/**
 * Structural validation contract for `formulaCatalog`.
 *
 * Formula Catalog Wiring Sprint · Step 3 (Contract). The authoritative structural
 * check for one slice — the value produced by {@link formulaCatalogSource}. Per the
 * frozen Validation Model (`docs/architecture/26` §B.3, §C) it validates STRUCTURE
 * ONLY, in isolation, and returns the validated value unchanged or the reasons it is
 * invalid. It is deterministic and side-effect-free.
 *
 * It does NOT (Wiring Specification §B.3; Step-3 non-responsibilities):
 *  - validate editorial conventions (Title Case, capitalization, punctuation, tone
 *    marks, spacing);
 *  - validate meaning (TCM correctness, semantics, clinical interpretation, quality);
 *  - check referential integrity or parity against definitions or any other corpus
 *    (cross-content is a separate layer);
 *  - repair — no trim, rewrite, normalize, dedupe, sort, or mutate.
 * On success it returns `value: raw` — the input, untouched.
 *
 * This module is registered in the production registry as the interface's structural contract.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/**
 * Validates the structure of a `formulaCatalog` slice:
 * FCV-1 array; FCV-2 every entry is a string; FCV-3 every string is non-empty after
 * trim; FCV-4 no duplicate names (exact string equality); FCV-5 deterministic and
 * side-effect-free. Structure only.
 */
export const formulaCatalogContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // FCV-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seen = new Set<string>();

  raw.forEach((entry, index) => {
    // FCV-2: every entry must be a string.
    if (typeof entry !== "string") {
      issues.push(`entry ${index}: not a string`);
      return;
    }
    // FCV-3: non-empty after trim (checked, not modified).
    if (entry.trim().length === 0) {
      issues.push(`entry ${index}: canonical name must be a non-empty string`);
      return;
    }
    // FCV-4: no duplicate names (exact string equality).
    if (seen.has(entry)) {
      issues.push(`entry ${index}: duplicate canonical name "${entry}"`);
    }
    seen.add(entry);
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // FCV-5 / N-4: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
