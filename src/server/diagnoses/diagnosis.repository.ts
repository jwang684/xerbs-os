import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { diagnoses, type Diagnosis } from "@/db/schema";

/**
 * Data for a new diagnosis. Clinical content is immutable; the only mutable
 * state is the `is_active` marker, changed via `create` (activates the new one)
 * and `setActive`. There is no content update and no delete.
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
  /**
   * Inserts a diagnosis and makes it the active one for its visit, deactivating
   * any previously active diagnosis — atomically, so the "one active per visit"
   * invariant always holds.
   */
  async create(
    organizationId: string,
    data: CreateDiagnosisData,
  ): Promise<Diagnosis> {
    return db.transaction(async (tx) => {
      await tx
        .update(diagnoses)
        .set({ isActive: false })
        .where(
          and(
            eq(diagnoses.organizationId, organizationId),
            eq(diagnoses.visitId, data.visitId),
            eq(diagnoses.isActive, true),
          ),
        );
      const [row] = await tx
        .insert(diagnoses)
        .values({ ...data, organizationId, isActive: true })
        .returning();
      return row;
    });
  },

  async findById(organizationId: string, id: string): Promise<Diagnosis | null> {
    const [row] = await db
      .select()
      .from(diagnoses)
      .where(and(eq(diagnoses.organizationId, organizationId), eq(diagnoses.id, id)))
      .limit(1);
    return row ?? null;
  },

  async findActiveByVisit(
    organizationId: string,
    visitId: string,
  ): Promise<Diagnosis | null> {
    const [row] = await db
      .select()
      .from(diagnoses)
      .where(
        and(
          eq(diagnoses.organizationId, organizationId),
          eq(diagnoses.visitId, visitId),
          eq(diagnoses.isActive, true),
        ),
      )
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

  /**
   * Marks a specific diagnosis as the active one for its visit (deactivating the
   * rest). Returns null if the diagnosis is not in this org + visit.
   */
  async setActive(
    organizationId: string,
    visitId: string,
    diagnosisId: string,
  ): Promise<Diagnosis | null> {
    return db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: diagnoses.id })
        .from(diagnoses)
        .where(
          and(
            eq(diagnoses.organizationId, organizationId),
            eq(diagnoses.visitId, visitId),
            eq(diagnoses.id, diagnosisId),
          ),
        )
        .limit(1);
      if (!target) return null;

      await tx
        .update(diagnoses)
        .set({ isActive: false })
        .where(
          and(
            eq(diagnoses.organizationId, organizationId),
            eq(diagnoses.visitId, visitId),
            eq(diagnoses.isActive, true),
          ),
        );
      const [row] = await tx
        .update(diagnoses)
        .set({ isActive: true })
        .where(
          and(
            eq(diagnoses.organizationId, organizationId),
            eq(diagnoses.id, diagnosisId),
          ),
        )
        .returning();
      return row ?? null;
    });
  },
};
