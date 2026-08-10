/**
 * Cross-content validation for `formulaDefinitions` → `formulaDefinitionCatalog`.
 *
 * Formula Definitions Wiring Sprint · Step 4A. This is Validation Layer 3
 * (cross-content) — a BUILD-TIME check of referential integrity and parity between the
 * strategy-tier meaning layer (definition `principle` references) and the strategy-tier
 * identity root (catalog identities). It verifies the *relationship* between two slices.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Cross-content ownership only.
 *
 * Definition Neutrality Audit (Doc 41) and Context Independence Audit (Doc 42) remain
 * editorial review gates and are intentionally NOT enforced here.
 *
 * Structural validation belongs to `formulaDefinitionsContract`.
 *
 * This validator owns only `formulaDefinitions → formulaDefinitionCatalog` reference
 * integrity. It does NOT own: shape validation, required fields, string validation,
 * duplicate structural detection (contract), Definition Neutrality, Context
 * Independence, clinical correctness, editorial quality, recommendation detection, or
 * indication detection.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Data sources (authoritative derived corpora; no second source of truth): the derived
 * `formulaDefinitionsData` principals and the derived `formulaDefinitionCatalogData`
 * identities (per Doc 41 §7). Output is deterministic, machine-consumable,
 * side-effect-free, reports ALL issues (no fail-fast), and never throws for ordinary
 * validation failures.
 */

import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import { formulaDefinitionsData } from "../content/generated/formula-definitions.generated";

/** Deterministic, machine-consumable cross-content result. All arrays are sorted. */
export interface CrossContentResult {
  readonly valid: boolean;
  readonly catalogUniqueCount: number;
  readonly definitionUniqueCount: number;
  readonly definitionTotalCount: number;
  readonly intersectionCount: number;
  readonly missingDefinitions: readonly string[];
  readonly orphanReferences: readonly string[];
  readonly duplicateReferences: readonly string[];
  readonly issues: readonly string[];
}

/** Returns the values that appear more than once, sorted (deterministic). */
function findDuplicates(values: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
}

/**
 * Compares definition `principle` references against catalog identities and reports
 * referential integrity and parity. Pure: no I/O, no mutation of inputs, never throws.
 *
 * Checks: orphan references (a `principle` absent from the catalog); missing definitions
 * (a catalog identity with no definition — coverage/parity, per the prescription
 * precedent); duplicate references.
 */
export function crossValidateFormulaDefinitions(
  principleReferences: readonly string[],
  catalogIdentities: readonly string[],
): CrossContentResult {
  const issues: string[] = [];

  const duplicateReferences = findDuplicates(principleReferences);

  const referenceSet = new Set(principleReferences);
  const catalogSet = new Set(catalogIdentities);

  const missingDefinitions = [...catalogSet]
    .filter((identity) => !referenceSet.has(identity))
    .sort();
  const orphanReferences = [...referenceSet]
    .filter((reference) => !catalogSet.has(reference))
    .sort();
  const intersectionCount = [...referenceSet].filter((reference) =>
    catalogSet.has(reference),
  ).length;

  if (duplicateReferences.length > 0) {
    issues.push(
      `definitions contain duplicate principle references: ${duplicateReferences.join(", ")}`,
    );
  }
  for (const reference of orphanReferences) {
    issues.push(`orphan reference: "${reference}" has no catalog identity`);
  }
  for (const identity of missingDefinitions) {
    issues.push(`missing definition: catalog identity "${identity}" has no definition`);
  }

  return {
    valid: issues.length === 0,
    catalogUniqueCount: catalogSet.size,
    definitionUniqueCount: referenceSet.size,
    definitionTotalCount: principleReferences.length,
    intersectionCount,
    missingDefinitions,
    orphanReferences,
    duplicateReferences,
    issues,
  };
}

/**
 * Build-time entry point: cross-validates the real definition `principle` references
 * against the real catalog identities, both from the derived artifacts.
 */
export function validateFormulaDefinitionsAgainstCatalog(): CrossContentResult {
  return crossValidateFormulaDefinitions(
    formulaDefinitionsData.map((entry) => entry.principle),
    formulaDefinitionCatalogData,
  );
}
