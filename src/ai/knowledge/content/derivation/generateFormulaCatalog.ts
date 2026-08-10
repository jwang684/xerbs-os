/**
 * Generator for the `formulaCatalog` structured runtime representation.
 *
 * Formula Catalog Wiring Sprint · Step 1 (Derivation Layer). Reads the authoritative
 * authored corpus, derives the flat canonical-name collection, and writes the
 * generated artifact. This is the build-time derivation step (Wiring Plan
 * `docs/architecture/27` §2, Derivation A): the generated artifact is produced
 * deterministically from the markdown and is never hand-authored. The markdown
 * remains the single source of truth.
 *
 * Parsing reuses the pure `parseFormulaCatalogIdentities` already established in the
 * definitions cross-content validator — the single catalog-parsing logic in the
 * project — rather than authoring a second parser (Wiring Plan §2, §closing).
 *
 * Run (reproducible):
 *   npx tsx src/ai/knowledge/content/derivation/generateFormulaCatalog.ts
 *
 * The derivation test re-runs the parser and asserts the generated artifact equals a
 * fresh derivation (no drift); a stale artifact fails the suite rather than shipping.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseFormulaCatalogIdentities } from "../../validation/prescriptionFormulaDefinitionsCrossContent";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-catalog.md");
const OUTPUT_PATH = resolve(here, "../generated/formula-catalog.generated.ts");

/** Serializes derived identities into a deterministic, human-diffable TS data module. */
function serialize(identities: readonly string[]): string {
  const header = [
    "// AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source of truth: src/ai/knowledge/content/formula-catalog.md",
    "// Regenerate: npx tsx src/ai/knowledge/content/derivation/generateFormulaCatalog.ts",
    "//",
    "// A lossless, non-interpretive projection of the authored canonical names, in",
    "// source order. Identity only (Minimal Vocabulary) — each entry is exactly one",
    "// canonical formula name and nothing else. No meaning is added here; edit the",
    "// markdown and regenerate.",
  ].join("\n");

  const body = identities.map((name) => `  ${JSON.stringify(name)},`).join("\n");

  return `${header}\n\nexport const formulaCatalogData: readonly string[] = [\n${body}\n];\n`;
}

const markdown = readFileSync(SOURCE_PATH, "utf8");
const identities = parseFormulaCatalogIdentities(markdown);
writeFileSync(OUTPUT_PATH, serialize(identities), "utf8");
console.log(`Derived ${identities.length} identities → ${OUTPUT_PATH}`);
