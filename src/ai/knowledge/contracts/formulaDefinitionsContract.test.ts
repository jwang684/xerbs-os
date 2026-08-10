/**
 * Verification for the `formulaDefinitions` structural contract.
 *
 * Formula Definitions Wiring Sprint · Step 3. Proves the contract enforces STRUCTURE
 * (array, exact two-field shape, non-empty strings, uniqueness) and nothing more: the
 * real generated slice passes, and each structural violation fails. It deliberately
 * does NOT test Definition Neutrality (Doc 41) or Context Independence (Doc 42) — those
 * are editorial review gates, not structural rules (see the contract's ownership note).
 */

import { describe, expect, it } from "vitest";

import { formulaDefinitionsData } from "../content/generated/formula-definitions.generated";
import { formulaDefinitionsContract } from "./formulaDefinitionsContract";

describe("formulaDefinitionsContract", () => {
  it("valid: the real generated collection passes and is returned unchanged", () => {
    const result = formulaDefinitionsContract(formulaDefinitionsData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(formulaDefinitionsData);
    }
  });

  it("valid: a minimal well-formed array passes", () => {
    const raw = [{ principle: "Tonify Qi", definition: "A treatment principle." }];
    const result = formulaDefinitionsContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      expect(formulaDefinitionsContract(notArray).valid).toBe(false);
    }
  });

  it("entry missing `principle` fails", () => {
    const result = formulaDefinitionsContract([{ definition: "A treatment principle." }]);
    expect(result.valid).toBe(false);
  });

  it("entry missing `definition` fails", () => {
    const result = formulaDefinitionsContract([{ principle: "Tonify Qi" }]);
    expect(result.valid).toBe(false);
  });

  it("entry with an extra field fails", () => {
    const result = formulaDefinitionsContract([
      { principle: "Tonify Qi", definition: "A treatment principle.", tier: "strategy" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("empty/whitespace principle fails", () => {
    for (const principle of ["", "   "]) {
      const result = formulaDefinitionsContract([
        { principle, definition: "A treatment principle." },
      ]);
      expect(result.valid).toBe(false);
    }
  });

  it("non-string principle fails", () => {
    const result = formulaDefinitionsContract([
      { principle: 123, definition: "A treatment principle." },
    ]);
    expect(result.valid).toBe(false);
  });

  it("empty/whitespace definition fails", () => {
    for (const definition of ["", "   "]) {
      const result = formulaDefinitionsContract([{ principle: "Tonify Qi", definition }]);
      expect(result.valid).toBe(false);
    }
  });

  it("duplicate principle fails", () => {
    const result = formulaDefinitionsContract([
      { principle: "Tonify Qi", definition: "First." },
      { principle: "Tonify Qi", definition: "Second." },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("multiple issues: collects all violations (no fail-fast)", () => {
    const result = formulaDefinitionsContract([
      { principle: "" },
      { principle: "Tonify Qi", definition: "First." },
      { principle: "Tonify Qi", definition: "Second." },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("passthrough: success returns the original object reference", () => {
    const raw = [
      { principle: "Tonify Qi", definition: "A." },
      { principle: "Clear Heat", definition: "B." },
    ];
    const result = formulaDefinitionsContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("deterministic: identical input yields identical output", () => {
    const run = () =>
      formulaDefinitionsContract([{ principle: "A", definition: "" }]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
