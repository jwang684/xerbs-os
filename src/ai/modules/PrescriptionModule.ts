import { PrescriptionSchema } from "../schemas/PrescriptionSchema";
import type { AIContext } from "../types/AIContext";
import type { FormulaResult } from "../types/FormulaResult";
import type { KnowledgeRequest } from "../types/Knowledge";
import type { PrescriptionResult } from "../types/PrescriptionResult";
import { BaseModule, ModuleExecutionError } from "./BaseModule";
import { knowledgeOrNone } from "./knowledgeFallback";

/** Trim + lower-case for deterministic, case-insensitive text comparison. */
const norm = (s: string): string => s.trim().toLowerCase();

/** Trim-empty test — catches "" and whitespace-only (schema `.min(1)` allows " "). */
const isBlank = (s: string): boolean => s.trim().length === 0;

/**
 * PrescriptionModule — the EXECUTION layer (the last treatment module).
 *
 * STATUS: FROZEN (Prescription Sprint, Step 5). Changes require explicit
 * clinical/architectural justification.
 *
 * Consumes `results.formula` (primary), `results.diagnosis`, `results.summary`,
 * and `results.assessment`, and produces a validated {@link PrescriptionResult} —
 * exactly ONE executable prescription (named formula + modifications, herb
 * composition and quantities, dosage, administration, duration) or an explicit
 * insufficient-evidence outcome. It converges; it never returns competing or
 * ranked prescriptions, and it never reinterprets the diagnosis or changes the
 * treatment strategy.
 *
 * Prompt guidance is not trusted on its own: the runtime guards below enforce the
 * clinical contract in code and fail deterministically (ModuleExecutionError).
 * They are STRUCTURAL only — no semantic/medical validation (e.g. whether a dose
 * is clinically correct); that belongs to evaluation, not runtime.
 *
 * Knowledge: per the frozen knowledge review, Prescription exposes four reference
 * interfaces (prescriptionFormulaDefinitions, treatmentFormulaMap, formulaCatalog,
 * herbCatalog) as "Required Architecture · Optional Content". For v1 the content
 * is empty, so the module supplies graceful-fallback placeholders to the prompt
 * and requests no knowledge — wiring real loader keys would require extending the
 * frozen KnowledgeRequest/KnowledgeBundle, deliberately not done here ("Option B").
 */
export class PrescriptionModule extends BaseModule<PrescriptionResult> {
  readonly name = "prescription";
  protected readonly templateKey = "prescription";
  protected readonly outputSchema = PrescriptionSchema;

  /**
   * Declares the knowledge this module depends on (frozen Prescription knowledge
   * architecture): named-formula definitions, the treatment→formula reference
   * map, and the formula/herb name vocabularies. Demand only — content is
   * optional and supplied by a future loader; the stub returns nothing today.
   */
  protected knowledgeRequest(): KnowledgeRequest {
    return {
      prescriptionFormulaDefinitions: true,
      treatmentFormulaMap: true,
      formulaCatalog: true,
      herbCatalog: true,
    };
  }

  /**
   * Prompt variables: Formula (primary), Diagnosis/Summary/Assessment (context) as
   * JSON, plus the four optional knowledge blocks (graceful fallback). Also serves
   * as Guard 1's pre-flight check (runs before the provider call).
   */
  protected variables(context: AIContext): Record<string, unknown> {
    const formula = this.requireFormula(context);
    return {
      formula: JSON.stringify(formula, null, 2),
      diagnosis: JSON.stringify(context.results.diagnosis ?? null, null, 2),
      summary: JSON.stringify(context.results.summary ?? null, null, 2),
      assessment: JSON.stringify(context.results.assessment ?? null, null, 2),
      // Optional Content with graceful fallback (Option B): each requested slice
      // is injected when supplied, else "(none provided)". Reference only.
      prescriptionFormulaDefinitions: knowledgeOrNone(
        this.knowledge,
        "prescriptionFormulaDefinitions",
      ),
      treatmentFormulaMap: knowledgeOrNone(this.knowledge, "treatmentFormulaMap"),
      formulaCatalog: knowledgeOrNone(this.knowledge, "formulaCatalog"),
      herbCatalog: knowledgeOrNone(this.knowledge, "herbCatalog"),
    };
  }

  /**
   * Runtime safety guards (2–8). Runs after schema validation (Guard 9, enforced
   * by BaseModule — including the convergence refinements: exactly one
   * prescription OR insufficientEvidence, never both) and before the result is
   * stored. Aggregates all violations into one ModuleExecutionError.
   */
  protected finalize(output: PrescriptionResult, context: AIContext): unknown {
    // Guard 1 — FormulaResult is the required primary input.
    const formula = this.requireFormula(context);
    const { diagnosis, summary, assessment } = context.results;
    const issues: string[] = [];

    // Guards 2 & 8 — confidence must never exceed the inherited Formula confidence
    // (reasoning is not new evidence, so there is no basis to inflate it).
    if (output.confidence > formula.confidence) {
      issues.push(
        `confidence ${output.confidence} exceeds Formula confidence ${formula.confidence}`,
      );
    }

    // The remaining guards concern the executable prescription itself. When the
    // result is an insufficient-evidence outcome the schema guarantees no
    // prescription is present (Guard 6 / convergence), so there is nothing further
    // to check structurally.
    const rx = output.prescription;
    if (rx) {
      // Guard 4: evidence provenance must ORIGINATE FROM a top-level section key
      // of Formula, Diagnosis, Summary, or Assessment.
      const allowedSources = new Set(
        [
          ...Object.keys(formula),
          ...(diagnosis ? Object.keys(diagnosis) : []),
          ...(summary ? Object.keys(summary) : []),
          ...(assessment ? Object.keys(assessment) : []),
        ].map(norm),
      );

      // Guard 3 — the executable prescription must cite at least one supporting
      // evidence item (traceability).
      if (rx.supportingEvidence.length === 0) {
        issues.push(
          `prescription is not traceable (no supporting evidence): "${rx.formulaName}"`,
        );
      }

      // Guards 4 & 5 — evidence provenance + non-empty text.
      for (const item of [...rx.supportingEvidence, ...rx.conflictingEvidence]) {
        if (!allowedSources.has(norm(item.source))) {
          issues.push(
            `evidence source does not originate from Formula/Diagnosis/Summary/Assessment: "${item.source}"`,
          );
        }
        if (isBlank(item.text)) {
          issues.push("evidence text is empty");
        }
      }

      // Guard 7 — execution integrity: reject obvious STRUCTURAL execution
      // mistakes only (blank required fields, a contentless prescription, blank
      // herb entries). No judgement about medical correctness of any value.
      if (isBlank(rx.formulaName)) issues.push("formulaName is empty");
      if (isBlank(rx.dosage)) issues.push("dosage is empty");
      if (isBlank(rx.administration)) issues.push("administration is empty");
      if (isBlank(rx.duration)) issues.push("duration is empty");
      if (rx.herbs.length === 0) {
        issues.push("executable prescription must contain at least one herb");
      }
      for (const herb of rx.herbs) {
        if (isBlank(herb.name)) issues.push("herb name is empty");
        if (isBlank(herb.quantity)) {
          issues.push(`herb quantity is empty: "${herb.name}"`);
        }
      }
    }

    // Guard 6 — exactly one executable prescription. This guard is satisfied by
    // the OUTPUT CONTRACT itself, not by runtime code, and the absence of a check
    // here is intentional (not an oversight): PrescriptionSchema structurally
    // permits only a single optional `prescription` object and never an array, so
    // multiple executable prescriptions are structurally UNREPRESENTABLE. A
    // malformed multi-prescription output could not survive schema validation to
    // reach this point. Therefore no runtime validation is necessary or even
    // possible — enforcing it in code would be dead code. This is an architectural
    // property of the contract (see PrescriptionSchema), deliberately relied upon.

    if (issues.length > 0) {
      throw new ModuleExecutionError(this.name, issues);
    }
    return output;
  }

  /** FormulaModule's output is Prescription's required primary input. */
  private requireFormula(context: AIContext): FormulaResult {
    const formula = context.results.formula;
    if (!formula) {
      throw new ModuleExecutionError(this.name, [
        "missing FormulaResult: PrescriptionModule requires results.formula",
      ]);
    }
    return formula;
  }
}
