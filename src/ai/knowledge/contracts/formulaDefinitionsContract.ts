/**
 * Structural validation contract for `formulaDefinitions`.
 *
 * Formula Definitions Wiring Sprint · Step 3 (Contract).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Structure ownership only.
 *
 * Definition Neutrality Audit (Doc 41) and Context Independence Audit (Doc 42) are
 * editorial review gates and are intentionally NOT enforced here. They are separate
 * review layers, not structural validation rules — so a definition may pass this
 * structural contract while still failing an editorial review gate. That separation
 * is intentional and required: it preserves the independent authority of Docs 41/42
 * and prevents editorial review from being folded into structural validation.
 *
 * This contract owns ONLY: array validation, object-shape validation, required
 * fields, string validation, uniqueness validation, and deterministic behavior.
 * It does NOT own: Definition Neutrality, Context Independence, clinical correctness,
 * editorial quality, writing style, therapeutic appropriateness, recommendation
 * detection, or mapping detection. No neutrality regexes, context-independence
 * heuristics, or indication/recommendation detection appear here by design.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The authoritative structural check for one slice — the value produced by
 * {@link formulaDefinitionsSource}. Per the frozen Validation Model and the
 * Specification (`docs/architecture/39` §C entry model) it validates STRUCTURE ONLY,
 * in isolation, and returns the validated value unchanged or the reasons it is
 * invalid. Deterministic and side-effect-free; no repair.
 *
 * Cross-content referential integrity (`formulaDefinitions.principle ∈
 * formulaDefinitionCatalog`) is a separate build-time layer (specified in Doc 41 §7),
 * not this contract. This module is registered in the production registry as the
 * interface's structural contract.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/** The two fields a Formula Definitions entry may carry — exactly these, nothing else. */
const EXPECTED_KEYS = ["definition", "principle"] as const;

function hasExactlyExpectedKeys(entry: object): boolean {
  const keys = Object.keys(entry).sort();
  return (
    keys.length === EXPECTED_KEYS.length &&
    keys[0] === EXPECTED_KEYS[0] &&
    keys[1] === EXPECTED_KEYS[1]
  );
}

/**
 * Validates the structure of a `formulaDefinitions` slice:
 * array; each entry has exactly {principle, definition}; principle is a non-empty
 * (trimmed) string; definition is a non-empty (trimmed) string; no duplicate
 * referenced principle within the slice. Structure only.
 */
export const formulaDefinitionsContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seenPrinciples = new Set<string>();

  raw.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push(`entry ${index}: not an object`);
      return;
    }

    // Exactly the two expected fields — no missing, no extra.
    if (!hasExactlyExpectedKeys(entry)) {
      issues.push(
        `entry ${index}: expected exactly {principle, definition}, got {${Object.keys(entry).join(", ")}}`,
      );
    }

    const record = entry as Record<string, unknown>;
    const { principle, definition } = record;

    // principle is a non-empty string; uniqueness checked on exact value.
    if (typeof principle !== "string" || principle.trim().length === 0) {
      issues.push(`entry ${index}: principle must be a non-empty string`);
    } else {
      if (seenPrinciples.has(principle)) {
        issues.push(`entry ${index}: duplicate principle "${principle}"`);
      }
      seenPrinciples.add(principle);
    }

    // definition is a non-empty string.
    if (typeof definition !== "string" || definition.trim().length === 0) {
      issues.push(`entry ${index}: definition must be a non-empty string`);
    }
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // No repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
