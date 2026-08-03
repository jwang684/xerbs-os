/**
 * Knowledge types (framework shape only — no medical data or vocabularies).
 *
 * A {@link KnowledgeBundle} is the domain knowledge a module may need at
 * execution time. Concrete shapes (symptom catalogs, herb/formula tables) are
 * deliberately left as `unknown` until the corresponding data modules are built.
 */
export interface KnowledgeBundle {
  questionnaires?: unknown;
  symptoms?: unknown;
  herbs?: unknown;
  formulas?: unknown;
}

/**
 * Declares which slices of knowledge a module wants loaded. A `true` loads the
 * whole slice; a string[] narrows to specific ids/keys (interpretation is left
 * to the loader implementation).
 */
export interface KnowledgeRequest {
  questionnaires?: boolean | string[];
  symptoms?: boolean | string[];
  herbs?: boolean | string[];
  formulas?: boolean | string[];
}
