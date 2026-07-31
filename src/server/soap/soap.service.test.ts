import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import { organizations, patients, user, visits } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { soapService } from "./soap.service";

let orgA: string;
let orgB: string;
let patientA: string;
let patientB: string;
let visitB: string;
const uids: string[] = [];

const ctx = (
  organizationId: string,
  role: AuthContext["role"],
  userId: string,
): AuthContext => ({ userId, organizationId, membershipId: `m-${role}`, role });

let ctxOwner: AuthContext;
let ctxPract: AuthContext;
let ctxStaff: AuthContext;
let ctxB: AuthContext;

async function makeUser(label: string): Promise<string> {
  const id = `soap-${label}-${randomUUID()}`;
  await db.insert(user).values({
    id,
    name: label,
    email: `${id}@example.com`,
    emailVerified: true,
  });
  uids.push(id);
  return id;
}

async function makeVisit(orgId: string, patientId: string): Promise<string> {
  const [v] = await db
    .insert(visits)
    .values({ organizationId: orgId, patientId })
    .returning();
  return v.id;
}

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "SOAP Org A", slug: `soap-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "SOAP Org B", slug: `soap-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "SOAP Patient A" })
    .returning();
  const [pb] = await db
    .insert(patients)
    .values({ organizationId: orgB, fullName: "SOAP Patient B" })
    .returning();
  patientA = pa.id;
  patientB = pb.id;
  visitB = await makeVisit(orgB, patientB);

  ctxOwner = ctx(orgA, "owner", await makeUser("owner"));
  ctxPract = ctx(orgA, "practitioner", await makeUser("pract"));
  ctxStaff = ctx(orgA, "staff", await makeUser("staff"));
  ctxB = ctx(orgB, "owner", await makeUser("orgb"));
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(inArray(user.id, uids));
  await closeDb();
});

describe("soapService", () => {
  it("creates a note (version 1) and rejects duplicates", async () => {
    const v = await makeVisit(orgA, patientA);
    const note = await soapService.create(ctxOwner, v, {
      subjective: "S",
      plan: "P",
    });
    expect(note.version).toBe(1);
    expect(note.subjective).toBe("S");
    expect(note.objective).toBe(""); // defaulted
    await expect(soapService.create(ctxOwner, v, {})).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("get returns the note (staff can read); 404 when none", async () => {
    const v = await makeVisit(orgA, patientA);
    await expect(soapService.getByVisit(ctxOwner, v)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await soapService.create(ctxOwner, v, { subjective: "X" });
    const n = await soapService.getByVisit(ctxStaff, v);
    expect(n.subjective).toBe("X");
  });

  it("autosave versions immutably; no-op does not bump", async () => {
    const v = await makeVisit(orgA, patientA);
    await soapService.create(ctxOwner, v, { subjective: "s1" });
    const u1 = await soapService.update(ctxOwner, v, { objective: "o1" });
    expect(u1.version).toBe(2);
    expect(u1.subjective).toBe("s1"); // preserved across partial update
    expect(u1.objective).toBe("o1");
    const u2 = await soapService.update(ctxPract, v, { assessment: "a1" });
    expect(u2.version).toBe(3);
    const noop = await soapService.update(ctxOwner, v, {});
    expect(noop.version).toBe(3); // no new revision

    const revs = await soapService.listRevisions(ctxOwner, v);
    expect(revs.total).toBe(3);
    expect(revs.items[0].version).toBe(3); // newest first
    expect(revs.items[2].version).toBe(1);
    expect(revs.items[2].subjective).toBe("s1"); // immutable v1 snapshot
  });

  it("enforces Visit authorization (staff read-only)", async () => {
    const v = await makeVisit(orgA, patientA);
    await soapService.create(ctxOwner, v, { subjective: "s" });
    await expect(
      soapService.create(ctxStaff, await makeVisit(orgA, patientA), {}),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      soapService.update(ctxStaff, v, { plan: "p" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(soapService.remove(ctxStaff, v)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect((await soapService.getByVisit(ctxStaff, v)).id).toBeTruthy();
    expect((await soapService.listRevisions(ctxStaff, v)).total).toBe(1);
  });

  it("practitioner can create (write role)", async () => {
    const v = await makeVisit(orgA, patientA);
    const n = await soapService.create(ctxPract, v, { plan: "px" });
    expect(n.plan).toBe("px");
  });

  it("rejects a visit not in the organization", async () => {
    await expect(soapService.create(ctxOwner, visitB, {})).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      soapService.create(ctxOwner, randomUUID(), {}),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes the note and its history", async () => {
    const v = await makeVisit(orgA, patientA);
    await soapService.create(ctxOwner, v, { subjective: "s" });
    await soapService.update(ctxOwner, v, { plan: "p" });
    const removed = await soapService.remove(ctxOwner, v);
    expect(removed.id).toBeTruthy();
    await expect(soapService.getByVisit(ctxOwner, v)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(soapService.listRevisions(ctxOwner, v)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("does not leak across organizations", async () => {
    const v = await makeVisit(orgA, patientA);
    await soapService.create(ctxOwner, v, { subjective: "s" });
    await expect(soapService.getByVisit(ctxB, v)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      soapService.update(ctxB, v, { plan: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("validates input", async () => {
    const v = await makeVisit(orgA, patientA);
    await expect(
      soapService.create(ctxOwner, v, { subjective: 123 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
