/**
 * Verification for the `formulaDefinitionCatalog` structural contract.
 *
 * Formula Definition Catalog Wiring Sprint · Step 3. Proves the contract enforces
 * structure (FDCC-1..FDCC-5) and nothing more: the real generated slice passes, and
 * each structural violation fails. It asserts nothing about the registry, loader,
 * other corpora, parity, editorial style, or meaning — those are outside the
 * contract's ownership.
 */

import { describe, expect, it } from "vitest";

import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import { formulaDefinitionCatalogContract } from "./formulaDefinitionCatalogContract";

describe("formulaDefinitionCatalogContract", () => {
  it("FDCCT-1 valid: the real generated catalog passes and is returned unchanged", () => {
    const result = formulaDefinitionCatalogContract(formulaDefinitionCatalogData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(formulaDefinitionCatalogData);
    }
  });

  it("FDCCT-2 valid: a minimal well-formed array passes", () => {
    const raw = ["Tonify Qi"];
    const result = formulaDefinitionCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("FDCCT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      const result = formulaDefinitionCatalogContract(notArray);
      expect(result.valid).toBe(false);
    }
  });

  it("FDCCT-4 non-string entry fails", () => {
    const result = formulaDefinitionCatalogContract(["Tonify Qi", 123]);
    expect(result.valid).toBe(false);
  });

  it("FDCCT-5 empty-string entry fails", () => {
    const result = formulaDefinitionCatalogContract([""]);
    expect(result.valid).toBe(false);
  });

  it("FDCCT-6 whitespace-only entry fails", () => {
    for (const blank of ["   ", "\n", "\t"]) {
      const result = formulaDefinitionCatalogContract([blank]);
      expect(result.valid).toBe(false);
    }
  });

  it("FDCCT-7 duplicate identities fail (exact string equality)", () => {
    const result = formulaDefinitionCatalogContract(["Tonify Qi", "Tonify Qi"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("FDCCT-8 multiple issues: collects all violations (no fail-fast)", () => {
    const result = formulaDefinitionCatalogContract(["", 123, "Tonify Qi", "Tonify Qi"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      // empty + non-string + duplicate — at least three issues reported together.
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("FDCCT-9 passthrough: success returns the original object reference", () => {
    const raw = ["Tonify Qi", "Clear Heat"];
    const result = formulaDefinitionCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("FDCCT-10 determinism: identical input yields identical output", () => {
    const run = () => formulaDefinitionCatalogContract(["A", "", "A"]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
