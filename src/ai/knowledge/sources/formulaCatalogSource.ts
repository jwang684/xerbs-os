/**
 * KnowledgeSource for `formulaCatalog`.
 *
 * Formula Catalog Wiring Sprint · Step 2 (Source). Exposes the completed derivation
 * layer as a real {@link KnowledgeSource} — a pure data provider behind the frozen
 * transport seam. It is NOT yet registered: `productionRegistry.ts` still binds the
 * identifier to a placeholder, so at runtime the interface remains absent and
 * consumers fall back (Option B). Registry integration, the validation contract, and
 * runtime wiring are later steps.
 *
 * Ownership: the authored corpus (`formula-catalog.md`) owns identity; this source
 * owns nothing — it is only a transport provider that yields the canonical-name set.
 *
 * Runtime shape (Wiring Specification §B.1/§B.2): a flat `readonly string[]` of
 * canonical formula names — identity only (Minimal Vocabulary). Not objects, not a
 * Map/Record, not formatted prompt text, markdown, or a JSON string.
 *
 * Boundaries (Wiring Specification §C.1): the source only supplies data. It does not
 * validate, repair, deduplicate, sort, normalize, infer, enrich, or check
 * parity/references/policy — those belong to other layers. It returns the value
 * opaquely and exposes no business logic. The loader validates and freezes whatever a
 * source returns; this source does neither.
 */

import { formulaCatalogData } from "../content/generated/formula-catalog.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `formulaCatalog` canonical-name collection derived from the
 * authoritative corpus. Read-only: it returns the generated data as-is and never
 * mutates it; repeated calls return the same collection.
 */
export const formulaCatalogSource: KnowledgeSource = () => formulaCatalogData;
