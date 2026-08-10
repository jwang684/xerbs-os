import type { z } from "zod";

import type {
  FormulaEvidenceSchema,
  FormulaSchema,
  TreatmentHypothesisSchema,
} from "../schemas/FormulaSchema";

/**
 * The structured output of FormulaModule — a ranked set of independent treatment
 * hypotheses (or an explicit insufficient-evidence outcome), with per-hypothesis
 * reasoning and evidence, and an overall strategy confidence.
 *
 * Types are derived from {@link FormulaSchema} so the runtime schema is the single
 * source of truth (no drift between validation and types). See
 * `docs/clinical/formula-specification.md` for the clinical contract.
 */
export type FormulaResult = z.infer<typeof FormulaSchema>;

/** One independent treatment hypothesis (principle + candidate formula family). */
export type TreatmentHypothesis = z.infer<typeof TreatmentHypothesisSchema>;

/** A single traceable supporting/conflicting fact ({ source, text }). */
export type FormulaEvidence = z.infer<typeof FormulaEvidenceSchema>;
