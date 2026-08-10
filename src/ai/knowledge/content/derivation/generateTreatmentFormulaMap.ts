/**
 * Generator for the `treatmentFormulaMap` structured runtime representation.
 *
 * Treatment Formula Map Wiring Sprint · Step 1 (Derivation Layer). Reads the authoritative
 * authored corpus, derives the association collection with the shared adapter, and writes the
 * generated artifact. This is the build-time derivation step (mirroring
 * `generatePatternTreatmentMap.ts`): the generated artifact is produced deterministically from
 * the markdown and is never hand-authored. The markdown remains the single source of truth.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generateTreatmentFormulaMap.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a fresh
 * derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type TreatmentFormulaAssociation,
  parseTreatmentFormulaMap,
} from "./treatmentFormulaMapParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../treatment-formula-map.md");
const OUTPUT_PATH = resolve(here, "../generated/treatment-formula-map.generated.ts");

/** Serializes derived associations into a deterministic, human-diffable TS data module. */
function serialize(
  associations: readonly TreatmentFormulaAssociation[],
): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/treatment-formula-map.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generateTreatmentFormulaMap.ts",
    "//",
    "// A lossless, non-interpretive derivation of the authored corpus: each entry is exactly",
    "// a referenced treatment principle and a referenced named formula, in source order. No",
    "// metadata, score, rank, or rationale is added here; edit the markdown and regenerate.",
    "",
    'import type { TreatmentFormulaAssociation } from "../derivation/treatmentFormulaMapParser";',
  ].join("\n");

  const body = associations
    .map(
      (a) =>
        `  { principle: ${JSON.stringify(a.principle)}, formula: ${JSON.stringify(a.formula)} },`,
    )
    .join("\n");

  return `${header}\n\nexport const treatmentFormulaMapData: readonly TreatmentFormulaAssociation[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const associations = parseTreatmentFormulaMap(markdown);
writeFileSync(OUTPUT_PATH, serialize(associations), "utf8");
console.log(
  `Derived ${associations.length} principle→formula associations → ${OUTPUT_PATH}`,
);
