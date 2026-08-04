import { z } from "zod";

/**
 * Runtime contract for FormulaResult — the structured output of FormulaModule.
 *
 * STATUS: FROZEN — "Formula Contract v1" (tag: formula-contract-v1). A stable,
 * long-term runtime contract; changes require explicit clinical/architectural
 * justification and a new contract version.
 *
 * It faithfully implements the frozen clinical specification
 * (`docs/clinical/formula-specification.md`) and the AI Runtime Contract
 * (`docs/architecture/10-ai-runtime.md`). Formula is the first TREATMENT-STRATEGY
 * layer: it turns a diagnosis into **treatment hypotheses** — treatment
 * principle(s) and candidate formula family(ies) — never a prescription.
 *
 * Design intent: strategy only (no named formula, herbs, dosage, prescription,
 * or follow-up); a ranked set of INDEPENDENT treatment hypotheses that preserves
 * the diagnostic differential (never collapsed into one); each hypothesis
 * evidence-traceable; overall confidence kept separate from per-hypothesis
 * reasoning; and an explicit "insufficient evidence" outcome as a first-class
 * result — mirroring the frozen Diagnosis contract.
 *
 * Versioning follows the established precedent: no per-object version field
 * (schema evolution is managed at the schema layer). Extensibility comes from
 * optional fields and unknown-key stripping.
 */

/**
 * One traceable fact linking a treatment hypothesis to prior modules. `source`
 * records provenance — the originating Diagnosis / Summary / Assessment element —
 * so the strategy stays traceable. `text` is the factual statement, restated
 * faithfully. Same provenance model as the Diagnosis contract.
 */
export const FormulaEvidenceSchema = z.object({
  source: z.string().min(1),
  text: z.string().min(1),
});

/**
 * One independent treatment hypothesis. Each stands on its own — it carries its
 * own principle, candidate formula family, reasoning, and supporting/conflicting
 * evidence. A differential diagnosis yields multiple hypotheses; they are never
 * collapsed into a single strategy.
 */
export const TreatmentHypothesisSchema = z.object({
  /**
   * Ordinal ranking within the set (1 = best-supported). Comparative support
   * among the hypotheses only — NOT probability, certainty, or confirmed truth.
   */
  rank: z.number().int().positive(),
  /**
   * The treatment principle / method — e.g. "Tonify Qi", "Move Liver Qi". A
   * principle, never a specific remedy.
   */
  treatmentPrinciple: z.string().min(1),
  /**
   * The formula family / direction that embodies the principle — e.g.
   * "Qi-tonifying formulas". Strategy direction only; NEVER a named prescription
   * formula (that is Prescription's task).
   */
  formulaFamily: z.string().min(1),
  /** Why this strategy follows from the diagnosis. */
  reasoning: z.string().min(1),
  /** Evidence that supports this strategy (traceable to prior modules). */
  supportingEvidence: z.array(FormulaEvidenceSchema).default([]),
  /** Evidence that argues against this strategy; kept separate on purpose. */
  conflictingEvidence: z.array(FormulaEvidenceSchema).default([]),
});

export const FormulaSchema = z
  .object({
    /**
     * The ranked set of independent treatment hypotheses — the primary output.
     * (Formula owns `treatmentHypotheses`; Diagnosis owns `candidates`.) May be
     * empty when the input is insufficient (see `insufficientEvidence`); Formula
     * is never forced to invent a strategy, and never collapses a diagnostic
     * differential into one hypothesis.
     */
    treatmentHypotheses: z.array(TreatmentHypothesisSchema).default([]),

    /**
     * First-class outcome: the diagnosis/evidence is inadequate to responsibly
     * commit to a treatment strategy. Uncertainty is an acceptable clinical
     * result (equivalent to the Diagnosis contract's insufficient-evidence
     * outcome).
     */
    insufficientEvidence: z.boolean().default(false),
    /** Why the evidence is insufficient (required when insufficientEvidence). */
    insufficientEvidenceReason: z.string().min(1).optional(),

    /**
     * Overall strategy confidence in [0, 1] — DISTINCT from per-hypothesis rank
     * and reasoning. It inherits the Diagnosis confidence and may only stay the
     * same or decrease; it must never be raised without new clinical evidence.
     */
    confidence: z.number().min(0).max(1),
    /** Human-readable reason for the confidence value (preserved or lowered). */
    confidenceReason: z.string().min(1),

    /**
     * Unresolved points and what additional evidence would refine the strategy.
     * Descriptive strategic uncertainty only — not a follow-up plan, action list,
     * or patient instruction.
     */
    uncertaintyNotes: z.array(z.string().min(1)).default([]),
  })
  // A result must say something: either treatment hypotheses or an explicit
  // insufficient-evidence outcome. It is never silently empty.
  .refine((v) => v.treatmentHypotheses.length >= 1 || v.insufficientEvidence, {
    message:
      "Provide at least one treatment hypothesis, or set insufficientEvidence to true.",
  })
  // Insufficient-evidence outcomes must explain themselves.
  .refine(
    (v) => !v.insufficientEvidence || Boolean(v.insufficientEvidenceReason),
    {
      message:
        "insufficientEvidenceReason is required when insufficientEvidence is true.",
      path: ["insufficientEvidenceReason"],
    },
  );
