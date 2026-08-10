/**
 * Verification for the `diagnosisPatternDefinitions` → `diagnosisPatternCatalog`
 * cross-content validator.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 4A. Proves the validator enforces
 * referential integrity and parity over synthetic inputs, and that the real corpora are in
 * perfect parity. It touches no registry, loader, source, or contract, and enforces no
 * structural / neutrality / context-independence rules (those are other layers).
 */

import { describe, expect, it } from "vitest";

import {
  crossValidateDiagnosisPatternDefinitions,
  validateDiagnosisPatternDefinitionsAgainstCatalog,
} from "./diagnosisPatternDefinitionsCrossContent";

const EXPECTED_COUNT = 85;

describe("diagnosisPatternDefinitions cross-content validation", () => {
  it("DPDCCVT-1 valid corpus passes", () => {
    const result = validateDiagnosisPatternDefinitionsAgainstCatalog();
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.orphanReferences).toEqual([]);
    expect(result.missingDefinitions).toEqual([]);
    expect(result.duplicateReferences).toEqual([]);
  });

  it("DPDCCVT-2 single orphan reference detected", () => {
    const result = crossValidateDiagnosisPatternDefinitions(
      ["A", "B", "Orphan Pattern"],
      ["A", "B", "C"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanReferences).toEqual(["Orphan Pattern"]);
  });

  it("DPDCCVT-3 multiple orphan references detected (all reported)", () => {
    const result = crossValidateDiagnosisPatternDefinitions(
      ["A", "Zeta", "Yotta"],
      ["A", "B"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanReferences).toEqual(["Yotta", "Zeta"]); // sorted, all reported
  });

  it("DPDCCVT-4 determinism: repeated validation identical", () => {
    const run = () => crossValidateDiagnosisPatternDefinitions(["B", "A"], ["A", "C"]);
    expect(run()).toEqual(run());
    expect(run().orphanReferences).toEqual(["B"]);
    expect(run().missingDefinitions).toEqual(["C"]);
  });

  it("DPDCCVT-5 no mutation: inputs unchanged", () => {
    const refs = ["B", "A"];
    const cat = ["A", "C"];
    crossValidateDiagnosisPatternDefinitions(refs, cat);
    expect(refs).toEqual(["B", "A"]);
    expect(cat).toEqual(["A", "C"]);
  });

  it("DPDCCVT-6 never throws; returns structured issues for mismatched data", () => {
    const run = () => crossValidateDiagnosisPatternDefinitions(["X", "X"], []);
    expect(run).not.toThrow();
    const result = run();
    expect(result.valid).toBe(false);
    expect(result.duplicateReferences).toEqual(["X"]);
    expect(result.orphanReferences).toEqual(["X"]);
  });

  it("DPDCCVT-7 current corpus integrity: 85 ↔ 85, 0 orphans, 0 missing, 0 duplicates", () => {
    const result = validateDiagnosisPatternDefinitionsAgainstCatalog();
    expect(result.uniqueReferenceCount).toBe(EXPECTED_COUNT);
    expect(result.catalogUniqueCount).toBe(EXPECTED_COUNT);
    expect(result.totalReferenceCount).toBe(EXPECTED_COUNT);
    expect(result.intersectionCount).toBe(EXPECTED_COUNT);
    expect(result.orphanReferences).toEqual([]);
    expect(result.missingDefinitions).toEqual([]);
    expect(result.duplicateReferences).toEqual([]);
  });
});
