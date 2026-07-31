import { randomUUID } from "node:crypto";

// Use the deterministic fake AI provider for these tests.
process.env.AI_PROVIDER = "fake";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import {
  organizations,
  patients,
  questionnaireResponses,
  visits,
} from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import { BadRequestError, ForbiddenError, NotFoundError } from "../http/errors";
import { diagnosisService } from "./diagnosis.service";

let orgA: string;
let orgB: string;
let patientA: string;
let visitWithQ: string;
let visitNoQ: string;
let visitA2: string;

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
    .values({ name: "D Org A", slug: `dtest-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "D Org B", slug: `dtest-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "D Patient A" })
    .returning();
  patientA = pa.id;

  visitWithQ = await makeVisit(orgA, patientA);
  visitNoQ = await makeVisit(orgA, patientA);
  visitA2 = await makeVisit(orgA, patientA);

  for (const vId of [visitWithQ, visitA2]) {
    await db.insert(questionnaireResponses).values({
      organizationId: orgA,
      visitId: vId,
      patientId: patientA,
      schemaVersion: 1,
      answers: { responses: [{ questionId: "sleep", value: "poor" }] },
    });
  }

  ctxA = ctx(orgA, "practitioner");
  ctxAStaff = ctx(orgA, "staff");
  ctxB = ctx(orgB, "owner");
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await closeDb();
});

describe("diagnosisService", () => {
  it("generates a diagnosis from the questionnaire and stores structured + raw", async () => {
    const d = await diagnosisService.createForVisit(ctxA, visitWithQ);
    expect(d.visitId).toBe(visitWithQ);
    expect(d.patientId).toBe(patientA);
    expect(d.questionnaireId).toBeTruthy();
    expect(d.provider).toBe("fake");
    expect(d.model).toBe("fake-model-1");
    expect(d.promptVersion).toBe("v1");
    expect(d.disclaimer).toContain("informational");
    expect(typeof d.confidence).toBe("number");
    // structured result
    const structured = d.structuredResult as {
      patterns: { name: string }[];
      summary: string;
    };
    expect(Array.isArray(structured.patterns)).toBe(true);
    expect(structured.patterns[0].name).toBe("Qi Deficiency");
    // original raw response preserved
    expect(d.rawResponse).toMatchObject({ provider: "fake" });
  });

  it("requires a questionnaire before diagnosing", async () => {
    await expect(
      diagnosisService.createForVisit(ctxA, visitNoQ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("keeps immutable history — multiple diagnoses per visit", async () => {
    const first = await diagnosisService.createForVisit(ctxA, visitA2);
    const second = await diagnosisService.createForVisit(ctxA, visitA2);
    expect(first.id).not.toBe(second.id);

    const list = await diagnosisService.listByVisit(ctxA, visitA2);
    const ids = list.map((d) => d.id);
    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("404s for an unknown or cross-org visit", async () => {
    await expect(
      diagnosisService.createForVisit(ctxA, randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundError);
    // org B cannot generate or list against org A's visit
    await expect(
      diagnosisService.createForVisit(ctxB, visitWithQ),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      diagnosisService.listByVisit(ctxB, visitWithQ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("enforces authorization (staff read-only)", async () => {
    await expect(
      diagnosisService.createForVisit(ctxAStaff, visitWithQ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const list = await diagnosisService.listByVisit(ctxAStaff, visitWithQ);
    expect(Array.isArray(list)).toBe(true);
  });
});
