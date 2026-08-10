/**
 * Verification for the `patternTreatmentMap` structural contract.
 *
 * Pattern Treatment Map Wiring Sprint · Step 3. Proves the contract enforces STRUCTURE
 * (array, exact two-field shape, non-empty strings, duplicate-PAIR uniqueness) and nothing
 * more: the real generated slice passes, and each structural violation fails. It asserts
 * nothing about catalogs, referential integrity, coverage, cardinality, or recommendations —
 * those are outside the contract's ownership (Doc 55).
 */

import { describe, expect, it } from "vitest";

import { patternTreatmentMapData } from "../content/generated/pattern-treatment-map.generated";
import { patternTreatmentMapContract } from "./patternTreatmentMapContract";

describe("patternTreatmentMapContract", () => {
  it("PTMCT-1 valid: the real generated corpus passes and is returned unchanged", () => {
    const result = patternTreatmentMapContract(patternTreatmentMapData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(patternTreatmentMapData);
    }
  });

  it("PTMCT-2 valid: a minimal well-formed array passes", () => {
    const raw = [{ pattern: "Qi Deficiency", principle: "Tonify Qi" }];
    const result = patternTreatmentMapContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("PTMCT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      expect(patternTreatmentMapContract(notArray).valid).toBe(false);
    }
  });

  it("PTMCT-4 non-object entry fails", () => {
    const result = patternTreatmentMapContract(["Qi Deficiency — Tonify Qi"]);
    expect(result.valid).toBe(false);
  });

  it("PTMCT-5 entry missing `pattern` fails", () => {
    const result = patternTreatmentMapContract([{ principle: "Tonify Qi" }]);
    expect(result.valid).toBe(false);
  });

  it("PTMCT-6 entry missing `principle` fails", () => {
    const result = patternTreatmentMapContract([{ pattern: "Qi Deficiency" }]);
    expect(result.valid).toBe(false);
  });

  it("PTMCT-7 empty/whitespace pattern fails", () => {
    for (const pattern of ["", "   "]) {
      const result = patternTreatmentMapContract([{ pattern, principle: "Tonify Qi" }]);
      expect(result.valid).toBe(false);
    }
  });

  it("PTMCT-8 empty/whitespace principle fails", () => {
    for (const principle of ["", "   "]) {
      const result = patternTreatmentMapContract([{ pattern: "Qi Deficiency", principle }]);
      expect(result.valid).toBe(false);
    }
  });

  it("PTMCT-9 entry with an extra field fails (metadata drift guard)", () => {
    const result = patternTreatmentMapContract([
      { pattern: "Qi Deficiency", principle: "Tonify Qi", weight: 1 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("PTMCT-10 duplicate (pattern, principle) pair fails", () => {
    const result = patternTreatmentMapContract([
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("PTMCT-10b same pattern with different principles is NOT a duplicate (many-to-many)", () => {
    const result = patternTreatmentMapContract([
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
      { pattern: "Qi Deficiency", principle: "Raise the Yang" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("PTMCT-11 multiple issues aggregate (no fail-fast)", () => {
    const result = patternTreatmentMapContract([
      { pattern: "" },
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("PTMCT-12 passthrough: success returns the original object reference", () => {
    const raw = [
      { pattern: "Qi Deficiency", principle: "Tonify Qi" },
      { pattern: "Blood Stasis", principle: "Invigorate the Blood and Dispel Stasis" },
    ];
    const result = patternTreatmentMapContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("PTMCT-13 determinism: identical input yields identical output", () => {
    const run = () =>
      patternTreatmentMapContract([{ pattern: "A", principle: "" }]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
