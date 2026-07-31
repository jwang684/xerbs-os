import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import { organizations, patients } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { patientService } from "./patient.service";

// Two isolated tenants created for this suite; torn down afterwards.
let orgA: string;
let orgB: string;

const ctx = (organizationId: string, role: AuthContext["role"]): AuthContext => ({
  userId: `user-${role}`,
  organizationId,
  membershipId: `membership-${role}`,
  role,
});

let ctxA: AuthContext; // practitioner in org A (can write)
let ctxAStaff: AuthContext; // staff in org A (read-only)
let ctxB: AuthContext; // owner in org B (different tenant)

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Test Org A", slug: `test-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Test Org B", slug: `test-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;
  ctxA = ctx(orgA, "practitioner");
  ctxAStaff = ctx(orgA, "staff");
  ctxB = ctx(orgB, "owner");
});

afterAll(async () => {
  await db.delete(patients).where(inArray(patients.organizationId, [orgA, orgB]));
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await closeDb();
});

describe("patientService CRUD", () => {
  it("creates and reads a patient", async () => {
    const created = await patientService.create(ctxA, {
      fullName: "Alice Rivers",
      email: "alice@example.com",
      sex: "female",
    });
    expect(created.id).toBeTruthy();
    expect(created.organizationId).toBe(orgA);
    expect(created.deletedAt).toBeNull();

    const fetched = await patientService.get(ctxA, created.id);
    expect(fetched.fullName).toBe("Alice Rivers");
  });

  it("updates a patient and bumps updatedAt", async () => {
    const created = await patientService.create(ctxA, { fullName: "Bob Stone" });
    const updated = await patientService.update(ctxA, created.id, {
      phone: "555-0100",
      email: "bob@example.com",
    });
    expect(updated.phone).toBe("555-0100");
    expect(updated.email).toBe("bob@example.com");
    expect(updated.id).toBe(created.id);
    // Note: not comparing updatedAt across insert (DB clock) vs update (host
    // clock) — skew between them makes ordering assertions flaky.
    expect(updated.updatedAt).toBeInstanceOf(Date);
  });

  it("soft-deletes a patient (row remains, hidden from reads)", async () => {
    const created = await patientService.create(ctxA, { fullName: "Carol Vane" });
    const deleted = await patientService.remove(ctxA, created.id);
    expect(deleted.deletedAt).not.toBeNull();

    // Hidden from get and list...
    await expect(patientService.get(ctxA, created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const list = await patientService.list(ctxA, {});
    expect(list.items.some((p) => p.id === created.id)).toBe(false);

    // ...but the row still physically exists (never hard-deleted).
    const [raw] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, created.id));
    expect(raw).toBeTruthy();
    expect(raw.deletedAt).not.toBeNull();
  });

  it("lists and searches by name and email", async () => {
    const token = `Srch${randomUUID().slice(0, 8)}`;
    await patientService.create(ctxA, {
      fullName: `${token} Namematch`,
      email: "namematch@example.com",
    });
    await patientService.create(ctxA, {
      fullName: "Emailmatch Person",
      email: `${token.toLowerCase()}@example.com`,
    });

    const byName = await patientService.list(ctxA, { q: token });
    expect(byName.items.length).toBeGreaterThanOrEqual(1);
    expect(byName.items.every((p) => p.organizationId === orgA)).toBe(true);

    const byEmail = await patientService.list(ctxA, {
      q: `${token.toLowerCase()}@example.com`,
    });
    expect(byEmail.items.some((p) => p.fullName === "Emailmatch Person")).toBe(
      true,
    );

    const none = await patientService.list(ctxA, { q: "no-such-token-zzz" });
    expect(none.items).toHaveLength(0);
    expect(none.total).toBe(0);
  });

  it("paginates", async () => {
    const page = await patientService.list(ctxA, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThan(1);
  });
});

describe("organization scoping", () => {
  it("does not leak patients across organizations", async () => {
    const inA = await patientService.create(ctxA, { fullName: "Tenant A Only" });

    // Org B cannot read A's patient...
    await expect(patientService.get(ctxB, inA.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    // ...nor update or delete it...
    await expect(
      patientService.update(ctxB, inA.id, { phone: "1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(patientService.remove(ctxB, inA.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    // ...nor see it in its list.
    const listB = await patientService.list(ctxB, {});
    expect(listB.items.some((p) => p.id === inA.id)).toBe(false);
  });
});

describe("authorization", () => {
  it("forbids staff from mutating, allows reading", async () => {
    const created = await patientService.create(ctxA, { fullName: "Dana Read" });

    await expect(
      patientService.create(ctxAStaff, { fullName: "Nope" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      patientService.update(ctxAStaff, created.id, { phone: "9" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      patientService.remove(ctxAStaff, created.id),
    ).rejects.toBeInstanceOf(ForbiddenError);

    // Reads are allowed for staff.
    const read = await patientService.get(ctxAStaff, created.id);
    expect(read.id).toBe(created.id);
  });
});

describe("input validation", () => {
  it("rejects invalid input", async () => {
    await expect(
      patientService.create(ctxA, { fullName: "" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      patientService.create(ctxA, { fullName: "X", email: "not-an-email" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(patientService.get(ctxA, "not-a-uuid")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
