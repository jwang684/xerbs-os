import { and, asc, eq, gt, gte, lt, lte, ne, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointments, type Appointment } from "@/db/schema";

export type CreateAppointmentData = Omit<
  typeof appointments.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;

export type UpdateAppointmentData = Partial<
  Pick<
    typeof appointments.$inferInsert,
    "startTime" | "endTime" | "status" | "notes"
  >
>;

export interface ListAppointmentsParams {
  providerId?: string;
  patientId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export interface ListAppointmentsResult {
  items: Appointment[];
  total: number;
}

// Statuses that do NOT free the slot — used for overlap detection.
const BLOCKING_EXCLUDED = ["cancelled", "no_show"] as const;

export const appointmentRepository = {
  async create(
    organizationId: string,
    data: CreateAppointmentData,
  ): Promise<Appointment> {
    const [row] = await db
      .insert(appointments)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Appointment | null> {
    const [row] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.id, id),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async update(
    organizationId: string,
    id: string,
    data: UpdateAppointmentData,
  ): Promise<Appointment | null> {
    const [row] = await db
      .update(appointments)
      .set(data)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.id, id),
        ),
      )
      .returning();
    return row ?? null;
  },

  async remove(organizationId: string, id: string): Promise<boolean> {
    const rows = await db
      .delete(appointments)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.id, id),
        ),
      )
      .returning({ id: appointments.id });
    return rows.length > 0;
  },

  async list(
    organizationId: string,
    { providerId, patientId, from, to, limit, offset }: ListAppointmentsParams,
  ): Promise<ListAppointmentsResult> {
    const filters = [eq(appointments.organizationId, organizationId)];
    if (providerId) filters.push(eq(appointments.providerId, providerId));
    if (patientId) filters.push(eq(appointments.patientId, patientId));
    if (from) filters.push(gte(appointments.startTime, from));
    if (to) filters.push(lte(appointments.startTime, to));
    const where = and(...filters);

    const items = await db
      .select()
      .from(appointments)
      .where(where)
      .orderBy(asc(appointments.startTime))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(where);

    return { items, total: count };
  },

  /**
   * True if the provider already has a non-cancelled appointment overlapping
   * [start, end). `excludeId` skips a specific appointment (for updates).
   */
  async hasOverlap(
    organizationId: string,
    providerId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const conds = [
      eq(appointments.organizationId, organizationId),
      eq(appointments.providerId, providerId),
      notInArray(appointments.status, [...BLOCKING_EXCLUDED]),
      lt(appointments.startTime, end),
      gt(appointments.endTime, start),
    ];
    if (excludeId) conds.push(ne(appointments.id, excludeId));

    const [row] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(...conds))
      .limit(1);
    return Boolean(row);
  },
};
