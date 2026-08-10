/**
 * Derivation-layer verification for `formulaDefinitions`.
 *
 * Formula Definitions Wiring Sprint · Step 1. Proves the structured runtime
 * representation is a complete, structurally sound, identity- and meaning-faithful,
 * source-order-faithful, deterministic, drift-free derivation of the authoritative
 * authored corpus. The "no drift" case re-derives from the markdown and asserts the
 * checked-in generated artifact matches, so a stale artifact fails the suite instead
 * of shipping. No registry, source, contract, loader, module, or runtime path is
 * touched here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formulaDefinitionsData } from "../generated/formula-definitions.generated";
import { parseFormulaDefinitions } from "./formulaDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../formula-definitions.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

describe("formulaDefinitions derivation", () => {
  const parsed = parseFormulaDefinitions(markdown);

  it("FDD-1 count fidelity: generated count equals authored entry count", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\*\*.+?\*\*\s+—\s+.+$/.test(line));
    expect(parsed).toHaveLength(authoredLines.length);
    expect(formulaDefinitionsData).toHaveLength(authoredLines.length);
  });

  it("FDD-2 structural integrity: every entry has exactly two non-empty string fields", () => {
    for (const entry of formulaDefinitionsData) {
      expect(Object.keys(entry).sort()).toEqual(["definition", "principle"]);
      expect(typeof entry.principle).toBe("string");
      expect(entry.principle.trim().length).toBeGreaterThan(0);
      expect(typeof entry.definition).toBe("string");
      expect(entry.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("FDD-3 identity preservation: referenced principles are unique and match a fresh derivation", () => {
    const principles = formulaDefinitionsData.map((e) => e.principle);
    expect(new Set(principles).size).toBe(principles.length);
    expect(principles).toEqual(parsed.map((e) => e.principle));
  });

  it("FDD-4 definition preservation: definitions match a fresh derivation exactly", () => {
    expect(formulaDefinitionsData.map((e) => e.definition)).toEqual(
      parsed.map((e) => e.definition),
    );
  });

  it("FDD-5 source-order preservation: generated order matches authored order", () => {
    const authoredPrinciples = markdown
      .split(/\r?\n/)
      .map((line) => /^-\s+\*\*(.+?)\*\*\s+—\s+.+$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => m[1].trim());
    expect(formulaDefinitionsData.map((e) => e.principle)).toEqual(
      authoredPrinciples,
    );
  });

  it("FDD-6 determinism: repeated derivation yields identical output", () => {
    const again = parseFormulaDefinitions(markdown);
    expect(again).toEqual(parsed);
  });

  it("FDD-7 no drift: the generated artifact equals a fresh derivation", () => {
    expect(formulaDefinitionsData).toEqual(parsed);
  });
});
