import { and, asc, eq, gt, gte, lt, lte, ne, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointments,
  organizationMembers,
  providerProfiles,
  visits,
  type Appointment,
  type Visit,
} from "@/db/schema";

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
   * All appointments whose startTime falls in [from, to), optionally for one
   * provider, ordered by startTime. Used by the calendar (bounded range, so no
   * pagination).
   */
  async findInRange(
    organizationId: string,
    {
      providerId,
      from,
      to,
    }: { providerId?: string; from: Date; to: Date },
  ): Promise<Appointment[]> {
    const filters = [
      eq(appointments.organizationId, organizationId),
      gte(appointments.startTime, from),
      lt(appointments.startTime, to),
    ];
    if (providerId) filters.push(eq(appointments.providerId, providerId));

    return db
      .select()
      .from(appointments)
      .where(and(...filters))
      .orderBy(asc(appointments.startTime));
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

  /**
   * Atomically checks in a scheduled appointment: flips its status to
   * `checked_in` and creates the linked visit — in a single transaction. The
   * status guard makes this idempotent-safe: a non-scheduled appointment yields
   * null (no visit created). The unique index on visits.appointment_id is a
   * backstop against duplicate visits.
   */
  async checkIn(
    organizationId: string,
    appointmentId: string,
  ): Promise<{ appointment: Appointment; visit: Visit } | null> {
    return db.transaction(async (tx) => {
      const [appointment] = await tx
        .update(appointments)
        .set({ status: "checked_in" })
        .where(
          and(
            eq(appointments.organizationId, organizationId),
            eq(appointments.id, appointmentId),
            eq(appointments.status, "scheduled"),
          ),
        )
        .returning();
      if (!appointment) return null;

      // Inherit the appointment's provider on the visit. The visit's providerId
      // references organization_members, while the appointment references a
      // provider_profile — map profile -> member by the shared user within the
      // organization (null if that user is no longer a member).
      const [profile] = await tx
        .select({ userId: providerProfiles.userId })
        .from(providerProfiles)
        .where(
          and(
            eq(providerProfiles.id, appointment.providerId),
            eq(providerProfiles.organizationId, organizationId),
          ),
        )
        .limit(1);

      let providerMemberId: string | null = null;
      if (profile) {
        const [member] = await tx
          .select({ id: organizationMembers.id })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, organizationId),
              eq(organizationMembers.userId, profile.userId),
            ),
          )
          .limit(1);
        providerMemberId = member?.id ?? null;
      }

      const [visit] = await tx
        .insert(visits)
        .values({
          organizationId,
          patientId: appointment.patientId,
          providerId: providerMemberId,
          appointmentId: appointment.id,
        })
        .returning();

      return { appointment, visit };
    });
  },
};
