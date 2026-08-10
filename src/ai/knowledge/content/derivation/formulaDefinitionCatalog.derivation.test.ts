/**
 * Derivation-layer verification for `formulaDefinitionCatalog`.
 *
 * Formula Definition Catalog Wiring Sprint · Step 1. Proves the structured runtime
 * representation is a complete, unique, structurally sound, source-order-faithful,
 * deterministic, drift-free projection of the authoritative authored corpus. The "no
 * drift" case re-derives from the markdown and asserts the checked-in generated
 * artifact matches, so a stale artifact fails the suite instead of shipping. No
 * registry, source, contract, loader, module, or runtime path is touched here.
 *
 * Parsing reuses the single project markdown-bullet identity parser
 * (`parseFormulaCatalogIdentities`), so this suite verifies the generated artifact
 * against that same authoritative derivation rather than a second one.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formulaDefinitionCatalogData } from "../generated/formula-definition-catalog.generated";
import { parseFormulaCatalogIdentities } from "../../validation/prescriptionFormulaDefinitionsCrossContent";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-definition-catalog.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

describe("formulaDefinitionCatalog derivation", () => {
  const parsed = parseFormulaCatalogIdentities(markdown);

  it("FDCD-1 count fidelity: generated count equals authored count", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\S.*$/.test(line));
    expect(parsed).toHaveLength(authoredLines.length);
    expect(formulaDefinitionCatalogData).toHaveLength(authoredLines.length);
  });

  it("FDCD-2 structural integrity: every entry is a non-empty string", () => {
    for (const entry of formulaDefinitionCatalogData) {
      expect(typeof entry).toBe("string");
      expect(entry.trim().length).toBeGreaterThan(0);
    }
  });

  it("FDCD-3 uniqueness: all identities unique", () => {
    expect(new Set(formulaDefinitionCatalogData).size).toBe(
      formulaDefinitionCatalogData.length,
    );
  });

  it("FDCD-4 determinism: repeated derivation yields identical output", () => {
    const again = parseFormulaCatalogIdentities(markdown);
    expect(again).toEqual(parsed);
  });

  it("FDCD-5 source-order preservation: generated order matches authored order", () => {
    const authoredOrder = markdown
      .split(/\r?\n/)
      .map((line) => /^-\s+(\S.*?)\s*$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => m[1]);
    expect(formulaDefinitionCatalogData).toEqual(authoredOrder);
  });

  it("FDCD-6 no drift: the generated artifact equals a fresh derivation", () => {
    expect(formulaDefinitionCatalogData).toEqual(parsed);
  });
});
