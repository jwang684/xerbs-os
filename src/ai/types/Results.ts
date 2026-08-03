/**
 * Typed module results.
 *
 * `AssessmentResult` is now the real, schema-derived shape (see
 * `../schemas/assessment`). The remaining results are still minimal placeholders
 * — a single `kind` discriminant — so `AIContext.results` stays typed until each
 * owning module is built.
 */

import type { AssessmentResult } from "../schemas/assessment";

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
