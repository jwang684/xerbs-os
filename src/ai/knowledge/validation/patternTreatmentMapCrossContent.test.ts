/**
 * Verification for the `patternTreatmentMap` dual cross-content validator.
 *
 * Pattern Treatment Map Wiring Sprint · Step 4A. Proves the validator enforces two-sided
 * referential integrity over synthetic inputs, and that the real corpora resolve cleanly on
 * both sides. It touches no registry, loader, source, or contract, and enforces no structure,
 * cardinality, duplicate, or editorial rules (those are other layers, Doc 55).
 */

import { describe, expect, it } from "vitest";

import {
  crossValidatePatternTreatmentMap,
  validatePatternTreatmentMapAgainstCatalogs,
} from "./patternTreatmentMapCrossContent";

describe("patternTreatmentMap cross-content validation", () => {
  it("PTMCCVT-1 valid corpus passes (real, two-sided)", () => {
    const result = validatePatternTreatmentMapAgainstCatalogs();
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.orphanPatterns).toEqual([]);
    expect(result.orphanPrinciples).toEqual([]);
  });

  it("PTMCCVT-2 orphan pattern detected", () => {
    const result = crossValidatePatternTreatmentMap(
      [{ pattern: "Ghost Pattern", principle: "Tonify Qi" }],
      ["Qi Deficiency"],
      ["Tonify Qi"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPatterns).toEqual(["Ghost Pattern"]);
    expect(result.orphanPrinciples).toEqual([]);
  });

  it("PTMCCVT-3 orphan principle detected", () => {
    const result = crossValidatePatternTreatmentMap(
      [{ pattern: "Qi Deficiency", principle: "Ghost Principle" }],
      ["Qi Deficiency"],
      ["Tonify Qi"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPatterns).toEqual([]);
    expect(result.orphanPrinciples).toEqual(["Ghost Principle"]);
  });

  it("PTMCCVT-4 both orphan types detected together (all reported, no fail-fast)", () => {
    const result = crossValidatePatternTreatmentMap(
      [
        { pattern: "Ghost A", principle: "Ghost X" },
        { pattern: "Ghost B", principle: "Tonify Qi" },
      ],
      ["Qi Deficiency"],
      ["Tonify Qi"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanPatterns).toEqual(["Ghost A", "Ghost B"]); // sorted
    expect(result.orphanPrinciples).toEqual(["Ghost X"]);
    expect(result.issues.length).toBe(3);
  });

  it("PTMCCVT-5 deterministic output (sorted, repeatable)", () => {
    const run = () =>
      crossValidatePatternTreatmentMap(
        [
          { pattern: "Zeta", principle: "P2" },
          { pattern: "Alpha", principle: "P1" },
        ],
        ["P-only"],
        ["P1"],
      );
    expect(run()).toEqual(run());
    expect(run().orphanPatterns).toEqual(["Alpha", "Zeta"]);
    expect(run().orphanPrinciples).toEqual(["P2"]);
  });

  it("PTMCCVT-6 inputs unmodified", () => {
    const assoc = [{ pattern: "Qi Deficiency", principle: "Tonify Qi" }];
    const pats = ["Qi Deficiency"];
    const prins = ["Tonify Qi"];
    crossValidatePatternTreatmentMap(assoc, pats, prins);
    expect(assoc).toEqual([{ pattern: "Qi Deficiency", principle: "Tonify Qi" }]);
    expect(pats).toEqual(["Qi Deficiency"]);
    expect(prins).toEqual(["Tonify Qi"]);
  });

  it("PTMCCVT-7 coverage reporting correct (informational, non-failing)", () => {
    const result = crossValidatePatternTreatmentMap(
      [
        { pattern: "A", principle: "P1" },
        { pattern: "A", principle: "P2" }, // A → many principles (many-to-many)
        { pattern: "B", principle: "P1" },
      ],
      ["A", "B", "C"], // catalog has 3 patterns; C unreferenced
      ["P1", "P2", "P3"], // catalog has 3 principles; P3 unreferenced
    );
    expect(result.valid).toBe(true);
    expect(result.distinctPatternCount).toBe(2); // A, B
    expect(result.distinctPrincipleCount).toBe(2); // P1, P2
    expect(result.catalogPatternCount).toBe(3);
    expect(result.catalogPrincipleCount).toBe(3);
    expect(result.patternCoverageCount).toBe(2); // A, B covered; C not
    expect(result.principleCoverageCount).toBe(2); // P1, P2 covered; P3 not
  });

  it("never throws for empty / mismatched input", () => {
    expect(() => crossValidatePatternTreatmentMap([], [], [])).not.toThrow();
    const empty = crossValidatePatternTreatmentMap([], [], []);
    expect(empty.valid).toBe(true);
    expect(empty.distinctPatternCount).toBe(0);
  });
});
