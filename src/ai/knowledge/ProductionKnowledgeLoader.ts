import type { KnowledgeBundle, KnowledgeRequest } from "../types/Knowledge";
import type { KnowledgeLoader } from "./KnowledgeLoader";
import {
  type KnowledgeRegistryEntry,
  validateRegistry,
} from "./KnowledgeRegistry";

/**
 * Recursively freezes a value so served knowledge is immutable (spec §6). Enforces
 * the property, not a particular mechanism.
 */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

/** True when a selector asks for a slice to be loaded (`true`, or a non-empty narrowing list). */
function isRequested(selector: boolean | readonly string[] | undefined): boolean {
  if (selector === true) return true;
  if (Array.isArray(selector)) return selector.length > 0;
  return false;
}

/**
 * ProductionKnowledgeLoader — the first real supplier of curated knowledge, and a
 * drop-in {@link KnowledgeLoader} that lives entirely behind the frozen transport
 * seam (`load(request): Promise<KnowledgeBundle>`).
 *
 * Implements the frozen Production Knowledge Loader Specification
 * (`docs/architecture/12-production-knowledge-loader.md`). It is completely
 * GENERIC: it contains no clinical vocabulary, no identifier branching, and no
 * `switch`/`if (identifier)` logic. All behaviour is derived from the registry —
 * to serve a new knowledge interface, add a registry entry, a validation contract,
 * and content; this loader never changes (Registry Evolution Principle).
 *
 * Ownership: it locates, loads, validates (structure, authoritatively), freezes,
 * caches, and assembles bundles. It never decides what is requested (modules do),
 * never performs fallback presentation (modules do), never reasons clinically, and
 * never judges clinical correctness.
 */
export class ProductionKnowledgeLoader implements KnowledgeLoader {
  /** Validated, immutable inventory (registry validation runs in the constructor). */
  private readonly registry: ReadonlyMap<string, KnowledgeRegistryEntry>;

  /**
   * Loader-owned cache of validated, frozen slices. Ownership is exclusive to the
   * loader; the framework and modules are unaware it exists (spec §7).
   */
  private readonly cache = new Map<string, unknown>();

  constructor(entries: readonly KnowledgeRegistryEntry[]) {
    // Registry Validation Rule (§5a): only a validated registry may serve
    // knowledge. An inconsistent registry throws here, at initialization, before
    // any load. After this point the registry is immutable for the loader's life.
    this.registry = validateRegistry(entries);
  }

  /**
   * Resolves a request into an immutable bundle. Lifecycle per spec §7/§4:
   * resolve request → registry lookup → load source → validate → freeze → cache →
   * assemble → return immutable bundle. Only requested, registered, valid slices
   * appear; everything else is absent (Option B), never fabricated.
   */
  async load(request?: KnowledgeRequest): Promise<KnowledgeBundle> {
    const bundle: Record<string, unknown> = {};
    if (request) {
      for (const identifier of Object.keys(request)) {
        if (!isRequested(request[identifier])) continue;
        const value = await this.resolve(identifier);
        // Option B: an unresolved identifier is simply omitted from the bundle.
        if (value !== undefined) bundle[identifier] = value;
      }
    }
    return Object.freeze(bundle);
  }

  /**
   * Resolves one identifier to a validated, frozen, cached slice — or `undefined`
   * when it is not registered, its source fails, or its content is malformed
   * (degrade to absence; never fabricate).
   */
  private async resolve(identifier: string): Promise<unknown> {
    const cached = this.cache.get(identifier);
    if (cached !== undefined) return cached;

    const entry = this.registry.get(identifier);
    if (!entry) return undefined; // not in registry → absent (Option B)

    let raw: unknown;
    try {
      raw = await entry.source(); // load source
    } catch {
      return undefined; // knowledge (source) error → degrade to absence
    }

    const result = entry.contract(raw); // authoritative structural validation
    if (!result.valid) return undefined; // malformed → degrade to absence

    const frozen = deepFreeze(result.value); // freeze immediately after validation
    this.cache.set(identifier, frozen); // cache the validated, immutable slice
    return frozen;
  }
}
