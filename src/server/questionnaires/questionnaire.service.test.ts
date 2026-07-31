import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import { organizations, patients, visits } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { questionnaireService } from "./questionnaire.service";

let orgA: string;
let orgB: string;
let patientA: string;
let patientB: string;
let visitB: string;

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

const validContent = {
  responses: [
    { questionId: "sleep", value: "poor" },
    { questionId: "energy", value: 3 },
    { questionId: "symptoms", value: ["fatigue", "headache"] },
  ],
};

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Q Org A", slug: `qtest-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Q Org B", slug: `qtest-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  const [pa] = await db
    .insert(patients)
    .values({ organizationId: orgA, fullName: "Q Patient A" })
    .returning();
  const [pb] = await db
    .insert(patients)
    .values({ organizationId: orgB, fullName: "Q Patient B" })
    .returning();
  patientA = pa.id;
  patientB = pb.id;
  visitB = await makeVisit(orgB, patientB);

  ctxA = ctx(orgA, "practitioner");
  ctxAStaff = ctx(orgA, "staff");
  ctxB = ctx(orgB, "owner");
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await closeDb();
});

describe("questionnaireService CRUD", () => {
  it("creates, reads, and updates a questionnaire for a visit", async () => {
    const visit = await makeVisit(orgA, patientA);

    const created = await questionnaireService.createForVisit(ctxA, visit, {
      answers: validContent,
    });
    expect(created.visitId).toBe(visit);
    expect(created.patientId).toBe(patientA);
    expect(created.schemaVersion).toBe(1);
    expect(created.answers).toEqual(validContent);

    const read = await questionnaireService.getByVisit(ctxA, visit);
    expect(read.id).toBe(created.id);

    const updated = await questionnaireService.updateForVisit(ctxA, visit, {
      answers: { responses: [{ questionId: "sleep", value: "good" }] },
    });
    expect(updated.answers).toEqual({
      responses: [{ questionId: "sleep", value: "good" }],
    });
  });

  it("defaults to the latest schema version", async () => {
    const visit = await makeVisit(orgA, patientA);
    const created = await questionnaireService.createForVisit(ctxA, visit, {
      answers: { responses: [] },
    });
    expect(created.schemaVersion).toBe(1);
  });

  it("enforces one questionnaire per visit", async () => {
    const visit = await makeVisit(orgA, patientA);
    await questionnaireService.createForVisit(ctxA, visit, {
      answers: { responses: [] },
    });
    await expect(
      questionnaireService.createForVisit(ctxA, visit, {
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("version-safe validation", () => {
  it("rejects malformed content", async () => {
    const visit = await makeVisit(orgA, patientA);
    // responses not an array
    await expect(
      questionnaireService.createForVisit(ctxA, visit, {
        answers: { responses: "nope" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    // unknown top-level key (strict)
    await expect(
      questionnaireService.createForVisit(ctxA, visit, {
        answers: { responses: [], extra: 1 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    // unknown key inside a response (strict)
    await expect(
      questionnaireService.createForVisit(ctxA, visit, {
        answers: { responses: [{ questionId: "x", value: "y", z: 1 }] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects unsupported schema versions on create and update", async () => {
    const visit = await makeVisit(orgA, patientA);
    await expect(
      questionnaireService.createForVisit(ctxA, visit, {
        schemaVersion: 99,
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await questionnaireService.createForVisit(ctxA, visit, {
      answers: { responses: [] },
    });
    await expect(
      questionnaireService.updateForVisit(ctxA, visit, { schemaVersion: 99 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("cross-entity + organization isolation", () => {
  it("rejects creating for a visit in another organization", async () => {
    await expect(
      questionnaireService.createForVisit(ctxA, visitB, {
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not leak questionnaires across organizations", async () => {
    const visit = await makeVisit(orgA, patientA);
    await questionnaireService.createForVisit(ctxA, visit, {
      answers: validContent,
    });
    await expect(
      questionnaireService.getByVisit(ctxB, visit),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      questionnaireService.updateForVisit(ctxB, visit, {
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("authorization", () => {
  it("forbids staff from mutating, allows reading", async () => {
    const visit = await makeVisit(orgA, patientA);
    await expect(
      questionnaireService.createForVisit(ctxAStaff, visit, {
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const created = await questionnaireService.createForVisit(ctxA, visit, {
      answers: validContent,
    });
    await expect(
      questionnaireService.updateForVisit(ctxAStaff, visit, {
        answers: { responses: [] },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const read = await questionnaireService.getByVisit(ctxAStaff, visit);
    expect(read.id).toBe(created.id);
  });

  it("validates the visit id", async () => {
    await expect(
      questionnaireService.getByVisit(ctxA, "not-a-uuid"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
