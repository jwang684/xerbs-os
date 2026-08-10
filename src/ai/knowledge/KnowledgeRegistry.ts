/**
 * Knowledge registry (the architectural center of the production loader).
 *
 * Implements the frozen Production Knowledge Loader Specification
 * (`docs/architecture/12-production-knowledge-loader.md`): the registry is the
 * single source of truth mapping each OPAQUE identifier to its source and its
 * validation contract. This module defines the registry *mechanism* — the entry
 * shape and the registry-validation rule — and is completely domain-agnostic: it
 * contains no clinical vocabulary and no identifier-specific behaviour. The actual
 * inventory of entries is Knowledge-Layer content, supplied separately.
 */

/**
 * Produces the raw content for one knowledge slice. Opaque to the loader — it may
 * read a file, a database, memory, or anything else; the loader only calls it.
 */
export type KnowledgeSource = () => unknown | Promise<unknown>;

/** The outcome of validating a slice's raw content against its contract. */
export type KnowledgeValidation =
  | { readonly valid: true; readonly value: unknown }
  | { readonly valid: false; readonly issues: readonly string[] };

/**
 * The authoritative structural contract for one slice: given raw content, it
 * returns the validated value or the reasons it is invalid. Structure only — never
 * clinical correctness.
 */
export type KnowledgeContract = (raw: unknown) => KnowledgeValidation;

/**
 * One registry entry: an opaque identifier bound to exactly one source and one
 * validation contract. The identifier's meaning is a Knowledge-Layer concern; here
 * it is just a string.
 */
export interface KnowledgeRegistryEntry {
  readonly identifier: string;
  readonly source: KnowledgeSource;
  readonly contract: KnowledgeContract;
}

/** Thrown when the registry is internally inconsistent (fails at initialization). */
export class KnowledgeRegistryError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid knowledge registry: ${issues.join("; ")}`);
    this.name = "KnowledgeRegistryError";
  }
}

/**
 * Registry Validation Rule (§5a). Validates the inventory's internal consistency
 * BEFORE any knowledge may be served, and returns an immutable identifier→entry
 * map. This is registry validation (structural integrity of the inventory), never
 * clinical validation.
 *
 * Verifies that every entry has a non-empty identifier, a source, and a contract;
 * that no identifier is duplicated; and that each identifier resolves to exactly
 * one entry (unique ownership). Any violation throws a {@link KnowledgeRegistryError}
 * — a registry error fails at initialization rather than degrading. Entries are
 * frozen and the returned map is typed read-only so the registry is immutable for
 * the lifetime of the loader.
 */
export function validateRegistry(
  entries: readonly KnowledgeRegistryEntry[],
): ReadonlyMap<string, KnowledgeRegistryEntry> {
  const map = new Map<string, KnowledgeRegistryEntry>();
  const issues: string[] = [];

  for (const entry of entries) {
    const id = entry.identifier;
    if (typeof id !== "string" || id.trim().length === 0) {
      issues.push("registry entry has an empty identifier");
      continue;
    }
    if (typeof entry.source !== "function") {
      issues.push(`registry entry "${id}" has no source`);
    }
    if (typeof entry.contract !== "function") {
      issues.push(`registry entry "${id}" has no validation contract`);
    }
    if (map.has(id)) {
      // Duplicate identifier → ownership is not unique.
      issues.push(`duplicate registry identifier: "${id}"`);
      continue;
    }
    map.set(id, Object.freeze(entry));
  }

  if (issues.length > 0) {
    throw new KnowledgeRegistryError(issues);
  }
  return map;
}
