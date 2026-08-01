import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  appointments,
  diagnoses,
  organizationMembers,
  organizations,
  patients,
  prescriptions,
  providerProfiles,
  soapNotes,
  user,
  visits,
  type Diagnosis,
  type PatientAddress,
  type Prescription,
  type SoapNote,
} from "@/db/schema";

export interface ProfileRecord {
  patientId: string;
  organizationId: string;
  organizationName: string | null;
  fullName: string;
  dateOfBirth: string | null;
  sex: string;
  email: string | null;
  phone: string | null;
  address: PatientAddress | null;
  updatedAt: Date;
}

export interface VisitRow {
  id: string;
  organizationId: string;
  organizationName: string | null;
  providerName: string | null;
  status: string;
  visitDate: Date;
  chiefComplaint: string | null;
  notes: string | null;
}

export interface AppointmentRow {
  id: string;
  organizationName: string | null;
  providerName: string | null;
  status: string;
  startTime: Date;
  endTime: Date;
}

export interface ContactPatch {
  email?: string | null;
  phone?: string | null;
  address?: PatientAddress | null;
}

const visitSelection = {
  id: visits.id,
  organizationId: visits.organizationId,
  organizationName: organizations.name,
  providerName: user.name,
  status: visits.status,
  visitDate: visits.visitDate,
  chiefComplaint: visits.chiefComplaint,
  notes: visits.notes,
};

// Visits join the provider through the organization member -> user.
const visitBase = () =>
  db
    .select(visitSelection)
    .from(visits)
    .leftJoin(organizationMembers, eq(visits.providerId, organizationMembers.id))
    .leftJoin(user, eq(organizationMembers.userId, user.id))
    .leftJoin(organizations, eq(visits.organizationId, organizations.id));

/**
 * Read-only aggregation over a single patient record. The active record is
 * resolved from the session (see the service); the portal never trusts a patient
 * id from the request without first checking it belongs to the caller.
 * `listProfiles` takes the caller's full id set only to render the record
 * selector — it does not merge clinical data across clinics.
 */
export const patientPortalRepository = {
  /** All of the user's records (for the record/clinic selector). */
  async listProfiles(patientIds: string[]): Promise<ProfileRecord[]> {
    return db
      .select({
        patientId: patients.id,
        organizationId: patients.organizationId,
        organizationName: organizations.name,
        fullName: patients.fullName,
        dateOfBirth: patients.dateOfBirth,
        sex: patients.sex,
        email: patients.email,
        phone: patients.phone,
        address: patients.address,
        updatedAt: patients.updatedAt,
      })
      .from(patients)
      .leftJoin(organizations, eq(patients.organizationId, organizations.id))
      .where(inArray(patients.id, patientIds))
      .orderBy(desc(patients.updatedAt));
  },

  /** Applies a contact patch to a single record. */
  async updateContact(patientId: string, patch: ContactPatch): Promise<void> {
    const set: Record<string, unknown> = {};
    if (patch.email !== undefined) set.email = patch.email;
    if (patch.phone !== undefined) set.phone = patch.phone;
    if (patch.address !== undefined) set.address = patch.address;
    if (Object.keys(set).length === 0) return;
    await db.update(patients).set(set).where(eq(patients.id, patientId));
  },

  async listVisits(patientId: string): Promise<VisitRow[]> {
    return visitBase()
      .where(eq(visits.patientId, patientId))
      .orderBy(desc(visits.visitDate));
  },

  async getVisit(
    patientId: string,
    visitId: string,
  ): Promise<VisitRow | null> {
    const [row] = await visitBase()
      .where(and(eq(visits.id, visitId), eq(visits.patientId, patientId)))
      .limit(1);
    return row ?? null;
  },

  async getSoapByVisit(visitId: string): Promise<SoapNote | null> {
    const [row] = await db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.visitId, visitId))
      .limit(1);
    return row ?? null;
  },

  async listDiagnosesByVisit(visitId: string): Promise<Diagnosis[]> {
    return db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.visitId, visitId))
      .orderBy(desc(diagnoses.createdAt));
  },

  async listPrescriptionsByVisit(visitId: string): Promise<Prescription[]> {
    return db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.visitId, visitId))
      .orderBy(desc(prescriptions.createdAt));
  },

  async listDiagnoses(
    patientId: string,
  ): Promise<Array<Diagnosis & { organizationName: string | null }>> {
    return db
      .select({
        id: diagnoses.id,
        organizationId: diagnoses.organizationId,
        visitId: diagnoses.visitId,
        questionnaireId: diagnoses.questionnaireId,
        patientId: diagnoses.patientId,
        provider: diagnoses.provider,
        model: diagnoses.model,
        promptVersion: diagnoses.promptVersion,
        reasoning: diagnoses.reasoning,
        structuredResult: diagnoses.structuredResult,
        rawResponse: diagnoses.rawResponse,
        confidence: diagnoses.confidence,
        disclaimer: diagnoses.disclaimer,
        isActive: diagnoses.isActive,
        createdAt: diagnoses.createdAt,
        organizationName: organizations.name,
      })
      .from(diagnoses)
      .leftJoin(organizations, eq(diagnoses.organizationId, organizations.id))
      .where(eq(diagnoses.patientId, patientId))
      .orderBy(desc(diagnoses.createdAt));
  },

  async listPrescriptions(
    patientId: string,
  ): Promise<Array<Prescription & { organizationName: string | null }>> {
    return db
      .select({
        id: prescriptions.id,
        organizationId: prescriptions.organizationId,
        diagnosisId: prescriptions.diagnosisId,
        visitId: prescriptions.visitId,
        patientId: prescriptions.patientId,
        provider: prescriptions.provider,
        model: prescriptions.model,
        promptVersion: prescriptions.promptVersion,
        structuredResult: prescriptions.structuredResult,
        rawResponse: prescriptions.rawResponse,
        disclaimer: prescriptions.disclaimer,
        createdAt: prescriptions.createdAt,
        organizationName: organizations.name,
      })
      .from(prescriptions)
      .leftJoin(
        organizations,
        eq(prescriptions.organizationId, organizations.id),
      )
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  },

  /** The soonest future appointment (scheduled or checked-in), if any. */
  async upcomingAppointment(
    patientId: string,
    now: Date,
  ): Promise<AppointmentRow | null> {
    const [row] = await db
      .select({
        id: appointments.id,
        organizationName: organizations.name,
        providerName: user.name,
        status: appointments.status,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
      })
      .from(appointments)
      .leftJoin(
        providerProfiles,
        eq(appointments.providerId, providerProfiles.id),
      )
      .leftJoin(user, eq(providerProfiles.userId, user.id))
      .leftJoin(
        organizations,
        eq(appointments.organizationId, organizations.id),
      )
      .where(
        and(
          eq(appointments.patientId, patientId),
          gte(appointments.startTime, now),
          inArray(appointments.status, ["scheduled", "checked_in"]),
        ),
      )
      .orderBy(asc(appointments.startTime))
      .limit(1);
    return row ?? null;
  },
};
