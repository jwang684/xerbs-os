/**
 * Derivation adapter for `diagnosisPatternDefinitions`.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 1 (Derivation Layer). The authored
 * `diagnosis-pattern-definitions.md` uses the identical two-field entry format as
 * `formula-definitions.md` / `prescription-formula-definitions.md`
 * (`- **<term>** — <definition>`). Rather than author a second parser, this module REUSES
 * the shared parsing logic ({@link parsePrescriptionFormulaDefinitions}) and only remaps
 * the referenced-term field to `pattern` — the diagnosis-tier field name fixed by the
 * frozen specification (`docs/architecture/47` §C). Both string values are preserved
 * verbatim; nothing is normalized, enriched, validated, reordered, or deduplicated.
 *
 * It is pure: no I/O, no side effects. Reading the corpus and writing the generated
 * artifact are the generator's job.
 */

import {
  parsePrescriptionFormulaDefinitions,
} from "./prescriptionFormulaDefinitionsParser";

/**
 * One derived diagnosis-pattern definition: the two conceptual fields of an entry.
 * - `pattern`    — the referenced canonical diagnosis pattern (owned by
 *   `diagnosisPatternCatalog`).
 * - `definition` — the objective intrinsic-meaning explanation.
 * Nothing else may be added to this shape.
 */
export interface DerivedDiagnosisPatternDefinition {
  readonly pattern: string;
  readonly definition: string;
}

/**
 * Derives the structured definition collection from the authoritative markdown by
 * delegating to the shared two-field parser and remapping the referenced-term field name
 * to `pattern`. Deterministic and lossless with respect to both fields.
 */
export function parseDiagnosisPatternDefinitions(
  markdown: string,
): DerivedDiagnosisPatternDefinition[] {
  return parsePrescriptionFormulaDefinitions(markdown).map((entry) => ({
    pattern: entry.formula,
    definition: entry.definition,
  }));
}
