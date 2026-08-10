/**
 * Verification for the `herbCatalog` KnowledgeSource.
 *
 * Herb Catalog Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact,
 * returning a flat `readonly string[]`. It asserts nothing about the registry,
 * loader, contract, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { herbCatalogData } from "../content/generated/herb-catalog.generated";
import { herbCatalogSource } from "./herbCatalogSource";

describe("herbCatalogSource", () => {
  it("HS-1 returns the complete collection", () => {
    const value = herbCatalogSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("HS-2 count fidelity: length matches the generated artifact", () => {
    const value = herbCatalogSource() as readonly unknown[];
    expect(value).toHaveLength(herbCatalogData.length);
  });

  it("HS-3 string shape: every entry remains a string", () => {
    const value = herbCatalogSource() as readonly unknown[];
    for (const entry of value) {
      expect(typeof entry).toBe("string");
    }
  });

  it("HS-4 reference preserved: returns exactly the generated artifact", () => {
    const value = herbCatalogSource();
    // Same content and same reference — the source supplies, it does not copy or transform.
    expect(value).toEqual(herbCatalogData);
    expect(value).toBe(herbCatalogData);
  });

  it("HS-5 deterministic: repeated calls yield identical results", () => {
    const first = herbCatalogSource();
    const second = herbCatalogSource();
    expect(first).toEqual(second);
    expect(first).toBe(second);
  });

  it("HS-6 read-only: the source does not mutate the generated artifact", () => {
    const before = [...herbCatalogData];
    herbCatalogSource();
    expect(herbCatalogData).toEqual(before);
    expect(herbCatalogData).toHaveLength(before.length);
  });
});
