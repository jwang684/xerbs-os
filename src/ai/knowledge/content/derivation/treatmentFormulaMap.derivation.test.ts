/**
 * Derivation-layer verification for `treatmentFormulaMap`.
 *
 * Treatment Formula Map Wiring Sprint · Step 1. Proves the structured runtime representation
 * is a complete, structurally sound, principle- and formula-faithful, source-order-faithful,
 * deterministic, drift-free derivation of the authoritative authored corpus. The "no drift"
 * case re-derives from the markdown and asserts the checked-in generated artifact matches, so a
 * stale artifact fails the suite instead of shipping. No registry, source, contract, loader,
 * module, or runtime path is touched here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { treatmentFormulaMapData } from "../generated/treatment-formula-map.generated";
import { parseTreatmentFormulaMap } from "./treatmentFormulaMapParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../treatment-formula-map.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

describe("treatmentFormulaMap derivation", () => {
  const parsed = parseTreatmentFormulaMap(markdown);

  it("TFMD-1 count fidelity: generated count equals authored association count", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\*\*.+?\*\*\s+—\s+.+$/.test(line));
    expect(parsed).toHaveLength(authoredLines.length);
    expect(treatmentFormulaMapData).toHaveLength(authoredLines.length);
  });

  it("TFMD-2 structural integrity: every entry has exactly two non-empty string fields", () => {
    for (const entry of treatmentFormulaMapData) {
      expect(Object.keys(entry).sort()).toEqual(["formula", "principle"]);
      expect(typeof entry.principle).toBe("string");
      expect(entry.principle.trim().length).toBeGreaterThan(0);
      expect(typeof entry.formula).toBe("string");
      expect(entry.formula.trim().length).toBeGreaterThan(0);
    }
  });

  it("TFMD-3 principle preservation: generated principles match a fresh derivation exactly", () => {
    expect(treatmentFormulaMapData.map((e) => e.principle)).toEqual(
      parsed.map((e) => e.principle),
    );
  });

  it("TFMD-4 formula preservation: generated formulas match a fresh derivation exactly", () => {
    expect(treatmentFormulaMapData.map((e) => e.formula)).toEqual(
      parsed.map((e) => e.formula),
    );
  });

  it("TFMD-5 source-order preservation: generated order matches authored order", () => {
    const authoredPairs = markdown
      .split(/\r?\n/)
      .map((line) => /^-\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s*$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => ({ principle: m[1].trim(), formula: m[2].trim() }));
    expect(treatmentFormulaMapData).toEqual(authoredPairs);
  });

  it("TFMD-6 determinism: repeated derivation yields identical output", () => {
    const again = parseTreatmentFormulaMap(markdown);
    expect(again).toEqual(parsed);
  });

  it("TFMD-7 no drift: the generated artifact equals a fresh derivation", () => {
    expect(treatmentFormulaMapData).toEqual(parsed);
  });
});
