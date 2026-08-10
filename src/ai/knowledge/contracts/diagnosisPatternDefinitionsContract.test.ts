/**
 * Verification for the `diagnosisPatternDefinitions` structural contract.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 3. Proves the contract enforces
 * STRUCTURE (array, exact two-field shape, non-empty strings, uniqueness) and nothing more:
 * the real generated slice passes, and each structural violation fails. It deliberately
 * does NOT test Definition Neutrality (Doc 49) or Context Independence (Doc 50) — those are
 * editorial review gates, not structural rules (see the contract's ownership note).
 */

import { describe, expect, it } from "vitest";

import { diagnosisPatternDefinitionsData } from "../content/generated/diagnosis-pattern-definitions.generated";
import { diagnosisPatternDefinitionsContract } from "./diagnosisPatternDefinitionsContract";

describe("diagnosisPatternDefinitionsContract", () => {
  it("DPDCT-1 valid: the real generated collection passes and is returned unchanged", () => {
    const result = diagnosisPatternDefinitionsContract(diagnosisPatternDefinitionsData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(diagnosisPatternDefinitionsData);
    }
  });

  it("DPDCT-2 valid: a minimal well-formed array passes", () => {
    const raw = [{ pattern: "Qi Deficiency", definition: "A diagnosis pattern." }];
    const result = diagnosisPatternDefinitionsContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("DPDCT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      expect(diagnosisPatternDefinitionsContract(notArray).valid).toBe(false);
    }
  });

  it("DPDCT-4 entry missing `pattern` fails", () => {
    const result = diagnosisPatternDefinitionsContract([{ definition: "A diagnosis pattern." }]);
    expect(result.valid).toBe(false);
  });

  it("DPDCT-5 entry missing `definition` fails", () => {
    const result = diagnosisPatternDefinitionsContract([{ pattern: "Qi Deficiency" }]);
    expect(result.valid).toBe(false);
  });

  it("DPDCT-6 entry with an extra field fails", () => {
    const result = diagnosisPatternDefinitionsContract([
      { pattern: "Qi Deficiency", definition: "A diagnosis pattern.", tier: "diagnosis" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("DPDCT-7 empty/whitespace pattern fails", () => {
    for (const pattern of ["", "   "]) {
      const result = diagnosisPatternDefinitionsContract([
        { pattern, definition: "A diagnosis pattern." },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("DPDCT-8 empty/whitespace definition fails", () => {
    for (const definition of ["", "   "]) {
      const result = diagnosisPatternDefinitionsContract([
        { pattern: "Qi Deficiency", definition },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("DPDCT-9 duplicate pattern fails", () => {
    const result = diagnosisPatternDefinitionsContract([
      { pattern: "Qi Deficiency", definition: "First." },
      { pattern: "Qi Deficiency", definition: "Second." },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("DPDCT-10 multiple violations aggregated (no fail-fast)", () => {
    const result = diagnosisPatternDefinitionsContract([
      { pattern: "" },
      { pattern: "Qi Deficiency", definition: "First." },
      { pattern: "Qi Deficiency", definition: "Second." },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("DPDCT-11 passthrough: success returns the original object reference", () => {
    const raw = [
      { pattern: "Qi Deficiency", definition: "A." },
      { pattern: "Blood Stasis", definition: "B." },
    ];
    const result = diagnosisPatternDefinitionsContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("DPDCT-12 determinism: identical input yields identical output", () => {
    const run = () =>
      diagnosisPatternDefinitionsContract([{ pattern: "A", definition: "" }]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
