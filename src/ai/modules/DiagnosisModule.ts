import { DiagnosisSchema } from "../schemas/DiagnosisSchema";
import type { AIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { SummaryResult } from "../types/SummaryResult";
import { BaseModule, ModuleExecutionError } from "./BaseModule";

/** Trim + lower-case for deterministic, case-insensitive text comparison. */
const norm = (s: string): string => s.trim().toLowerCase();

/**
 * DiagnosisModule — the first INTERPRETING layer.
 *
 * Consumes `results.summary` (primary evidence) and `results.assessment`
 * (immutable supporting context), and produces a validated {@link DiagnosisResult}
 * — a ranked differential of clinical HYPOTHESES, never confirmed facts, never
 * treatment.
 *
 * Prompt guidance is not trusted on its own: the runtime guards below enforce the
 * clinical contract in code and fail deterministically (ModuleExecutionError)
 * rather than emit unsafe output.
 *
 * Knowledge: per the frozen knowledge review, Diagnosis depends on canonical
 * pattern definitions as "Required Architecture · Optional Content". For v1 the
 * content is empty, so the module supplies a graceful-fallback placeholder to the
 * prompt and requests no knowledge. Wiring a real `diagnosisPatternDefinitions`
 * loader key requires extending the (frozen) KnowledgeRequest/KnowledgeBundle
 * types — a framework change deliberately not made here; see the module notes.
 */
export class DiagnosisModule extends BaseModule<DiagnosisResult> {
  readonly name = "diagnosis";
  protected readonly templateKey = "diagnosis";
  protected readonly outputSchema = DiagnosisSchema;

  /**
   * Prompt variables: the Summary (primary evidence) and Assessment (immutable
   * context) as JSON, plus the optional pattern-definitions block. Also serves as
   * Guard 1's pre-flight check (runs before the provider call).
   */
  protected variables(context: AIContext): Record<string, unknown> {
    const summary = this.requireSummary(context);
    return {
      summary: JSON.stringify(summary, null, 2),
      // Immutable supporting context (may be absent → "null", always a string).
      assessment: JSON.stringify(context.results.assessment ?? null, null, 2),
      // Optional Content: v1 graceful fallback. When a real
      // `diagnosisPatternDefinitions` interface is wired, this is where the
      // supplied definitions would be injected; absence must never be read as
      // missing patient evidence.
      patternDefinitions: "(none provided)",
    };
  }

  /**
   * Runtime safety guards. Runs after schema validation (which enforces the
   * differential/insufficient-evidence coherence) and before the result is
   * stored. Aggregates all violations into one ModuleExecutionError.
   */
  protected finalize(output: DiagnosisResult, context: AIContext): unknown {
    const summary = this.requireSummary(context);
    const assessment = context.results.assessment;
    const issues: string[] = [];

    // Guard: overall confidence must never exceed the inherited Summary
    // confidence (interpretation is reasoning, not new evidence).
    if (output.confidence > summary.confidence) {
      issues.push(
        `confidence ${output.confidence} exceeds Summary confidence ${summary.confidence}`,
      );
    }

    // Evidence must be provenance-valid (structural only; semantic correctness is
    // an evaluation concern): sources originate from a Summary/Assessment section,
    // and every hypothesis cites at least one supporting evidence item.
    const allowedSources = new Set(
      [
        ...Object.keys(summary),
        ...(assessment ? Object.keys(assessment) : []),
      ].map(norm),
    );
    for (const candidate of output.candidates) {
      if (candidate.supportingEvidence.length === 0) {
        issues.push(
          `hypothesis is not traceable (no supporting evidence): "${candidate.pattern}"`,
        );
      }
      for (const item of [
        ...candidate.supportingEvidence,
        ...candidate.conflictingEvidence,
      ]) {
        if (!allowedSources.has(norm(item.source))) {
          issues.push(
            `evidence source does not originate from Summary/Assessment: "${item.source}"`,
          );
        }
        if (item.text.trim().length === 0) {
          issues.push("evidence text is empty");
        }
      }
    }

    // Rank integrity (an output-integrity constraint, not clinical semantics):
    // when candidates are present, their ranks must be continuous 1..N — so a
    // single candidate is rank 1. Gaps, duplicates, or a non-1 start are rejected.
    if (output.candidates.length > 0) {
      const sorted = output.candidates.map((c) => c.rank).sort((a, b) => a - b);
      if (!sorted.every((r, i) => r === i + 1)) {
        issues.push(
          `candidate ranks must be continuous 1..N; got [${output.candidates
            .map((c) => c.rank)
            .join(", ")}]`,
        );
      }
    }

    if (issues.length > 0) {
      throw new ModuleExecutionError(this.name, issues);
    }
    return output;
  }

  /** SummaryModule's output is Diagnosis's required primary input. */
  private requireSummary(context: AIContext): SummaryResult {
    const summary = context.results.summary;
    if (!summary) {
      throw new ModuleExecutionError(this.name, [
        "missing SummaryResult: DiagnosisModule requires results.summary",
      ]);
    }
    return summary;
  }
}
