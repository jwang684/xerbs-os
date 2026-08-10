/**
 * Verification for the `herbCatalog` structural contract.
 *
 * Herb Catalog Wiring Sprint · Step 3. Proves the contract enforces structure
 * (HCV-1..HCV-5) and nothing more: the real generated slice passes, and each
 * structural violation fails. It asserts nothing about the registry, loader, other
 * corpora, parity, or meaning — those are outside the contract's ownership.
 */

import { describe, expect, it } from "vitest";

import { herbCatalogData } from "../content/generated/herb-catalog.generated";
import { herbCatalogContract } from "./herbCatalogContract";

describe("herbCatalogContract", () => {
  it("HCVT-1 valid: the real generated herb catalog passes and is returned unchanged", () => {
    const result = herbCatalogContract(herbCatalogData);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(herbCatalogData);
    }
  });

  it("HCVT-2 valid: a minimal well-formed array passes", () => {
    const raw = ["Ma Huang"];
    const result = herbCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("HCVT-3 non-array input fails", () => {
    for (const notArray of [null, undefined, {}, 123, "x", true]) {
      const result = herbCatalogContract(notArray);
      expect(result.valid).toBe(false);
    }
  });

  it("HCVT-4 non-string entry fails", () => {
    const result = herbCatalogContract(["Ma Huang", 123]);
    expect(result.valid).toBe(false);
  });

  it("HCVT-5 empty-string entry fails", () => {
    const result = herbCatalogContract([""]);
    expect(result.valid).toBe(false);
  });

  it("HCVT-6 whitespace-only entry fails", () => {
    for (const blank of ["   ", "\n", "\t"]) {
      const result = herbCatalogContract([blank]);
      expect(result.valid).toBe(false);
    }
  });

  it("HCVT-7 duplicate identities fail (exact string equality)", () => {
    const result = herbCatalogContract(["Ma Huang", "Ma Huang"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.join(" ")).toContain("duplicate");
    }
  });

  it("HCVT-8 multiple issues: collects all violations (no fail-fast)", () => {
    const result = herbCatalogContract(["", 123, "Ma Huang", "Ma Huang"]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      // empty + non-string + duplicate — at least three issues reported together.
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("HCVT-9 passthrough: success returns the original object reference", () => {
    const raw = ["Ma Huang", "Gui Zhi"];
    const result = herbCatalogContract(raw);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(raw);
    }
  });

  it("HCVT-10 determinism: identical input yields identical output", () => {
    const run = () => herbCatalogContract(["A", "", "A"]);
    expect(run()).toEqual(run());
    expect(run).not.toThrow();
  });
});
