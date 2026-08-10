/**
 * Verification for the `prescriptionFormulaDefinitions` → `formulaCatalog`
 * cross-content validator.
 *
 * Wiring Sprint · Step 4. Proves the validator enforces referential integrity and
 * parity (CC-1..CC-6) over synthetic inputs, and that the real corpora are in
 * perfect parity. It touches no registry, loader, source, or contract.
 */

import { describe, expect, it } from "vitest";

import {
  crossValidatePrescriptionFormulaDefinitions,
  loadFormulaCatalogIdentities,
  parseFormulaCatalogIdentities,
  validatePrescriptionFormulaDefinitionsAgainstCatalog,
} from "./prescriptionFormulaDefinitionsCrossContent";

const EXPECTED_COUNT = 135;

describe("prescriptionFormulaDefinitions cross-content validation", () => {
  describe("real corpora", () => {
    it("catalog parser reads 135 unique authoritative identities", () => {
      const identities = loadFormulaCatalogIdentities();
      expect(identities).toHaveLength(EXPECTED_COUNT);
      expect(new Set(identities).size).toBe(EXPECTED_COUNT);
    });

    it("perfect parity: real definitions ↔ real catalog", () => {
      const result = validatePrescriptionFormulaDefinitionsAgainstCatalog();
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.catalogUniqueCount).toBe(EXPECTED_COUNT);
      expect(result.definitionUniqueCount).toBe(EXPECTED_COUNT);
      expect(result.intersectionCount).toBe(EXPECTED_COUNT);
      expect(result.missingDefinitions).toEqual([]);
      expect(result.orphanReferences).toEqual([]);
      expect(result.duplicateCatalogIdentities).toEqual([]);
      expect(result.duplicateDefinitionReferences).toEqual([]);
    });
  });

  describe("synthetic cases (pure comparison)", () => {
    it("perfect parity passes", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "B", "C"],
        ["A", "B", "C"],
      );
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.intersectionCount).toBe(3);
    });

    it("CC-3 missing definition: catalog identity with no definition fails", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "B"],
        ["A", "B", "C"],
      );
      expect(result.valid).toBe(false);
      expect(result.missingDefinitions).toEqual(["C"]);
      expect(result.orphanReferences).toEqual([]);
    });

    it("CC-1/CC-2 orphan reference: definition referencing a non-catalog identity fails", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "B", "Foo Formula"],
        ["A", "B"],
      );
      expect(result.valid).toBe(false);
      expect(result.orphanReferences).toEqual(["Foo Formula"]);
      expect(result.missingDefinitions).toEqual([]);
    });

    it("CC-5 count mismatch fails", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A"],
        ["A", "B"],
      );
      expect(result.valid).toBe(false);
      expect(result.catalogUniqueCount).toBe(2);
      expect(result.definitionUniqueCount).toBe(1);
      expect(result.issues.some((i) => i.includes("count mismatch"))).toBe(true);
    });

    it("CC-6 duplicate catalog identity fails", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "B"],
        ["A", "B", "B"],
      );
      expect(result.valid).toBe(false);
      expect(result.duplicateCatalogIdentities).toEqual(["B"]);
    });

    it("CC-6 duplicate definition reference fails", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "A", "B"],
        ["A", "B"],
      );
      expect(result.valid).toBe(false);
      expect(result.duplicateDefinitionReferences).toEqual(["A"]);
    });

    it("multiple simultaneous failures: reports all detected issues (no fail-fast)", () => {
      const result = crossValidatePrescriptionFormulaDefinitions(
        ["A", "A", "Orphan"], // duplicate A + orphan
        ["A", "B", "B"], // duplicate B + missing B(def) + C? no
      );
      expect(result.valid).toBe(false);
      expect(result.duplicateDefinitionReferences).toEqual(["A"]);
      expect(result.duplicateCatalogIdentities).toEqual(["B"]);
      expect(result.orphanReferences).toEqual(["Orphan"]);
      expect(result.missingDefinitions).toEqual(["B"]);
      // Every category is represented in the issue log simultaneously.
      expect(result.issues.length).toBeGreaterThanOrEqual(4);
    });

    it("never throws for ordinary invalid input and is deterministic", () => {
      const run = () =>
        crossValidatePrescriptionFormulaDefinitions(["B", "A"], ["A", "C"]);
      expect(run).not.toThrow();
      expect(run()).toEqual(run());
      // Sorted, deterministic reporting regardless of input order.
      expect(run().orphanReferences).toEqual(["B"]);
      expect(run().missingDefinitions).toEqual(["C"]);
    });
  });

  describe("catalog parser", () => {
    it("extracts only bullet identities, ignoring headings and status lines", () => {
      const markdown = [
        "# Formula Catalog",
        "",
        "**Status: frozen.**",
        "*Status: frozen note.*",
        "",
        "- Gui Zhi Tang",
        "- Ma Huang Tang",
      ].join("\n");
      expect(parseFormulaCatalogIdentities(markdown)).toEqual([
        "Gui Zhi Tang",
        "Ma Huang Tang",
      ]);
    });
  });
});
