/**
 * Typed module results.
 *
 * `AssessmentResult`, `SummaryResult`, `DiagnosisResult`, `FormulaResult`, and
 * `PrescriptionResult` are the real, schema-derived shapes (see `../schemas/*`).
 * The remaining result is still a minimal placeholder — a single `kind`
 * discriminant — so `AIContext.results` stays typed until its owning module is
 * built.
 */

import type { AssessmentResult } from "../schemas/assessment";
import type { DiagnosisResult } from "./DiagnosisResult";
import type { FormulaResult } from "./FormulaResult";
import type { PrescriptionResult } from "./PrescriptionResult";
import type { SummaryResult } from "./SummaryResult";

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
