/**
 * Derivation adapter for `formulaDefinitions`.
 *
 * Formula Definitions Wiring Sprint · Step 1 (Derivation Layer). The authored
 * `formula-definitions.md` uses the identical two-field entry format as
 * `prescription-formula-definitions.md` (`- **<term>** — <definition>`). Rather than
 * author a second parser, this module REUSES the shared parsing logic
 * ({@link parsePrescriptionFormulaDefinitions}) and only remaps the referenced-term
 * field to `principle` — the strategy-tier field name fixed by the frozen
 * specification (`docs/architecture/39` §C). Both string values are preserved
 * verbatim; nothing is normalized, enriched, reordered, or deduplicated.
 *
 * It is pure: no I/O, no side effects. Reading the corpus and writing the generated
 * artifact are the generator's job.
 */

import {
  parsePrescriptionFormulaDefinitions,
} from "./prescriptionFormulaDefinitionsParser";

/**
 * One derived treatment-principle definition: the two conceptual fields of a
 * Formula Definitions entry.
 * - `principle`  — the referenced canonical treatment principle (owned by
 *   `formulaDefinitionCatalog`).
 * - `definition` — the objective intrinsic-meaning explanation.
 * Nothing else may be added to this shape.
 */
export interface DerivedFormulaDefinition {
  readonly principle: string;
  readonly definition: string;
}

/**
 * Derives the structured definition collection from the authoritative markdown by
 * delegating to the shared two-field parser and remapping the referenced-term field
 * name to `principle`. Deterministic and lossless with respect to both fields.
 */
export function parseFormulaDefinitions(
  markdown: string,
): DerivedFormulaDefinition[] {
  return parsePrescriptionFormulaDefinitions(markdown).map((entry) => ({
    principle: entry.formula,
    definition: entry.definition,
  }));
}
