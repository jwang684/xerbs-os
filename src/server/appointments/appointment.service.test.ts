import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import {
  organizationMembers,
  organizations,
  patients,
  providerProfiles,
  user,
} from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { appointmentService } from "./appointment.service";

let orgA: string;
let orgB: string;
let patientA: string;
let patientB: string; // org B
let providerA: string; // profile for practitioner 1 (org A)
let providerB: string; // profile for practitioner 2 (org A)
let providerOrgB: string; // profile in org B
const uids: string[] = [];

const ctx = (
  organizationId: string,
  role: AuthContext["role"],
  userId: string,
): AuthContext => ({ userId, organizationId, membershipId: `m-${role}`, role });

let ctxOwner: AuthContext;
let ctxPract1: AuthContext;
let ctxPract2: AuthContext;
let ctxStaff: AuthContext;
let ctxB: AuthContext;

async function makeUser(label: string): Promise<string> {
  const id = `appt-${label}-${randomUUID()}`;
  await db.insert(user).values({
    id,
    name: label,
    email: `${id}@example.com`,
    emailVerified: true,
  });
  uids.push(id);
  return id;
}

// A unique 1-hour slot on a fresh day, to avoid cross-test overlap.
let dayCounter = 0;
function slot(): { startTime: Date; endTime: Date } {
  dayCounter += 1;
  return {
    startTime: new Date(Date.UTC(2030, 0, dayCounter, 9, 0, 0)),
    endTime: new Date(Date.UTC(2030, 0, dayCounter, 10, 0, 0)),
  };
}

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Appt Org A", slug: `appt-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Appt Org B", slug: `appt-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const uOwner = await makeUser("owner");
  const uP1 = await makeUser("pract1");
  const uP2 = await makeUser("pract2");
  const uStaff = await makeUser("staff");
  const uOrgB = await makeUser("orgb");

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: uOwner, role: "owner" },
    { organizationId: orgA, userId: uP1, role: "practitioner" },
    { organizationId: orgA, userId: uP2, role: "practitioner" },
    { organizationId: orgA, userId: uStaff, role: "staff" },
  ]);

  const [pa] = await db
    .insert(providerProfiles)
    .values({ organizationId: orgA, userId: uP1 })
    .returning();
  const [pb] = await db
    .insert(providerProfiles)
    .values({ organizationId: orgA, userId: uP2 })
    .returning();
  const [pOrgB] = await db
    .insert(providerProfiles)
    .values({ organizationId: orgB, userId: uOrgB })
    .returning();
  providerA = pa.id;
  providerB = pb.id;
  providerOrgB = pOrgB.id;

  const [patA] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "Appt Patient A" })
    .returning();
  const [patB] = await db
    .insert(patients)
    .values({ organizationId: orgB, fullName: "Appt Patient B" })
    .returning();
  patientA = patA.id;
  patientB = patB.id;

  ctxOwner = ctx(orgA, "owner", uOwner);
  ctxPract1 = ctx(orgA, "practitioner", uP1);
  ctxPract2 = ctx(orgA, "practitioner", uP2);
  ctxStaff = ctx(orgA, "staff", uStaff);
  ctxB = ctx(orgB, "owner", uOrgB);
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(inArray(user.id, uids));
  await closeDb();
});

describe("appointmentService — create + validation", () => {
  it("creates a valid appointment (default status scheduled)", async () => {
    const s = slot();
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...s,
    });
    expect(appt.organizationId).toBe(orgA);
    expect(appt.status).toBe("scheduled");
  });

  it("rejects endTime <= startTime", async () => {
    const s = slot();
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientA,
        providerId: providerA,
        startTime: s.endTime,
        endTime: s.startTime,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects patient/provider not in the organization", async () => {
    const s = slot();
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientB,
        providerId: providerA,
        ...s,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientA,
        providerId: providerOrgB,
        ...s,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects overlapping appointments for the same provider", async () => {
    const s = slot();
    await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...s,
    });
    // overlaps (same window)
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientA,
        providerId: providerA,
        startTime: new Date(s.startTime.getTime() + 30 * 60000),
        endTime: new Date(s.endTime.getTime() + 30 * 60000),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    // a different provider at the same time is fine
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientA,
        providerId: providerB,
        ...s,
      }),
    ).resolves.toBeTruthy();
  });

  it("a cancelled appointment frees the slot", async () => {
    const s = slot();
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...s,
    });
    await appointmentService.update(ctxOwner, appt.id, { status: "cancelled" });
    await expect(
      appointmentService.create(ctxOwner, {
        patientId: patientA,
        providerId: providerA,
        ...s,
      }),
    ).resolves.toBeTruthy();
  });
});

describe("appointmentService — authorization", () => {
  it("practitioner may create only for their own provider profile", async () => {
    const s1 = slot();
    await expect(
      appointmentService.create(ctxPract1, {
        patientId: patientA,
        providerId: providerA,
        ...s1,
      }),
    ).resolves.toBeTruthy();

    const s2 = slot();
    await expect(
      appointmentService.create(ctxPract1, {
        patientId: patientA,
        providerId: providerB, // not their own
        ...s2,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("staff can create/update but not delete", async () => {
    const s = slot();
    const appt = await appointmentService.create(ctxStaff, {
      patientId: patientA,
      providerId: providerA,
      ...s,
    });
    await expect(
      appointmentService.update(ctxStaff, appt.id, { status: "checked_in" }),
    ).resolves.toBeTruthy();
    await expect(
      appointmentService.remove(ctxStaff, appt.id),
    ).rejects.toBeInstanceOf(ForbiddenError);
    // owner can delete
    await expect(appointmentService.remove(ctxOwner, appt.id)).resolves.toBeTruthy();
  });

  it("practitioner cannot read/update/delete another provider's appointment", async () => {
    const s = slot();
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerB, // practitioner 2's
      ...s,
    });
    await expect(appointmentService.get(ctxPract1, appt.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      appointmentService.update(ctxPract1, appt.id, { notes: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      appointmentService.remove(ctxPract1, appt.id),
    ).rejects.toBeInstanceOf(ForbiddenError);
    // its owner practitioner can
    await expect(appointmentService.get(ctxPract2, appt.id)).resolves.toBeTruthy();
    await expect(
      appointmentService.remove(ctxPract2, appt.id),
    ).resolves.toBeTruthy();
  });
});

describe("appointmentService — list/filter + isolation", () => {
  it("practitioner list is restricted to their own appointments", async () => {
    const s = slot();
    const mine = await appointmentService.create(ctxPract1, {
      patientId: patientA,
      providerId: providerA,
      ...s,
    });
    const others = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerB,
      ...slot(),
    });
    const list = await appointmentService.list(ctxPract1, {});
    expect(list.items.every((a) => a.providerId === providerA)).toBe(true);
    expect(list.items.some((a) => a.id === mine.id)).toBe(true);
    expect(list.items.some((a) => a.id === others.id)).toBe(false);
  });

  it("owner can filter by provider, patient, and date range", async () => {
    const byProvider = await appointmentService.list(ctxOwner, {
      providerId: providerA,
    });
    expect(byProvider.items.every((a) => a.providerId === providerA)).toBe(true);

    const byPatient = await appointmentService.list(ctxOwner, {
      patientId: patientA,
    });
    expect(byPatient.items.every((a) => a.patientId === patientA)).toBe(true);

    const ranged = await appointmentService.list(ctxOwner, {
      from: new Date(Date.UTC(2030, 0, 1)),
      to: new Date(Date.UTC(2030, 0, 3, 23, 59, 59)),
    });
    expect(
      ranged.items.every(
        (a) =>
          a.startTime >= new Date(Date.UTC(2030, 0, 1)) &&
          a.startTime <= new Date(Date.UTC(2030, 0, 3, 23, 59, 59)),
      ),
    ).toBe(true);
  });

  it("does not leak appointments across organizations", async () => {
    const inA = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    await expect(appointmentService.get(ctxB, inA.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      appointmentService.remove(ctxB, inA.id),
    ).rejects.toBeInstanceOf(NotFoundError);
    const listB = await appointmentService.list(ctxB, {});
    expect(listB.items.some((a) => a.id === inA.id)).toBe(false);
  });
});

describe("appointmentService — check-in", () => {
  it("checks in a scheduled appointment and creates a linked visit", async () => {
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    const { appointment, visit } = await appointmentService.checkIn(
      ctxOwner,
      appt.id,
    );
    expect(appointment.status).toBe("checked_in");
    expect(visit.appointmentId).toBe(appt.id);
    expect(visit.patientId).toBe(patientA);
    expect(visit.organizationId).toBe(orgA);
    expect(visit.status).toBe("open");

    // Duplicate check-in is rejected (status is no longer scheduled).
    await expect(
      appointmentService.checkIn(ctxOwner, appt.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("only scheduled appointments can be checked in", async () => {
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    await appointmentService.update(ctxOwner, appt.id, { status: "cancelled" });
    await expect(
      appointmentService.checkIn(ctxOwner, appt.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("staff may check in; practitioner only their own appointment", async () => {
    // Staff allowed.
    const a1 = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    const r1 = await appointmentService.checkIn(ctxStaff, a1.id);
    expect(r1.visit.appointmentId).toBe(a1.id);

    // Practitioner may check in their own provider's appointment.
    const a2 = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    const r2 = await appointmentService.checkIn(ctxPract1, a2.id);
    expect(r2.appointment.status).toBe("checked_in");

    // ...but not another provider's.
    const a3 = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerB,
      ...slot(),
    });
    await expect(
      appointmentService.checkIn(ctxPract1, a3.id),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("does not check in appointments from another organization", async () => {
    const appt = await appointmentService.create(ctxOwner, {
      patientId: patientA,
      providerId: providerA,
      ...slot(),
    });
    await expect(appointmentService.checkIn(ctxB, appt.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
