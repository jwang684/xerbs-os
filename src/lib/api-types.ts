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

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface DataResult<T> {
  data: T;
}
