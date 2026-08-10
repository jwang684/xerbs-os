/**
 * Structural validation contract for `formulaDefinitionCatalog`.
 *
 * Formula Definition Catalog Wiring Sprint · Step 3 (Contract). The authoritative
 * structural check for one slice — the value produced by
 * {@link formulaDefinitionCatalogSource}. Per the frozen Validation Model and the
 * Formula Definition Catalog Specification (`docs/architecture/35` §G) it validates
 * STRUCTURE ONLY, in isolation, and returns the validated value unchanged or the
 * reasons it is invalid. It is deterministic and side-effect-free.
 *
 * It does NOT: repair, normalize, trim values, deduplicate, sort, rewrite names,
 * enforce Title Case, enforce English wording, validate TCM correctness or editorial
 * quality, or compare against any other corpus. Those are not structural facts — they
 * belong to editorial review or other/future validation layers. On success it returns
 * `value: raw` — the input, untouched.
 *
 * This module is not yet referenced by the registry; wiring is a later step.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/**
 * Validates the structure of a `formulaDefinitionCatalog` slice:
 * FDCC-1 array; FDCC-2 every entry is a string; FDCC-3 every string is non-empty
 * after trim; FDCC-4 no duplicate identities (exact string equality); FDCC-5
 * deterministic and side-effect-free. Structure only.
 */
export const formulaDefinitionCatalogContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // FDCC-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seen = new Set<string>();

  raw.forEach((entry, index) => {
    // FDCC-2: every entry must be a string.
    if (typeof entry !== "string") {
      issues.push(`entry ${index}: not a string`);
      return;
    }
    // FDCC-3: non-empty after trim (checked, not modified).
    if (entry.trim().length === 0) {
      issues.push(`entry ${index}: canonical name must be a non-empty string`);
      return;
    }
    // FDCC-4: no duplicate identities (exact string equality).
    if (seen.has(entry)) {
      issues.push(`entry ${index}: duplicate canonical name "${entry}"`);
    }
    seen.add(entry);
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // FDCC-5 / passthrough: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
