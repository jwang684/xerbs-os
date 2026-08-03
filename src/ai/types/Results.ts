/**
 * Typed module results.
 *
 * Each future AI module produces one of these. They are intentionally minimal
 * for now — a single `kind` discriminant — so the framework carries no medical
 * shape yet, while giving `AIContext.results` real types instead of `unknown`.
 * The owning module fills in its fields when it is built.
 */

export interface AssessmentResult {
  readonly kind: "assessment";
}

export interface SummaryResult {
  readonly kind: "summary";
}

export interface DiagnosisResult {
  readonly kind: "diagnosis";
}

export interface FormulaResult {
  readonly kind: "formula";
}

export interface PrescriptionResult {
  readonly kind: "prescription";
}

export interface FollowUpResult {
  readonly kind: "followup";
}

/**
 * The accumulating outputs on an {@link AIContext}. Known modules are typed;
 * the index signature keeps the map open for experimental/custom modules.
 */
export interface ModuleResults {
  assessment?: AssessmentResult;
  summary?: SummaryResult;
  diagnosis?: DiagnosisResult;
  formula?: FormulaResult;
  prescription?: PrescriptionResult;
  followup?: FollowUpResult;
  [key: string]: unknown;
}
