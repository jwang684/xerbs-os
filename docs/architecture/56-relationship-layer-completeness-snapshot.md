# Relationship Layer — Completeness Snapshot

**Relationship Layer · Completeness Snapshot.** Status: **PROPOSED — PENDING REVIEW.** A
read-only architectural snapshot taken after `patternTreatmentMap` Step 4B (first relationship
layer fully wired) and **before** any `treatmentFormulaMap` work. It creates no
implementation, content, registry change, validator, contract, or commit. Findings are
grounded in live code (registry, `FormulaModule` / `PrescriptionModule`, the validation
directory).

## 1. Registry Completeness Snapshot

| # | Interface | Status |
|---|---|---|
| 1 | `prescriptionFormulaDefinitions` | **real** (wired) |
| 2 | `formulaCatalog` | **real** (wired) |
| 3 | `formulaDefinitionCatalog` | **real** (wired) |
| 4 | `formulaDefinitions` | **real** (wired) |
| 5 | `herbCatalog` | **real** (wired) |
| 6 | `diagnosisPatternCatalog` | **real** (wired) |
| 7 | `diagnosisPatternDefinitions` | **real** (wired) |
| 8 | `patternTreatmentMap` | **real** (wired) |
| 9 | `treatmentFormulaMap` | **pending** (`pending("treatmentFormulaMap")`) |

**Totals: 8 real, 1 pending** (verified in `productionRegistry.ts`).

## 2. Relationship Layer Inventory

| Aspect | `patternTreatmentMap` | `treatmentFormulaMap` |
|---|---|---|
| Design (arch review / spec / rules / representation) | ✅ Docs 51–55 | ❌ none |
| Content | ✅ `pattern-treatment-map.md` (129 associations) | ❌ none |
| Derivation | ✅ adapter + generator + generated (129) | ❌ none |
| Source | ✅ `patternTreatmentMapSource` | ❌ none |
| Contract | ✅ `patternTreatmentMapContract` | ❌ none |
| Cross-content validator | ✅ `patternTreatmentMapCrossContent` (dual) | ❌ none |
| Registry | ✅ real entry | ⏳ `pending(...)` |
| Runtime | ✅ retrievable (129) | ❌ absent → Option B |

## 3. Ownership Matrix

| Interface | identity | meaning | relationships | recommendations | reasoning |
|---|---|---|---|---|---|
| `diagnosisPatternCatalog` | ✅ (patterns) | — | — | — | — |
| `formulaDefinitionCatalog` | ✅ (principles) | — | — | — | — |
| `formulaCatalog` | ✅ (named formulas) | — | — | — | — |
| `diagnosisPatternDefinitions` | — | ✅ (pattern meaning) | — | — | — |
| `formulaDefinitions` | — | ✅ (principle meaning) | — | — | — |
| `patternTreatmentMap` | — | — | ✅ (pattern→principle) | — | — |
| `treatmentFormulaMap` (pending) | — | — | ✅ (principle→formula) | — | — |
| runtime modules (`Diagnosis`/`Formula`/`Prescription`) | — | — | — | — | ✅ |

- **Identity** owned only by catalogs. **Meaning** owned only by definition layers.
  **Relationships** owned only by relationship maps. **Recommendations** owned **nowhere** in
  the knowledge layer (forbidden). **Reasoning** owned by runtime modules.
- **No overlaps, no ownership migration.**

## 4. Dependency Graph Review

Actual edges (content/build-time references; all point toward identity roots):

```
diagnosisPatternCatalog        formulaDefinitionCatalog        formulaCatalog        herbCatalog
   ↑            ↑                    ↑         ↑                    ↑
diagnosisPatternDefinitions   formulaDefinitions   prescriptionFormulaDefinitions
   (→ dpCatalog)                 (→ fdCatalog)         (→ formulaCatalog)
   ↑                                ↑    ↑
patternTreatmentMap ─────────────────┘   └───────── treatmentFormulaMap (PENDING)
   (LHS → dpCatalog, RHS → fdCatalog)                (LHS → fdCatalog, RHS → formulaCatalog)

Runtime consumers: DiagnosisModule → {dpDefinitions};
  FormulaModule → {formulaDefinitions, patternTreatmentMap};
  PrescriptionModule → {prescriptionFormulaDefinitions, treatmentFormulaMap(pending), formulaCatalog, herbCatalog}
```

- **Acyclic:** every edge terminates at an identity root that references nothing; the two maps
  reference identity roots on both sides. No cycle.
- The pending `treatmentFormulaMap` would add exactly two edges (→ `formulaDefinitionCatalog`,
  → `formulaCatalog`), both to existing wired roots — remaining acyclic.

## 5. Symmetry Review

| Diagnosis Tier | Strategy Tier | Symmetric? |
|---|---|---|
| `diagnosisPatternCatalog` (identity root) | `formulaDefinitionCatalog` (identity root) | ✅ |
| `diagnosisPatternDefinitions` (meaning) | `formulaDefinitions` (meaning) | ✅ |
| `patternTreatmentMap` (relationship, wired) | `treatmentFormulaMap` (relationship, **pending**) | ⏳ mirror incomplete |

Identity and meaning tiers are **fully mirrored** across diagnosis and strategy. The
relationship mirror is **half-complete**: `patternTreatmentMap` (pattern→principle) is wired;
its structural twin `treatmentFormulaMap` (principle→formula) is the sole remaining interface.
No asymmetry in the built layers; the only gap is the unbuilt second map.

## 6. Validator Layer Inventory

Four cross-content validators exist (all build-time, side-effect-free, report-all-issues):

| Validator | Owns (reference integrity) | Does NOT own |
|---|---|---|
| `prescriptionFormulaDefinitionsCrossContent` | formula ∈ `formulaCatalog` | structure, meaning, editorial |
| `formulaDefinitionsCrossContent` | principle ∈ `formulaDefinitionCatalog` | structure, meaning, editorial |
| `diagnosisPatternDefinitionsCrossContent` | pattern ∈ `diagnosisPatternCatalog` | structure, meaning, editorial |
| `patternTreatmentMapCrossContent` (**dual**) | pattern ∈ `diagnosisPatternCatalog` **and** principle ∈ `formulaDefinitionCatalog` | structure (contract), duplicate-pair (contract), cardinality, coverage-as-requirement, recommendations, editorial |

**Layer separation (verified via in-file ownership notes):**
- **Contract** — structure only (array, exact fields, non-empty, uniqueness; duplicate-*pair*
  for the map).
- **Cross-content** — referential integrity + informational coverage.
- **Editorial review** — applies to **meaning** corpora only (Docs 41/42/49/50); relationship
  layers have **no editorial gate** (no prose to audit — Doc 55).
- **Runtime** — reasoning/selection in modules.
None merged.

## 7. Runtime Availability Snapshot (verified via the production loader)

- **Retrievable (8):** `formulaCatalog` (135), `herbCatalog` (288), `formulaDefinitionCatalog`
  (69), `formulaDefinitions` (69), `prescriptionFormulaDefinitions` (135),
  `diagnosisPatternCatalog` (85), `diagnosisPatternDefinitions` (85), `patternTreatmentMap`
  (129).
- **Pending (1):** `treatmentFormulaMap` → absent → Option B.

## 8. Architectural Health Assessment

- **Ownership clarity:** strong — identity/meaning/relationship cleanly separated; no overlaps.
- **Dependency clarity:** strong — acyclic; maps reference identity roots on both sides.
- **Validation layering:** strong — contract / cross-content / editorial / runtime distinct;
  relationship layer correctly has no editorial gate.
- **Runtime consistency:** strong — 8 interfaces resolve, immutable, Option B intact for the
  one pending.
- **Registry consistency:** strong — generic loader unchanged across all 8 upgrades (Registry
  Evolution Principle held).

**Real risks (visible now, non-speculative):**
- **Uncommitted work (process):** the entire knowledge sprint (Docs 22–56, all
  content/derivation/source/contract/validator/registry changes) is **uncommitted** on
  `sprint-3` — a very large unversioned body of work. Relevant to your commit gate.
- **Doc drift (minor):** `FormulaModule` docstring still says it "requests no knowledge" /
  content is empty — now stale (it receives `formulaDefinitions` + `patternTreatmentMap`).
  Same class already noted for `Diagnosis`/`Prescription` modules. No functional impact.
- **Shared-parser naming (minor):** the shared two-field parser is still
  `parsePrescriptionFormulaDefinitions` though reused by four corpora — legibility only.

## 9. Remaining Scope Analysis — `treatmentFormulaMap`

`treatmentFormulaMap` (principle → named formula) is the **only** remaining interface. It is
**structurally identical** to `patternTreatmentMap` (a two-sided, many-to-many relationship
referencing two wired identity roots: `formulaDefinitionCatalog` → `formulaCatalog`) and is
consumed by `PrescriptionModule` (`knowledgeRequest` includes `treatmentFormulaMap`; renders
`{{treatmentFormulaMap}}`).

Remaining work, in order (each reuses the `patternTreatmentMap` precedent):
1. **Architecture Review** — likely brief; can reuse Doc 51's conclusions (Option A,
   relationship-only, dual cross-content).
2. **Specification** — reuse Doc 52 shape.
3. **Authoring Rules** — reuse Doc 53.
4. **(Representation)** — already settled by Doc 54 (flat pair); may fold into the spec.
5. **Content** — author `treatment-formula-map.md` (principle → named formula).
6. **Derivation** — reuse the flat-pair parser via a `{ principle, formula }` adapter.
7. **Source** — mirror `patternTreatmentMapSource`.
8. **Contract** — mirror `patternTreatmentMapContract` (exact `{principle, formula}`,
   duplicate-pair).
9. **Dual Cross-Content Validator** — `principle ∈ formulaDefinitionCatalog`,
   `formula ∈ formulaCatalog`.
10. **Registry Upgrade** — replace `pending("treatmentFormulaMap")`.
11. **(Optional) Validation Layer Review** — likely unnecessary; Doc 55 already froze the
    relationship-layer validation ownership generically.

**Prerequisites:** both identity roots it references (`formulaDefinitionCatalog`,
`formulaCatalog`) are wired and available → **no prerequisite remains unfinished**;
`treatmentFormulaMap` is fully unblocked.

## 10. Completion Estimate

- **Relationship layer: ~50%** — 1 of 2 relationship interfaces (`patternTreatmentMap`) fully
  built and wired; `treatmentFormulaMap` entirely pending.
- **Knowledge architecture: ~89%** — **8 of 9 registry interfaces wired** (8/9 ≈ 89%). The
  remaining 11% is the single `treatmentFormulaMap` interface. All identity and meaning tiers
  across formulas, herbs, strategy, and diagnosis are complete, and one of the two relationship
  layers is complete; only the second (structurally-identical) relationship layer remains.

## 11. Sufficiency Assessment

**Yes — the architecture is sufficiently settled to begin `treatmentFormulaMap` Architecture
Review without additional reviews.** The relationship-layer pattern is fully proven end-to-end
by `patternTreatmentMap`; the validation ownership is frozen generically (Doc 55); the
representation is settled (Doc 54); both identity roots are wired; and the consumer
(`PrescriptionModule`) already requests and renders the interface. The remaining work is a
direct, low-risk reuse of the completed relationship-layer precedent.

## Recommendation — `treatmentFormulaMap` direction

**Recommended: Option A — a simple identity→identity relationship map (principle identity →
formula identity).**

Grounded in:
- **Ownership model** — relationship maps own only associations; catalogs own identity;
  reasoning is the module's. Option B (priority/confidence/ranking/rationale/weights) would move
  reasoning/recommendation ownership into a reference layer — a violation the whole architecture
  avoids.
- **Validation model** — Doc 55 froze the relationship-layer validation split; Option A fits it
  exactly (contract's exact-two-fields structurally blocks metadata drift; dual cross-content
  checks both sides). Option B would require metadata validation nobody owns and reintroduce an
  editorial concern that relationship layers deliberately lack.
- **Relationship-layer precedent** — `patternTreatmentMap` is Option A and works cleanly; the
  twin should match for symmetry and to reuse the parser, contract, and dual-validator shapes
  verbatim.
- **Reasoning ownership** — "which formula, how strongly, why" is `PrescriptionModule`'s
  runtime judgement, not the map's; the map records only *that* a principle and a formula are
  associated ("reference only, never deterministic rules," per the prescription template).

Any future metadata attaches **beside** the map by reference, never inside an entry. *(Decision
only — the interface is not designed, specified, or built here.)*

## Scope

Read-only snapshot. No implementation, content, registry change, validator, contract, or
commit; no change to any existing file other than the creation of this document.

STOP. Relationship-layer snapshot complete. No `treatmentFormulaMap` work begun. Nothing
committed. Awaiting review.
