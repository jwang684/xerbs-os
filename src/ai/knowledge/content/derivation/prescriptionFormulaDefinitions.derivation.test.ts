/**
 * Derivation-layer verification for `prescriptionFormulaDefinitions`.
 *
 * Wiring Sprint · Step 1. Proves the structured runtime representation is a
 * complete, unique, structurally sound, faithful, deterministic, drift-free
 * derivation of the authoritative authored corpus. This is the regenerate-and-verify
 * guard: the "no drift" case re-derives from the markdown and asserts the checked-in
 * generated artifact matches, so a stale artifact fails the suite instead of
 * shipping. No registry, source, contract, loader, module, or runtime path is
 * touched here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { prescriptionFormulaDefinitionsData } from "../generated/prescription-formula-definitions.generated";
import { parsePrescriptionFormulaDefinitions } from "./prescriptionFormulaDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../prescription-formula-definitions.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

const EXPECTED_COUNT = 135;

describe("prescriptionFormulaDefinitions derivation", () => {
  const parsed = parsePrescriptionFormulaDefinitions(markdown);

  it("completeness: derives all 135 definitions", () => {
    expect(parsed).toHaveLength(EXPECTED_COUNT);
    expect(prescriptionFormulaDefinitionsData).toHaveLength(EXPECTED_COUNT);
  });

  it("uniqueness: no duplicate formula references", () => {
    const references = parsed.map((entry) => entry.formula);
    expect(new Set(references).size).toBe(references.length);
  });

  it("structural integrity: every entry has exactly two non-empty string fields", () => {
    for (const entry of parsed) {
      expect(Object.keys(entry).sort()).toEqual(["definition", "formula"]);
      expect(typeof entry.formula).toBe("string");
      expect(entry.formula.trim().length).toBeGreaterThan(0);
      expect(typeof entry.definition).toBe("string");
      expect(entry.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("fidelity: entry count equals the authored definition lines", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\*\*.+?\*\*\s+—\s+.+$/.test(line));
    expect(authoredLines).toHaveLength(EXPECTED_COUNT);
    expect(parsed).toHaveLength(authoredLines.length);
  });

  it("determinism: repeated derivation yields identical output", () => {
    const again = parsePrescriptionFormulaDefinitions(markdown);
    expect(again).toEqual(parsed);
  });

  it("no drift: the generated artifact equals a fresh derivation", () => {
    expect(prescriptionFormulaDefinitionsData).toEqual(parsed);
  });
});
