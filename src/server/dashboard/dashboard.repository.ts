import { and, asc, eq, gte, lt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointments,
  diagnoses,
  organizationMembers,
  prescriptions,
  soapNotes,
  visits,
  type Appointment,
} from "@/db/schema";

const countExpr = sql<number>`count(*)::int`;

type VisitStatus = "open" | "completed" | "cancelled";
type PendingKind = "soap" | "diagnosis" | "prescription";

/**
 * Read-only aggregation queries for the clinical dashboard. Every query is
 * organization-scoped; optional provider filters narrow to one provider.
 */
export const dashboardRepository = {
  async todaysAppointments(
    organizationId: string,
    from: Date,
    to: Date,
    providerId?: string,
  ): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          gte(appointments.startTime, from),
          lt(appointments.startTime, to),
          providerId ? eq(appointments.providerId, providerId) : undefined,
        ),
      )
      .orderBy(asc(appointments.startTime));
  },

  async countVisitsByStatus(
    organizationId: string,
    status: VisitStatus,
    memberId?: string,
  ): Promise<number> {
    const [row] = await db
      .select({ count: countExpr })
      .from(visits)
      .where(
        and(
          eq(visits.organizationId, organizationId),
          eq(visits.status, status),
          memberId ? eq(visits.providerId, memberId) : undefined,
        ),
      );
    return row.count;
  },

  /** Non-cancelled visits missing the given artifact. */
  async countPending(
    organizationId: string,
    kind: PendingKind,
    memberId?: string,
  ): Promise<number> {
    const missing =
      kind === "soap"
        ? sql`not exists (select 1 from ${soapNotes} where ${soapNotes.visitId} = ${visits.id})`
        : kind === "diagnosis"
          ? sql`not exists (select 1 from ${diagnoses} where ${diagnoses.visitId} = ${visits.id})`
          : sql`not exists (select 1 from ${prescriptions} where ${prescriptions.visitId} = ${visits.id})`;

    const [row] = await db
      .select({ count: countExpr })
      .from(visits)
      .where(
        and(
          eq(visits.organizationId, organizationId),
          ne(visits.status, "cancelled"),
          memberId ? eq(visits.providerId, memberId) : undefined,
          missing,
        ),
      );
    return row.count;
  },

  /** organization_members.id for a user in the org (maps provider profile -> member). */
  async memberIdForUser(
    organizationId: string,
    userId: string,
  ): Promise<string | null> {
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
    return row?.id ?? null;
  },
};
