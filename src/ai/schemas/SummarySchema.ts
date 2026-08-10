import { z } from "zod";

/**
 * Runtime contract for SummaryResult — the structured output of SummaryModule.
 *
 * STATUS: FROZEN — "Summary Contract v1" (tag: summary-contract-v1). This shape
 * is a stable, long-term runtime contract; changes require explicit clinical/
 * architectural justification and a new contract version.
 *
 * It faithfully implements the approved clinical specification
 * (`docs/clinical/summary-specification.md`) and the AI Runtime Contract
 * (`docs/architecture/10-ai-runtime.md`): Summary ORGANIZES and HIGHLIGHTS the
 * facts already produced by Assessment. It never diagnoses, interprets,
 * recommends treatment, or adds facts.
 *
 * The schema is designed for DOWNSTREAM AI CONSUMPTION (DiagnosisModule), not UI
 * rendering: concise, deterministic, provider-independent, and traceable. It
 * holds clinical content only — execution metadata (timestamps, versions) lives
 * in the engine/audit layer, not in the clinical runtime object.
 */

/**
 * A single traceable fact supporting a finding.
 *
 * `source` records provenance — which reported input / assessed element the fact
 * came from (e.g. "questionnaire", "history", "chiefComplaint") — so Diagnosis
 * can see WHY a finding exists. `text` is the factual statement itself. Both are
 * restated facts only; never interpretation.
 */
export const EvidenceItemSchema = z.object({
  source: z.string().min(1),
  text: z.string().min(1),
});

/**
 * Salience of a finding — how much attention it warrants relative to others.
 * This is the "highlight" signal, NOT confidence and NOT a diagnosis. It only
 * ranks importance among facts the patient already reported.
 */
export const SummaryPriority = z.enum(["high", "medium", "low"]);

/**
 * One consolidated finding: related reported facts grouped into a single,
 * de-duplicated statement, ranked by salience, and traced to its evidence. This
 * is where Summary's "organize / de-duplicate / group / highlight" work lives.
 */
export const SummaryFindingSchema = z.object({
  /** The consolidated finding, stated factually in the patient's terms. */
  finding: z.string().min(1),
  /**
   * Optional free-text grouping label (e.g. "sleep", "digestion"). Free-form on
   * purpose — a fixed taxonomy would be domain knowledge, not a schema concern.
   */
  category: z.string().min(1).optional(),
  /** Salience ranking used to highlight the most important evidence. */
  priority: SummaryPriority.default("medium"),
  /**
   * Traceability: the underlying reported facts this finding consolidates, with
   * their provenance. Lets Diagnosis see why the finding exists.
   */
  evidence: z.array(EvidenceItemSchema).default([]),
});

/**
 * A single piece of information that was not provided.
 *
 * `field` names the missing datum (e.g. "headache duration"); `reason` optionally
 * says why it is missing or why it matters. Structured so a future Follow-up
 * capability can turn each item into a targeted question.
 */
export const MissingInformationItemSchema = z.object({
  field: z.string().min(1),
  reason: z.string().min(1).optional(),
});

export const SummarySchema = z.object({
  /**
   * A concise, factual narrative synthesis of the case — the prioritized
   * "problem representation" that orients the reader. Description only; no
   * interpretation, diagnosis, or treatment. Named `clinicalSummary` to stay
   * unambiguous when other modules produce their own summaries.
   */
  clinicalSummary: z.string().min(1),

  /**
   * The organized, de-duplicated, grouped, and prioritized findings — the core
   * structured evidence base handed to Diagnosis. Empty only when nothing was
   * reported.
   */
  significantFindings: z.array(SummaryFindingSchema).default([]),

  /**
   * Urgent findings, kept in a dedicated field so safety-critical evidence is
   * never buried or dropped. Uses the same {@link SummaryFindingSchema} as
   * `significantFindings` — a red flag IS a clinical finding — so downstream
   * modules see one unified finding model with consistent evidence and priority.
   * These are carried forward from Assessment's red flags (with supporting
   * evidence); nothing is reinterpreted or invented.
   */
  redFlags: z.array(SummaryFindingSchema).default([]),

  /**
   * Information that was not provided (carried forward from Assessment's data
   * gaps), structured to support future Follow-up generation.
   */
  missingInformation: z.array(MissingInformationItemSchema).default([]),

  /**
   * Confidence in the evidence available at this stage, as a number in [0, 1] —
   * matching AssessmentResult so the "preserve or lower, never increase"
   * invariant is directly comparable. Summary introduces no new evidence, so
   * this must be <= the Assessment confidence.
   */
  confidence: z.number().min(0).max(1),

  /**
   * A short, human-readable reason for the confidence value — required for
   * auditability (e.g. "preserved; no new evidence", "lowered: conflicting
   * reports about sleep"), whether confidence was preserved or lowered.
   */
  confidenceReason: z.string().min(1),
});
