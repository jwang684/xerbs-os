import { randomUUID } from "node:crypto";

process.env.AI_PROVIDER = "fake";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import { diagnoses, organizations, patients, visits } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import { diagnosisRepository } from "../diagnoses/diagnosis.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../http/errors";
import { prescriptionService } from "./prescription.service";

let orgA: string;
let orgB: string;
let patientA: string;
let visitWithDiag: string;
let visitNoDiag: string;

const ctx = (organizationId: string, role: AuthContext["role"]): AuthContext => ({
  userId: `user-${role}`,
  organizationId,
  membershipId: `membership-${role}`,
  role,
});

let ctxA: AuthContext;
let ctxAStaff: AuthContext;
let ctxB: AuthContext;

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
    .values({ name: "P Org A", slug: `ptest-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "P Org B", slug: `ptest-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "P Patient A" })
    .returning();
  patientA = pa.id;

  visitWithDiag = await makeVisit(orgA, patientA);
  visitNoDiag = await makeVisit(orgA, patientA);

  // An active diagnosis to prescribe from.
  await db.insert(diagnoses).values({
    organizationId: orgA,
    visitId: visitWithDiag,
    patientId: patientA,
    provider: "fake",
    model: "fake-model-1",
    promptVersion: "v1",
    structuredResult: {
      patterns: [{ name: "Qi Deficiency", rationale: "fatigue" }],
      summary: "Qi deficiency pattern.",
    },
    rawResponse: {},
    disclaimer: "d",
    confidence: 0.5,
    isActive: true,
  });

  ctxA = ctx(orgA, "practitioner");
  ctxAStaff = ctx(orgA, "staff");
  ctxB = ctx(orgB, "owner");
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await closeDb();
});

describe("prescriptionService", () => {
  it("generates a prescription from the active diagnosis and stores it immutably", async () => {
    const p = await prescriptionService.createForVisit(ctxA, visitWithDiag);
    expect(p.visitId).toBe(visitWithDiag);
    expect(p.patientId).toBe(patientA);
    expect(p.diagnosisId).toBeTruthy();
    expect(p.provider).toBe("fake");
    expect(p.model).toBe("fake-model-1");
    expect(p.promptVersion).toBe("v1");
    expect(p.disclaimer).toContain("informational");

    const structured = p.structuredResult as {
      formulaName: string;
      herbs: unknown[];
    };
    // Derived from the ACTIVE diagnosis's pattern.
    expect(structured.formulaName).toContain("Qi Deficiency");
    expect(Array.isArray(structured.herbs)).toBe(true);
    expect(p.rawResponse).toMatchObject({ provider: "fake" });
  });

  it("uses whichever diagnosis is currently active", async () => {
    // Add a new active diagnosis (deactivates the previous one).
    const newActive = await diagnosisRepository.create(orgA, {
      visitId: visitWithDiag,
      questionnaireId: null,
      patientId: patientA,
      provider: "fake",
      model: "fake-model-1",
      promptVersion: "v1",
      reasoning: null,
      structuredResult: {
        patterns: [{ name: "Damp Heat", rationale: "heat signs" }],
        summary: "Damp heat pattern.",
      },
      rawResponse: {},
      confidence: 0.6,
      disclaimer: "d",
    });

    const p = await prescriptionService.createForVisit(ctxA, visitWithDiag);
    expect(p.diagnosisId).toBe(newActive.id);
    const structured = p.structuredResult as { formulaName: string };
    expect(structured.formulaName).toContain("Damp Heat");
  });

  it("keeps immutable history (multiple prescriptions per visit)", async () => {
    const list = await prescriptionService.listByVisit(ctxA, visitWithDiag);
    // From the two create calls above.
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("requires an active diagnosis", async () => {
    await expect(
      prescriptionService.createForVisit(ctxA, visitNoDiag),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("404s for unknown or cross-org visits", async () => {
    await expect(
      prescriptionService.createForVisit(ctxA, randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      prescriptionService.createForVisit(ctxB, visitWithDiag),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      prescriptionService.listByVisit(ctxB, visitWithDiag),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("enforces authorization (staff read-only)", async () => {
    await expect(
      prescriptionService.createForVisit(ctxAStaff, visitWithDiag),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const list = await prescriptionService.listByVisit(ctxAStaff, visitWithDiag);
    expect(Array.isArray(list)).toBe(true);
  });
});
