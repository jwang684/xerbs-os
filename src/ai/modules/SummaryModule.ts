import type { AssessmentResult } from "../schemas/assessment";
import { SummarySchema } from "../schemas/SummarySchema";
import type { AIContext } from "../types/AIContext";
import type { SummaryResult } from "../types/SummaryResult";
import { BaseModule, ModuleExecutionError } from "./BaseModule";

/** Trim + lower-case for deterministic, case-insensitive text comparison. */
const norm = (s: string): string => s.trim().toLowerCase();

/**
 * SummaryModule — the "Organize + Highlight" layer.
 *
 * STATUS: FROZEN (Summary Sprint, Step 5). Changes require explicit
 * clinical/architectural justification.
 *
 * Consumes `results.assessment` (the ONLY input it reads, per the Evidence Flow
 * Rule) and produces a validated {@link SummaryResult}. It never diagnoses,
 * interprets, infers new findings, recommends treatment, or modifies the
 * Assessment.
 *
 * Prompt guidance is not trusted on its own: the runtime guards below enforce the
 * clinical contract in code and fail deterministically (ModuleExecutionError)
 * rather than emit partial or unsafe output. It requests no knowledge (per the
 * frozen Knowledge design — BaseModule's default already requests nothing).
 */
export class SummaryModule extends BaseModule<SummaryResult> {
  readonly name = "summary";
  protected readonly templateKey = "summary";
  protected readonly outputSchema = SummarySchema;

  /**
   * The prompt receives exactly one variable — the AssessmentResult as JSON.
   * Also serves as Guard 1's pre-flight check (runs before the provider call).
   */
  protected variables(context: AIContext): Record<string, unknown> {
    const assessment = this.requireAssessment(context);
    return { assessment: JSON.stringify(assessment, null, 2) };
  }

  /**
   * Runtime safety guards (2–5). Runs after schema validation (Guard 6, enforced
   * by BaseModule) and before the result is stored. Aggregates all violations
   * and throws a single ModuleExecutionError if any are found.
   */
  protected finalize(output: SummaryResult, context: AIContext): unknown {
    const assessment = this.requireAssessment(context);
    const issues: string[] = [];

    // Guard 2 — confidence must never increase (Confidence Propagation Rule).
    if (output.confidence > assessment.confidence) {
      issues.push(
        `confidence ${output.confidence} exceeds Assessment confidence ${assessment.confidence}`,
      );
    }

    // Guard 3 — every Assessment red flag must be traceable through evidence
    // PROVENANCE in summary.redFlags. Clinical wording (the finding statement)
    // may change; clinical identity (the evidence it came from) may not — so the
    // trace is via EvidenceItem.text, never the finding wording.
    const redFlagEvidence = new Set(
      output.redFlags.flatMap((f) => f.evidence.map((e) => norm(e.text))),
    );
    for (const redFlag of assessment.redFlags) {
      if (!redFlagEvidence.has(norm(redFlag))) {
        issues.push(`red flag not traceable through evidence: "${redFlag}"`);
      }
    }

    // Guard 4 — every Assessment data gap must be preserved in missingInformation.
    const preservedGaps = new Set(
      output.missingInformation.map((m) => norm(m.field)),
    );
    for (const gap of assessment.dataGaps) {
      if (!preservedGaps.has(norm(gap))) {
        issues.push(`missing-information item not preserved: "${gap}"`);
      }
    }

    // Guard 5 — evidence must be provenance-valid (structural only). Semantic
    // correctness (does the text faithfully reflect the source?) belongs to
    // evaluation, not runtime. The runtime verifies only that:
    //   - every finding declares at least one EvidenceItem (traceability), and
    //   - every EvidenceItem.source names an Assessment section (its origin), and
    //   - every EvidenceItem.text is non-empty.
    const assessmentSources = new Set(Object.keys(assessment).map(norm));
    for (const finding of [...output.significantFindings, ...output.redFlags]) {
      if (finding.evidence.length === 0) {
        issues.push(`finding is not traceable (no evidence): "${finding.finding}"`);
      }
      for (const item of finding.evidence) {
        if (!assessmentSources.has(norm(item.source))) {
          issues.push(`evidence source does not originate from Assessment: "${item.source}"`);
        }
        if (item.text.trim().length === 0) {
          issues.push("evidence text is empty");
        }
      }
    }

    if (issues.length > 0) {
      throw new ModuleExecutionError(this.name, issues);
    }
    return output;
  }

  /** Guard 1 — SummaryModule requires an AssessmentResult in the context. */
  private requireAssessment(context: AIContext): AssessmentResult {
    const assessment = context.results.assessment;
    if (!assessment) {
      throw new ModuleExecutionError(this.name, [
        "missing AssessmentResult: SummaryModule requires results.assessment",
      ]);
    }
    return assessment;
  }
}
