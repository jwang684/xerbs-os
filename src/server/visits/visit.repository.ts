import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { organizationMembers, visits, type Visit } from "@/db/schema";

/** Data required to create a visit (tenant + audit columns set elsewhere). */
export type CreateVisitData = Omit<
  typeof visits.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;

/** patientId is immutable, so it cannot be updated. */
export type UpdateVisitData = Partial<Omit<CreateVisitData, "patientId">>;

export interface ListVisitsParams {
  patientId?: string;
  status?: (typeof visits.status.enumValues)[number];
  limit: number;
  offset: number;
}

export interface ListVisitsResult {
  items: Visit[];
  total: number;
}

/**
 * Pure data access for visits. Every method is scoped by `organizationId` so
 * tenants stay isolated.
 */
export const visitRepository = {
  async create(organizationId: string, data: CreateVisitData): Promise<Visit> {
    const [row] = await db
      .insert(visits)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(organizationId: string, id: string): Promise<Visit | null> {
    const [row] = await db
      .select()
      .from(visits)
      .where(and(eq(visits.organizationId, organizationId), eq(visits.id, id)))
      .limit(1);
    return row ?? null;
  },

  async update(
    organizationId: string,
    id: string,
    data: UpdateVisitData,
  ): Promise<Visit | null> {
    const [row] = await db
      .update(visits)
      .set(data)
      .where(and(eq(visits.organizationId, organizationId), eq(visits.id, id)))
      .returning();
    return row ?? null;
  },

  async list(
    organizationId: string,
    { patientId, status, limit, offset }: ListVisitsParams,
  ): Promise<ListVisitsResult> {
    const filters = [eq(visits.organizationId, organizationId)];
    if (patientId) filters.push(eq(visits.patientId, patientId));
    if (status) filters.push(eq(visits.status, status));
    const where = and(...filters);

    const items = await db
      .select()
      .from(visits)
      .where(where)
      .orderBy(desc(visits.visitDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visits)
      .where(where);

    return { items, total: count };
  },

  /** True if `providerId` is a member of the given organization. */
  async providerExists(
    organizationId: string,
    providerId: string,
  ): Promise<boolean> {
    const [row] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, providerId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      )
      .limit(1);
    return Boolean(row);
  },
};
