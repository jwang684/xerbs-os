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

import type { AuthContext } from "../auth/authz";
import { BadRequestError } from "../http/errors";
import { dashboardService } from "./dashboard.service";

type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

// A fixed UTC anchor day for the "today" widgets.
const DAY = "2026-06-15";
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00.000Z`);

let orgA: string;
let orgB: string;
let patientA: string;
let patientB: string;
let memberPract: string; // organization member id for the practitioner
let memberOther: string; // a second member (unrelated visits)
let providerPract: string; // provider profile id for the practitioner
let providerOther: string; // provider profile with no matching member

const uids: string[] = [];

const ctx = (
  organizationId: string,
  role: AuthContext["role"],
  userId: string,
  membershipId: string,
): AuthContext => ({ userId, organizationId, membershipId, role });

let ctxOwner: AuthContext;
let ctxPract: AuthContext;
let ctxStaff: AuthContext;
let ctxB: AuthContext;

async function makeUser(label: string): Promise<string> {
  const id = `dash-${label}-${randomUUID()}`;
  await db.insert(user).values({
    id,
    name: label,
    email: `${id}@example.com`,
    emailVerified: true,
  });
  uids.push(id);
  return id;
}

async function makeMember(orgId: string, userId: string): Promise<string> {
  const [m] = await db
    .insert(organizationMembers)
    .values({ organizationId: orgId, userId, role: "practitioner" })
    .returning();
  return m.id;
}

async function makeProvider(orgId: string, userId: string): Promise<string> {
  const [p] = await db
    .insert(providerProfiles)
    .values({ organizationId: orgId, userId })
    .returning();
  return p.id;
}

async function makeVisit(
  orgId: string,
  patientId: string,
  opts: { providerId?: string; status?: "open" | "completed" | "cancelled" } = {},
): Promise<string> {
  const [v] = await db
    .insert(visits)
    .values({
      organizationId: orgId,
      patientId,
      providerId: opts.providerId ?? null,
      status: opts.status ?? "open",
    })
    .returning();
  return v.id;
}

async function makeAppt(
  orgId: string,
  patientId: string,
  providerId: string,
  start: Date,
  status: AppointmentStatus = "scheduled",
): Promise<void> {
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  await db.insert(appointments).values({
    organizationId: orgId,
    patientId,
    providerId,
    startTime: start,
    endTime: end,
    status,
  });
}

async function addSoap(
  orgId: string,
  visitId: string,
  patientId: string,
): Promise<void> {
  await db
    .insert(soapNotes)
    .values({ organizationId: orgId, visitId, patientId, subjective: "s", version: 1 });
}

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Dash Org A", slug: `dash-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Dash Org B", slug: `dash-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "Dash Patient A" })
    .returning();
  const [pb] = await db
    .insert(patients)
    .values({ organizationId: orgB, fullName: "Dash Patient B" })
    .returning();
  patientA = pa.id;
  patientB = pb.id;

  const ownerUser = await makeUser("owner");
  const practUser = await makeUser("pract");
  const staffUser = await makeUser("staff");
  const otherUser = await makeUser("other");
  const orphanUser = await makeUser("orphan"); // provider profile, no member

  const memberOwner = await makeMember(orgA, ownerUser);
  memberPract = await makeMember(orgA, practUser);
  memberOther = await makeMember(orgA, otherUser);

  providerPract = await makeProvider(orgA, practUser);
  providerOther = await makeProvider(orgA, orphanUser);

  ctxOwner = ctx(orgA, "owner", ownerUser, memberOwner);
  ctxPract = ctx(orgA, "practitioner", practUser, memberPract);
  ctxStaff = ctx(orgA, "staff", staffUser, `m-staff-${randomUUID()}`);
  ctxB = ctx(orgB, "owner", await makeUser("orgb"), `m-b-${randomUUID()}`);

  // --- Today's appointments (orgA) ---
  // Practitioner's own: 2 scheduled (waiting), 1 checked_in.
  await makeAppt(orgA, patientA, providerPract, at("09:00"), "scheduled");
  await makeAppt(orgA, patientA, providerPract, at("10:00"), "scheduled");
  await makeAppt(orgA, patientA, providerPract, at("11:00"), "checked_in");
  // Another provider: 1 scheduled today.
  await makeAppt(orgA, patientA, providerOther, at("12:00"), "scheduled");
  // Outside the day window (should never count).
  await makeAppt(
    orgA,
    patientA,
    providerPract,
    new Date("2026-06-16T09:00:00.000Z"),
    "scheduled",
  );

  // --- Visits (orgA) ---
  // Practitioner's visits (providerId = memberPract):
  //   open + no artifacts  -> open:1, pendingSoap/Dx/Rx +1
  await makeVisit(orgA, patientA, { providerId: memberPract, status: "open" });
  //   completed + full artifacts -> completed:1, no pending
  const vDone = await makeVisit(orgA, patientA, {
    providerId: memberPract,
    status: "completed",
  });
  await addSoap(orgA, vDone, patientA);
  // A prescription requires a diagnosis id, so insert the diagnosis directly.
  {
    const [d] = await db
      .insert(diagnoses)
      .values({
        organizationId: orgA,
        visitId: vDone,
        patientId: patientA,
        provider: "fake",
        model: "test",
        promptVersion: "v1",
        structuredResult: {},
        rawResponse: {},
        disclaimer: "x",
      })
      .returning();
    await db.insert(prescriptions).values({
      organizationId: orgA,
      diagnosisId: d.id,
      visitId: vDone,
      patientId: patientA,
      provider: "fake",
      model: "test",
      promptVersion: "v1",
      structuredResult: {},
      rawResponse: {},
      disclaimer: "x",
    });
  }
  //   cancelled -> excluded from pending entirely
  await makeVisit(orgA, patientA, {
    providerId: memberPract,
    status: "cancelled",
  });

  // Other member's visit: open, no artifacts (counts org-wide, not for pract).
  await makeVisit(orgA, patientA, { providerId: memberOther, status: "open" });

  // --- orgB isolation: appt + visit that must never surface for orgA ---
  const providerB = await makeProvider(orgB, ctxB.userId);
  await makeAppt(orgB, patientB, providerB, at("09:00"), "scheduled");
  await makeVisit(orgB, patientB, { status: "open" });
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(inArray(user.id, uids));
  await closeDb();
});

describe("dashboardService", () => {
  it("owner sees organization-wide aggregates for the day", async () => {
    const r = await dashboardService.getDashboard(ctxOwner, { date: DAY });
    expect(r.date).toBe(DAY);
    expect(r.providerId).toBeNull();
    // 3 pract + 1 other = 4 appts in the day window (the 06-16 one excluded).
    expect(r.widgets.todaysAppointments).toBe(4);
    expect(r.todaysAppointments).toHaveLength(4);
    expect(r.widgets.waitingPatients).toBe(3); // scheduled
    expect(r.widgets.checkedInPatients).toBe(1); // checked_in
    // Visits org-wide: 2 open (pract + other), 1 completed.
    expect(r.widgets.openVisits).toBe(2);
    expect(r.widgets.completedVisits).toBe(1);
    // Pending (non-cancelled without artifact): 2 open visits pending everything.
    expect(r.widgets.pendingSoap).toBe(2);
    expect(r.widgets.pendingDiagnosis).toBe(2);
    expect(r.widgets.pendingPrescription).toBe(2);
  });

  it("orders today's appointments by start time", async () => {
    const r = await dashboardService.getDashboard(ctxOwner, { date: DAY });
    const times = r.todaysAppointments.map((a) => a.startTime.getTime());
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });

  it("staff sees the same organization-wide view (read)", async () => {
    const r = await dashboardService.getDashboard(ctxStaff, { date: DAY });
    expect(r.widgets.todaysAppointments).toBe(4);
    expect(r.widgets.openVisits).toBe(2);
  });

  it("practitioner sees only their own dashboard", async () => {
    const r = await dashboardService.getDashboard(ctxPract, { date: DAY });
    expect(r.providerId).toBe(providerPract);
    // Only the practitioner's 3 appointments.
    expect(r.widgets.todaysAppointments).toBe(3);
    expect(r.widgets.waitingPatients).toBe(2);
    expect(r.widgets.checkedInPatients).toBe(1);
    // Only visits assigned to the practitioner's membership.
    expect(r.widgets.openVisits).toBe(1);
    expect(r.widgets.completedVisits).toBe(1);
    expect(r.widgets.pendingSoap).toBe(1);
    expect(r.widgets.pendingDiagnosis).toBe(1);
    expect(r.widgets.pendingPrescription).toBe(1);
  });

  it("owner can filter by a specific provider", async () => {
    const r = await dashboardService.getDashboard(ctxOwner, {
      date: DAY,
      providerId: providerPract,
    });
    expect(r.providerId).toBe(providerPract);
    expect(r.widgets.todaysAppointments).toBe(3);
    expect(r.widgets.openVisits).toBe(1);
    expect(r.widgets.completedVisits).toBe(1);
  });

  it("filtering by a provider without a matching member yields no visits", async () => {
    const r = await dashboardService.getDashboard(ctxOwner, {
      date: DAY,
      providerId: providerOther,
    });
    expect(r.providerId).toBe(providerOther);
    expect(r.widgets.todaysAppointments).toBe(1); // the 12:00 appt
    expect(r.widgets.openVisits).toBe(0);
    expect(r.widgets.completedVisits).toBe(0);
    expect(r.widgets.pendingSoap).toBe(0);
  });

  it("rejects a provider filter for a provider not in the organization", async () => {
    await expect(
      dashboardService.getDashboard(ctxOwner, {
        date: DAY,
        providerId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("does not leak across organizations", async () => {
    const r = await dashboardService.getDashboard(ctxB, { date: DAY });
    expect(r.widgets.todaysAppointments).toBe(1); // only orgB's appt
    expect(r.widgets.openVisits).toBe(1); // only orgB's visit
  });

  it("defaults the day to today when no date is given", async () => {
    const r = await dashboardService.getDashboard(ctxOwner, {});
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("validates the query", async () => {
    await expect(
      dashboardService.getDashboard(ctxOwner, { date: "not-a-date" }),
    ).rejects.toBeTruthy();
  });
});
