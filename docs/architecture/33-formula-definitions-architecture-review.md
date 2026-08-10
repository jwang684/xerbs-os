# Formula Definitions — Architecture Review

**Formula Definitions · Architecture Review.** Status: **PROPOSED — PENDING REVIEW.** A
read-only review of whether `formulaDefinitions` should remain a single interface
(identity + meaning) or be split into an identity catalog + a meaning layer, mirroring
`formulaCatalog → prescriptionFormulaDefinitions`. Grounded in the live modules,
templates, and registry; it creates no content, code, or registry change and modifies
nothing. It builds on the Knowledge Architecture Audit (`docs/architecture/32`).

## 1. Grounded Current State (verified)

- **Registry** — `formulaDefinitions` is `pending("formulaDefinitions")` (absent →
  Option B). Wired siblings: `formulaCatalog` (135), `prescriptionFormulaDefinitions`
  (135), `herbCatalog` (288). Also pending: `diagnosisPatternDefinitions`,
  `patternTreatmentMap`, `treatmentFormulaMap`.
- **Consumer** — only `FormulaModule` requests it:
  `knowledgeRequest()` → `{ formulaDefinitions: true, patternTreatmentMap: true }`;
  `variables()` reads `knowledgeOrNone(this.knowledge, "formulaDefinitions")`.
- **Prompt usage** — `formula.md` renders `{{formulaDefinitions}}` under the label
  *"Canonical **definitions** of **treatment principles and formula families**.
  Definitions only — reference material, not rules."*
- **What FormulaModule produces** — a treatment **strategy**: a treatment principle
  (e.g. a stated principle) plus a formula **family** (a class of formulas), never a
  specific named formula (that is Prescription's job). So `formulaDefinitions` grounds
  the *strategy vocabulary*, at a tier above named formulas.
- **Downstream references to the same vocabulary** (from the two pending maps' prompt
  labels):
  - `patternTreatmentMap` (formula.md): associations *pattern → treatment
    principle/family* — its **RHS** is the principle/family vocabulary.
  - `treatmentFormulaMap` (prescription.md): associations *treatment principle/family →
    candidate named formulas* — its **LHS** is the principle/family vocabulary; its
    **RHS** is named formulas (already owned by `formulaCatalog`).

**Decisive observation:** `treatmentFormulaMap`'s **RHS references an identity root**
(`formulaCatalog`), *not* the named-formula meaning layer
(`prescriptionFormulaDefinitions`). For symmetry, its **LHS** (principle/family) should
reference an *identity root* too — but today no such root exists; the only home for
principle/family identity is bundled inside `formulaDefinitions` (a meaning interface).

## 2. Current Architecture (dependency graph)

```
IDENTITY ROOTS         formulaCatalog        herbCatalog
                            │
MEANING LAYERS   prescriptionFormulaDefinitions → formulaCatalog
                 formulaDefinitions            (identity + meaning combined; root)
                 diagnosisPatternDefinitions   (identity + meaning combined; root)

RELATIONSHIP     patternTreatmentMap → diagnosisPatternDefinitions (LHS)
                                     → formulaDefinitions          (RHS, identity-in-meaning)
                 treatmentFormulaMap → formulaDefinitions          (LHS, identity-in-meaning)
                                     → formulaCatalog              (RHS, identity root)
```

Asymmetry visible: for **named formulas**, identity (`formulaCatalog`) and meaning
(`prescriptionFormulaDefinitions`) are **separate**; for **principles/families**, they
are **combined** in `formulaDefinitions`. The maps therefore reference an *identity
root* on one side and an *identity-embedded-in-meaning* interface on the other.

## 3. Option A — Single Interface (retain combined)

Structure: `formulaDefinitions` owns both identity and meaning of principles/families.

- **Pros**
  - **Simplicity** — one interface, one corpus, one content sprint, one registry entry.
  - **Fewer moving parts** — no extra derivation/source/contract/cross-content wiring.
  - **Adequate if the vocabulary is small/stable** and rarely re-organized.
- **Cons**
  - **Inconsistent with the established identity/meaning split** used for named formulas
    (`formulaCatalog → prescriptionFormulaDefinitions`) and with the vocabulary roots
    `formulaCatalog`/`herbCatalog`.
  - **Maps reference identity embedded in a meaning corpus.** Both maps' referential
    integrity would target `formulaDefinitions` — coupling stable identity references to
    a corpus whose *meaning* content may be re-worded/re-organized. Canonical Naming
    Stability for principle/family identities is weaker when identity lives inside the
    meaning layer.
  - **Asymmetric maps** — `treatmentFormulaMap` would reference an identity root
    (`formulaCatalog`) on one side and a meaning interface on the other.
  - **Ownership blur** — a single interface owns two concerns (naming + meaning),
    unlike every other tier in the system.
- **Principle violation?** It does not violate a *hard* frozen rule, but it is
  **inconsistent** with the Identity-vs-Meaning ownership separation the architecture
  otherwise applies (Minimal Vocabulary / Canonical Naming Stability were defined for
  standalone identity roots).

## 4. Option B — Split Identity and Meaning

Structure: `formulaDefinitionCatalog` (identity root) → `formulaDefinitions` (meaning),
mirroring `formulaCatalog → prescriptionFormulaDefinitions`.

- **Pros**
  - **Consistency** with the named-formula tier and with `herbCatalog` — identity is a
    standalone Vocabulary root; meaning references it.
  - **Stable identity root for the maps.** Both `patternTreatmentMap` (RHS) and
    `treatmentFormulaMap` (LHS) reference the *catalog* (identity), not the meaning
    corpus — exactly as `treatmentFormulaMap` RHS already references `formulaCatalog`.
    The maps become **symmetric** (identity roots on both sides).
  - **Cleaner validation** — cross-content checks resolve map references against a
    small, stable identity corpus; meaning validation stays independent.
  - **Independent growth** — meaning can be re-worded without touching identity; new
    principle/family identities append to the catalog additively.
- **Cons**
  - **More interfaces/sprints** — a catalog content sprint + a definitions content
    sprint + two wirings, versus one.
  - **Possible over-abstraction** if the principle/family vocabulary is tiny.
  - **Granularity question** (see §9) — "treatment principles" and "formula families"
    may be *two* vocabularies, risking further splitting.
- **Value assessment** — the additional layer provides **meaningful, non-speculative
  value**: the dependents (both maps) are concrete and imminent (next on the roadmap),
  and they specifically need stable *identity* to reference. This is the same
  justification that produced `formulaCatalog`.

## 5. Dependency Comparison

**Current (combined):**
```
patternTreatmentMap → diagnosisPatternDefinitions , formulaDefinitions
treatmentFormulaMap → formulaDefinitions , formulaCatalog
formulaDefinitions  → (root: identity+meaning)
```

**If split:**
```
formulaDefinitionCatalog → (identity root)
formulaDefinitions       → formulaDefinitionCatalog            (meaning → identity)
patternTreatmentMap      → diagnosisPatternDefinitions , formulaDefinitionCatalog
treatmentFormulaMap      → formulaDefinitionCatalog , formulaCatalog
```

- **Identity roots:** current = {formulaCatalog, herbCatalog} (+ combined
  formulaDefinitions, diagnosisPatternDefinitions acting as roots); split adds
  `formulaDefinitionCatalog` as a clean root.
- **Meaning layers:** current `formulaDefinitions` (combined); split `formulaDefinitions`
  (pure meaning → catalog), like `prescriptionFormulaDefinitions`.
- **Relationship layers:** unchanged in count; under split they reference **identity
  roots on every side** (more consistent).
- **Cycles:** none in either model (both are DAGs; all edges point toward roots).
- **Added complexity:** one extra interface (+ its wiring). No runtime coupling added;
  the maps' references simply retarget from a meaning interface to an identity root.

## 6. Ownership Comparison

| Concern | Current (combined) | Split |
|---|---|---|
| Principle/family **identity** (canonical names) | inside `formulaDefinitions` | **`formulaDefinitionCatalog`** (standalone root) |
| Principle/family **meaning** | inside `formulaDefinitions` | `formulaDefinitions` (references catalog) |
| Named-formula identity | `formulaCatalog` | `formulaCatalog` (unchanged) |
| Named-formula meaning | `prescriptionFormulaDefinitions` | unchanged |
| Map references (both maps) | target a meaning interface for identity | target identity roots on all sides |

**What `formulaDefinitions` actually owns today** (per FormulaModule + formula.md):
the *meaning* of treatment principles and formula families — reference definitions of
the strategy vocabulary. **What it does NOT own:** named formulas (`formulaCatalog` /
`prescriptionFormulaDefinitions`), herb identities (`herbCatalog`), diagnosis patterns
(`diagnosisPatternDefinitions`), and any treatment mapping (the two map interfaces). In
the combined model it *additionally* owns the principle/family *identity*; the split
extracts that into the catalog.

## 7. Future Growth Analysis

- **Imminent dependents:** `patternTreatmentMap` and `treatmentFormulaMap` both
  reference the principle/family vocabulary and are the next interfaces on the roadmap —
  their referential integrity wants a **stable identity root**.
- **Later dependents:** future principle-mappings or family-mappings, and possibly a
  richer classification/ontology, would likewise reference identity, not meaning.
- **Do dependents require stable identity roots?** **Yes for a clean, symmetric design.**
  A combined interface *can* serve them (they can reference identities embedded in the
  meaning corpus), but every such dependent then couples to the meaning corpus, and the
  maps stay asymmetric. A split gives all current and future map/relationship layers a
  stable, meaning-independent anchor — exactly what `formulaCatalog` provides on the
  named-formula side.

## 8. Recommendation

**Split Into Catalog + Definitions (Option B).**

Justification:
1. **Symmetry with an existing, load-bearing reference.** `treatmentFormulaMap` already
   references `formulaCatalog` (an identity root) on its RHS. Splitting gives its LHS a
   matching identity root (`formulaDefinitionCatalog`), so the map references identity
   roots on both sides — consistent, and cleaner for cross-content validation.
2. **Consistency with the established pattern.** The architecture already separates
   identity from meaning for named formulas (`formulaCatalog →
   prescriptionFormulaDefinitions`) and treats identity as standalone roots
   (`formulaCatalog`, `herbCatalog`). Principles/families are in the identical position
   (identity shared by ≥3 consumers: FormulaModule + both maps).
3. **Non-speculative.** The dependents are concrete and next on the roadmap, so this is
   not premature abstraction — it is building the root the imminent maps need.
4. **Stability & independent growth.** Identity stays stable and append-only; meaning can
   evolve without destabilizing map references (Canonical Naming Stability).

The cost (one extra interface + wiring) is the same, proven, low-risk lifecycle already
executed three times. Option A remains acceptable if the reviewer prioritizes minimal
interface count over architectural symmetry, but it leaves the maps asymmetric and
couples identity to meaning.

## 9. Open Questions

- **Principle vs. family granularity (key).** `formulaDefinitions` bundles *two* concept
  types — **treatment principles** and **formula families**. Are these one vocabulary or
  two? The split could be a single combined `formulaDefinitionCatalog` (principles +
  families together) or two catalogs. Recommend deciding this in the split's content
  review; a single combined catalog is likely sufficient and simplest, but the
  distinction should be explicit.
- **Naming.** `formulaDefinitionCatalog` (per this prompt) vs. a clearer name such as
  `treatmentStrategyCatalog` / `formulaFamilyCatalog`. Naming should reflect the chosen
  granularity.
- **Symmetric treatment of patterns.** `diagnosisPatternDefinitions` has the same
  combined identity+meaning shape. If the split is adopted here for consistency, the same
  question applies to patterns (whose identity is referenced by `patternTreatmentMap`
  LHS). Out of scope for this review, but should be decided consistently.

Settled (not open): `formulaDefinitions` is distinct from `prescriptionFormulaDefinitions`
(strategy vs. execution tier — audit §4); no cycles; transport/loader/registry/Option B
pattern.

## 10. Sufficiency Assessment

- **Is the current architecture coherent?** **Yes** — it is an acyclic three-tier
  structure. The only wrinkle is the identity/meaning asymmetry for principles/families
  and patterns; that is a refinement, not an incoherence.
- **Is `formulaDefinitions` correctly modeled today?** **Partially.** Its *existence and
  meaning ownership* are correct and justified (distinct strategy-tier meaning layer). Its
  *bundling of identity with meaning* is the inconsistency this review addresses.
- **Should a content sprint begin next, or an architectural split first?** **Resolve the
  split decision first.** Because both imminent maps reference the principle/family
  identity, authoring a combined corpus now and splitting later would mean re-homing
  identities mid-stream. The cheaper, cleaner order is: **(1) approve the split (Option
  B) and its granularity (§9), then (2) run the catalog content sprint, then the
  definitions content sprint, then wire, then the maps.** If the reviewer chooses Option
  A instead, a single `formulaDefinitions` content sprint may begin immediately.
- **Recommended next step:** a short **Formula Definition Catalog content review**
  (deciding principle-vs-family granularity), then its content + wiring — ahead of the
  meaning layer and the maps.

## Scope

Read-only architecture review. No content corpora, generators, sources, contracts,
registry bindings, module changes, or template changes; no implementation begun; no
change to any existing file other than the creation of this document.
