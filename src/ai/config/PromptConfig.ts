/**
 * Prompt template versioning.
 *
 * Centralizes which version of each prompt template a module should use, so a
 * template can evolve (e.g. `assessment` → `v2`) without code changes. The
 * loader/module decides how a version maps to a file — this only holds the
 * selection.
 */
export interface PromptConfig {
  /** Version used when a template has no explicit entry. */
  defaultVersion: string;
  /** Version selected per template name (e.g. `{ assessment: "v2" }`). */
  versions?: Record<string, string>;
}
