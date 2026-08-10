/**
 * KnowledgeSource for `prescriptionFormulaDefinitions`.
 *
 * Wiring Sprint · Step 2 (Source). Exposes the completed derivation layer as a real
 * {@link KnowledgeSource} — a pure data provider behind the frozen transport seam.
 * It is NOT yet registered: `productionRegistry.ts` still binds the identifier to a
 * placeholder, so at runtime the interface remains absent and modules fall back
 * (Option B). Registry integration, the validation contract, and runtime wiring are
 * later steps.
 *
 * Ownership: the authored corpus owns meaning; `formulaCatalog` owns identity; this
 * source owns neither. It is only a transport provider — it yields the structured
 * collection and nothing more.
 *
 * Boundaries (per Wiring Specification §4, SR-1..SR-5): the source only supplies
 * data. It does not validate, repair, transform, infer, deduplicate, sort, format,
 * render, or check the catalog — those are other layers' concerns (validation is the
 * next step; catalog cross-checks are a build-time concern). It returns the value
 * opaquely and exposes no business logic.
 */

import type { KnowledgeSource } from "../KnowledgeRegistry";
import { prescriptionFormulaDefinitionsData } from "../content/generated/prescription-formula-definitions.generated";

/**
 * Yields the complete, structured `prescriptionFormulaDefinitions` collection
 * derived from the authoritative corpus. Read-only: it returns the generated data
 * as-is and never mutates it; repeated calls return the same collection. The loader
 * validates and freezes whatever a source returns — this source does neither.
 */
export const prescriptionFormulaDefinitionsSource: KnowledgeSource = () =>
  prescriptionFormulaDefinitionsData;
