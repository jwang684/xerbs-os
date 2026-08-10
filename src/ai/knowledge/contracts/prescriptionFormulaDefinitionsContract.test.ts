/**
 * Verification for the `prescriptionFormulaDefinitions` structural contract.
 *
 * Wiring Sprint · Step 3. Proves the contract enforces structure (CV-1..CV-5) and
 * nothing more: the real generated slice passes, and each structural violation
 * fails. It asserts nothing about the registry, loader, catalog, parity, or clinical
 * meaning — those are outside the contract's ownership.
 */

import { describe, expect, it } from "vitest";

import { prescriptionFormulaDefinitionsData } from "../content/generated/prescription-formula-definitions.generated";
import { prescriptionFormulaDefinitionsContract } from "./prescriptionFormulaDefinitionsContract";

describe("prescriptionFormulaDefinitionsContract", () => {
  it("valid: the real generated collection passes and is returned unchanged", () => {
    const result = prescriptionFormulaDefinitionsContract(
      prescriptionFormulaDefinitionsData,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      // N-4: no repair — the exact input value is returned.
      expect(result.value).toBe(prescriptionFormulaDefinitionsData);
    }
  });

  it("valid: a minimal well-formed array passes", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { formula: "Gui Zhi Tang", definition: "A classical formula." },
      { formula: "Ma Huang Tang", definition: "Another classical formula." },
    ]);
    expect(result.valid).toBe(true);
  });

  it("CV-1: a non-array value fails", () => {
    for (const notArray of [undefined, null, "x", 42, {}, true]) {
      const result = prescriptionFormulaDefinitionsContract(notArray);
      expect(result.valid).toBe(false);
    }
  });

  it("CV-2: an entry missing `formula` fails", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { definition: "A classical formula." },
    ]);
    expect(result.valid).toBe(false);
  });

  it("CV-2: an entry missing `definition` fails", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { formula: "Gui Zhi Tang" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("CV-2: an entry with an extra field fails", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { formula: "Gui Zhi Tang", definition: "A classical formula.", dosage: "9g" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("CV-3: an empty/whitespace `formula` fails", () => {
    for (const formula of ["", "   "]) {
      const result = prescriptionFormulaDefinitionsContract([
        { formula, definition: "A classical formula." },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("CV-3: a non-string `formula` fails", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { formula: 123, definition: "A classical formula." },
    ]);
    expect(result.valid).toBe(false);
  });

  it("CV-4: an empty/whitespace `definition` fails", () => {
    for (const definition of ["", "   "]) {
      const result = prescriptionFormulaDefinitionsContract([
        { formula: "Gui Zhi Tang", definition },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("CV-5: a duplicate formula reference fails", () => {
    const result = prescriptionFormulaDefinitionsContract([
      { formula: "Gui Zhi Tang", definition: "First." },
      { formula: "Gui Zhi Tang", definition: "Second." },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("reports issues (not exceptions) for invalid input", () => {
    const result = prescriptionFormulaDefinitionsContract([{ formula: "" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
