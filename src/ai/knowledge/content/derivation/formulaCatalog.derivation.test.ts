/**
 * Derivation-layer verification for `formulaCatalog`.
 *
 * Formula Catalog Wiring Sprint · Step 1. Proves the structured runtime
 * representation is a complete, unique, structurally sound, faithful, deterministic,
 * drift-free projection of the authoritative authored corpus. The "no drift" case
 * re-derives from the markdown and asserts the checked-in generated artifact matches,
 * so a stale artifact fails the suite instead of shipping. No registry, source,
 * contract, loader, module, or runtime path is touched here.
 *
 * Parsing reuses the single project catalog parser (`parseFormulaCatalogIdentities`),
 * so this suite verifies the generated artifact against that same authoritative
 * derivation rather than a second one.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formulaCatalogData } from "../generated/formula-catalog.generated";
import { parseFormulaCatalogIdentities } from "../../validation/prescriptionFormulaDefinitionsCrossContent";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-catalog.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

const EXPECTED_COUNT = 135;

describe("formulaCatalog derivation", () => {
  const parsed = parseFormulaCatalogIdentities(markdown);

  it("completeness: derives all 135 identities", () => {
    expect(parsed).toHaveLength(EXPECTED_COUNT);
    expect(formulaCatalogData).toHaveLength(EXPECTED_COUNT);
  });

  it("structural integrity: every entry is a non-empty string", () => {
    for (const entry of formulaCatalogData) {
      expect(typeof entry).toBe("string");
      expect(entry.trim().length).toBeGreaterThan(0);
    }
  });

  it("uniqueness: no duplicate identities", () => {
    expect(new Set(formulaCatalogData).size).toBe(formulaCatalogData.length);
  });

  it("fidelity: entry count equals the authored identity lines", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\S.*$/.test(line));
    expect(authoredLines).toHaveLength(EXPECTED_COUNT);
    expect(parsed).toHaveLength(authoredLines.length);
  });

  it("determinism: repeated derivation yields identical output", () => {
    const again = parseFormulaCatalogIdentities(markdown);
    expect(again).toEqual(parsed);
  });

  it("no drift: the generated artifact equals a fresh derivation", () => {
    expect(formulaCatalogData).toEqual(parsed);
  });
});
