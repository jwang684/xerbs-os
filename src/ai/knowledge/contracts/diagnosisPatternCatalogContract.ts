/**
 * Structural validation contract for `diagnosisPatternCatalog`.
 *
 * Diagnosis Pattern Catalog Wiring Sprint · Step 3 (Contract).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP BOUNDARY — Structure ownership only.
 *
 * This contract owns ONLY structure validation. It does NOT own: clinical
 * correctness, naming quality, canonicalization policy, editorial review, pattern
 * meaning, recommendations, treatment guidance, pattern relationships, mappings, or
 * the future `diagnosisPatternDefinitions` content. It must not judge whether a
 * diagnosis pattern is medically correct, appropriately named, complete, canonical,
 * or clinically useful — only whether the slice is structurally well-formed.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The authoritative structural check for one slice — the value produced by
 * {@link diagnosisPatternCatalogSource}. Per the frozen Validation Model and the
 * Specification (`docs/architecture/44` §C entry model) it validates STRUCTURE ONLY,
 * in isolation, and returns the validated value unchanged or the reasons it is
 * invalid. Deterministic and side-effect-free; no repair.
 *
 * This module is not yet referenced by the registry; wiring is a later step.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/**
 * Validates the structure of a `diagnosisPatternCatalog` slice:
 * DPCC-1 array; DPCC-2 every entry is a string; DPCC-3 every string is non-empty
 * after trim; DPCC-4 no duplicate identities (exact string equality, no
 * normalization/case-folding); DPCC-5 deterministic and side-effect-free. Structure
 * only.
 */
export const diagnosisPatternCatalogContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // DPCC-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seen = new Set<string>();

  raw.forEach((entry, index) => {
    // DPCC-2: every entry must be a string.
    if (typeof entry !== "string") {
      issues.push(`entry ${index}: not a string`);
      return;
    }
    // DPCC-3: non-empty after trim (checked, not modified).
    if (entry.trim().length === 0) {
      issues.push(`entry ${index}: canonical name must be a non-empty string`);
      return;
    }
    // DPCC-4: no duplicate identities (exact string equality; no case-folding).
    if (seen.has(entry)) {
      issues.push(`entry ${index}: duplicate canonical name "${entry}"`);
    }
    seen.add(entry);
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // DPCC-5 / passthrough: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
