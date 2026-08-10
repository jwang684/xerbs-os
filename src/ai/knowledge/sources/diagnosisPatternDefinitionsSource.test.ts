/**
 * Verification for the `diagnosisPatternDefinitions` KnowledgeSource.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact, returning
 * the derived two-field collection unchanged. It asserts nothing about the registry, loader,
 * contract, catalog, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { diagnosisPatternDefinitionsData } from "../content/generated/diagnosis-pattern-definitions.generated";
import { diagnosisPatternDefinitionsSource } from "./diagnosisPatternDefinitionsSource";

const EXPECTED_COUNT = 85;

describe("diagnosisPatternDefinitionsSource", () => {
  it("DPDS-1 returns the generated corpus", () => {
    const value = diagnosisPatternDefinitionsSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("DPDS-2 collection length equals 85", () => {
    const value = diagnosisPatternDefinitionsSource() as readonly unknown[];
    expect(value).toHaveLength(EXPECTED_COUNT);
    expect(value).toHaveLength(diagnosisPatternDefinitionsData.length);
  });

  it("DPDS-3 reference equality: returns the generated artifact itself", () => {
    // Reference identity, not deep equality — the source supplies, it does not copy.
    expect(diagnosisPatternDefinitionsSource()).toBe(diagnosisPatternDefinitionsData);
  });

  it("DPDS-4 shape: every entry is { pattern: string, definition: string }", () => {
    const value = diagnosisPatternDefinitionsSource() as readonly Record<string, unknown>[];
    for (const entry of value) {
      expect(Object.keys(entry).sort()).toEqual(["definition", "pattern"]);
      expect(typeof entry.pattern).toBe("string");
      expect(typeof entry.definition).toBe("string");
    }
  });

  it("DPDS-5 determinism: repeated calls return identical content", () => {
    const first = diagnosisPatternDefinitionsSource();
    const second = diagnosisPatternDefinitionsSource();
    expect(first).toBe(second);
    expect(first).toEqual(second);
  });

  it("DPDS-6 read-only: the source does not mutate the generated data", () => {
    const before = diagnosisPatternDefinitionsData.map((entry) => ({ ...entry }));
    diagnosisPatternDefinitionsSource();
    expect(diagnosisPatternDefinitionsData).toEqual(before);
    expect(diagnosisPatternDefinitionsData).toHaveLength(EXPECTED_COUNT);
  });
});
