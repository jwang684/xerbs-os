import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { diagnoses, type Diagnosis } from "@/db/schema";

/**
 * Data for a new diagnosis. Diagnoses are immutable, so the repository exposes
 * only create + reads — there is intentionally no update or delete.
 */
export interface CreateDiagnosisData {
  visitId: string;
  questionnaireId: string | null;
  patientId: string;
  provider: string;
  model: string;
  promptVersion: string;
  reasoning: string | null;
  structuredResult: Record<string, unknown>;
  rawResponse: unknown;
  confidence: number | null;
  disclaimer: string;
}

export const diagnosisRepository = {
  async create(
    organizationId: string,
    data: CreateDiagnosisData,
  ): Promise<Diagnosis> {
    const [row] = await db
      .insert(diagnoses)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(organizationId: string, id: string): Promise<Diagnosis | null> {
    const [row] = await db
      .select()
      .from(diagnoses)
      .where(and(eq(diagnoses.organizationId, organizationId), eq(diagnoses.id, id)))
      .limit(1);
    return row ?? null;
  },

  async listByVisit(
    organizationId: string,
    visitId: string,
  ): Promise<Diagnosis[]> {
    return db
      .select()
      .from(diagnoses)
      .where(
        and(
          eq(diagnoses.organizationId, organizationId),
          eq(diagnoses.visitId, visitId),
        ),
      )
      .orderBy(desc(diagnoses.createdAt));
  },
};
