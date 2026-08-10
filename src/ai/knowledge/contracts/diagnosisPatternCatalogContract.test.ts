/**
 * Verification for the `diagnosisPatternCatalog` structural contract.
 *
 * Diagnosis Pattern Catalog Wiring Sprint · Step 3. Proves the contract enforces
 * structure (DPCC-1..DPCC-5) and nothing more: the real generated slice passes, and each
 * structural violation fails. It asserts nothing about clinical correctness, naming
 * quality, canonicalization, meaning, or other corpora — those are outside the contract's
 * ownership.
 */

import { describe, expect, it } from "vitest";

import { diagnosisPatternCatalogData } from "../content/generated/diagnosis-pattern-catalog.generated";
import { diagnosisPatternCatalogContract } from "./diagnosisPatternCatalogContract";

describe("diagnosisPatternCatalogContract", () => {
  it("DPCCT-1 valid: the real generated catalog passes and is returned unchanged", () => {
    const result = diagnosisPatternCatalogContract(diagnosisPatternCatalogData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(diagnosisPatternCatalogData);
    }
  });

  it("DPCCT-2 valid: a minimal well-formed array passes", () => {
    const raw = ["Qi Deficiency"];
    const result = diagnosisPatternCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("DPCCT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      expect(diagnosisPatternCatalogContract(notArray).valid).toBe(false);
    }
  });

  it("DPCCT-4 non-string entry fails", () => {
    const result = diagnosisPatternCatalogContract(["Qi Deficiency", 123]);
    expect(result.valid).toBe(false);
  });

  it("DPCCT-5 empty-string entry fails", () => {
    const result = diagnosisPatternCatalogContract([""]);
    expect(result.valid).toBe(false);
  });

  it("DPCCT-6 whitespace-only entry fails", () => {
    for (const blank of ["   ", "\n", "\t"]) {
      expect(diagnosisPatternCatalogContract([blank]).valid).toBe(false);
    }
  });

  it("DPCCT-7 duplicate identity fails (exact string equality)", () => {
    const result = diagnosisPatternCatalogContract(["Qi Deficiency", "Qi Deficiency"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("DPCCT-8 multiple issues: collects all violations (no fail-fast)", () => {
    const result = diagnosisPatternCatalogContract(["", 123, "Qi Deficiency", "Qi Deficiency"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("DPCCT-9 passthrough: success returns the original object reference", () => {
    const raw = ["Qi Deficiency", "Blood Stasis"];
    const result = diagnosisPatternCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("DPCCT-10 determinism: identical input yields identical output", () => {
    const run = () => diagnosisPatternCatalogContract(["A", "", "A"]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
