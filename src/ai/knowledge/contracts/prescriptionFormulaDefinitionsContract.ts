/**
 * Structural validation contract for `prescriptionFormulaDefinitions`.
 *
 * Wiring Sprint · Step 3 (Contract). The authoritative structural check for one
 * slice — the value produced by {@link prescriptionFormulaDefinitionsSource}. Per
 * the frozen Validation Model (`docs/architecture/19` §6, `23` §5) it validates
 * STRUCTURE ONLY, in isolation, and returns the validated value unchanged or the
 * reasons it is invalid. It is deterministic and side-effect-free.
 *
 * It does NOT (Wiring Specification §5, C-1..C-6; Step-3 non-responsibilities):
 *  - judge clinical correctness, meaning, TCM theory, wording, or prompt suitability;
 *  - look up `formulaCatalog` or check parity (cross-content, a build-time step);
 *  - repair, deduplicate, normalize, trim-and-rewrite, sort, or transform data.
 * On success it returns `value: raw` — the input, untouched.
 *
 * This module is not yet referenced by the registry; wiring is a later step.
 */

import type {
  KnowledgeContract,
  KnowledgeValidation,
} from "../KnowledgeRegistry";

/** The two fields a Definition entry may carry — exactly these, nothing else. */
const EXPECTED_KEYS = ["definition", "formula"] as const;

function hasExactlyExpectedKeys(entry: object): boolean {
  const keys = Object.keys(entry).sort();
  return (
    keys.length === EXPECTED_KEYS.length &&
    keys[0] === EXPECTED_KEYS[0] &&
    keys[1] === EXPECTED_KEYS[1]
  );
}

/**
 * Validates the structure of a `prescriptionFormulaDefinitions` slice:
 * CV-1 array; CV-2 each entry has exactly {formula, definition}; CV-3 formula is a
 * non-empty (trimmed) string; CV-4 definition is a non-empty (trimmed) string;
 * CV-5 no duplicate formula references. Structure only.
 */
export const prescriptionFormulaDefinitionsContract: KnowledgeContract = (
  raw,
): KnowledgeValidation => {
  // CV-1: the slice must be an array.
  if (!Array.isArray(raw)) {
    return { valid: false, issues: ["value is not an array"] };
  }

  const issues: string[] = [];
  const seenFormulas = new Set<string>();

  raw.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push(`entry ${index}: not an object`);
      return;
    }

    // CV-2: exactly the two expected fields — no missing, no extra.
    if (!hasExactlyExpectedKeys(entry)) {
      issues.push(
        `entry ${index}: expected exactly {formula, definition}, got {${Object.keys(entry).join(", ")}}`,
      );
    }

    const record = entry as Record<string, unknown>;
    const { formula, definition } = record;

    // CV-3: formula is a non-empty string (checked after trim; not modified).
    if (typeof formula !== "string" || formula.trim().length === 0) {
      issues.push(`entry ${index}: formula must be a non-empty string`);
    } else {
      // CV-5: no duplicate formula references (exact value comparison).
      if (seenFormulas.has(formula)) {
        issues.push(`entry ${index}: duplicate formula reference "${formula}"`);
      }
      seenFormulas.add(formula);
    }

    // CV-4: definition is a non-empty string (checked after trim; not modified).
    if (typeof definition !== "string" || definition.trim().length === 0) {
      issues.push(`entry ${index}: definition must be a non-empty string`);
    }
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  // N-4: no repair — return the validated value exactly as received.
  return { valid: true, value: raw };
};
