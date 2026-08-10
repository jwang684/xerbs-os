/**
 * Cross-content validation for `diagnosisPatternDefinitions` → `diagnosisPatternCatalog`.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 4A. This is Validation Layer 3
 * (cross-content) — a BUILD-TIME check of referential integrity and parity between the
 * diagnosis-tier meaning layer (definition `pattern` references) and the diagnosis-tier
 * identity root (catalog identities). It verifies the *relationship* between two slices.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Cross-content ownership only.
 *
 * Definition Neutrality Audit (Doc 49) and Context Independence Audit (Doc 50) remain
 * editorial review gates and are intentionally NOT enforced here.
 *
 * Structural validation belongs to `diagnosisPatternDefinitionsContract`.
 *
 * This validator owns only `diagnosisPatternDefinitions → diagnosisPatternCatalog`
 * reference integrity. It does NOT own: structure/field validation, Definition Neutrality,
 * Context Independence, clinical correctness, editorial quality, recommendations, diagnosis
 * guidance, or mappings.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Data sources (authoritative derived artifacts; no second source of truth; no authored
 * markdown, no runtime bundle): the derived `diagnosisPatternDefinitionsData` patterns and
 * the derived `diagnosisPatternCatalogData` identities. Output is deterministic,
 * machine-consumable, side-effect-free, reports ALL issues (no fail-fast), and never throws
 * for ordinary validation failures.
 */

import { diagnosisPatternCatalogData } from "../content/generated/diagnosis-pattern-catalog.generated";
import { diagnosisPatternDefinitionsData } from "../content/generated/diagnosis-pattern-definitions.generated";

/** Deterministic, machine-consumable cross-content result. All arrays are sorted. */
export interface CrossContentResult {
  readonly valid: boolean;
  readonly catalogUniqueCount: number;
  readonly uniqueReferenceCount: number;
  readonly totalReferenceCount: number;
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
 * Compares definition `pattern` references against catalog identities and reports
 * referential integrity and parity. Pure: no I/O, no mutation of inputs, never throws.
 *
 * Checks: orphan references (a `pattern` absent from the catalog); missing definitions (a
 * catalog identity with no definition — coverage/parity, per the Formula Definitions
 * precedent); duplicate references.
 */
export function crossValidateDiagnosisPatternDefinitions(
  patternReferences: readonly string[],
  catalogIdentities: readonly string[],
): CrossContentResult {
  const issues: string[] = [];

  const duplicateReferences = findDuplicates(patternReferences);

  const referenceSet = new Set(patternReferences);
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
      `definitions contain duplicate pattern references: ${duplicateReferences.join(", ")}`,
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
    uniqueReferenceCount: referenceSet.size,
    totalReferenceCount: patternReferences.length,
    intersectionCount,
    missingDefinitions,
    orphanReferences,
    duplicateReferences,
    issues,
  };
}

/**
 * Build-time entry point: cross-validates the real definition `pattern` references against
 * the real catalog identities, both from the derived artifacts.
 */
export function validateDiagnosisPatternDefinitionsAgainstCatalog(): CrossContentResult {
  return crossValidateDiagnosisPatternDefinitions(
    diagnosisPatternDefinitionsData.map((entry) => entry.pattern),
    diagnosisPatternCatalogData,
  );
}
