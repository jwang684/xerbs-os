import type { KnowledgeBundle } from "./Knowledge";

/** Outputs produced by modules, keyed by module name. */
export type ModuleResults = Record<string, unknown>;

/**
 * The single shared execution object threaded through every AI module.
 *
 * It carries the inputs a module may read (patient, visit, questionnaire,
 * tongue, history, loaded knowledge) and the accumulating `results` each module
 * writes to. Input shapes are intentionally `unknown` — the AI foundation stays
 * free of business/medical types; concrete modules narrow what they read.
 */
export interface AIContext {
  patient?: unknown;
  visit?: unknown;
  questionnaire?: unknown;
  tongue?: unknown;
  history?: unknown;
  /** Knowledge loaded for this run (see KnowledgeLoader). */
  knowledge?: KnowledgeBundle;
  /** Accumulated module outputs, keyed by module name. */
  results: ModuleResults;
}

/** Creates an AIContext with an initialized (empty) results map. */
export function createAIContext(seed: Partial<AIContext> = {}): AIContext {
  return { results: {}, ...seed };
}
