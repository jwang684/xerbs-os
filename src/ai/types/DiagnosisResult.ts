import type { z } from "zod";

import type {
  CandidateDiagnosisSchema,
  DiagnosisEvidenceSchema,
  DiagnosisSchema,
} from "../schemas/DiagnosisSchema";

/**
 * The structured output of DiagnosisModule — a ranked differential of clinical
 * hypotheses (or an explicit insufficient-evidence outcome), with per-candidate
 * reasoning and evidence, and an overall diagnostic confidence.
 *
 * Types are derived from {@link DiagnosisSchema} so the runtime schema is the
 * single source of truth (no drift between validation and types). See
 * `docs/clinical/diagnosis-specification.md` for the clinical contract.
 */
export type DiagnosisResult = z.infer<typeof DiagnosisSchema>;

/** One independent hypothesis in the differential. */
export type CandidateDiagnosis = z.infer<typeof CandidateDiagnosisSchema>;

/** A single traceable supporting/conflicting fact ({ source, text }). */
export type DiagnosisEvidence = z.infer<typeof DiagnosisEvidenceSchema>;
