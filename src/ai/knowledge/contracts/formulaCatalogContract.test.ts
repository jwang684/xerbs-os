/**
 * Verification for the `formulaCatalog` structural contract.
 *
 * Formula Catalog Wiring Sprint · Step 3. Proves the contract enforces structure
 * (FCV-1..FCV-5) and nothing more: the real generated slice passes, and each
 * structural violation fails. It asserts nothing about the registry, loader, other
 * corpora, parity, or meaning — those are outside the contract's ownership.
 */

import { describe, expect, it } from "vitest";

import { formulaCatalogData } from "../content/generated/formula-catalog.generated";
import { formulaCatalogContract } from "./formulaCatalogContract";

describe("formulaCatalogContract", () => {
  it("valid: the real generated catalog passes and is returned unchanged", () => {
    const result = formulaCatalogContract(formulaCatalogData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      // N-4: no repair — the exact input value is returned.
      expect(result.value).toBe(formulaCatalogData);
    }
  });

  it("valid: a minimal well-formed array passes", () => {
    const raw = ["Gui Zhi Tang"];
    const result = formulaCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("FCV-1: a non-array value fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      const result = formulaCatalogContract(notArray);
      expect(result.valid).toBe(false);
    }
  });

  it("FCV-2: a non-string entry fails", () => {
    const result = formulaCatalogContract(["Gui Zhi Tang", 123]);
    expect(result.valid).toBe(false);
  });

  it("FCV-3: an empty-string entry fails", () => {
    const result = formulaCatalogContract([""]);
    expect(result.valid).toBe(false);
  });

  it("FCV-3: a whitespace-only entry fails", () => {
    for (const blank of ["   ", "\n", "\t"]) {
      const result = formulaCatalogContract([blank]);
      expect(result.valid).toBe(false);
    }
  });

  it("FCV-4: duplicate names fail (exact string equality)", () => {
    const result = formulaCatalogContract(["Gui Zhi Tang", "Gui Zhi Tang"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("reports issues (not exceptions) for invalid input, collecting all violations", () => {
    const result = formulaCatalogContract(["", 123, "Gui Zhi Tang", "Gui Zhi Tang"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      // empty + non-string + duplicate — more than one issue reported (no fail-fast).
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("success path returns the original object reference (passthrough)", () => {
    const raw = ["Gui Zhi Tang", "Ma Huang Tang"];
    const result = formulaCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("deterministic: identical input yields identical output", () => {
    const run = () => formulaCatalogContract(["A", "", "A"]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
