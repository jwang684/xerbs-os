/**
 * Derivation adapter for `patternTreatmentMap`.
 *
 * Pattern Treatment Map Wiring Sprint · Step 1 (Derivation Layer). The authored
 * `pattern-treatment-map.md` uses the identical two-field entry format as the definition
 * corpora (`- **<term>** — <value>`), fixed by the representation review
 * (`docs/architecture/54`, Candidate A). Rather than author a second parser, this module
 * REUSES the shared parsing logic ({@link parsePrescriptionFormulaDefinitions}) and only
 * remaps the two fields to `{ pattern, principle }` — the two identity references of a
 * relationship entry. Both string values are preserved verbatim; nothing is normalized,
 * enriched, reordered, or deduplicated.
 *
 * It is pure: no I/O, no side effects. Reading the corpus and writing the generated
 * artifact are the generator's job.
 */

import {
  parsePrescriptionFormulaDefinitions,
} from "./prescriptionFormulaDefinitionsParser";

/**
 * One derived pattern→treatment-principle association: the two identity references of a
 * relationship entry.
 * - `pattern`   — the referenced canonical diagnosis pattern (owned by
 *   `diagnosisPatternCatalog`).
 * - `principle` — the referenced canonical treatment principle (owned by
 *   `formulaDefinitionCatalog`).
 * Nothing else may be added to this shape (no metadata, score, rank, or rationale).
 */
export interface PatternTreatmentAssociation {
  readonly pattern: string;
  readonly principle: string;
}

/**
 * Derives the structured association collection from the authoritative markdown by
 * delegating to the shared two-field parser and remapping the two fields to
 * `{ pattern, principle }`. Deterministic and lossless with respect to both fields;
 * source order preserved; no deduplication.
 */
export function parsePatternTreatmentMap(
  markdown: string,
): PatternTreatmentAssociation[] {
  return parsePrescriptionFormulaDefinitions(markdown).map((entry) => ({
    pattern: entry.formula,
    principle: entry.definition,
  }));
}
