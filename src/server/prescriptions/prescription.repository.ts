import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { prescriptions, type Prescription } from "@/db/schema";

/**
 * Data for a new prescription. Prescriptions are immutable, so the repository
 * exposes only create + reads — no update or delete.
 */
export interface CreatePrescriptionData {
  diagnosisId: string;
  visitId: string;
  patientId: string;
  provider: string;
  model: string;
  promptVersion: string;
  structuredResult: Record<string, unknown>;
  rawResponse: unknown;
  disclaimer: string;
}

export const prescriptionRepository = {
  async create(
    organizationId: string,
    data: CreatePrescriptionData,
  ): Promise<Prescription> {
    const [row] = await db
      .insert(prescriptions)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Prescription | null> {
    const [row] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.organizationId, organizationId),
          eq(prescriptions.id, id),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async listByVisit(
    organizationId: string,
    visitId: string,
  ): Promise<Prescription[]> {
    return db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.organizationId, organizationId),
          eq(prescriptions.visitId, visitId),
        ),
      )
      .orderBy(desc(prescriptions.createdAt));
  },
};
