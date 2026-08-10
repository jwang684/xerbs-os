/**
 * Generator for the `patternTreatmentMap` structured runtime representation.
 *
 * Pattern Treatment Map Wiring Sprint · Step 1 (Derivation Layer). Reads the authoritative
 * authored corpus, derives the association collection with the shared adapter, and writes
 * the generated artifact. This is the build-time derivation step (mirroring the definition
 * generators): the generated artifact is produced deterministically from the markdown and
 * is never hand-authored. The markdown remains the single source of truth.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generatePatternTreatmentMap.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a fresh
 * derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type PatternTreatmentAssociation,
  parsePatternTreatmentMap,
} from "./patternTreatmentMapParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../pattern-treatment-map.md");
const OUTPUT_PATH = resolve(here, "../generated/pattern-treatment-map.generated.ts");

/** Serializes derived associations into a deterministic, human-diffable TS data module. */
function serialize(
  associations: readonly PatternTreatmentAssociation[],
): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/pattern-treatment-map.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generatePatternTreatmentMap.ts",
    "//",
    "// A lossless, non-interpretive derivation of the authored corpus: each entry is exactly",
    "// a referenced pattern and a referenced treatment principle, in source order. No",
    "// metadata, score, rank, or rationale is added here; edit the markdown and regenerate.",
    "",
    'import type { PatternTreatmentAssociation } from "../derivation/patternTreatmentMapParser";',
  ].join("\n");

  const body = associations
    .map(
      (a) =>
        `  { pattern: ${JSON.stringify(a.pattern)}, principle: ${JSON.stringify(a.principle)} },`,
    )
    .join("\n");

  return `${header}\n\nexport const patternTreatmentMapData: readonly PatternTreatmentAssociation[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const associations = parsePatternTreatmentMap(markdown);
writeFileSync(OUTPUT_PATH, serialize(associations), "utf8");
console.log(
  `Derived ${associations.length} pattern→principle associations → ${OUTPUT_PATH}`,
);
