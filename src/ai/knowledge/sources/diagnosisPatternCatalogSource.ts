/**
 * KnowledgeSource for `diagnosisPatternCatalog`.
 *
 * Diagnosis Pattern Catalog Wiring Sprint · Step 2 (Source). Exposes the completed
 * derivation layer as a real {@link KnowledgeSource} — a pure data provider behind the
 * frozen transport seam. It is NOT yet registered: the identifier has no registry entry,
 * so at runtime the interface is absent and any consumer falls back (Option B). The
 * validation contract, cross-content check, and registry upgrade are later steps.
 *
 * Ownership: the authored corpus (`diagnosis-pattern-catalog.md`) owns identity; this
 * source owns nothing — it is only a transport provider that yields the canonical
 * diagnosis-pattern set.
 *
 * Runtime shape: a flat `readonly string[]` of canonical diagnosis-pattern names —
 * identity only (Minimal Vocabulary). Not objects, not a Map/Record, not formatted
 * prompt text, markdown, or a JSON string.
 *
 * Boundaries: the source only supplies data. It does not clone, rebuild, transform,
 * validate, normalize, sort, deduplicate, enrich, interpret, modify, or compare — those
 * belong to other layers. It returns the value opaquely and exposes no business logic.
 * The loader validates and freezes whatever a source returns; this source does neither.
 */

import { diagnosisPatternCatalogData } from "../content/generated/diagnosis-pattern-catalog.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `diagnosisPatternCatalog` canonical-name collection derived from
 * the authoritative corpus. Read-only: it returns the generated data as-is and never
 * mutates it; repeated calls return the same collection.
 */
export const diagnosisPatternCatalogSource: KnowledgeSource = () =>
  diagnosisPatternCatalogData;
