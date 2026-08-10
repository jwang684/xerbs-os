/**
 * Structural validation contract for `diagnosisPatternDefinitions`.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 3 (Contract).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Structure ownership only.
 *
 * Definition Neutrality Audit (Doc 49) and Context Independence Audit (Doc 50) are
 * editorial review gates and are intentionally NOT enforced here. Editorial review and
 * structural validation are separate layers — a definition may pass this contract while
 * still failing an editorial review gate. That separation is intentional and required; it
 * preserves the ownership boundary established in the Formula Definitions sprint.
 *
 * This contract owns ONLY: structure validation, required fields, string validation,
 * duplicate detection, and deterministic behavior. It does NOT own: Definition Neutrality,
 * Context Independence, clinical correctness, editorial quality, treatment appropriateness,
 * recommendations, diagnosis guidance, symptom logic, pattern-treatment mappings, or
 * catalog-reference (cross-content) validation.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The authoritative structural check for one slice — the value produced by
 * {@link diagnosisPatternDefinitionsSource}. Per the frozen Specification
 * (`docs/architecture/47` §C entry model) it validates STRUCTURE ONLY, in isolation, and
 * returns the validated value unchanged or the reasons it is invalid. Deterministic and
 * side-effect-free; no repair.
 *
 * Cross-content referential integrity (`diagnosisPatternDefinitions.pattern ∈
 * diagnosisPatternCatalog`) is a separate build-time layer, not this contract. This module
 * is not yet referenced by the registry; wiring is a later step.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/** The two fields a Diagnosis Pattern Definitions entry may carry — exactly these. */
const EXPECTED_KEYS = ["definition", "pattern"] as const;

function hasExactlyExpectedKeys(entry: object): boolean {
  const keys = Object.keys(entry).sort();
  return (
    keys.length === EXPECTED_KEYS.length &&
    keys[0] === EXPECTED_KEYS[0] &&
    keys[1] === EXPECTED_KEYS[1]
  );
}

/**
 * Validates the structure of a `diagnosisPatternDefinitions` slice:
 * array; each entry has exactly {pattern, definition}; pattern is a non-empty (trimmed)
 * string; definition is a non-empty (trimmed) string; no duplicate referenced pattern
 * within the slice (exact string equality, no normalization/case-folding). Structure only.
 */
export const diagnosisPatternDefinitionsContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seenPatterns = new Set<string>();

  raw.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push(`entry ${index}: not an object`);
      return;
    }

    // Exactly the two expected fields — no missing, no extra.
    if (!hasExactlyExpectedKeys(entry)) {
      issues.push(
        `entry ${index}: expected exactly {pattern, definition}, got {${Object.keys(entry).join(", ")}}`,
      );
    }

    const record = entry as Record<string, unknown>;
    const { pattern, definition } = record;

    // pattern is a non-empty string; uniqueness checked on exact value.
    if (typeof pattern !== "string" || pattern.trim().length === 0) {
      issues.push(`entry ${index}: pattern must be a non-empty string`);
    } else {
      if (seenPatterns.has(pattern)) {
        issues.push(`entry ${index}: duplicate pattern "${pattern}"`);
      }
      seenPatterns.add(pattern);
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
