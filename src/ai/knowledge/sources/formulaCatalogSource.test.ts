/**
 * Verification for the `formulaCatalog` KnowledgeSource.
 *
 * Formula Catalog Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact,
 * returning a flat `readonly string[]`. It asserts nothing about the registry,
 * loader, contract, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { formulaCatalogData } from "../content/generated/formula-catalog.generated";
import { formulaCatalogSource } from "./formulaCatalogSource";

const EXPECTED_COUNT = 135;

describe("formulaCatalogSource", () => {
  it("returns the complete catalog collection (length 135)", () => {
    const value = formulaCatalogSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value).toHaveLength(EXPECTED_COUNT);
  });

  it("shape: returns only strings", () => {
    const value = formulaCatalogSource() as readonly unknown[];
    for (const entry of value) {
      expect(typeof entry).toBe("string");
    }
  });

  it("reference preserved: returns exactly the generated artifact", () => {
    const value = formulaCatalogSource();
    // Same content and same reference — the source supplies, it does not copy or transform.
    expect(value).toEqual(formulaCatalogData);
    expect(value).toBe(formulaCatalogData);
  });

  it("deterministic: repeated calls yield identical results", () => {
    const first = formulaCatalogSource();
    const second = formulaCatalogSource();
    expect(first).toEqual(second);
    expect(first).toBe(second);
  });

  it("read-only: the source does not mutate the generated artifact", () => {
    const before = [...formulaCatalogData];
    formulaCatalogSource();
    expect(formulaCatalogData).toEqual(before);
    expect(formulaCatalogData).toHaveLength(EXPECTED_COUNT);
  });
});
