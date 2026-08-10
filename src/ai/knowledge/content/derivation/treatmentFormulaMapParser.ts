/**
 * Derivation adapter for `treatmentFormulaMap`.
 *
 * Treatment Formula Map Wiring Sprint · Step 1 (Derivation Layer). The authored
 * `treatment-formula-map.md` uses the identical two-field entry format as the other
 * relationship/definition corpora (`- **<term>** — <value>`), fixed by the representation
 * decision (Doc 54, Candidate A). Rather than author a second parser, this module REUSES the
 * shared parsing logic ({@link parsePrescriptionFormulaDefinitions}) and only remaps the two
 * fields to `{ principle, formula }` — the two identity references of a relationship entry.
 * Both string values are preserved verbatim; nothing is normalized, enriched, reordered, or
 * deduplicated.
 *
 * It is pure: no I/O, no side effects. Reading the corpus and writing the generated artifact
 * are the generator's job.
 */

import {
  parsePrescriptionFormulaDefinitions,
} from "./prescriptionFormulaDefinitionsParser";

/**
 * One derived treatment-principle → formula association: the two identity references of a
 * relationship entry.
 * - `principle` — the referenced canonical treatment principle (owned by
 *   `formulaDefinitionCatalog`).
 * - `formula`   — the referenced canonical named formula (owned by `formulaCatalog`).
 * Nothing else may be added to this shape (no metadata, score, rank, or rationale).
 */
export interface TreatmentFormulaAssociation {
  readonly principle: string;
  readonly formula: string;
}

/**
 * Derives the structured association collection from the authoritative markdown by delegating
 * to the shared two-field parser and remapping the two fields to `{ principle, formula }`.
 * Deterministic and lossless with respect to both fields; source order preserved; no
 * deduplication.
 */
export function parseTreatmentFormulaMap(
  markdown: string,
): TreatmentFormulaAssociation[] {
  return parsePrescriptionFormulaDefinitions(markdown).map((entry) => ({
    principle: entry.formula,
    formula: entry.definition,
  }));
}
