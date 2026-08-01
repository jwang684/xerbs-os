import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import {
  appointments,
  diagnoses,
  organizationMembers,
  organizations,
  patients,
  prescriptions,
  providerProfiles,
  soapNotes,
  user,
  visits,
} from "@/db/schema";

import { NotFoundError, ValidationError } from "../http/errors";
import type { PatientContext } from "./patient-context";
import { patientPortalService } from "./patient-portal.service";

let orgA: string;
let orgB: string;
let userA: string;
let userB: string;
let provUser: string;
let memberProv: string;
let providerProfileProv: string;
let patientA1: string; // userA @ orgA (primary)
let patientA2: string; // userA @ orgB (second clinic)
let patientB: string; // userB @ orgA
let visitA1: string; // recent visit with soap/dx/rx
let visitA1Old: string;
let visitA2: string;
let visitB: string;

const uids: string[] = [];

const ctx = (
  userId: string,
  name: string,
  email: string,
  patientIds: string[],
): PatientContext => ({ userId, name, email, patientIds });

let ctxA: PatientContext; // single record [A1]
let ctxAMulti: PatientContext; // [A1, A2]
let ctxB: PatientContext; // [B]

async function makeUser(label: string): Promise<string> {
  const id = `pp-${label}-${randomUUID()}`;
  await db.insert(user).values({
    id,
    name: `${label} name`,
    email: `${id}@example.com`,
    emailVerified: true,
  });
  uids.push(id);
  return id;
}

async function makeOrg(label: string): Promise<string> {
  const [o] = await db
    .insert(organizations)
    .values({ name: `${label} clinic`, slug: `${label}-${randomUUID()}` })
    .returning();
  return o.id;
}

async function makePatient(
  orgId: string,
  fullName: string,
  userId: string | null,
): Promise<string> {
  const [p] = await db
    .insert(patients)
    .values({ organizationId: orgId, fullName, userId })
    .returning();
  return p.id;
}

async function makeVisit(
  orgId: string,
  patientId: string,
  opts: { providerId?: string; status?: "open" | "completed"; visitDate?: Date } = {},
): Promise<string> {
  const [v] = await db
    .insert(visits)
    .values({
      organizationId: orgId,
      patientId,
      providerId: opts.providerId ?? null,
      status: opts.status ?? "open",
      visitDate: opts.visitDate,
    })
    .returning();
  return v.id;
}

async function addSoap(orgId: string, visitId: string, patientId: string) {
  await db.insert(soapNotes).values({
    organizationId: orgId,
    visitId,
    patientId,
    subjective: "S text",
    version: 1,
  });
}

async function addDiagnosis(
  orgId: string,
  visitId: string,
  patientId: string,
): Promise<string> {
  const [d] = await db
    .insert(diagnoses)
    .values({
      organizationId: orgId,
      visitId,
      patientId,
      provider: "fake",
      model: "test",
      promptVersion: "v1",
      structuredResult: { summary: "Pattern summary", patterns: [] },
      rawResponse: {},
      disclaimer: "Not medical advice",
    })
    .returning();
  return d.id;
}

async function addPrescription(
  orgId: string,
  visitId: string,
  patientId: string,
  diagnosisId: string,
  formulaName: string,
) {
  await db.insert(prescriptions).values({
    organizationId: orgId,
    diagnosisId,
    visitId,
    patientId,
    provider: "fake",
    model: "test",
    promptVersion: "v1",
    structuredResult: { formulaName, herbs: [], instructions: "Take daily" },
    rawResponse: {},
    disclaimer: "Not medical advice",
  });
}

beforeAll(async () => {
  orgA = await makeOrg("ppA");
  orgB = await makeOrg("ppB");
  userA = await makeUser("pa");
  userB = await makeUser("pb");
  provUser = await makeUser("prov");

  const [m] = await db
    .insert(organizationMembers)
    .values({ organizationId: orgA, userId: provUser, role: "practitioner" })
    .returning();
  memberProv = m.id;
  const [pp] = await db
    .insert(providerProfiles)
    .values({ organizationId: orgA, userId: provUser })
    .returning();
  providerProfileProv = pp.id;

  patientA1 = await makePatient(orgA, "Patient A", userA);
  patientA2 = await makePatient(orgB, "Patient A (clinic B)", userA);
  patientB = await makePatient(orgA, "Patient B", userB);
  // A clinic-only patient with no linked account (must never be reachable).
  await makePatient(orgA, "Unlinked", null);

  visitA1 = await makeVisit(orgA, patientA1, {
    providerId: memberProv,
    status: "completed",
    visitDate: new Date("2026-06-10T10:00:00.000Z"),
  });
  visitA1Old = await makeVisit(orgA, patientA1, {
    providerId: memberProv,
    status: "completed",
    visitDate: new Date("2026-01-05T10:00:00.000Z"),
  });
  visitA2 = await makeVisit(orgB, patientA2, {
    status: "open",
    visitDate: new Date("2026-05-01T10:00:00.000Z"),
  });
  visitB = await makeVisit(orgA, patientB, { status: "open" });

  await addSoap(orgA, visitA1, patientA1);
  // Older diagnosis first, then the recent-visit diagnosis, so the newest
  // diagnosis (by createdAt) belongs to the recent visit.
  await addDiagnosis(orgA, visitA1Old, patientA1);
  const dxA1 = await addDiagnosis(orgA, visitA1, patientA1);
  // Two prescriptions: the newest is "active".
  await addPrescription(orgA, visitA1, patientA1, dxA1, "Old Formula");
  await addPrescription(orgA, visitA1, patientA1, dxA1, "Current Formula");

  // A future appointment for patientA1.
  await db.insert(appointments).values({
    organizationId: orgA,
    patientId: patientA1,
    providerId: providerProfileProv,
    startTime: new Date("2099-01-01T09:00:00.000Z"),
    endTime: new Date("2099-01-01T09:30:00.000Z"),
    status: "scheduled",
  });

  ctxA = ctx(userA, "pa name", `${userA}@example.com`, [patientA1]);
  ctxAMulti = ctx(userA, "pa name", `${userA}@example.com`, [
    patientA1,
    patientA2,
  ]);
  ctxB = ctx(userB, "pb name", `${userB}@example.com`, [patientB]);
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(inArray(user.id, uids));
  await closeDb();
});

describe("patientPortalService", () => {
  it("returns the profile with identity, contact, and records", async () => {
    const p = await patientPortalService.getProfile(ctxA);
    expect(p.name).toBe("pa name");
    expect(p.activePatientId).toBe(patientA1);
    expect(p.records).toHaveLength(1);
    expect(p.records[0].fullName).toBe("Patient A");
  });

  it("updates contact info and address on the active record only", async () => {
    await patientPortalService.updateProfile(ctxAMulti, undefined, {
      email: "new@example.com",
      phone: "555-1000",
      address: { line1: "1 Main St", city: "Townsville" },
    });
    const p1 = await patientPortalService.getProfile(ctxAMulti, patientA1);
    expect(p1.contact.email).toBe("new@example.com");
    expect(p1.contact.address?.city).toBe("Townsville");
    // The second record was untouched.
    const p2 = await patientPortalService.getProfile(ctxAMulti, patientA2);
    expect(p2.contact.email).toBeNull();
  });

  it("rejects an invalid profile update", async () => {
    await expect(
      patientPortalService.updateProfile(ctxA, undefined, { email: "nope" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("composes the dashboard (upcoming appt, latest rx/dx/visit)", async () => {
    const d = await patientPortalService.getDashboard(ctxA);
    expect(d.upcomingAppointment?.status).toBe("scheduled");
    expect(d.activePrescription?.structuredResult.formulaName).toBe(
      "Current Formula",
    );
    expect(d.activePrescription?.status).toBe("active");
    expect(d.recentDiagnosis?.visitId).toBe(visitA1);
    expect(d.recentVisit?.id).toBe(visitA1);
    expect(d.followUps).toEqual([]);
  });

  it("lists visits (newest first) with provider and clinic names", async () => {
    const { items, total } = await patientPortalService.listVisits(ctxA);
    expect(total).toBe(2);
    expect(items[0].id).toBe(visitA1); // newest
    expect(items[0].providerName).toBe("prov name");
    expect(items[0].organizationName).toBe("ppA clinic");
  });

  it("returns a visit detail with soap, diagnoses, prescriptions", async () => {
    const d = await patientPortalService.getVisitDetail(
      ctxA,
      undefined,
      visitA1,
    );
    expect(d.visit.id).toBe(visitA1);
    expect(d.soap?.subjective).toBe("S text");
    expect(d.diagnoses).toHaveLength(1);
    expect(d.prescriptions).toHaveLength(2);
  });

  it("lists diagnosis and prescription history", async () => {
    const dx = await patientPortalService.listDiagnoses(ctxA);
    expect(dx.total).toBe(2);
    const rx = await patientPortalService.listPrescriptions(ctxA);
    expect(rx.total).toBe(2);
    expect(rx.items[0].status).toBe("active"); // newest
    expect(rx.items[1].status).toBe("past");
  });

  it("supports the record selector and rejects foreign ids", async () => {
    // Selecting the second record scopes to its (empty) history.
    const v2 = await patientPortalService.listVisits(ctxAMulti, patientA2);
    expect(v2.items.map((v) => v.id)).toEqual([visitA2]);
    // Requesting a record the user does not own → 404.
    await expect(
      patientPortalService.listVisits(ctxAMulti, patientB),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      patientPortalService.getProfile(ctxAMulti, randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("isolates patients: B cannot see A's data", async () => {
    const { items } = await patientPortalService.listVisits(ctxB);
    expect(items.map((v) => v.id)).toEqual([visitB]);
    // A's visit id is not reachable from B's context.
    await expect(
      patientPortalService.getVisitDetail(ctxB, undefined, visitA1),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await patientPortalService.listDiagnoses(ctxB)).total).toBe(0);
    expect((await patientPortalService.listPrescriptions(ctxB)).total).toBe(0);
  });

  it("does not reach a visit from another of the user's own records", async () => {
    // Active is A1; A2's visit must not be reachable without selecting A2.
    await expect(
      patientPortalService.getVisitDetail(ctxAMulti, undefined, visitA2),
    ).rejects.toBeInstanceOf(NotFoundError);
    // But selecting A2 makes it reachable.
    const d = await patientPortalService.getVisitDetail(
      ctxAMulti,
      patientA2,
      visitA2,
    );
    expect(d.visit.id).toBe(visitA2);
  });

  it("rejects an invalid visit id", async () => {
    await expect(
      patientPortalService.getVisitDetail(ctxA, undefined, "not-a-uuid"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
