/**
 * Cross-content validation for `treatmentFormulaMap` (dual, two-sided).
 *
 * Treatment Formula Map Wiring Sprint · Step 4A. This is Validation Layer 3 (cross-content)
 * — a BUILD-TIME check of referential integrity between the relationship layer and the two
 * identity roots it bridges. It mirrors the dual (two-sided) strategy established by
 * `patternTreatmentMapCrossContent`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Cross-content reference integrity only.
 *
 * This validator owns ONLY these two reference-resolution checks:
 *   - treatmentFormulaMap.principle → formulaDefinitionCatalog
 *   - treatmentFormulaMap.formula   → formulaCatalog
 *
 * Structural validation belongs exclusively to `treatmentFormulaMapContract`.
 *
 * This validator does NOT own: structural validation, duplicate-pair rejection, cardinality,
 * many-to-many enforcement, recommendation detection, ranking detection, confidence detection,
 * rationale detection, formula selection, prescription generation, or runtime reasoning.
 *
 * Coverage reporting is informational only and NEVER fails validation (no parity requirement,
 * no minimum threshold). `duplicateReferences` is likewise informational only — duplicate-pair
 * REJECTION is owned by the contract, not here; this validator merely surfaces duplicates for
 * visibility and never lets them affect `valid`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Data sources (authoritative derived artifacts; no authored markdown, no runtime bundle, no
 * registry lookups): the derived `treatmentFormulaMapData` associations, the derived
 * `formulaDefinitionCatalogData` principle identities, and the derived `formulaCatalogData`
 * formula identities. Output is deterministic, sorted, side-effect-free, reports ALL issues (no
 * fail-fast), and never throws for ordinary validation failures.
 */

import { formulaCatalogData } from "../content/generated/formula-catalog.generated";
import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import { treatmentFormulaMapData } from "../content/generated/treatment-formula-map.generated";

/** One association under validation. */
export interface TreatmentFormulaAssociationRef {
  readonly principle: string;
  readonly formula: string;
}

/**
 * Deterministic, machine-consumable dual cross-content result. All arrays are sorted.
 *
 * Coverage fields are informational (`*CoverageReferenced` = distinct referenced identities on
 * that side; `*CoverageCatalog` = identities in that catalog). `intersectionCount` is the count
 * of associations whose BOTH sides resolve into their catalogs (informational). None of these
 * affect `valid`.
 */
export interface CrossContentResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly orphanPrinciples: readonly string[];
  readonly orphanFormulas: readonly string[];
  readonly duplicateReferences: readonly string[];
  readonly intersectionCount: number;
  readonly principleCoverageReferenced: number;
  readonly principleCoverageCatalog: number;
  readonly formulaCoverageReferenced: number;
  readonly formulaCoverageCatalog: number;
}

/**
 * Compares the association set's two reference sides against the two identity catalogs and
 * reports referential integrity plus informational coverage. Pure: no I/O, no mutation of
 * inputs, never throws.
 *
 * `valid` is true iff there are no orphan principles and no orphan formulas. Coverage counts,
 * `intersectionCount`, and `duplicateReferences` are informational and never affect `valid`.
 */
export function crossValidateTreatmentFormulaMap(
  associations: readonly TreatmentFormulaAssociationRef[],
  principleIdentities: readonly string[],
  formulaIdentities: readonly string[],
): CrossContentResult {
  const distinctPrinciples = new Set(associations.map((a) => a.principle));
  const distinctFormulas = new Set(associations.map((a) => a.formula));

  const principleCatalog = new Set(principleIdentities);
  const formulaCatalog = new Set(formulaIdentities);

  const orphanPrinciples = [...distinctPrinciples]
    .filter((p) => !principleCatalog.has(p))
    .sort();
  const orphanFormulas = [...distinctFormulas]
    .filter((f) => !formulaCatalog.has(f))
    .sort();

  // Informational coverage: how many catalog identities are actually referenced.
  const principleCoverageReferenced = [...principleCatalog].filter((p) =>
    distinctPrinciples.has(p),
  ).length;
  const formulaCoverageReferenced = [...formulaCatalog].filter((f) =>
    distinctFormulas.has(f),
  ).length;

  // Informational: associations whose BOTH sides resolve into their catalogs.
  const intersectionCount = associations.filter(
    (a) => principleCatalog.has(a.principle) && formulaCatalog.has(a.formula),
  ).length;

  // Informational: duplicate (principle, formula) whole-pairs surfaced (rejection is the
  // contract's job; here they are reported for visibility only).
  const seen = new Set<string>();
  const dupSet = new Set<string>();
  for (const a of associations) {
    const key = `${JSON.stringify(a.principle)} → ${JSON.stringify(a.formula)}`;
    if (seen.has(key)) {
      dupSet.add(key);
    }
    seen.add(key);
  }
  const duplicateReferences = [...dupSet].sort();

  const issues: string[] = [];
  for (const p of orphanPrinciples) {
    issues.push(
      `orphan principle: "${p}" has no formulaDefinitionCatalog identity`,
    );
  }
  for (const f of orphanFormulas) {
    issues.push(`orphan formula: "${f}" has no formulaCatalog identity`);
  }

  return {
    valid: issues.length === 0,
    issues,
    orphanPrinciples,
    orphanFormulas,
    duplicateReferences,
    intersectionCount,
    principleCoverageReferenced,
    principleCoverageCatalog: principleCatalog.size,
    formulaCoverageReferenced,
    formulaCoverageCatalog: formulaCatalog.size,
  };
}

/**
 * Build-time entry point: dual cross-validates the real associations against the real principle
 * (formulaDefinitionCatalog) and formula (formulaCatalog) identity catalogs, all from the
 * derived artifacts.
 */
export function validateTreatmentFormulaMapAgainstCatalogs(): CrossContentResult {
  return crossValidateTreatmentFormulaMap(
    treatmentFormulaMapData,
    formulaDefinitionCatalogData,
    formulaCatalogData,
  );
}
