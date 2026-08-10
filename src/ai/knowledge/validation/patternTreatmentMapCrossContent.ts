/**
 * Cross-content validation for `patternTreatmentMap` (dual, two-sided).
 *
 * Pattern Treatment Map Wiring Sprint · Step 4A. This is Validation Layer 3 (cross-content)
 * — a BUILD-TIME check of referential integrity between the relationship layer and the two
 * identity roots it bridges. It is the first DUAL (two-sided) cross-content validator.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Cross-content ownership only.
 *
 * Structural validation belongs to `patternTreatmentMapContract`.
 *
 * This validator owns only:
 *   - patternTreatmentMap.pattern   → diagnosisPatternCatalog
 *   - patternTreatmentMap.principle → formulaDefinitionCatalog
 * reference integrity.
 *
 * Coverage reporting is informational only (never fails validation).
 * Many-to-many semantics are documented but not enforced.
 *
 * This validator does NOT own: recommendations, rankings, confidence, reasoning, treatment
 * selection, cardinality, duplicate-pair rejection, metadata validation, or editorial review.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Data sources (authoritative derived artifacts; no authored markdown, no runtime bundle):
 * the derived `patternTreatmentMapData` associations, the derived
 * `diagnosisPatternCatalogData` identities, and the derived `formulaDefinitionCatalogData`
 * identities. Output is deterministic, sorted, side-effect-free, reports ALL issues (no
 * fail-fast), and never throws for ordinary validation failures.
 */

import { diagnosisPatternCatalogData } from "../content/generated/diagnosis-pattern-catalog.generated";
import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import { patternTreatmentMapData } from "../content/generated/pattern-treatment-map.generated";

/** One association under validation. */
export interface PatternTreatmentAssociationRef {
  readonly pattern: string;
  readonly principle: string;
}

/** Deterministic, machine-consumable dual cross-content result. All arrays are sorted. */
export interface CrossContentResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly orphanPatterns: readonly string[];
  readonly orphanPrinciples: readonly string[];
  readonly distinctPatternCount: number;
  readonly distinctPrincipleCount: number;
  readonly catalogPatternCount: number;
  readonly catalogPrincipleCount: number;
  readonly patternCoverageCount: number;
  readonly principleCoverageCount: number;
}

/**
 * Compares the association set's two reference sides against the two identity catalogs and
 * reports referential integrity plus informational coverage. Pure: no I/O, no mutation of
 * inputs, never throws.
 *
 * `valid` is true iff there are no orphan patterns and no orphan principles. Coverage counts
 * are informational and never affect `valid`.
 */
export function crossValidatePatternTreatmentMap(
  associations: readonly PatternTreatmentAssociationRef[],
  patternIdentities: readonly string[],
  principleIdentities: readonly string[],
): CrossContentResult {
  const distinctPatterns = new Set(associations.map((a) => a.pattern));
  const distinctPrinciples = new Set(associations.map((a) => a.principle));

  const patternCatalog = new Set(patternIdentities);
  const principleCatalog = new Set(principleIdentities);

  const orphanPatterns = [...distinctPatterns]
    .filter((p) => !patternCatalog.has(p))
    .sort();
  const orphanPrinciples = [...distinctPrinciples]
    .filter((p) => !principleCatalog.has(p))
    .sort();

  const patternCoverageCount = [...patternCatalog].filter((p) =>
    distinctPatterns.has(p),
  ).length;
  const principleCoverageCount = [...principleCatalog].filter((p) =>
    distinctPrinciples.has(p),
  ).length;

  const issues: string[] = [];
  for (const p of orphanPatterns) {
    issues.push(`orphan pattern: "${p}" has no diagnosisPatternCatalog identity`);
  }
  for (const p of orphanPrinciples) {
    issues.push(`orphan principle: "${p}" has no formulaDefinitionCatalog identity`);
  }

  return {
    valid: issues.length === 0,
    issues,
    orphanPatterns,
    orphanPrinciples,
    distinctPatternCount: distinctPatterns.size,
    distinctPrincipleCount: distinctPrinciples.size,
    catalogPatternCount: patternCatalog.size,
    catalogPrincipleCount: principleCatalog.size,
    patternCoverageCount,
    principleCoverageCount,
  };
}

/**
 * Build-time entry point: dual cross-validates the real associations against the real pattern
 * and principle identity catalogs, all from the derived artifacts.
 */
export function validatePatternTreatmentMapAgainstCatalogs(): CrossContentResult {
  return crossValidatePatternTreatmentMap(
    patternTreatmentMapData,
    diagnosisPatternCatalogData,
    formulaDefinitionCatalogData,
  );
}
