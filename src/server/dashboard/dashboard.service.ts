import type { Appointment } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import { BadRequestError } from "../http/errors";
import { validate } from "../http/validate";
import { providerRepository } from "../providers/provider.repository";
import { dashboardRepository } from "./dashboard.repository";
import { dashboardQuerySchema } from "./dashboard.schema";

export interface DashboardResult {
  date: string;
  providerId: string | null;
  widgets: {
    todaysAppointments: number;
    waitingPatients: number;
    checkedInPatients: number;
    openVisits: number;
    completedVisits: number;
    pendingSoap: number;
    pendingDiagnosis: number;
    pendingPrescription: number;
  };
  todaysAppointments: Appointment[];
}

/**
 * Clinical dashboard: read-only aggregation over existing entities. No business
 * logic is duplicated — it counts/lists what the other domains already own.
 *
 * Scope:
 *   - owner/admin/staff: organization-wide, with an optional provider filter.
 *   - practitioner: their own dashboard (appointments for their provider
 *     profile; visits assigned to their membership).
 */
export const dashboardService = {
  async getDashboard(
    ctx: AuthContext,
    query: unknown,
  ): Promise<DashboardResult> {
    const { providerId, date } = validate(dashboardQuerySchema, query);
    const day = date ?? new Date().toISOString().slice(0, 10);
    const from = new Date(`${day}T00:00:00.000Z`);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 1);

    const org = ctx.organizationId;

    // Provider scope. Appointment widgets filter by provider profile; visit
    // widgets filter by the corresponding organization member.
    let apptProviderId: string | undefined;
    let visitMemberId: string | undefined;
    let apptEmpty = false;
    let visitEmpty = false;
    let appliedProviderId: string | null = null;

    if (ctx.role === "practitioner") {
      const profile = await providerRepository.findByUser(org, ctx.userId);
      apptProviderId = profile?.id;
      apptEmpty = !profile;
      appliedProviderId = profile?.id ?? null;
      visitMemberId = ctx.membershipId;
    } else if (providerId) {
      const profile = await providerRepository.findById(org, providerId);
      if (!profile) {
        throw new BadRequestError("Provider not found in organization");
      }
      apptProviderId = profile.id;
      appliedProviderId = profile.id;
      const memberId = await dashboardRepository.memberIdForUser(
        org,
        profile.userId,
      );
      visitMemberId = memberId ?? undefined;
      visitEmpty = memberId == null;
    }

    const appts = apptEmpty
      ? []
      : await dashboardRepository.todaysAppointments(
          org,
          from,
          to,
          apptProviderId,
        );

    const [
      openVisits,
      completedVisits,
      pendingSoap,
      pendingDiagnosis,
      pendingPrescription,
    ] = visitEmpty
      ? [0, 0, 0, 0, 0]
      : await Promise.all([
          dashboardRepository.countVisitsByStatus(org, "open", visitMemberId),
          dashboardRepository.countVisitsByStatus(
            org,
            "completed",
            visitMemberId,
          ),
          dashboardRepository.countPending(org, "soap", visitMemberId),
          dashboardRepository.countPending(org, "diagnosis", visitMemberId),
          dashboardRepository.countPending(org, "prescription", visitMemberId),
        ]);

    return {
      date: day,
      providerId: appliedProviderId,
      widgets: {
        todaysAppointments: appts.length,
        waitingPatients: appts.filter((a) => a.status === "scheduled").length,
        checkedInPatients: appts.filter((a) => a.status === "checked_in").length,
        openVisits,
        completedVisits,
        pendingSoap,
        pendingDiagnosis,
        pendingPrescription,
      },
      todaysAppointments: appts,
    };
  },
};
