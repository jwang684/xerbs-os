/**
 * Verification for the `patternTreatmentMap` KnowledgeSource.
 *
 * Pattern Treatment Map Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact, returning
 * the derived association collection unchanged. It asserts nothing about the registry,
 * loader, contract, catalogs, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { patternTreatmentMapData } from "../content/generated/pattern-treatment-map.generated";
import { patternTreatmentMapSource } from "./patternTreatmentMapSource";

const EXPECTED_COUNT = 129;

describe("patternTreatmentMapSource", () => {
  it("PTMS-1 returns the generated collection", () => {
    const value = patternTreatmentMapSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("PTMS-2 returns the same reference", () => {
    // Reference identity, not deep equality — the source supplies, it does not copy.
    expect(patternTreatmentMapSource()).toBe(patternTreatmentMapData);
  });

  it("PTMS-3 collection size equals the generated count (129)", () => {
    const value = patternTreatmentMapSource() as readonly unknown[];
    expect(value).toHaveLength(EXPECTED_COUNT);
    expect(value).toHaveLength(patternTreatmentMapData.length);
  });

  it("PTMS-4 shape: every entry is { pattern: string, principle: string }", () => {
    const value = patternTreatmentMapSource() as readonly Record<string, unknown>[];
    for (const entry of value) {
      expect(Object.keys(entry).sort()).toEqual(["pattern", "principle"]);
      expect(typeof entry.pattern).toBe("string");
      expect(typeof entry.principle).toBe("string");
    }
  });

  it("PTMS-5 deterministic across calls", () => {
    const first = patternTreatmentMapSource();
    const second = patternTreatmentMapSource();
    expect(first).toBe(second);
    expect(first).toEqual(second);
  });

  it("PTMS-6 source order preserved (matches the generated artifact exactly)", () => {
    expect(patternTreatmentMapSource()).toEqual(patternTreatmentMapData);
  });
});
