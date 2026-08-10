/**
 * Cross-content validation for `prescriptionFormulaDefinitions` → `formulaCatalog`.
 *
 * Wiring Sprint · Step 4. This is Validation Layer 3 (cross-content) from the frozen
 * Validation Model (`docs/architecture/19` §6, `23` §7): a BUILD-TIME check of
 * referential integrity and parity between the completed meaning layer (definition
 * references) and the completed identity layer (catalog identities). It verifies the
 * *relationship* between two slices — nothing about the structure, meaning, or
 * runtime of either.
 *
 * Layer boundaries (do not merge layers):
 *  - Structure validation belongs to the KnowledgeContract (Step 3), not here (N-1).
 *  - Meaning/clinical correctness is human review, never here (N-2).
 *  - No loader/registry interaction; this is not a runtime path (N-3).
 *  - No repair — no dedupe, rewrite, fix, or normalization; validation only (N-4).
 *
 * Data sources (authoritative only; no second source of truth is created):
 *  - Definition references: the generated derivation artifact
 *    (`prescription-formula-definitions.generated.ts`), field `formula`.
 *  - Catalog identities: parsed from the authoritative `formula-catalog.md` at
 *    build/check time. Identities are read, never copied into code or regenerated.
 *
 * Output is deterministic, machine-consumable, side-effect-free, reports ALL issues
 * (no fail-fast), and never throws for ordinary validation failures.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { prescriptionFormulaDefinitionsData } from "../content/generated/prescription-formula-definitions.generated";

/** Deterministic, machine-consumable cross-content result. All arrays are sorted. */
export interface CrossContentResult {
  readonly valid: boolean;
  readonly catalogUniqueCount: number;
  readonly definitionUniqueCount: number;
  readonly catalogTotalCount: number;
  readonly definitionTotalCount: number;
  readonly intersectionCount: number;
  readonly missingDefinitions: readonly string[];
  readonly orphanReferences: readonly string[];
  readonly duplicateCatalogIdentities: readonly string[];
  readonly duplicateDefinitionReferences: readonly string[];
  readonly issues: readonly string[];
}

/** Matches one authoritative catalog identity line: `- <Canonical Name>`. */
const CATALOG_ENTRY_PATTERN = /^-\s+(\S.*?)\s*$/;

/**
 * Parses canonical identities from the authoritative catalog markdown. Reads the
 * single source of truth; it does not create or normalize a second one.
 */
export function parseFormulaCatalogIdentities(markdown: string): string[] {
  const identities: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = CATALOG_ENTRY_PATTERN.exec(line);
    if (match === null) continue;
    identities.push(match[1].trim());
  }
  return identities;
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
 * Compares definition references against catalog identities and reports referential
 * integrity and parity. Pure: no I/O, no mutation of inputs, never throws.
 *
 * Checks: CC-1/CC-2 orphan references (definition reference absent from catalog);
 * CC-3 missing definitions (catalog identity with no definition); CC-4 bidirectional
 * parity (equal sets, i.e. no orphans and no missing); CC-5 unique-count consistency;
 * CC-6 duplicate protection on both sides.
 */
export function crossValidatePrescriptionFormulaDefinitions(
  definitionReferences: readonly string[],
  catalogIdentities: readonly string[],
): CrossContentResult {
  const issues: string[] = [];

  const duplicateDefinitionReferences = findDuplicates(definitionReferences);
  const duplicateCatalogIdentities = findDuplicates(catalogIdentities);

  const definitionSet = new Set(definitionReferences);
  const catalogSet = new Set(catalogIdentities);

  const missingDefinitions = [...catalogSet]
    .filter((identity) => !definitionSet.has(identity))
    .sort();
  const orphanReferences = [...definitionSet]
    .filter((reference) => !catalogSet.has(reference))
    .sort();
  const intersectionCount = [...definitionSet].filter((reference) =>
    catalogSet.has(reference),
  ).length;

  // CC-6: duplicate protection (both sides).
  if (duplicateCatalogIdentities.length > 0) {
    issues.push(
      `catalog contains duplicate identities: ${duplicateCatalogIdentities.join(", ")}`,
    );
  }
  if (duplicateDefinitionReferences.length > 0) {
    issues.push(
      `definitions contain duplicate references: ${duplicateDefinitionReferences.join(", ")}`,
    );
  }
  // CC-1/CC-2: every orphan reported.
  for (const reference of orphanReferences) {
    issues.push(`orphan reference: "${reference}" has no catalog identity`);
  }
  // CC-3: every missing definition reported.
  for (const identity of missingDefinitions) {
    issues.push(`missing definition: catalog identity "${identity}" has no definition`);
  }
  // CC-5: unique-count consistency.
  if (catalogSet.size !== definitionSet.size) {
    issues.push(
      `count mismatch: ${catalogSet.size} unique catalog identities vs ${definitionSet.size} unique definition references`,
    );
  }

  // CC-4: bidirectional parity holds exactly when nothing above is wrong.
  const valid = issues.length === 0;

  return {
    valid,
    catalogUniqueCount: catalogSet.size,
    definitionUniqueCount: definitionSet.size,
    catalogTotalCount: catalogIdentities.length,
    definitionTotalCount: definitionReferences.length,
    intersectionCount,
    missingDefinitions,
    orphanReferences,
    duplicateCatalogIdentities,
    duplicateDefinitionReferences,
    issues,
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(here, "../content/formula-catalog.md");

/** Loads catalog identities from the authoritative markdown (build-time only). */
export function loadFormulaCatalogIdentities(): string[] {
  return parseFormulaCatalogIdentities(readFileSync(CATALOG_PATH, "utf8"));
}

/**
 * Build-time entry point: cross-validates the real definition references against the
 * real catalog identities from the authoritative corpora.
 */
export function validatePrescriptionFormulaDefinitionsAgainstCatalog(): CrossContentResult {
  const definitionReferences = prescriptionFormulaDefinitionsData.map(
    (entry) => entry.formula,
  );
  return crossValidatePrescriptionFormulaDefinitions(
    definitionReferences,
    loadFormulaCatalogIdentities(),
  );
}
