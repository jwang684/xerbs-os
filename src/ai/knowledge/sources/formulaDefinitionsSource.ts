/**
 * KnowledgeSource for `formulaDefinitions`.
 *
 * Formula Definitions Wiring Sprint · Step 2 (Source). Exposes the completed derivation
 * layer as a real {@link KnowledgeSource} — a pure data provider behind the frozen
 * transport seam. It is NOT yet registered: `productionRegistry.ts` still binds the
 * identifier via `pending(...)`, so at runtime the interface remains absent and
 * `FormulaModule` falls back (Option B). The validation contract, cross-content check,
 * and registry upgrade are later steps.
 *
 * Ownership: identity is owned by `formulaDefinitionCatalog`; meaning is owned by
 * `formulaDefinitions` (the authored corpus). This source owns nothing — it is only a
 * transport provider that yields the derived collection.
 *
 * Boundaries: the source only supplies data. It does not validate, transform,
 * normalize, sort, deduplicate, enrich, interpret meaning, validate references, enforce
 * parity/neutrality/context-independence, or compare against the catalog — those belong
 * to other layers. It returns the generated artifact unchanged; the loader validates and
 * freezes whatever a source returns.
 */

import { formulaDefinitionsData } from "../content/generated/formula-definitions.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `formulaDefinitions` collection derived from the authoritative
 * corpus. Read-only: it returns the generated data as-is (no clone, rebuild, or
 * re-derivation) and never mutates it; repeated calls return the same collection.
 */
export const formulaDefinitionsSource: KnowledgeSource = () =>
  formulaDefinitionsData;
