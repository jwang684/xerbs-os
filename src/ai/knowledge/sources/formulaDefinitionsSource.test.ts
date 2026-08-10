/**
 * Verification for the `formulaDefinitions` KnowledgeSource.
 *
 * Formula Definitions Wiring Sprint · Step 2. Proves the source is a faithful,
 * deterministic, read-only data provider over the generated derivation artifact,
 * returning the derived two-field collection unchanged. It asserts nothing about the
 * registry, loader, contract, catalog, or runtime path — those are untouched by this
 * step.
 */

import { describe, expect, it } from "vitest";

import { formulaDefinitionsData } from "../content/generated/formula-definitions.generated";
import { formulaDefinitionsSource } from "./formulaDefinitionsSource";

const EXPECTED_COUNT = 69;

describe("formulaDefinitionsSource", () => {
  it("FDS-1 returns the generated collection", () => {
    const value = formulaDefinitionsSource() as readonly unknown[];
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBeGreaterThan(0);
  });

  it("FDS-2 count fidelity: 69 entries", () => {
    const value = formulaDefinitionsSource() as readonly unknown[];
    expect(value).toHaveLength(EXPECTED_COUNT);
    expect(value).toHaveLength(formulaDefinitionsData.length);
  });

  it("FDS-3 shape: every entry is { principle: string, definition: string }", () => {
    const value = formulaDefinitionsSource() as readonly Record<string, unknown>[];
    for (const entry of value) {
      expect(Object.keys(entry).sort()).toEqual(["definition", "principle"]);
      expect(typeof entry.principle).toBe("string");
      expect(typeof entry.definition).toBe("string");
    }
  });

  it("FDS-4 reference equality: returns the generated artifact itself", () => {
    // Reference identity, not deep equality — the source supplies, it does not copy.
    expect(formulaDefinitionsSource()).toBe(formulaDefinitionsData);
  });

  it("FDS-5 determinism: repeated calls return identical content", () => {
    const first = formulaDefinitionsSource();
    const second = formulaDefinitionsSource();
    expect(first).toBe(second);
    expect(first).toEqual(second);
  });

  it("FDS-6 read-only: the source does not mutate the generated data", () => {
    const before = formulaDefinitionsData.map((entry) => ({ ...entry }));
    formulaDefinitionsSource();
    expect(formulaDefinitionsData).toEqual(before);
    expect(formulaDefinitionsData).toHaveLength(EXPECTED_COUNT);
  });
});
