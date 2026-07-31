import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  organizationMembers,
  providerProfiles,
  type ProviderProfile,
} from "@/db/schema";

export type CreateProviderData = Omit<
  typeof providerProfiles.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;

export type UpdateProviderData = Partial<
  Omit<CreateProviderData, "userId">
>;

export interface ListProvidersParams {
  isActive?: boolean;
  limit: number;
  offset: number;
}

export interface ListProvidersResult {
  items: ProviderProfile[];
  total: number;
}

/**
 * Pure data access for provider profiles. Every method is scoped by
 * `organizationId` so tenants stay isolated.
 */
export const providerRepository = {
  async create(
    organizationId: string,
    data: CreateProviderData,
  ): Promise<ProviderProfile> {
    const [row] = await db
      .insert(providerProfiles)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProviderProfile | null> {
    const [row] = await db
      .select()
      .from(providerProfiles)
      .where(
        and(
          eq(providerProfiles.organizationId, organizationId),
          eq(providerProfiles.id, id),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<ProviderProfile | null> {
    const [row] = await db
      .select()
      .from(providerProfiles)
      .where(
        and(
          eq(providerProfiles.organizationId, organizationId),
          eq(providerProfiles.userId, userId),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async update(
    organizationId: string,
    id: string,
    data: UpdateProviderData,
  ): Promise<ProviderProfile | null> {
    const [row] = await db
      .update(providerProfiles)
      .set(data)
      .where(
        and(
          eq(providerProfiles.organizationId, organizationId),
          eq(providerProfiles.id, id),
        ),
      )
      .returning();
    return row ?? null;
  },

  async list(
    organizationId: string,
    { isActive, limit, offset }: ListProvidersParams,
  ): Promise<ListProvidersResult> {
    const filters = [eq(providerProfiles.organizationId, organizationId)];
    if (isActive !== undefined) {
      filters.push(eq(providerProfiles.isActive, isActive));
    }
    const where = and(...filters);

    const items = await db
      .select()
      .from(providerProfiles)
      .where(where)
      .orderBy(desc(providerProfiles.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .where(where);

    return { items, total: count };
  },

  /** True if `userId` is a member of the given organization. */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
        ),
      )
      .limit(1);
    return Boolean(row);
  },
};
