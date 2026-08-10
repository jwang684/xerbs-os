import { z } from "zod";

/**
 * Runtime contract for PrescriptionResult — the structured output of
 * PrescriptionModule.
 *
 * STATUS: FROZEN — "Prescription Contract v1" (tag: prescription-contract-v1). A
 * stable, long-term runtime contract; changes require explicit
 * clinical/architectural justification and a new contract version.
 *
 * It faithfully implements the frozen clinical specification
 * (`docs/clinical/prescription-specification.md`) and the AI Runtime Contract
 * (`docs/architecture/10-ai-runtime.md`). Prescription is the EXECUTION layer: it
 * turns the selected treatment strategy into ONE concrete, executable
 * prescription — never a differential, never a set of alternatives.
 *
 * Design intent — CONVERGENCE. Diagnosis and Formula are divergent: they preserve
 * a differential (`candidates[]`, `treatmentHypotheses[]`). Prescription is the
 * point at which the pipeline COMMITS: it yields exactly one executable
 * prescription (the single optional `prescription` object) or an explicit
 * insufficient-evidence outcome — never an array of competing prescriptions. The
 * convergent analog of "many items" is "one optional item": present when the
 * pipeline converges, absent when it cannot.
 *
 * Field-inclusion test (same four conditions as the Diagnosis/Formula contracts):
 * a field exists only when there is both a stable PRODUCER and a stable CONSUMER,
 * it owns unique information, and that information cannot already be derived.
 * Rejected/deferred ideas (formulaId, herbId, contraindications, interaction
 * warnings, safety warnings, ICD/billing/education/follow-up, version,
 * generatedAt, alternatives) all fail that test today — they depend on knowledge
 * bases that do not yet exist, belong to other clinical layers, duplicate the
 * persistence layer, or would force the model to fabricate advisory content.
 * They remain backward-compatible future additions.
 *
 * Versioning follows the established precedent: no per-object version field
 * (schema evolution is managed at the schema layer). Extensibility comes from
 * optional fields and unknown-key stripping.
 */

/**
 * One traceable fact linking the prescription to prior modules. `source` records
 * provenance — the originating Formula / Diagnosis / Summary / Assessment element
 * — so the executable prescription stays traceable. `text` is the factual
 * statement, restated faithfully. Same provenance model as the Diagnosis and
 * Formula contracts.
 */
export const PrescriptionEvidenceSchema = z.object({
  source: z.string().min(1),
  text: z.string().min(1),
});

/**
 * One prescribed herb: its name and the quantity to dispense. Quantity is a
 * free-text clinical expression (e.g. an amount with its unit, or a range), so
 * the contract does not presume a single numeric unit. No stable herb catalog
 * exists yet, so there is deliberately no `herbId` (see the header note).
 */
export const PrescribedHerbSchema = z.object({
  /** The herb, by name. */
  name: z.string().min(1),
  /** How much of this herb to dispense (amount + unit, as a clinical string). */
  quantity: z.string().min(1),
});

/**
 * The single EXECUTABLE prescription — the convergent output. It operationalizes
 * exactly one selected treatment hypothesis into a concrete, dispensable
 * prescription: a named formula (with any modifications), its herb composition
 * and quantities, dosage, administration, and treatment duration, plus the
 * reasoning and evidence that tie it back to the selected strategy.
 *
 * There is exactly ONE of these per result (never an array): Prescription
 * converges. Per-decision reasoning and evidence live HERE (mirroring how each
 * Diagnosis candidate / Formula hypothesis carries its own reasoning and
 * evidence); result-level signals (confidence, uncertainty, insufficiency) live
 * on the enclosing result.
 */
export const ExecutablePrescriptionSchema = z.object({
  /**
   * The named prescription formula selected from the strategy's formula family —
   * e.g. a specific classical formula. This is the boundary Formula was forbidden
   * to cross (Formula names a family; Prescription names the specific formula).
   */
  formulaName: z.string().min(1),
  /**
   * Modifications to the base formula (additions, subtractions, or adjustments)
   * that adapt it to this patient. Each item a discrete, factual change; [] when
   * the base formula is used unmodified.
   */
  modifications: z.array(z.string().min(1)).default([]),
  /**
   * The herb composition with quantities — the concrete contents of the
   * prescription. May be empty at the schema boundary; a structural
   * "≥ 1 herb for an executable prescription" check belongs to the Module.
   */
  herbs: z.array(PrescribedHerbSchema).default([]),
  /** Dosage — how much to take per administration. */
  dosage: z.string().min(1),
  /** Administration — route/method and frequency (how and how often to take it). */
  administration: z.string().min(1),
  /** Treatment duration — how long to take the prescription for. */
  duration: z.string().min(1),
  /** Why this concrete prescription realizes the selected treatment strategy. */
  reasoning: z.string().min(1),
  /** Evidence that supports this prescription (traceable to prior modules). */
  supportingEvidence: z.array(PrescriptionEvidenceSchema).default([]),
  /** Evidence that argues against this prescription; kept separate on purpose. */
  conflictingEvidence: z.array(PrescriptionEvidenceSchema).default([]),
});

export const PrescriptionSchema = z
  .object({
    /**
     * The single executable prescription — the primary, CONVERGENT output.
     * Present when the pipeline can responsibly commit; absent when it cannot
     * (see `insufficientEvidence`). Never an array: Prescription does not return
     * competing or alternative prescriptions (that differential belongs to
     * Formula's `treatmentHypotheses`).
     */
    prescription: ExecutablePrescriptionSchema.optional(),

    /**
     * First-class outcome: the selected strategy/evidence is inadequate to
     * responsibly commit to an executable prescription. Declining to prescribe is
     * an acceptable clinical result — mirroring the Diagnosis and Formula
     * contracts — and is preferred over forcing an unsafe prescription.
     */
    insufficientEvidence: z.boolean().default(false),
    /** Why the evidence is insufficient (required when insufficientEvidence). */
    insufficientEvidenceReason: z.string().min(1).optional(),

    /**
     * Overall prescription confidence in [0, 1] — DISTINCT from the prescription's
     * own reasoning. It inherits the Formula confidence and may only stay the same
     * or decrease; it must never be raised without new clinical evidence (which
     * Prescription does not introduce). The "never exceeds Formula" bound is
     * enforced at runtime by the Module.
     */
    confidence: z.number().min(0).max(1),
    /** Human-readable reason for the confidence value (preserved or lowered). */
    confidenceReason: z.string().min(1),

    /**
     * Unresolved points and what additional information would refine the
     * prescription. Descriptive execution-level uncertainty only — NOT a
     * follow-up plan, patient instruction, or action list (those belong to later
     * layers).
     */
    uncertaintyNotes: z.array(z.string().min(1)).default([]),
  })
  // A result must say something: either one executable prescription or an
  // explicit insufficient-evidence outcome. It is never silently empty.
  .refine((v) => v.prescription !== undefined || v.insufficientEvidence, {
    message:
      "Provide one executable prescription, or set insufficientEvidence to true.",
  })
  // Insufficient-evidence outcomes must explain themselves.
  .refine(
    (v) => !v.insufficientEvidence || Boolean(v.insufficientEvidenceReason),
    {
      message:
        "insufficientEvidenceReason is required when insufficientEvidence is true.",
      path: ["insufficientEvidenceReason"],
    },
  )
  // Execution either CONVERGES or it explicitly does NOT — never both. Unlike the
  // interpretive layers (which may hold tentative candidates alongside
  // uncertainty), an insufficient-evidence outcome forbids a prescription: if
  // `insufficientEvidence` is true, `prescription` must be absent. This mutual
  // exclusivity is a core property of the execution contract, not a runtime guard.
  .refine((v) => !v.insufficientEvidence || v.prescription === undefined, {
    message:
      "prescription must be absent when insufficientEvidence is true (execution converges or explicitly does not — never both).",
    path: ["prescription"],
  });
