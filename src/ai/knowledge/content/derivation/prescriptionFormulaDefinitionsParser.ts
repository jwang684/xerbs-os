/**
 * Derivation parser for `prescriptionFormulaDefinitions`.
 *
 * Wiring Sprint · Step 1 (Derivation Layer). This is the single, deterministic,
 * non-interpretive derivation from the authoritative authored corpus
 * (`src/ai/knowledge/content/prescription-formula-definitions.md`) to a structured
 * runtime representation. The markdown remains the single source of truth; this
 * parser derives a structured form from it and adds no meaning.
 *
 * Per the frozen Definition Specification (`docs/architecture/19`) each entry has
 * exactly two conceptual fields — a referenced canonical formula and its objective
 * explanation — and nothing else (Minimal Definition). This parser extracts exactly
 * those two fields, in source order, from each authored definition line. It does
 * not reorder, deduplicate, normalize wording, add aliases, metadata,
 * relationships, reasoning, or any other information.
 *
 * It is pure: no I/O, no side effects. Reading the corpus and writing the generated
 * artifact are the generator's job; this module only transforms text → data.
 */

/**
 * One derived definition: the two conceptual fields of a Definition entry.
 * - `formula`    — the referenced canonical formula (a name owned by `formulaCatalog`).
 * - `definition` — the objective explanation (its intrinsic therapeutic meaning).
 * Nothing else may be added to this shape.
 */
export interface DerivedPrescriptionFormulaDefinition {
  readonly formula: string;
  readonly definition: string;
}

/**
 * Matches exactly one authored definition line of the frozen form:
 *
 *   - **<canonical formula>** — <objective explanation>
 *
 * The separator is a spaced EM DASH (U+2014), as authored. Only lines matching this
 * exact shape are treated as definitions; headings, status paragraphs, and prose
 * are ignored. A change to the authored separator or entry shape would stop matching
 * and surface immediately as a completeness failure rather than a silent drift.
 */
const ENTRY_PATTERN = /^-\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s*$/;

/**
 * Derives the structured definition collection from the authoritative markdown.
 *
 * Deterministic and lossless with respect to the two conceptual fields: for a given
 * input it always returns the same entries, in the same (source) order, containing
 * exactly the authored formula reference and explanation.
 */
export function parsePrescriptionFormulaDefinitions(
  markdown: string,
): DerivedPrescriptionFormulaDefinition[] {
  const entries: DerivedPrescriptionFormulaDefinition[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = ENTRY_PATTERN.exec(line);
    if (match === null) continue;
    entries.push({
      formula: match[1].trim(),
      definition: match[2].trim(),
    });
  }
  return entries;
}
