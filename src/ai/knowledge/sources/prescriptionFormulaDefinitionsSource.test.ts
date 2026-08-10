/**
 * Verification for the `prescriptionFormulaDefinitions` KnowledgeSource.
 *
 * Wiring Sprint · Step 2. Proves the source is a faithful, deterministic, read-only
 * data provider over the generated derivation artifact. It asserts nothing about the
 * registry, loader, contract, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { prescriptionFormulaDefinitionsData } from "../content/generated/prescription-formula-definitions.generated";
import { prescriptionFormulaDefinitionsSource } from "./prescriptionFormulaDefinitionsSource";

const EXPECTED_COUNT = 135;

describe("prescriptionFormulaDefinitionsSource", () => {
  it("returns the complete collection (length 135)", () => {
    const value = prescriptionFormulaDefinitionsSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value).toHaveLength(EXPECTED_COUNT);
  });

  it("shape preserved: returns exactly the generated artifact", () => {
    const value = prescriptionFormulaDefinitionsSource();
    // Same content and same reference — the source supplies, it does not copy or transform.
    expect(value).toEqual(prescriptionFormulaDefinitionsData);
    expect(value).toBe(prescriptionFormulaDefinitionsData);
  });

  it("deterministic: repeated calls yield identical results", () => {
    const first = prescriptionFormulaDefinitionsSource();
    const second = prescriptionFormulaDefinitionsSource();
    expect(first).toEqual(second);
    expect(first).toBe(second);
  });

  it("read-only: the source does not mutate the generated artifact", () => {
    const before = prescriptionFormulaDefinitionsData.map((entry) => ({
      ...entry,
    }));
    prescriptionFormulaDefinitionsSource();
    expect(prescriptionFormulaDefinitionsData).toEqual(before);
    expect(prescriptionFormulaDefinitionsData).toHaveLength(EXPECTED_COUNT);
  });
});
