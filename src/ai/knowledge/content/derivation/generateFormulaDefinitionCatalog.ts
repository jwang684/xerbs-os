/**
 * Generator for the `formulaDefinitionCatalog` structured runtime representation.
 *
 * Formula Definition Catalog Wiring Sprint · Step 1 (Derivation Layer). Reads the
 * authoritative authored corpus, derives the flat canonical-name collection, and
 * writes the generated artifact. This is the build-time derivation step (mirroring
 * `generateFormulaCatalog.ts` / `generateHerbCatalog.ts`): the generated artifact is
 * produced deterministically from the markdown and is never hand-authored. The
 * markdown remains the single source of truth.
 *
 * v1 scope (doc 37): treatment principles only.
 *
 * Parsing reuses the pure `parseFormulaCatalogIdentities` — the single
 * markdown-bullet identity parser in the project (it matches `- <Name>` lines and is
 * not formula-specific in behaviour) — rather than authoring a second parser. The
 * same reuse was applied to the formula and herb catalog generators.
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generateFormulaDefinitionCatalog.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a
 * fresh derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseFormulaCatalogIdentities } from "../../validation/prescriptionFormulaDefinitionsCrossContent";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-definition-catalog.md");
const OUTPUT_PATH = resolve(
  here,
  "../generated/formula-definition-catalog.generated.ts",
);

/** Serializes derived identities into a deterministic, human-diffable TS data module. */
function serialize(identities: readonly string[]): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/formula-definition-catalog.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generateFormulaDefinitionCatalog.ts",
    "//",
    "// A lossless, non-interpretive projection of the authored canonical treatment-",
    "// principle names, in source order. Identity only (Minimal Vocabulary) — each",
    "// entry is exactly one canonical treatment-principle name and nothing else. No",
    "// meaning is added here; edit the markdown and regenerate.",
  ].join("\n");

  const body = identities.map((name) => `  ${JSON.stringify(name)},`).join("\n");

  return `${header}\n\nexport const formulaDefinitionCatalogData: readonly string[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const identities = parseFormulaCatalogIdentities(markdown);
writeFileSync(OUTPUT_PATH, serialize(identities), "utf8");
console.log(
  `Derived ${identities.length} treatment-principle identities → ${OUTPUT_PATH}`,
);
