import type { KnowledgeBundle, KnowledgeRequest } from "../types/Knowledge";

/**
 * Loads knowledge for a run — the seam between the framework and the (future)
 * Knowledge Layer. Modules declare what they need via a {@link KnowledgeRequest};
 * the loader returns an immutable {@link KnowledgeBundle}. Implementations decide
 * the source (files, DB, remote) and own caching; none of that leaks into the
 * engine or modules.
 *
 * The interface is deliberately domain-agnostic (see
 * `docs/architecture/11-knowledge-framework.md`): a single transport method keyed
 * by opaque identifiers. The framework never names a clinical concept, so there
 * are no domain-specific accessors here — an unsupplied identifier is simply
 * absent from the returned bundle (Option B), never an error.
 */
export interface KnowledgeLoader {
  /** Resolves the requested slices; unsupplied identifiers are simply absent. */
  load(request?: KnowledgeRequest): Promise<KnowledgeBundle>;
}

/**
 * A no-op loader that supplies no knowledge: it returns an empty, immutable
 * bundle for any request. It satisfies the transport contract and lets the engine
 * run end to end with graceful fallback — every identifier is absent, so each
 * module substitutes its own placeholder. It hardcodes no data and knows no
 * clinical vocabulary; a real Knowledge-Layer loader replaces it later.
 */
export class StubKnowledgeLoader implements KnowledgeLoader {
  load(request?: KnowledgeRequest): Promise<KnowledgeBundle> {
    void request;
    return Promise.resolve(Object.freeze({}));
  }
}
