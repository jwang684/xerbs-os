/**
 * KnowledgeSource for `diagnosisPatternDefinitions`.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 2 (Source). Exposes the completed
 * derivation layer as a real {@link KnowledgeSource} — a pure data provider behind the
 * frozen transport seam. It is NOT yet registered: `productionRegistry.ts` still binds the
 * identifier via `pending(...)`, so at runtime the interface remains absent and
 * `DiagnosisModule` falls back (Option B). The validation contract, cross-content check,
 * and registry upgrade are later steps.
 *
 * Ownership: identity is owned by `diagnosisPatternCatalog`; meaning is owned by
 * `diagnosisPatternDefinitions` (the authored corpus). This source owns nothing — it is
 * only a transport provider that yields the derived collection.
 *
 * OWNERSHIP-BOUNDARY NOTE: the Definition Neutrality Audit (Doc 49) and Context
 * Independence Audit (Doc 50) are editorial review gates and are intentionally NOT enforced
 * here. The source is a transport layer only. It does not validate, normalize, transform,
 * enrich, sort, deduplicate, compare against catalogs, or perform cross-content /
 * neutrality / context-independence checks — those belong to other layers. It returns the
 * generated artifact unchanged; the loader validates and freezes whatever a source returns.
 */

import { diagnosisPatternDefinitionsData } from "../content/generated/diagnosis-pattern-definitions.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `diagnosisPatternDefinitions` collection derived from the
 * authoritative corpus. Read-only: it returns the generated data as-is (no clone, rebuild,
 * or re-derivation) and never mutates it; repeated calls return the same collection.
 */
export const diagnosisPatternDefinitionsSource: KnowledgeSource = () =>
  diagnosisPatternDefinitionsData;
