/**
 * KnowledgeSource for `formulaDefinitionCatalog`.
 *
 * Formula Definition Catalog Wiring Sprint · Step 2 (Source). Exposes the completed
 * derivation layer as a real {@link KnowledgeSource} — a pure data provider behind the
 * frozen transport seam. It is registered in `productionRegistry.ts` with its structural
 * contract, so at runtime the loader validates and serves this interface; Option B applies
 * only if the content is ever absent.
 *
 * Ownership: the authored corpus (`formula-definition-catalog.md`) owns identity; this
 * source owns nothing — it is only a transport provider that yields the canonical
 * treatment-principle set (v1 scope: principles only).
 *
 * Runtime shape: a flat `readonly string[]` of canonical treatment-principle names —
 * identity only (Minimal Vocabulary). Not objects, not a Map/Record, not formatted
 * prompt text, markdown, or a JSON string.
 *
 * Boundaries: the source only supplies data. It does not validate, normalize,
 * deduplicate, sort, enrich, infer, compare, cross-reference, or mutate — those belong
 * to other layers. It returns the value opaquely and exposes no business logic. The
 * loader validates and freezes whatever a source returns; this source does neither.
 */

import { formulaDefinitionCatalogData } from "../content/generated/formula-definition-catalog.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `formulaDefinitionCatalog` canonical-name collection derived
 * from the authoritative corpus. Read-only: it returns the generated data as-is and
 * never mutates it; repeated calls return the same collection.
 */
export const formulaDefinitionCatalogSource: KnowledgeSource = () =>
  formulaDefinitionCatalogData;
