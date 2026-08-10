/**
 * Verification for the `formulaDefinitions` → `formulaDefinitionCatalog` cross-content
 * validator.
 *
 * Formula Definitions Wiring Sprint · Step 4A. Proves the validator enforces referential
 * integrity and parity over synthetic inputs, and that the real corpora are in perfect
 * parity. It touches no registry, loader, source, or contract, and enforces no
 * structural / neutrality / context-independence rules (those are other layers).
 */

import { describe, expect, it } from "vitest";

import {
  crossValidateFormulaDefinitions,
  validateFormulaDefinitionsAgainstCatalog,
} from "./formulaDefinitionsCrossContent";

const EXPECTED_COUNT = 69;

describe("formulaDefinitions cross-content validation", () => {
  it("FDCCVT-1 valid corpus passes", () => {
    const result = validateFormulaDefinitionsAgainstCatalog();
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.orphanReferences).toEqual([]);
  });

  it("FDCCVT-2 single orphan reference detected", () => {
    const result = crossValidateFormulaDefinitions(
      ["A", "B", "Orphan Principle"],
      ["A", "B", "C"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanReferences).toEqual(["Orphan Principle"]);
  });

  it("FDCCVT-3 multiple orphan references detected (all reported)", () => {
    const result = crossValidateFormulaDefinitions(
      ["A", "Zeta", "Yotta"],
      ["A", "B"],
    );
    expect(result.valid).toBe(false);
    expect(result.orphanReferences).toEqual(["Yotta", "Zeta"]); // sorted, all reported
  });

  it("FDCCVT-4 determinism: repeated validation identical", () => {
    const run = () => crossValidateFormulaDefinitions(["B", "A"], ["A", "C"]);
    expect(run()).toEqual(run());
    expect(run().orphanReferences).toEqual(["B"]);
    expect(run().missingDefinitions).toEqual(["C"]);
  });

  it("FDCCVT-5 no mutation: inputs unchanged", () => {
    const refs = ["B", "A"];
    const cat = ["A", "C"];
    crossValidateFormulaDefinitions(refs, cat);
    expect(refs).toEqual(["B", "A"]);
    expect(cat).toEqual(["A", "C"]);
  });

  it("FDCCVT-6 never throws; returns structured issues for mismatched data", () => {
    const run = () => crossValidateFormulaDefinitions(["X", "X"], []);
    expect(run).not.toThrow();
    const result = run();
    expect(result.valid).toBe(false);
    expect(result.duplicateReferences).toEqual(["X"]);
    expect(result.orphanReferences).toEqual(["X"]);
  });

  it("FDCCVT-7 current corpus integrity: 69 references, 69 catalog identities, 0 orphans", () => {
    const result = validateFormulaDefinitionsAgainstCatalog();
    expect(result.definitionUniqueCount).toBe(EXPECTED_COUNT);
    expect(result.catalogUniqueCount).toBe(EXPECTED_COUNT);
    expect(result.intersectionCount).toBe(EXPECTED_COUNT);
    expect(result.orphanReferences).toEqual([]);
    expect(result.missingDefinitions).toEqual([]);
    expect(result.duplicateReferences).toEqual([]);
  });
});
