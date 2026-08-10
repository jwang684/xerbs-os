/**
 * Verification for the `diagnosisPatternCatalog` KnowledgeSource.
 *
 * Diagnosis Pattern Catalog Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact,
 * returning a flat `readonly string[]`. It asserts nothing about the registry, loader,
 * contract, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { diagnosisPatternCatalogData } from "../content/generated/diagnosis-pattern-catalog.generated";
import { diagnosisPatternCatalogSource } from "./diagnosisPatternCatalogSource";

describe("diagnosisPatternCatalogSource", () => {
  it("DPCS-1 returns the generated collection", () => {
    const value = diagnosisPatternCatalogSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("DPCS-2 count fidelity: length matches the generated artifact", () => {
    const value = diagnosisPatternCatalogSource() as readonly unknown[];
    expect(value).toHaveLength(diagnosisPatternCatalogData.length);
  });

  it("DPCS-3 string shape: every entry is a string", () => {
    const value = diagnosisPatternCatalogSource() as readonly unknown[];
    for (const entry of value) {
      expect(typeof entry).toBe("string");
    }
  });

  it("DPCS-4 reference equality: returns the same collection reference", () => {
    // Reference identity, not deep equality — the source supplies, it does not copy.
    expect(diagnosisPatternCatalogSource()).toBe(diagnosisPatternCatalogData);
  });

  it("DPCS-5 determinism: repeated calls return the same result", () => {
    const first = diagnosisPatternCatalogSource();
    const second = diagnosisPatternCatalogSource();
    expect(first).toBe(second);
    expect(first).toEqual(second);
  });

  it("DPCS-6 read-only: the source does not mutate the generated data", () => {
    const before = [...diagnosisPatternCatalogData];
    diagnosisPatternCatalogSource();
    expect(diagnosisPatternCatalogData).toEqual(before);
    expect(diagnosisPatternCatalogData).toHaveLength(before.length);
  });
});
