/**
 * KnowledgeSource for `herbCatalog`.
 *
 * Herb Catalog Wiring Sprint · Step 2 (Source). Exposes the completed derivation
 * layer as a real {@link KnowledgeSource} — a pure data provider behind the frozen
 * transport seam. It is registered in `productionRegistry.ts` with its structural
 * contract, so at runtime the loader validates and serves this interface to consumers;
 * Option B applies only if the content is ever absent.
 *
 * Ownership: the authored corpus (`herb-catalog.md`) owns identity; this source owns
 * nothing — it is only a transport provider that yields the canonical herb-name set.
 *
 * Runtime shape: a flat `readonly string[]` of canonical herb names — identity only
 * (Minimal Vocabulary). Not objects, not a Map/Record, not formatted prompt text,
 * markdown, or a JSON string.
 *
 * Boundaries: the source only supplies data. It does not validate, deduplicate,
 * normalize, sort, repair, enrich, infer, compare, cross-reference, check parity, or
 * check naming conventions, and it never mutates the generated artifact — those
 * belong to other layers. It returns the value opaquely and exposes no business
 * logic. The loader validates and freezes whatever a source returns; this source
 * does neither.
 */

import { herbCatalogData } from "../content/generated/herb-catalog.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `herbCatalog` canonical-name collection derived from the
 * authoritative corpus. Read-only: it returns the generated data as-is and never
 * mutates it; repeated calls return the same collection.
 */
export const herbCatalogSource: KnowledgeSource = () => herbCatalogData;
