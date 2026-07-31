import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { patients, type Patient } from "@/db/schema";

/** Data required to create a patient (tenant + audit columns are set elsewhere). */
export type CreatePatientData = Omit<
  typeof patients.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type UpdatePatientData = Partial<CreatePatientData>;

export interface ListPatientsParams {
  q?: string;
  limit: number;
  offset: number;
}

export interface ListPatientsResult {
  items: Patient[];
  total: number;
}

/**
 * Pure data access for patients. EVERY method is scoped by `organizationId`, so
 * one tenant can never read or mutate another tenant's rows. Soft-deleted rows
 * (`deleted_at IS NOT NULL`) are excluded from all reads and writes.
 */
export const patientRepository = {
  async create(
    organizationId: string,
    data: CreatePatientData,
  ): Promise<Patient> {
    const [row] = await db
      .insert(patients)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(organizationId: string, id: string): Promise<Patient | null> {
    const [row] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.organizationId, organizationId),
          eq(patients.id, id),
          isNull(patients.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async update(
    organizationId: string,
    id: string,
    data: UpdatePatientData,
  ): Promise<Patient | null> {
    const [row] = await db
      .update(patients)
      .set(data)
      .where(
        and(
          eq(patients.organizationId, organizationId),
          eq(patients.id, id),
          isNull(patients.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  },

  async softDelete(organizationId: string, id: string): Promise<Patient | null> {
    const [row] = await db
      .update(patients)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(patients.organizationId, organizationId),
          eq(patients.id, id),
          isNull(patients.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  },

  async list(
    organizationId: string,
    { q, limit, offset }: ListPatientsParams,
  ): Promise<ListPatientsResult> {
    const filters = [
      eq(patients.organizationId, organizationId),
      isNull(patients.deletedAt),
    ];
    if (q) {
      const pattern = `%${q}%`;
      filters.push(
        or(ilike(patients.fullName, pattern), ilike(patients.email, pattern))!,
      );
    }
    const where = and(...filters);

    const items = await db
      .select()
      .from(patients)
      .where(where)
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(where);

    return { items, total: count };
  },
};
