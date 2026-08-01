// Lightweight client-side response types. Kept independent of the server/db
// modules so no server code is bundled into the client. Shapes mirror the API.

export interface Patient {
  id: string;
  organizationId: string;
  fullName: string;
  dateOfBirth: string | null;
  sex: "male" | "female" | "other" | "unknown";
  email: string | null;
  phone: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type VisitStatus = "open" | "completed" | "cancelled";

export interface Visit {
  id: string;
  organizationId: string;
  patientId: string;
  providerId: string | null;
  status: VisitStatus;
  chiefComplaint: string | null;
  visitDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireResponseItem {
  questionId: string;
  value: string | number | boolean | string[] | null;
}

export interface Questionnaire {
  id: string;
  visitId: string;
  patientId: string;
  schemaVersion: number;
  answers: { responses: QuestionnaireResponseItem[] };
  submittedAt: string;
  createdAt: string;
}

export interface DiagnosisStructuredResult {
  patterns: Array<{ name: string; rationale: string }>;
  summary: string;
}

export interface Diagnosis {
  id: string;
  visitId: string;
  questionnaireId: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  reasoning: string | null;
  structuredResult: DiagnosisStructuredResult;
  confidence: number | null;
  disclaimer: string;
  isActive: boolean;
  createdAt: string;
}

export interface PrescriptionStructuredResult {
  formulaName: string;
  herbs: Array<{ name: string; dosage: string }>;
  instructions: string;
  durationDays: number;
}

export interface Prescription {
  id: string;
  diagnosisId: string;
  visitId: string;
  patientId: string;
  provider: string;
  model: string;
  promptVersion: string;
  structuredResult: PrescriptionStructuredResult;
  disclaimer: string;
  createdAt: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  organizationId: string;
  title: string | null;
  specialty: string | null;
  isActive: boolean;
}

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  organizationId: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarGroup {
  date: string;
  appointments: Appointment[];
}

export interface CalendarResult {
  view: "day" | "week" | "month";
  from: string;
  to: string;
  groups: CalendarGroup[];
}

export interface DashboardWidgets {
  todaysAppointments: number;
  waitingPatients: number;
  checkedInPatients: number;
  openVisits: number;
  completedVisits: number;
  pendingSoap: number;
  pendingDiagnosis: number;
  pendingPrescription: number;
}

export interface DashboardResult {
  date: string;
  providerId: string | null;
  widgets: DashboardWidgets;
  todaysAppointments: Appointment[];
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface DataResult<T> {
  data: T;
}

// ── Patient portal (Sprint 3) ────────────────────────────────────────────────

export interface PatientAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface SoapNote {
  id: string;
  visitId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfileRecord {
  patientId: string;
  organizationId: string;
  organizationName: string | null;
  fullName: string;
  dateOfBirth: string | null;
  sex: string;
}

export interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  activePatientId: string;
  records: PatientProfileRecord[];
  contact: {
    email: string | null;
    phone: string | null;
    address: PatientAddress | null;
  };
}

export interface PatientVisitListItem {
  id: string;
  organizationId: string;
  organizationName: string | null;
  providerName: string | null;
  status: string;
  visitDate: string;
  chiefComplaint: string | null;
  notes: string | null;
}

export interface PatientAppointment {
  id: string;
  organizationName: string | null;
  providerName: string | null;
  status: string;
  startTime: string;
  endTime: string;
}

export interface PatientDiagnosisItem extends Diagnosis {
  organizationName: string | null;
}

export interface PatientPrescriptionItem extends Prescription {
  organizationName: string | null;
  status: "active" | "past";
}

export interface PatientDashboard {
  name: string;
  activePatientId: string;
  upcomingAppointment: PatientAppointment | null;
  activePrescription: PatientPrescriptionItem | null;
  recentDiagnosis: PatientDiagnosisItem | null;
  recentVisit: PatientVisitListItem | null;
  followUps: string[];
}

export interface PatientVisitDetail {
  visit: PatientVisitListItem;
  soap: SoapNote | null;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
}
