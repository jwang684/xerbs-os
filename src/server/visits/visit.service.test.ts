import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import {
  organizationMembers,
  organizations,
  patients,
  user,
} from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import { ForbiddenError, NotFoundError, ValidationError } from "../http/errors";
import { visitService } from "./visit.service";

let orgA: string;
let orgB: string;
let patientA1: string;
let patientA2: string;
let patientB: string;
let testUserId: string;
let providerA: string; // organization_members.id in org A
let providerB: string; // organization_members.id in org B (same user, other org)

const ctx = (organizationId: string, role: AuthContext["role"]): AuthContext => ({
  userId: `user-${role}`,
  organizationId,
  membershipId: `membership-${role}`,
  role,
});

let ctxA: AuthContext;
let ctxAStaff: AuthContext;
let ctxB: AuthContext;

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Visit Org A", slug: `vtest-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Visit Org B", slug: `vtest-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa1] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "Visit Patient A1" })
    .returning();
  const [pa2] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "Visit Patient A2" })
    .returning();
  const [pb] = await db
    .insert(patients)
    .values({ organizationId: orgB, fullName: "Visit Patient B" })
    .returning();
  patientA1 = pa1.id;
  patientA2 = pa2.id;
  patientB = pb.id;

  testUserId = `visit-user-${randomUUID()}`;
  await db.insert(user).values({
    id: testUserId,
    name: "Visit Provider",
    email: `${testUserId}@example.com`,
    emailVerified: true,
  });
  const [ma] = await db
    .insert(organizationMembers)
    .values({ organizationId: orgA, userId: testUserId, role: "practitioner" })
    .returning();
  const [mb] = await db
    .insert(organizationMembers)
    .values({ organizationId: orgB, userId: testUserId, role: "practitioner" })
    .returning();
  providerA = ma.id;
  providerB = mb.id;

  ctxA = ctx(orgA, "practitioner");
  ctxAStaff = ctx(orgA, "staff");
  ctxB = ctx(orgB, "owner");
});

afterAll(async () => {
  // Deleting the orgs cascades patients, visits, and memberships.
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(eq(user.id, testUserId));
  await closeDb();
});

describe("visitService CRUD", () => {
  it("creates a visit with defaults (status open)", async () => {
    const v = await visitService.create(ctxA, {
      patientId: patientA1,
      chiefComplaint: "Headache",
    });
    expect(v.id).toBeTruthy();
    expect(v.organizationId).toBe(orgA);
    expect(v.patientId).toBe(patientA1);
    expect(v.status).toBe("open");
    expect(v.visitDate).toBeInstanceOf(Date);
  });

  it("accepts a provider and case-insensitive status", async () => {
    const v = await visitService.create(ctxA, {
      patientId: patientA1,
      providerId: providerA,
      status: "Completed",
      notes: "Resolved",
    });
    expect(v.providerId).toBe(providerA);
    expect(v.status).toBe("completed");
    expect(v.notes).toBe("Resolved");
  });

  it("reads and updates a visit", async () => {
    const created = await visitService.create(ctxA, { patientId: patientA2 });
    const fetched = await visitService.get(ctxA, created.id);
    expect(fetched.id).toBe(created.id);

    const updated = await visitService.update(ctxA, created.id, {
      status: "cancelled",
      chiefComplaint: "No-show",
    });
    expect(updated.status).toBe("cancelled");
    expect(updated.chiefComplaint).toBe("No-show");
  });

  it("filters by patient and status, and paginates", async () => {
    // patientA2 currently has the one cancelled visit from the previous test.
    const byPatient = await visitService.list(ctxA, { patientId: patientA2 });
    expect(byPatient.items.length).toBeGreaterThanOrEqual(1);
    expect(byPatient.items.every((v) => v.patientId === patientA2)).toBe(true);

    const cancelled = await visitService.list(ctxA, { status: "cancelled" });
    expect(cancelled.items.every((v) => v.status === "cancelled")).toBe(true);

    const page = await visitService.list(ctxA, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThan(1);
  });
});

describe("cross-entity tenant integrity", () => {
  it("rejects a patient from another organization", async () => {
    await expect(
      visitService.create(ctxA, { patientId: patientB }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a provider that is not a member of the organization", async () => {
    // providerB belongs to org B, so it is invalid for a visit created in org A.
    await expect(
      visitService.create(ctxA, { patientId: patientA1, providerId: providerB }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      visitService.create(ctxA, {
        patientId: patientA1,
        providerId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("organization scoping", () => {
  it("does not leak visits across organizations", async () => {
    const inA = await visitService.create(ctxA, { patientId: patientA1 });
    await expect(visitService.get(ctxB, inA.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      visitService.update(ctxB, inA.id, { status: "completed" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const listB = await visitService.list(ctxB, {});
    expect(listB.items.some((v) => v.id === inA.id)).toBe(false);
  });
});

describe("authorization", () => {
  it("forbids staff from mutating, allows reading", async () => {
    const created = await visitService.create(ctxA, { patientId: patientA1 });
    await expect(
      visitService.create(ctxAStaff, { patientId: patientA1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      visitService.update(ctxAStaff, created.id, { status: "completed" }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const read = await visitService.get(ctxAStaff, created.id);
    expect(read.id).toBe(created.id);
  });
});

describe("input validation", () => {
  it("rejects invalid input", async () => {
    await expect(visitService.create(ctxA, {})).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      visitService.create(ctxA, { patientId: patientA1, status: "bogus" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(visitService.get(ctxA, "not-a-uuid")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
