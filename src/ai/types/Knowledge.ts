/**
 * Knowledge transport types (framework shape only — no medical data, no clinical
 * vocabulary). Implements the frozen Knowledge Framework Specification
 * (`docs/architecture/11-knowledge-framework.md`): the framework transports
 * knowledge but never understands it.
 *
 * Identifiers and values are OPAQUE to the framework. Their names, meaning, and
 * value shapes are owned by the Knowledge Layer; the framework only moves opaque
 * strings to the loader and opaque values back. The framework enumerates no
 * identifier and defines no domain-specific key type.
 */

/** An opaque knowledge identifier. Owned by the Knowledge Layer; opaque here. */
export type KnowledgeIdentifier = string;

/**
 * How much of a requested slice to load: `true` for the whole slice, or a list of
 * opaque strings that narrow it. The narrowing strings are interpreted by the
 * loader, never by the framework.
 */
export type KnowledgeSelector = boolean | readonly string[];

/**
 * Declares which knowledge slices a module wants, keyed by opaque identifier. A
 * generic transport envelope: the framework attaches no meaning to any identifier
 * or selector — it only carries them to the loader.
 */
export type KnowledgeRequest = Readonly<
  Record<KnowledgeIdentifier, KnowledgeSelector>
>;

/**
 * The loader's response: opaque identifiers → opaque values. Immutable reference
 * data — a consumer may read but never mutate it. Values are `unknown` at the
 * framework boundary; typed shapes are narrowed in the Knowledge Layer. A
 * requested identifier that could not be supplied is simply ABSENT (Option B);
 * absence is never an error, and the framework never fills a default.
 */
export type KnowledgeBundle = Readonly<Record<KnowledgeIdentifier, unknown>>;
