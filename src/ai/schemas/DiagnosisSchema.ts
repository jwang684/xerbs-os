import { z } from "zod";

/**
 * Runtime contract for DiagnosisResult — the structured output of DiagnosisModule.
 *
 * STATUS: FROZEN — "Diagnosis Contract v1" (tag: diagnosis-contract-v1). A stable,
 * long-term runtime contract; changes require explicit clinical/architectural
 * justification and a new contract version.
 *
 * Design principle: a field exists only when there is both a stable PRODUCER and a
 * stable CONSUMER, it owns unique information, and that information cannot already
 * be derived. Deferred ideas (patternId, type) and rejected ideas (criteria,
 * relatedPatterns) all fail that test today — they depend on a knowledge
 * vocabulary/graph that does not yet exist, or duplicate existing fields. They
 * remain fully backward-compatible future additions.
 *
 * It faithfully implements the frozen clinical specification
 * (`docs/clinical/diagnosis-specification.md`) and the AI Runtime Contract
 * (`docs/architecture/10-ai-runtime.md`). Diagnosis is the first INTERPRETING
 * module: it turns organized evidence into clinical HYPOTHESES — never confirmed
 * facts, and never treatment.
 *
 * Design intent: interpretation only (no formula/herbs/prescription/follow-up); a
 * ranked DIFFERENTIAL rather than a single answer; each hypothesis independent and
 * evidence-traceable; overall diagnostic confidence kept separate from per-
 * candidate ranking; and an explicit "insufficient evidence" outcome as a
 * first-class result.
 *
 * Versioning follows the Summary precedent: the runtime object carries no
 * per-object version field (schema evolution is managed at the schema layer).
 * Extensibility comes from optional fields and unknown-key stripping — new
 * attributes can be added without breaking existing consumers.
 */

/**
 * One traceable fact linking a hypothesis to prior evidence. `source` records
 * provenance — the originating Summary (or Assessment) element the fact came from
 * — so the interpretation stays traceable. `text` is the factual statement. Both
 * are restated facts from earlier modules; never new facts, never interpretation.
 */
export const DiagnosisEvidenceSchema = z.object({
  source: z.string().min(1),
  text: z.string().min(1),
});

/**
 * One independent hypothesis in the differential. Each stands on its own — it
 * carries its own reasoning and its own supporting/conflicting evidence; there is
 * no shared top-level reasoning.
 */
export const CandidateDiagnosisSchema = z.object({
  /** The interpreted pattern/syndrome — a hypothesis label, not a confirmed fact. */
  pattern: z.string().min(1),
  /**
   * Ordinal ranking within the differential (1 = best-supported). This expresses
   * COMPARATIVE SUPPORT among competing hypotheses only — it is NOT an objective
   * probability, diagnostic certainty, or confirmed truth.
   */
  rank: z.number().int().positive(),
  /** Diagnostic reasoning justifying this hypothesis against the evidence. */
  reasoning: z.string().min(1),
  /** Evidence that supports this hypothesis (traceable to prior modules). */
  supportingEvidence: z.array(DiagnosisEvidenceSchema).default([]),
  /** Evidence that argues against this hypothesis; kept separate on purpose. */
  conflictingEvidence: z.array(DiagnosisEvidenceSchema).default([]),
});

export const DiagnosisSchema = z
  .object({
    /**
     * The ranked differential — the primary output. May be empty when the
     * evidence is insufficient (see `insufficientEvidence`); Diagnosis is never
     * forced to invent a diagnosis.
     */
    candidates: z.array(CandidateDiagnosisSchema).default([]),

    /**
     * First-class outcome: the evidence is inadequate, conflicting, or incomplete
     * and no diagnosis can be responsibly determined. Uncertainty is an
     * acceptable clinical result.
     */
    insufficientEvidence: z.boolean().default(false),
    /** Why the evidence is insufficient (required when insufficientEvidence). */
    insufficientEvidenceReason: z.string().min(1).optional(),

    /**
     * Overall diagnostic confidence in [0, 1] — DISTINCT from per-candidate rank.
     * It inherits the Summary confidence and may only stay the same or decrease;
     * it must never be raised without new clinical evidence.
     */
    confidence: z.number().min(0).max(1),
    /** Human-readable reason for the confidence value (preserved or lowered). */
    confidenceReason: z.string().min(1),

    /**
     * Unresolved points and what additional evidence would refine the
     * interpretation. Descriptive diagnostic uncertainty only — not a follow-up
     * plan, action list, or patient instruction.
     */
    uncertaintyNotes: z.array(z.string().min(1)).default([]),

    /**
     * Clinical disclaimer (informational, not a substitute for clinician
     * judgment). Module-populated, so optional at the model boundary.
     */
    disclaimer: z.string().min(1).optional(),
  })
  // A result must say something: either a differential or an explicit
  // insufficient-evidence outcome. It is never silently empty.
  .refine((v) => v.candidates.length >= 1 || v.insufficientEvidence, {
    message:
      "Provide at least one candidate, or set insufficientEvidence to true.",
  })
  // Insufficient-evidence outcomes must explain themselves.
  .refine((v) => !v.insufficientEvidence || Boolean(v.insufficientEvidenceReason), {
    message:
      "insufficientEvidenceReason is required when insufficientEvidence is true.",
    path: ["insufficientEvidenceReason"],
  });
