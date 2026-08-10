/**
 * Verification for the `formulaDefinitionCatalog` KnowledgeSource.
 *
 * Formula Definition Catalog Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact,
 * returning a flat `readonly string[]`. It asserts nothing about the registry, loader,
 * contract, or runtime path — those are untouched by this step.
 */

import { describe, expect, it } from "vitest";

import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import { formulaDefinitionCatalogSource } from "./formulaDefinitionCatalogSource";

describe("formulaDefinitionCatalogSource", () => {
  it("FDCS-1 returns the complete collection", () => {
    const value = formulaDefinitionCatalogSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("FDCS-2 count fidelity: length matches the generated artifact", () => {
    const value = formulaDefinitionCatalogSource() as readonly unknown[];
    expect(value).toHaveLength(formulaDefinitionCatalogData.length);
  });

  it("FDCS-3 string-only shape: every entry is a string", () => {
    const value = formulaDefinitionCatalogSource() as readonly unknown[];
    for (const entry of value) {
      expect(typeof entry).toBe("string");
    }
  });

  it("FDCS-4 reference/content equality: returns exactly the generated artifact", () => {
    const value = formulaDefinitionCatalogSource();
    // Same content and same reference — the source supplies, it does not copy or transform.
    expect(value).toEqual(formulaDefinitionCatalogData);
    expect(value).toBe(formulaDefinitionCatalogData);
  });

  it("FDCS-5 determinism: repeated calls yield identical results", () => {
    const first = formulaDefinitionCatalogSource();
    const second = formulaDefinitionCatalogSource();
    expect(first).toEqual(second);
    expect(first).toBe(second);
  });

  it("FDCS-6 read-only: the source does not mutate the generated artifact", () => {
    const before = [...formulaDefinitionCatalogData];
    formulaDefinitionCatalogSource();
    expect(formulaDefinitionCatalogData).toEqual(before);
    expect(formulaDefinitionCatalogData).toHaveLength(before.length);
  });
});
