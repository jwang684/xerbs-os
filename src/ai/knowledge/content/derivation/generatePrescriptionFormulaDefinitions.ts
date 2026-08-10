/**
 * Generator for the `prescriptionFormulaDefinitions` structured runtime
 * representation.
 *
 * Wiring Sprint · Step 1 (Derivation Layer). Reads the authoritative authored
 * corpus, derives the structured collection with the shared parser, and writes the
 * generated artifact. This is the build-time derivation step (Wiring Plan §2,
 * Derivation A): the generated artifact is produced deterministically from the
 * markdown and is never hand-authored. The markdown remains the single source of
 * truth.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generatePrescriptionFormulaDefinitions.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals
 * a fresh derivation (no drift); if this generator is not re-run after the corpus
 * changes, that test fails rather than shipping a stale artifact.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type DerivedPrescriptionFormulaDefinition,
  parsePrescriptionFormulaDefinitions,
} from "./prescriptionFormulaDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../prescription-formula-definitions.md");
const OUTPUT_PATH = resolve(
  here,
  "../generated/prescription-formula-definitions.generated.ts",
);

/** Serializes derived entries into a deterministic, human-diffable TS data module. */
function serialize(
  entries: readonly DerivedPrescriptionFormulaDefinition[],
): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/prescription-formula-definitions.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generatePrescriptionFormulaDefinitions.ts",
    "//",
    "// A lossless, non-interpretive derivation of the authored corpus: each entry is",
    "// exactly a referenced canonical formula and its objective explanation, in source",
    "// order. No meaning is added here; edit the markdown and regenerate.",
    "",
    'import type { DerivedPrescriptionFormulaDefinition } from "../derivation/prescriptionFormulaDefinitionsParser";',
  ].join("\n");

  const body = entries
    .map(
      (e) =>
        `  { formula: ${JSON.stringify(e.formula)}, definition: ${JSON.stringify(e.definition)} },`,
    )
    .join("\n");

  return `${header}\n\nexport const prescriptionFormulaDefinitionsData: readonly DerivedPrescriptionFormulaDefinition[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const entries = parsePrescriptionFormulaDefinitions(markdown);
writeFileSync(OUTPUT_PATH, serialize(entries), "utf8");
console.log(`Derived ${entries.length} definitions → ${OUTPUT_PATH}`);
