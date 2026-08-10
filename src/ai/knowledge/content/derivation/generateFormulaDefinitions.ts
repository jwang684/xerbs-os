/**
 * Generator for the `formulaDefinitions` structured runtime representation.
 *
 * Formula Definitions Wiring Sprint · Step 1 (Derivation Layer). Reads the
 * authoritative authored corpus, derives the structured collection with the shared
 * adapter, and writes the generated artifact. This is the build-time derivation step
 * (mirroring `generatePrescriptionFormulaDefinitions.ts`): the generated artifact is
 * produced deterministically from the markdown and is never hand-authored. The
 * markdown remains the single source of truth.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generateFormulaDefinitions.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a
 * fresh derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type DerivedFormulaDefinition,
  parseFormulaDefinitions,
} from "./formulaDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-definitions.md");
const OUTPUT_PATH = resolve(here, "../generated/formula-definitions.generated.ts");

/** Serializes derived entries into a deterministic, human-diffable TS data module. */
function serialize(entries: readonly DerivedFormulaDefinition[]): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/formula-definitions.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generateFormulaDefinitions.ts",
    "//",
    "// A lossless, non-interpretive derivation of the authored corpus: each entry is",
    "// exactly a referenced canonical treatment principle and its objective explanation,",
    "// in source order. No meaning is added here; edit the markdown and regenerate.",
    "",
    'import type { DerivedFormulaDefinition } from "../derivation/formulaDefinitionsParser";',
  ].join("\n");

  const body = entries
    .map(
      (e) =>
        `  { principle: ${JSON.stringify(e.principle)}, definition: ${JSON.stringify(e.definition)} },`,
    )
    .join("\n");

  return `${header}\n\nexport const formulaDefinitionsData: readonly DerivedFormulaDefinition[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const entries = parseFormulaDefinitions(markdown);
writeFileSync(OUTPUT_PATH, serialize(entries), "utf8");
console.log(`Derived ${entries.length} formula definitions → ${OUTPUT_PATH}`);
