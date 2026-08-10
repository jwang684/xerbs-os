/**
 * Generator for the `diagnosisPatternDefinitions` structured runtime representation.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 1 (Derivation Layer). Reads the
 * authoritative authored corpus, derives the structured collection with the shared
 * adapter, and writes the generated artifact. This is the build-time derivation step
 * (mirroring `generateFormulaDefinitions.ts`): the generated artifact is produced
 * deterministically from the markdown and is never hand-authored. The markdown remains the
 * single source of truth.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generateDiagnosisPatternDefinitions.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a fresh
 * derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type DerivedDiagnosisPatternDefinition,
  parseDiagnosisPatternDefinitions,
} from "./diagnosisPatternDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../diagnosis-pattern-definitions.md");
const OUTPUT_PATH = resolve(
  here,
  "../generated/diagnosis-pattern-definitions.generated.ts",
);

/** Serializes derived entries into a deterministic, human-diffable TS data module. */
function serialize(
  entries: readonly DerivedDiagnosisPatternDefinition[],
): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/diagnosis-pattern-definitions.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generateDiagnosisPatternDefinitions.ts",
    "//",
    "// A lossless, non-interpretive derivation of the authored corpus: each entry is",
    "// exactly a referenced canonical diagnosis pattern and its objective definition, in",
    "// source order. No meaning is added here; edit the markdown and regenerate.",
    "",
    'import type { DerivedDiagnosisPatternDefinition } from "../derivation/diagnosisPatternDefinitionsParser";',
  ].join("\n");

  const body = entries
    .map(
      (e) =>
        `  { pattern: ${JSON.stringify(e.pattern)}, definition: ${JSON.stringify(e.definition)} },`,
    )
    .join("\n");

  return `${header}\n\nexport const diagnosisPatternDefinitionsData: readonly DerivedDiagnosisPatternDefinition[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const entries = parseDiagnosisPatternDefinitions(markdown);
writeFileSync(OUTPUT_PATH, serialize(entries), "utf8");
console.log(`Derived ${entries.length} diagnosis-pattern definitions → ${OUTPUT_PATH}`);
