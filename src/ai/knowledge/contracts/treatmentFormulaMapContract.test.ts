/**
 * Verification for the `treatmentFormulaMap` structural contract.
 *
 * Treatment Formula Map Wiring Sprint · Step 3. Proves the contract enforces STRUCTURE
 * (array, exact two-field shape, non-empty strings, duplicate-PAIR uniqueness) and nothing
 * more: the real generated slice passes, and each structural violation fails. It asserts
 * nothing about catalogs, referential integrity, coverage, cardinality, or recommendations —
 * those are outside the contract's ownership (Docs 55, 58).
 */

import { describe, expect, it } from "vitest";

import { treatmentFormulaMapData } from "../content/generated/treatment-formula-map.generated";
import { treatmentFormulaMapContract } from "./treatmentFormulaMapContract";

describe("treatmentFormulaMapContract", () => {
  it("TFMCT-1 valid: the real generated corpus passes and is returned unchanged", () => {
    const result = treatmentFormulaMapContract(treatmentFormulaMapData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(treatmentFormulaMapData);
    }
  });

  it("TFMCT-2 valid: a minimal well-formed array passes and returns the original reference", () => {
    const raw = [{ principle: "Tonify Qi", formula: "Si Jun Zi Tang" }];
    const result = treatmentFormulaMapContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("TFMCT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      expect(treatmentFormulaMapContract(notArray).valid).toBe(false);
    }
  });

  it("TFMCT-4 non-object entry fails", () => {
    const result = treatmentFormulaMapContract(["Tonify Qi — Si Jun Zi Tang"]);
    expect(result.valid).toBe(false);
  });

  it("TFMCT-5 entry missing `principle` fails", () => {
    const result = treatmentFormulaMapContract([{ formula: "Si Jun Zi Tang" }]);
    expect(result.valid).toBe(false);
  });

  it("TFMCT-6 entry missing `formula` fails", () => {
    const result = treatmentFormulaMapContract([{ principle: "Tonify Qi" }]);
    expect(result.valid).toBe(false);
  });

  it("TFMCT-7 empty/whitespace principle fails", () => {
    for (const principle of ["", "   "]) {
      const result = treatmentFormulaMapContract([
        { principle, formula: "Si Jun Zi Tang" },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("TFMCT-8 empty/whitespace formula fails", () => {
    for (const formula of ["", "   "]) {
      const result = treatmentFormulaMapContract([
        { principle: "Tonify Qi", formula },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("TFMCT-9 entry with an extra field fails (metadata drift guard)", () => {
    const result = treatmentFormulaMapContract([
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang", weight: 1 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("TFMCT-10 duplicate (principle, formula) pair fails", () => {
    const result = treatmentFormulaMapContract([
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("TFMCT-10b same principle with different formulas is NOT a duplicate (many-to-many)", () => {
    const result = treatmentFormulaMapContract([
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
      { principle: "Tonify Qi", formula: "Bu Zhong Yi Qi Tang" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("TFMCT-11 multiple issues aggregate (no fail-fast)", () => {
    const result = treatmentFormulaMapContract([
      { principle: "" },
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("TFMCT-12 passthrough: success returns the original object reference", () => {
    const raw = [
      { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
      { principle: "Invigorate the Blood and Dispel Stasis", formula: "Xue Fu Zhu Yu Tang" },
    ];
    const result = treatmentFormulaMapContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("TFMCT-13 determinism: identical input yields identical output", () => {
    const run = () =>
      treatmentFormulaMapContract([{ principle: "A", formula: "" }]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
