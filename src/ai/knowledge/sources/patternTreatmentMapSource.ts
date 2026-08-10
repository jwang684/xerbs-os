/**
 * KnowledgeSource for `patternTreatmentMap`.
 *
 * Pattern Treatment Map Wiring Sprint · Step 2 (Source). Exposes the completed derivation
 * layer as a real {@link KnowledgeSource} — a pure data provider behind the frozen transport
 * seam. It is NOT yet registered: `productionRegistry.ts` still binds the identifier via
 * `pending(...)`, so at runtime the interface remains absent and `FormulaModule` falls back
 * (Option B). The validation contract, dual cross-content check, and registry upgrade are
 * later steps.
 *
 * OWNERSHIP BOUNDARY: this source owns **transport only**. Structural validation belongs to
 * the contract layer. Two-sided reference integrity (pattern ∈ diagnosisPatternCatalog,
 * principle ∈ formulaDefinitionCatalog) belongs to the future cross-content validator.
 * Recommendation logic, ranking, treatment selection, confidence scoring, rationale, and
 * reasoning ownership do NOT belong to this source.
 *
 * This source serves relationship data only. It does NOT interpret associations as
 * recommendations, priorities, probabilities, or deterministic routing. It does not clone,
 * rebuild, validate, normalize, sort, deduplicate, enrich, or interpret — it returns the
 * generated collection reference directly; the loader validates and freezes whatever a
 * source returns.
 */

import { patternTreatmentMapData } from "../content/generated/pattern-treatment-map.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `patternTreatmentMap` association collection derived from the
 * authoritative corpus. Read-only: it returns the generated data as-is (no clone, rebuild,
 * or re-derivation) and never mutates it; repeated calls return the same collection.
 */
export const patternTreatmentMapSource: KnowledgeSource = () =>
  patternTreatmentMapData;
