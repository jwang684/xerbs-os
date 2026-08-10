/**
 * Structural validation contract for `treatmentFormulaMap`.
 *
 * Treatment Formula Map Wiring Sprint · Step 3 (Contract).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Structure validation only.
 *
 * This contract owns: structural validation, exact-shape validation, duplicate-PAIR
 * detection, and deterministic passthrough. Per the Validation Layer Review
 * (`docs/architecture/55`) and the Treatment Formula Map spec (`58`):
 *  - Referential integrity (principle ∈ formulaDefinitionCatalog, formula ∈ formulaCatalog),
 *    orphan detection, catalog existence, coverage, and parity belong to the future dual
 *    CROSS-CONTENT validator, not here.
 *  - Many-to-many cardinality is DOCUMENTED but NOT enforced (only duplicate whole-pairs are
 *    rejected, which does not restrict cardinality).
 *  - Recommendation, ranking, confidence, rationale, treatment/formula selection, prescription
 *    generation, and runtime reasoning are outside the contract (reasoning → PrescriptionModule).
 *
 * This contract knows NOTHING about `formulaDefinitionCatalog` or `formulaCatalog`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The authoritative structural check for the value produced by
 * {@link treatmentFormulaMapSource}. It validates STRUCTURE ONLY, in isolation, and returns
 * the validated value unchanged or the reasons it is invalid. Deterministic and
 * side-effect-free; no repair. This module is registered in the production registry as the
 * interface's structural contract.
 *
 * Note: the exact-two-fields rule (TFMC-3) is the structural guard against metadata drift —
 * any entry bearing a field beyond {principle, formula} is rejected, so no weight, confidence,
 * ranking, or rationale can attach to an association.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/** The two fields a Treatment Formula Map entry may carry — exactly these. */
const EXPECTED_KEYS = ["formula", "principle"] as const;

function hasExactlyExpectedKeys(entry: object): boolean {
  const keys = Object.keys(entry).sort();
  return (
    keys.length === EXPECTED_KEYS.length &&
    keys[0] === EXPECTED_KEYS[0] &&
    keys[1] === EXPECTED_KEYS[1]
  );
}

/**
 * Validates the structure of a `treatmentFormulaMap` slice:
 * TFMC-1 array; TFMC-2 each entry an object; TFMC-3 exactly {principle, formula}; TFMC-4
 * principle non-empty string; TFMC-5 formula non-empty string; TFMC-6 no duplicate
 * (principle, formula) pair (exact string equality, no normalization/trimming/case-folding);
 * TFMC-7 deterministic; TFMC-8 passthrough (no repair). Structure only.
 */
export const treatmentFormulaMapContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // TFMC-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seenPairs = new Set<string>();

  raw.forEach((entry, index) => {
    // TFMC-2: each entry must be a (non-array) object.
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push(`entry ${index}: not an object`);
      return;
    }

    // TFMC-3: exactly the two expected fields — no missing, no extra.
    if (!hasExactlyExpectedKeys(entry)) {
      issues.push(
        `entry ${index}: expected exactly {principle, formula}, got {${Object.keys(entry).join(", ")}}`,
      );
    }

    const record = entry as Record<string, unknown>;
    const { principle, formula } = record;

    // TFMC-4 / TFMC-5: both fields non-empty strings.
    const principleOk =
      typeof principle === "string" && principle.trim().length > 0;
    const formulaOk = typeof formula === "string" && formula.trim().length > 0;
    if (!principleOk) {
      issues.push(`entry ${index}: principle must be a non-empty string`);
    }
    if (!formulaOk) {
      issues.push(`entry ${index}: formula must be a non-empty string`);
    }

    // TFMC-6: no duplicate (principle, formula) pair (exact equality) — only when both sides
    // are valid strings, so the pair key is well-defined.
    if (principleOk && formulaOk) {
      const key = `${JSON.stringify(principle)} ${JSON.stringify(formula)}`;
      if (seenPairs.has(key)) {
        issues.push(
          `entry ${index}: duplicate association (${JSON.stringify(principle)} → ${JSON.stringify(formula)})`,
        );
      }
      seenPairs.add(key);
    }
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // TFMC-8 / passthrough: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
