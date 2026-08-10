import { FormulaSchema } from "../schemas/FormulaSchema";
import type { AIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { FormulaResult } from "../types/FormulaResult";
import type { KnowledgeRequest } from "../types/Knowledge";
import { BaseModule, ModuleExecutionError } from "./BaseModule";
import { knowledgeOrNone } from "./knowledgeFallback";

/** Trim + lower-case for deterministic, case-insensitive text comparison. */
const norm = (s: string): string => s.trim().toLowerCase();

// Guard 8 is a purely STRUCTURAL check for execution-level formatting — dosage
// expressions and administration frequency. It deliberately does NOT match
// medical terminology (named formulas, herbs, dose forms): recognizing those
// requires semantic interpretation and belongs to evaluation, not runtime. Kept
// minimal so it never fires on legitimate strategy text like "Tonify Qi".
const DOSAGE_PATTERN = /\b\d+(\.\d+)?\s?(mg|mcg|ml|g|l|grams?|milligrams?)\b/i;
const FREQUENCY_PATTERN =
  /\b(bid|tid|qid|qd)\b|\b(once|twice|thrice|\d+\s*times?)\s+(a|per)\s+day\b|\bper\s+day\b|\b\d+\s*\/\s*day\b/i;

function hasExecutionLeakage(text: string): boolean {
  return DOSAGE_PATTERN.test(text) || FREQUENCY_PATTERN.test(text);
}

/**
 * FormulaModule — the treatment-strategy layer.
 *
 * STATUS: FROZEN (Formula Sprint, Step 5). Changes require explicit
 * clinical/architectural justification.
 *
 * Consumes `results.diagnosis` (primary), `results.summary`, and
 * `results.assessment`, and produces a validated {@link FormulaResult} — a ranked
 * set of independent treatment hypotheses (treatment principle + formula family),
 * never a prescription, named formula, herb, dosage, or follow-up.
 *
 * Prompt guidance is not trusted on its own: the runtime guards below enforce the
 * clinical contract in code and fail deterministically (ModuleExecutionError).
 *
 * Knowledge: per the frozen knowledge review, Formula exposes two reference
 * interfaces (formulaDefinitions, patternTreatmentMap) as "Required Architecture ·
 * Optional Content". For v1 the content is empty, so the module supplies
 * graceful-fallback placeholders to the prompt and requests no knowledge —
 * wiring real loader keys would require extending the frozen
 * KnowledgeRequest/KnowledgeBundle, deliberately not done here ("Option B").
 */
export class FormulaModule extends BaseModule<FormulaResult> {
  readonly name = "formula";
  protected readonly templateKey = "formula";
  protected readonly outputSchema = FormulaSchema;

  /**
   * Declares the knowledge this module depends on (frozen Formula knowledge
   * architecture): treatment-principle/formula-family definitions and the
   * pattern-to-treatment reference map. Demand only — content is optional and
   * supplied by a future loader; the stub returns nothing today.
   */
  protected knowledgeRequest(): KnowledgeRequest {
    return { formulaDefinitions: true, patternTreatmentMap: true };
  }

  /**
   * Prompt variables: Diagnosis (primary), Summary and Assessment (context) as
   * JSON, plus the two optional knowledge blocks (graceful fallback). Also serves
   * as Guard 1's pre-flight check (runs before the provider call).
   */
  protected variables(context: AIContext): Record<string, unknown> {
    const diagnosis = this.requireDiagnosis(context);
    return {
      diagnosis: JSON.stringify(diagnosis, null, 2),
      summary: JSON.stringify(context.results.summary ?? null, null, 2),
      assessment: JSON.stringify(context.results.assessment ?? null, null, 2),
      // Optional Content with graceful fallback (Option B): injected when
      // supplied, else "(none provided)". Reference only — never rules.
      formulaDefinitions: knowledgeOrNone(this.knowledge, "formulaDefinitions"),
      patternTreatmentMap: knowledgeOrNone(this.knowledge, "patternTreatmentMap"),
    };
  }

  /**
   * Runtime safety guards (2–8). Runs after schema validation (Guard 9, enforced
   * by BaseModule) and before the result is stored. Aggregates all violations
   * into one ModuleExecutionError.
   */
  protected finalize(output: FormulaResult, context: AIContext): unknown {
    const diagnosis = this.requireDiagnosis(context);
    const { summary, assessment } = context.results;
    const issues: string[] = [];

    // Guard 2 — confidence must never exceed the inherited Diagnosis confidence.
    if (output.confidence > diagnosis.confidence) {
      issues.push(
        `confidence ${output.confidence} exceeds Diagnosis confidence ${diagnosis.confidence}`,
      );
    }

    // Guard 4: evidence provenance must ORIGINATE FROM Assessment, Summary, or
    // Diagnosis — i.e. a top-level section key of one of those upstream results.
    const allowedSources = new Set(
      [
        ...Object.keys(diagnosis),
        ...(summary ? Object.keys(summary) : []),
        ...(assessment ? Object.keys(assessment) : []),
      ].map(norm),
    );

    for (const h of output.treatmentHypotheses) {
      // Guard 3 — each hypothesis must cite at least one supporting evidence item.
      if (h.supportingEvidence.length === 0) {
        issues.push(
          `treatment hypothesis is not traceable (no supporting evidence): "${h.treatmentPrinciple}"`,
        );
      }
      // Guards 4 & 5 — evidence provenance + non-empty text.
      for (const item of [...h.supportingEvidence, ...h.conflictingEvidence]) {
        if (!allowedSources.has(norm(item.source))) {
          issues.push(
            `evidence source does not originate from Diagnosis/Summary/Assessment: "${item.source}"`,
          );
        }
        if (item.text.trim().length === 0) {
          issues.push("evidence text is empty");
        }
      }
      // Guard 7 — treatment principle and formula family are distinct concepts.
      if (norm(h.treatmentPrinciple) === norm(h.formulaFamily)) {
        issues.push(
          `treatmentPrinciple must not equal formulaFamily: "${h.treatmentPrinciple}"`,
        );
      }
      // Guard 8 — no execution-level formatting (dosage / administration
      // frequency) in the strategy fields.
      if (
        hasExecutionLeakage(h.treatmentPrinciple) ||
        hasExecutionLeakage(h.formulaFamily)
      ) {
        issues.push(
          `execution-level content is not allowed in a treatment hypothesis: "${h.treatmentPrinciple} / ${h.formulaFamily}"`,
        );
      }
    }

    // Guard 6 — ranks must be continuous 1..N (single hypothesis = rank 1).
    if (output.treatmentHypotheses.length > 0) {
      const sorted = output.treatmentHypotheses
        .map((h) => h.rank)
        .sort((a, b) => a - b);
      if (!sorted.every((r, i) => r === i + 1)) {
        issues.push(
          `treatment hypothesis ranks must be continuous 1..N; got [${output.treatmentHypotheses
            .map((h) => h.rank)
            .join(", ")}]`,
        );
      }
    }

    if (issues.length > 0) {
      throw new ModuleExecutionError(this.name, issues);
    }
    return output;
  }

  /** DiagnosisModule's output is Formula's required primary input. */
  private requireDiagnosis(context: AIContext): DiagnosisResult {
    const diagnosis = context.results.diagnosis;
    if (!diagnosis) {
      throw new ModuleExecutionError(this.name, [
        "missing DiagnosisResult: FormulaModule requires results.diagnosis",
      ]);
    }
    return diagnosis;
  }
}
