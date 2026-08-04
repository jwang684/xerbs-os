/**
 * Typed module results.
 *
 * `AssessmentResult`, `SummaryResult`, and `DiagnosisResult` are the real,
 * schema-derived shapes (see `../schemas/*`). The remaining results are still
 * minimal placeholders — a single `kind` discriminant — so `AIContext.results`
 * stays typed until each owning module is built.
 */

import type { AssessmentResult } from "../schemas/assessment";
import type { DiagnosisResult } from "./DiagnosisResult";
import type { SummaryResult } from "./SummaryResult";

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
