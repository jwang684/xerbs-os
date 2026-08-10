# Knowledge Architecture — Completion Snapshot

**Knowledge Architecture · Completion Snapshot.** Status: **PROPOSED — PENDING REVIEW.** A
read-only architectural snapshot taken immediately after `treatmentFormulaMap` **Step 4B** (the
final pending interface wired) and **before** any cleanup or commit review. It creates no
implementation, content, registry change, validator, contract, or commit. Every figure below is
re-grounded in live code as it exists today — the registry (`src/ai/knowledge/productionRegistry.ts`),
the `contracts/`, `sources/`, and `validation/` directories, the module consumers
(`FormulaModule` / `PrescriptionModule` / `DiagnosisModule`), and the actual
`ProductionKnowledgeLoader` output. Prior step reports were **not** relied upon.

**Grounding method.** Registry identifiers, contract/validator/source inventories, and
`pending(...)` usage were read directly from source; all runtime counts were obtained by
constructing the real `ProductionKnowledgeLoader` over the production registry and loading every
identifier.

---

## 1. Registry Completeness

Read from `productionKnowledgeRegistry` (in registry order):

| # | Interface | Registry entry | Runtime |
|---|---|---|---|
| 1 | `diagnosisPatternDefinitions` | real | resolves |
| 2 | `diagnosisPatternCatalog` | real | resolves |
| 3 | `formulaDefinitions` | real | resolves |
| 4 | `patternTreatmentMap` | real | resolves |
| 5 | `prescriptionFormulaDefinitions` | real | resolves |
| 6 | `treatmentFormulaMap` | real | resolves |
| 7 | `formulaCatalog` | real | resolves |
| 8 | `formulaDefinitionCatalog` | real | resolves |
| 9 | `herbCatalog` | real | resolves |

- **Real interfaces: 9.**
- **Pending interfaces: 0.**
- **`pending("...")` usages = 0** (grounded: `grep -c 'pending("'` → `0`). The `pending()`
  helper function still exists at `productionRegistry.ts:62` but has **no callers** (see §11).

All nine required identifiers are present:
`diagnosisPatternCatalog`, `diagnosisPatternDefinitions`, `formulaDefinitionCatalog`,
`formulaDefinitions`, `formulaCatalog`, `prescriptionFormulaDefinitions`, `herbCatalog`,
`patternTreatmentMap`, `treatmentFormulaMap`.

**Verdict: registry complete — 9 real / 0 pending.**

---

## 2. Interface Layer Inventory

Interfaces grouped by ownership layer:

**Identity Layer** (own identity only — Minimal Vocabulary):
- `diagnosisPatternCatalog`
- `formulaDefinitionCatalog`
- `formulaCatalog`
- `herbCatalog`

**Meaning Layer** (own meaning only — Definition Neutrality / Intrinsic Identity):
- `diagnosisPatternDefinitions`
- `formulaDefinitions`
- `prescriptionFormulaDefinitions`

**Relationship Layer** (own reference-only associations — never recommendation/ranking):
- `patternTreatmentMap` (pattern → principle)
- `treatmentFormulaMap` (principle → formula)

**Ownership separation:** each interface belongs to exactly one layer. Identity roots carry no
meaning; meaning corpora carry no relationships; relationship maps carry no prose and no
selection logic. No interface spans two layers.

---

## 3. Ownership Matrix

Columns: **identity**, **meaning**, **relationships**, **recommendations**, **reasoning**,
**runtime**. (`✔` = owns; `—` = does not own.)

| Row | identity | meaning | relationships | recommendations | reasoning | runtime |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `diagnosisPatternCatalog` | ✔ | — | — | — | — | — |
| `diagnosisPatternDefinitions` | — | ✔ | — | — | — | — |
| `formulaDefinitionCatalog` | ✔ | — | — | — | — | — |
| `formulaDefinitions` | — | ✔ | — | — | — | — |
| `formulaCatalog` | ✔ | — | — | — | — | — |
| `prescriptionFormulaDefinitions` | — | ✔ | — | — | — | — |
| `herbCatalog` | ✔ | — | — | — | — | — |
| `patternTreatmentMap` | — | — | ✔ | — | — | — |
| `treatmentFormulaMap` | — | — | ✔ | — | — | — |
| `FormulaModule` | — | — | — | ✔ | ✔ | ✔ |
| `PrescriptionModule` | — | — | — | ✔ | ✔ | ✔ |
| `DiagnosisModule` | — | — | — | ✔ | ✔ | ✔ |

**Overlap check:** no knowledge interface owns recommendations, reasoning, or runtime — those
columns are exclusively the modules'. No module owns identity, meaning, or relationships — it
only *requests and renders* them (reference-only). The matrix is block-diagonal between the
knowledge tier and the module tier.

**Verdict: ownership remains clean — zero cross-layer overlap.**

---

## 4. Dependency Graph

The clinical chain and its interface owners:

```
Diagnosis Pattern            ← diagnosisPatternCatalog (identity)
        │                       diagnosisPatternDefinitions (meaning)
        │  patternTreatmentMap (relationship: pattern → principle)
        ▼
Treatment Principle          ← formulaDefinitionCatalog (identity)
        │                       formulaDefinitions (meaning)
        │  treatmentFormulaMap (relationship: principle → formula)
        ▼
Named Formula                ← formulaCatalog (identity)
        │                       prescriptionFormulaDefinitions (meaning)
        │  (execution — owned by PrescriptionModule reasoning, not a knowledge interface)
        ▼
Herb                         ← herbCatalog (identity)
```

**Direction of dependencies:**
- Relationship maps depend on the two identity roots they bridge (build-time cross-content only).
- Meaning corpora depend on their sibling identity catalog (build-time cross-content only).
- Identity catalogs depend on nothing.
- Modules depend on interfaces (request); interfaces never depend on modules.

**Acyclic — why:** dependencies flow strictly one way at build time: identity ← meaning,
identity ← relationship, and interface ← module. No interface imports a module; no identity root
imports a meaning or relationship layer; no contract or validator is imported by the generic
loader. The generated runtime artifacts are leaf data modules. There is therefore no path from
any node back to itself. (Confirmed by the fact that the loader is fully generic and the
`no-drift` derivation guards import only parsers + markdown, never runtime plumbing.)

---

## 5. Validation Layer Inventory

**Contracts (structure only)** — grounded from `contracts/`, **9 total**, one per interface:

| Interface | Contract |
|---|---|
| `diagnosisPatternCatalog` | `diagnosisPatternCatalogContract` |
| `diagnosisPatternDefinitions` | `diagnosisPatternDefinitionsContract` |
| `formulaDefinitionCatalog` | `formulaDefinitionCatalogContract` |
| `formulaDefinitions` | `formulaDefinitionsContract` |
| `formulaCatalog` | `formulaCatalogContract` |
| `prescriptionFormulaDefinitions` | `prescriptionFormulaDefinitionsContract` |
| `herbCatalog` | `herbCatalogContract` |
| `patternTreatmentMap` | `patternTreatmentMapContract` |
| `treatmentFormulaMap` | `treatmentFormulaMapContract` |

> Note: the prompt's expected list named the 5 meaning/relationship contracts; live code shows
> all **9** interfaces carry a structural contract — the 4 identity catalogs also have their own
> (single-identity, non-empty-string) contracts. Reported as grounded.

**Cross-content validators (referential integrity)** — grounded from `validation/`, **5 total**:

| Validator | Sides | Kind |
|---|---|---|
| `formulaDefinitionsCrossContent` | definition → `formulaDefinitionCatalog` | one-sided |
| `prescriptionFormulaDefinitionsCrossContent` | definition → `formulaCatalog` | one-sided |
| `diagnosisPatternDefinitionsCrossContent` | definition → `diagnosisPatternCatalog` | one-sided |
| `patternTreatmentMapCrossContent` | pattern → catalog, principle → catalog | dual |
| `treatmentFormulaMapCrossContent` | principle → catalog, formula → catalog | dual |

Identity catalogs have **no** cross-content validator (they are reference roots — nothing to
resolve against); this is correct, not a gap.

**Ownership separation (three-layer validation model):**
- **contract = structure** (shape, exact-two-fields, non-empty strings, duplicate-pair, passthrough).
- **cross-content = referential integrity** (build-time; every reference resolves into a catalog).
- **runtime = reasoning** (modules; selection, ranking, prescription — never in the knowledge tier).

Each concern lives in exactly one place. No contract performs referential checks; no
cross-content validator performs structural repair; no validator reasons clinically.

---

## 6. Editorial Gate Inventory

Editorial-review documents (grounded from `docs/architecture/`):

| Doc | Gate | Corpus |
|---|---|---|
| Doc 41 | Definition Neutrality Audit | `formulaDefinitions` (meaning) |
| Doc 42 | Context Independence Audit | `formulaDefinitions` (meaning) |
| Doc 49 | Definition Neutrality Audit | `diagnosisPatternDefinitions` (meaning) |
| Doc 50 | Context Independence Audit | `diagnosisPatternDefinitions` (meaning) |

- **Meaning layers only:** confirmed. Editorial gates apply exclusively to prose-bearing meaning
  corpora, where wording can smuggle in bias, recommendation, or scenario-dependence.
- **Relationship layers have no editorial gate:** confirmed (Doc 55 finding). `patternTreatmentMap`
  and `treatmentFormulaMap` carry **no prose** — each entry is a bare `(identity, identity)` pair.
  The exact-two-fields structural contract is a complete guard against meaning drift, so there is
  nothing an editorial reviewer could assess. Identity catalogs likewise have no editorial gate
  (single tokens, governed by Minimal Vocabulary authoring rules, not prose review).

---

## 7. Runtime Availability

Grounded from the real `ProductionKnowledgeLoader` over the production registry (every
identifier requested; all resolve and freeze):

| Interface | Resolves | Count |
|---|:--:|--:|
| `diagnosisPatternCatalog` | ✔ | 85 |
| `diagnosisPatternDefinitions` | ✔ | 85 |
| `formulaDefinitionCatalog` | ✔ | 69 |
| `formulaDefinitions` | ✔ | 69 |
| `formulaCatalog` | ✔ | 135 |
| `prescriptionFormulaDefinitions` | ✔ | 135 |
| `herbCatalog` | ✔ | **288** (grounded — prompt left this as `<actual>`) |
| `patternTreatmentMap` | ✔ | 129 |
| `treatmentFormulaMap` | ✔ | 209 |

**All 9 interfaces resolve at runtime.** Catalog↔definition parity holds where the model
requires it: `formulaDefinitionCatalog` 69 = `formulaDefinitions` 69; `formulaCatalog` 135 =
`prescriptionFormulaDefinitions` 135; `diagnosisPatternCatalog` 85 = `diagnosisPatternDefinitions`
85. Relationship maps are intentionally cardinality-neutral (129 and 209 associations; no parity
requirement).

---

## 8. Runtime Consumer Inventory

Grounded from each module's `knowledgeRequest()` and `knowledgeOrNone(...)` render slots:

| Module | Requests | Renders (slots) |
|---|---|---|
| `DiagnosisModule` | `diagnosisPatternDefinitions` | `diagnosisPatternDefinitions` |
| `FormulaModule` | `formulaDefinitions`, `patternTreatmentMap` | both |
| `PrescriptionModule` | `prescriptionFormulaDefinitions`, `treatmentFormulaMap`, `formulaCatalog`, `herbCatalog` | all four |

- **FormulaModule receives `patternTreatmentMap`:** confirmed (requested `true`, rendered via
  `knowledgeOrNone`; resolves to real content).
- **PrescriptionModule receives `treatmentFormulaMap`:** confirmed — now real content (verified
  ~18.2k chars at Step 4B) instead of `(none provided)`.
- **DiagnosisModule receives `diagnosisPatternDefinitions`:** confirmed.

Every declared knowledge slot across all three modules resolves. Option B remains intact: a slot
resolves to real content when served and to `(none provided)` only if absent — never fabricated.

---

## 9. Architecture Symmetry Review

| Axis | Observation |
|---|---|
| Identity | 4 catalogs, uniform (single-identity string lists) |
| Meaning | 3 definition corpora, uniform (`- **X** — Y` two-field) |
| Relationship | 2 maps, uniform (flat `(identity, identity)` pairs) |
| Validation | every interface: 1 contract; every definition/map: 1 cross-content validator |
| Runtime | one generic loader; every interface served identically |
| Registry | one entry per interface; identical `{identifier, source, contract}` shape |

**Structural asymmetries — classified as intentional, not defects:**
- **Meaning tier has 3 corpora; identity tier has 4.** `herbCatalog` is an identity root with no
  paired meaning corpus in v1 (herbs are terminal execution vocabulary, not reasoned-over prose).
  *Classification: intentional scope boundary.*
- **`prescriptionFormulaDefinitions` maps to `formulaCatalog`, not a dedicated catalog.** The
  named-formula identity root *is* `formulaCatalog`; no separate catalog is needed.
  *Classification: intentional reuse of the identity root.*
- **Cross-content validators: definitions are one-sided, maps are dual.** A definition resolves
  one reference (into its catalog); a map resolves two (both endpoints). *Classification:
  intrinsic to the reference shape, not asymmetry of rigor.*

Within each layer the interfaces are fully symmetric. Cross-layer differences are the deliberate
consequences of the tier's role.

---

## 10. Health Assessment

| Dimension | Assessment | Basis (grounded) |
|---|---|---|
| Ownership clarity | **Healthy** | §3 matrix block-diagonal; no overlap |
| Dependency clarity | **Healthy** | §4 one-directional, acyclic |
| Validation layering | **Healthy** | §5 structure/referential/reasoning cleanly separated |
| Runtime isolation | **Healthy** | §7 loader generic; §8 Option B fallback intact |
| Registry consistency | **Healthy** | §1 9 real / 0 pending; uniform entry shape |
| Consumer consistency | **Healthy** | §8 every declared slot resolves; identical request/render idiom |

No dimension shows a structural defect. Observations are drawn only from live code and loader
output.

---

## 11. Remaining Risks

Only real, presently-observable risks (no speculation):

1. **Large uncommitted body of work.** The entire 9-interface knowledge architecture — content,
   derivation, sources, contracts, validators, the registry upgrade, and Docs 22–60 — is
   uncommitted on branch `sprint-3`. *Risk: loss/confusion until a commit review lands.* This is
   the highest-priority real item.
2. **Unused `pending()` helper.** `productionRegistry.ts:62` — `pending()` now has zero callers
   (all interfaces are real), producing one lint **warning** (`'pending' is defined but never
   used`, 0 errors). Its dependencies `emptySource` / `unauthoredContract` are also now dormant.
   *Risk: cosmetic only; gate still passes.* Removal is a cleanup-review decision (deliberately
   not done here).
3. **Documentation surface is large and unreviewed.** ~39 architecture docs (22–60) were authored
   this sprint, all `PROPOSED — PENDING REVIEW`. *Risk: potential doc drift / review backlog; no
   known factual staleness at this time.*

No other risks are asserted. Parser naming is consistent (shared adapters, no observed drift); no
temporary artifacts are checked into `src/`.

---

## 12. Completion Assessment

| Facet | Status |
|---|---|
| Registry completeness | **Complete** — 9 real / 0 pending |
| Validation completeness | **Complete** — 9 contracts; 5 cross-content validators (all definition/map references resolve, 0 orphans) |
| Runtime completeness | **Complete** — all 9 interfaces resolve and freeze via the real loader |
| Relationship-layer completeness | **Complete** — both maps (`patternTreatmentMap`, `treatmentFormulaMap`) wired, validated dual, consumed |
| Overall architecture completeness | **Complete** |

**Explicit confirmation: the knowledge architecture is COMPLETE.** All nine interfaces are
wired, validated (structure + referential integrity), served at runtime, and consumed by the
modules, with ownership boundaries intact and the dependency graph acyclic.

---

## 13. Sufficiency Assessment

| Review | Sufficient? | Rationale |
|---|:--:|---|
| Freeze review | **Yes** | The architecture is stable and complete; every artifact is grounded and its ownership fixed. Nothing is mid-flight. |
| Cleanup review | **Yes** | The one cosmetic item (unused `pending()`/`emptySource`/`unauthoredContract`) is precisely identified and isolated to one file. |
| Commit review | **Yes** | Change set is well-scoped: content + derivation + sources + contracts + validators + a single targeted registry edit + docs. Do-not-touch files (loader, `KnowledgeRegistry`, `bootstrap`, transport types) are provably untouched. |
| Merge review | **Yes, with one gate** | All test/typecheck/lint/build gates pass (lint: 0 errors, 1 warning). Merge is appropriate once the commit review decides commit granularity and whether to clear the `pending()` warning first. |

The architecture is sufficient for freeze, cleanup, commit, and merge review. The only
outstanding action is the review-and-commit process itself, not further architectural work.

---

## Deliverable Summary

- **Registry completeness:** 9 real, 0 pending; `pending(...)` usages = 0.
- **Ownership completeness:** clean block-diagonal matrix; no cross-layer overlap.
- **Validation completeness:** 9 structural contracts + 5 cross-content validators; structure /
  referential / reasoning cleanly separated; 0 orphans across all maps and definitions.
- **Runtime completeness:** all 9 interfaces resolve and freeze; counts 85 / 85 / 69 / 69 / 135 /
  135 / 288 / 129 / 209; Option B intact; all module slots resolve.
- **Architecture completeness:** COMPLETE (registry + validation + runtime + relationship layer).
- **Remaining real risks:** (1) large uncommitted work on `sprint-3`; (2) unused `pending()`
  helper (1 lint warning, cosmetic); (3) large unreviewed doc surface (22–60).

---

*Status: PROPOSED — PENDING REVIEW. Read-only snapshot: no code, content, registry, validator,
contract, or commit was modified in producing this document.*
