/**
 * Structural validation contract for `herbCatalog`.
 *
 * Herb Catalog Wiring Sprint · Step 3 (Contract). The authoritative structural check
 * for one slice — the value produced by {@link herbCatalogSource}. Per the frozen
 * Validation Model and the Herb Catalog Content Specification (`docs/architecture/30`
 * §G) it validates STRUCTURE ONLY, in isolation, and returns the validated value
 * unchanged or the reasons it is invalid. It is deterministic and side-effect-free.
 *
 * It does NOT validate: pinyin correctness, Title Case, capitalization, tone marks,
 * editorial conventions, TCM correctness, herb meaning/properties/definitions, future
 * formula composition or herb mappings, or parity against any other corpus. Those are
 * not structural facts — they belong to editorial review or other/future validation
 * layers. On success it returns `value: raw` — the input, untouched.
 *
 * This module is registered in the production registry as the interface's structural contract.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/**
 * Validates the structure of a `herbCatalog` slice:
 * HCV-1 array; HCV-2 every entry is a string; HCV-3 every string is non-empty after
 * trim; HCV-4 no duplicate identities (exact string equality); HCV-5 deterministic
 * and side-effect-free. Structure only.
 */
export const herbCatalogContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // HCV-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seen = new Set<string>();

  raw.forEach((entry, index) => {
    // HCV-2: every entry must be a string.
    if (typeof entry !== "string") {
      issues.push(`entry ${index}: not a string`);
      return;
    }
    // HCV-3: non-empty after trim (checked, not modified).
    if (entry.trim().length === 0) {
      issues.push(`entry ${index}: canonical name must be a non-empty string`);
      return;
    }
    // HCV-4: no duplicate identities (exact string equality).
    if (seen.has(entry)) {
      issues.push(`entry ${index}: duplicate canonical name "${entry}"`);
    }
    seen.add(entry);
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // HCV-5 / passthrough: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
