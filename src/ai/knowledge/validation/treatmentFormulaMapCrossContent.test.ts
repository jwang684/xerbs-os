/**
 * Verification for the `treatmentFormulaMap` dual cross-content validator.
 *
 * Treatment Formula Map Wiring Sprint · Step 4A. Proves the validator enforces two-sided
 * referential integrity over synthetic inputs, and that the real corpora resolve cleanly on
 * both sides. It touches no registry, loader, source, or contract, and enforces no structure,
 * cardinality, duplicate, or editorial rules (those are other layers, Docs 55, 58).
 */

import { describe, expect, it } from "vitest";

import {
  crossValidateTreatmentFormulaMap,
  validateTreatmentFormulaMapAgainstCatalogs,
} from "./treatmentFormulaMapCrossContent";

describe("treatmentFormulaMap cross-content validation", () => {
  it("TFMCCVT-1 valid corpus passes (real, two-sided)", () => {
    const result = validateTreatmentFormulaMapAgainstCatalogs();
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.orphanPrinciples).toEqual([]);
    expect(result.orphanFormulas).toEqual([]);
  });

  it("TFMCCVT-2 orphan principle detected", () => {
    const result = crossValidateTreatmentFormulaMap(
      [{ principle: "Ghost Principle", formula: "Si Jun Zi Tang" }],
      ["Tonify Qi"],
      ["Si Jun Zi Tang"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPrinciples).toEqual(["Ghost Principle"]);
    expect(result.orphanFormulas).toEqual([]);
  });

  it("TFMCCVT-3 orphan formula detected", () => {
    const result = crossValidateTreatmentFormulaMap(
      [{ principle: "Tonify Qi", formula: "Ghost Formula" }],
      ["Tonify Qi"],
      ["Si Jun Zi Tang"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPrinciples).toEqual([]);
    expect(result.orphanFormulas).toEqual(["Ghost Formula"]);
  });

  it("TFMCCVT-4 both orphan types detected together (all reported, no fail-fast)", () => {
    const result = crossValidateTreatmentFormulaMap(
      [
        { principle: "Ghost A", formula: "Ghost X" },
        { principle: "Ghost B", formula: "Si Jun Zi Tang" },
      ],
      ["Tonify Qi"],
      ["Si Jun Zi Tang"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPrinciples).toEqual(["Ghost A", "Ghost B"]); // sorted
    expect(result.orphanFormulas).toEqual(["Ghost X"]);
    expect(result.issues.length).toBe(3);
  });

  it("TFMCCVT-5 deterministic output (sorted, repeatable)", () => {
    const run = () =>
      crossValidateTreatmentFormulaMap(
        [
          { principle: "Zeta", formula: "F2" },
          { principle: "Alpha", formula: "F1" },
        ],
        ["P-only"],
        ["F1"],
      );
    expect(run()).toEqual(run());
    expect(run().orphanPrinciples).toEqual(["Alpha", "Zeta"]);
    expect(run().orphanFormulas).toEqual(["F2"]);
  });

  it("TFMCCVT-6 inputs unmodified", () => {
    const assoc = [{ principle: "Tonify Qi", formula: "Si Jun Zi Tang" }];
    const prins = ["Tonify Qi"];
    const forms = ["Si Jun Zi Tang"];
    crossValidateTreatmentFormulaMap(assoc, prins, forms);
    expect(assoc).toEqual([{ principle: "Tonify Qi", formula: "Si Jun Zi Tang" }]);
    expect(prins).toEqual(["Tonify Qi"]);
    expect(forms).toEqual(["Si Jun Zi Tang"]);
  });

  it("TFMCCVT-7 structured-result guarantee + coverage reporting (informational, non-failing)", () => {
    const result = crossValidateTreatmentFormulaMap(
      [
        { principle: "Tonify Qi", formula: "F1" },
        { principle: "Tonify Qi", formula: "F2" }, // one principle → many formulas (many-to-many)
        { principle: "Move Qi", formula: "F1" },
      ],
      ["Tonify Qi", "Move Qi", "Cool Heat"], // catalog has 3 principles; "Cool Heat" unreferenced
      ["F1", "F2", "F3"], // catalog has 3 formulas; F3 unreferenced
    );
    expect(result.valid).toBe(true);
    // Structured-result guarantee: every field present with the expected type.
    expect(result).toEqual({
      valid: true,
      issues: [],
      orphanPrinciples: [],
      orphanFormulas: [],
      duplicateReferences: [],
      intersectionCount: 3, // all 3 associations fully resolve
      principleCoverageReferenced: 2, // Tonify Qi, Move Qi
      principleCoverageCatalog: 3,
      formulaCoverageReferenced: 2, // F1, F2
      formulaCoverageCatalog: 3,
    });
  });

  it("TFMCCVT-8 empty-input safety (never throws; valid, zeroed)", () => {
    expect(() => crossValidateTreatmentFormulaMap([], [], [])).not.toThrow();
    const empty = crossValidateTreatmentFormulaMap([], [], []);
    expect(empty.valid).toBe(true);
    expect(empty.issues).toEqual([]);
    expect(empty.orphanPrinciples).toEqual([]);
    expect(empty.orphanFormulas).toEqual([]);
    expect(empty.intersectionCount).toBe(0);
    expect(empty.principleCoverageReferenced).toBe(0);
    expect(empty.principleCoverageCatalog).toBe(0);
    expect(empty.formulaCoverageReferenced).toBe(0);
    expect(empty.formulaCoverageCatalog).toBe(0);
  });

  it("TFMCCVT-9 duplicate references surfaced informationally (never fails validation)", () => {
    const result = crossValidateTreatmentFormulaMap(
      [
        { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
        { principle: "Tonify Qi", formula: "Si Jun Zi Tang" }, // duplicate whole-pair
      ],
      ["Tonify Qi"],
      ["Si Jun Zi Tang"],
    );
    // Duplicate REJECTION is the contract's job; here duplicates are informational only.
    expect(result.valid).toBe(true);
    expect(result.duplicateReferences.length).toBe(1);
    expect(result.duplicateReferences[0]).toContain("Tonify Qi");
  });

  it("TFMCCVT-10 same principle + different formulas is NOT flagged (many-to-many allowed)", () => {
    const result = crossValidateTreatmentFormulaMap(
      [
        { principle: "Tonify Qi", formula: "Si Jun Zi Tang" },
        { principle: "Tonify Qi", formula: "Bu Zhong Yi Qi Tang" },
      ],
      ["Tonify Qi"],
      ["Si Jun Zi Tang", "Bu Zhong Yi Qi Tang"],
    );
    expect(result.valid).toBe(true);
    expect(result.duplicateReferences).toEqual([]);
    expect(result.principleCoverageReferenced).toBe(1);
    expect(result.formulaCoverageReferenced).toBe(2);
  });
});
