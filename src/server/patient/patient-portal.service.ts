import type { Diagnosis, PatientAddress, Prescription } from "@/db/schema";

import { NotFoundError } from "../http/errors";
import { validate } from "../http/validate";
import type { PatientContext } from "./patient-context";
import {
  patientPortalRepository as repo,
  type AppointmentRow,
  type VisitRow,
} from "./patient-portal.repository";
import { updateProfileSchema, visitIdSchema } from "./patient-portal.schema";

export interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  activePatientId: string;
  // The user's records, for the clinic/record selector (Phase 1 normally one).
  records: Array<{
    patientId: string;
    organizationId: string;
    organizationName: string | null;
    fullName: string;
    dateOfBirth: string | null;
    sex: string;
  }>;
  // The active record's editable contact info.
  contact: {
    email: string | null;
    phone: string | null;
    address: PatientAddress | null;
  };
}

export type PatientPrescriptionItem = Prescription & {
  organizationName: string | null;
  // Derived (no lifecycle column yet): the newest prescription is "active".
  status: "active" | "past";
};

export type PatientDiagnosisItem = Diagnosis & {
  organizationName: string | null;
};

export interface PatientDashboard {
  name: string;
  activePatientId: string;
  upcomingAppointment: AppointmentRow | null;
  activePrescription: PatientPrescriptionItem | null;
  recentDiagnosis: PatientDiagnosisItem | null;
  recentVisit: VisitRow | null;
  // Placeholder for a future follow-up/reminders feature.
  followUps: string[];
}

export interface PatientVisitDetail {
  visit: VisitRow;
  soap: Awaited<ReturnType<typeof repo.getSoapByVisit>>;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
}

/**
 * Resolves which of the caller's records to act on. Phase 1 normally has a
 * single record and defaults to it. An explicit selector is validated against
 * the caller's own records — it can only pick among records the session already
 * proves ownership of, so it is not an authorization bypass. Unknown ids 404.
 */
function activePatientId(ctx: PatientContext, requested?: string): string {
  if (requested) {
    if (!ctx.patientIds.includes(requested)) {
      throw new NotFoundError("Patient record not found");
    }
    return requested;
  }
  return ctx.patientIds[0];
}

export const patientPortalService = {
  async getProfile(
    ctx: PatientContext,
    requested?: string,
  ): Promise<PatientProfile> {
    const activeId = activePatientId(ctx, requested);
    const records = await repo.listProfiles(ctx.patientIds);
    const active = records.find((r) => r.patientId === activeId)!;
    return {
      userId: ctx.userId,
      name: ctx.name,
      email: ctx.email,
      activePatientId: activeId,
      records: records.map((r) => ({
        patientId: r.patientId,
        organizationId: r.organizationId,
        organizationName: r.organizationName,
        fullName: r.fullName,
        dateOfBirth: r.dateOfBirth,
        sex: r.sex,
      })),
      contact: {
        email: active.email,
        phone: active.phone,
        address: active.address,
      },
    };
  },

  async updateProfile(
    ctx: PatientContext,
    requested: string | undefined,
    input: unknown,
  ): Promise<PatientProfile> {
    const activeId = activePatientId(ctx, requested);
    const patch = validate(updateProfileSchema, input);
    await repo.updateContact(activeId, patch);
    return this.getProfile(ctx, activeId);
  },

  async getDashboard(
    ctx: PatientContext,
    requested?: string,
  ): Promise<PatientDashboard> {
    const activeId = activePatientId(ctx, requested);
    const [upcomingAppointment, visits, diagnoses, prescriptions] =
      await Promise.all([
        repo.upcomingAppointment(activeId, new Date()),
        repo.listVisits(activeId),
        repo.listDiagnoses(activeId),
        repo.listPrescriptions(activeId),
      ]);
    const newest = prescriptions[0];
    return {
      name: ctx.name,
      activePatientId: activeId,
      upcomingAppointment,
      activePrescription: newest ? { ...newest, status: "active" } : null,
      recentDiagnosis: diagnoses[0] ?? null,
      recentVisit: visits[0] ?? null,
      followUps: [],
    };
  },

  async listVisits(
    ctx: PatientContext,
    requested?: string,
  ): Promise<{ items: VisitRow[]; total: number }> {
    const activeId = activePatientId(ctx, requested);
    const items = await repo.listVisits(activeId);
    return { items, total: items.length };
  },

  async getVisitDetail(
    ctx: PatientContext,
    requested: string | undefined,
    visitId: string,
  ): Promise<PatientVisitDetail> {
    const id = validate(visitIdSchema, visitId);
    const activeId = activePatientId(ctx, requested);
    const visit = await repo.getVisit(activeId, id);
    if (!visit) {
      throw new NotFoundError("Visit not found");
    }
    const [soap, diagnoses, prescriptions] = await Promise.all([
      repo.getSoapByVisit(id),
      repo.listDiagnosesByVisit(id),
      repo.listPrescriptionsByVisit(id),
    ]);
    return { visit, soap, diagnoses, prescriptions };
  },

  async listDiagnoses(
    ctx: PatientContext,
    requested?: string,
  ): Promise<{ items: PatientDiagnosisItem[]; total: number }> {
    const activeId = activePatientId(ctx, requested);
    const items = await repo.listDiagnoses(activeId);
    return { items, total: items.length };
  },

  async listPrescriptions(
    ctx: PatientContext,
    requested?: string,
  ): Promise<{ items: PatientPrescriptionItem[]; total: number }> {
    const activeId = activePatientId(ctx, requested);
    const rows = await repo.listPrescriptions(activeId);
    // Newest is "active"; older ones are "past" (no lifecycle column yet).
    const items: PatientPrescriptionItem[] = rows.map((r, i) => ({
      ...r,
      status: i === 0 ? "active" : "past",
    }));
    return { items, total: items.length };
  },
};
