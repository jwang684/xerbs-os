/**
 * KnowledgeSource for `treatmentFormulaMap`.
 *
 * Treatment Formula Map Wiring Sprint · Step 2 (Source). Exposes the completed derivation
 * layer as a real {@link KnowledgeSource} — a pure data provider behind the frozen transport
 * seam. It is NOT yet registered: `productionRegistry.ts` still binds the identifier via
 * `pending(...)`, so at runtime the interface remains absent and `PrescriptionModule` falls
 * back (Option B). The validation contract, dual cross-content check, and registry upgrade are
 * later steps.
 *
 * OWNERSHIP BOUNDARY: this source owns **transport only**. It does NOT own structural
 * validation, duplicate detection, referential integrity, coverage analysis, recommendation
 * logic, ranking, confidence, rationale, formula selection, prescription generation, or
 * reasoning.
 *   - Structural validation belongs to the future `treatmentFormulaMapContract`.
 *   - Referential (two-sided) validation belongs to the future `treatmentFormulaMapCrossContent`.
 *   - Runtime reasoning belongs to `PrescriptionModule`.
 *
 * This source serves relationship data only. It does not clone, rebuild, normalize, sort,
 * deduplicate, validate, enrich, or interpret — it returns the generated collection reference
 * directly; the loader validates and freezes whatever a source returns.
 */

import { treatmentFormulaMapData } from "../content/generated/treatment-formula-map.generated";
import type { KnowledgeSource } from "../KnowledgeRegistry";

/**
 * Yields the complete `treatmentFormulaMap` association collection derived from the
 * authoritative corpus. Read-only: it returns the generated data as-is (no clone, rebuild, or
 * re-derivation) and never mutates it; repeated calls return the same collection.
 */
export const treatmentFormulaMapSource: KnowledgeSource = () =>
  treatmentFormulaMapData;
