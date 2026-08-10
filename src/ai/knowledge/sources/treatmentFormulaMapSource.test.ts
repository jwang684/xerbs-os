/**
 * Verification for the `treatmentFormulaMap` KnowledgeSource.
 *
 * Treatment Formula Map Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact, returning the
 * derived association collection unchanged. It asserts nothing about the registry, loader,
 * contract, catalogs, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { treatmentFormulaMapData } from "../content/generated/treatment-formula-map.generated";
import { treatmentFormulaMapSource } from "./treatmentFormulaMapSource";

const EXPECTED_COUNT = 209;

describe("treatmentFormulaMapSource", () => {
  it("TFMS-1 returns data", () => {
    const value = treatmentFormulaMapSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("TFMS-2 returns the exact generated collection reference", () => {
    // Reference identity, not deep equality — the source supplies, it does not copy.
    expect(treatmentFormulaMapSource()).toBe(treatmentFormulaMapData);
  });

  it("TFMS-3 count preserved (209)", () => {
    const value = treatmentFormulaMapSource() as readonly unknown[];
    expect(value).toHaveLength(EXPECTED_COUNT);
    expect(value).toHaveLength(treatmentFormulaMapData.length);
  });

  it("TFMS-4 shape: every entry is { principle: string, formula: string }", () => {
    const value = treatmentFormulaMapSource() as readonly Record<string, unknown>[];
    for (const entry of value) {
      expect(Object.keys(entry).sort()).toEqual(["formula", "principle"]);
      expect(typeof entry.principle).toBe("string");
      expect(typeof entry.formula).toBe("string");
    }
  });

  it("TFMS-5 preserves order (matches the generated artifact exactly)", () => {
    expect(treatmentFormulaMapSource()).toEqual(treatmentFormulaMapData);
  });

  it("TFMS-6 performs no transformation (deterministic, same reference each call)", () => {
    const first = treatmentFormulaMapSource();
    const second = treatmentFormulaMapSource();
    expect(first).toBe(second);
    expect(first).toBe(treatmentFormulaMapData);
  });
});
