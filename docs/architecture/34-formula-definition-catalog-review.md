# Formula Definition Catalog — Architecture Review

**Formula Definition Catalog · Architecture Review.** Status: **PROPOSED — PENDING
REVIEW.** A read-only review of whether a new identity-layer interface,
`formulaDefinitionCatalog`, should exist as the identity root for treatment principles
and formula families. Grounded in the live modules/templates/registry and the prior
audits (`docs/architecture/32`, `33`); it creates no content, catalog, definition,
mapping, source, contract, validation, registry change, plan, or code.

## 1. Current Ownership Model

- **`formulaDefinitions`** is `pending(...)`. Per `FormulaModule.knowledgeRequest()`
  and `formula.md`, it is labelled *"Canonical **definitions** of **treatment
  principles and formula families**."* It grounds the **strategy vocabulary** that
  `FormulaModule` produces (a treatment principle + a formula family — never a named
  formula).
- **Identity embedded inside it.** Because there is no separate catalog, a combined
  `formulaDefinitions` corpus would carry *two* concerns at once:
  1. the **identity** (canonical names) of treatment principles / formula families, and
  2. their **meaning** (the definitions).
  The identity is implicit — it is whatever names the definition entries happen to use.

## 2. Identity vs. Meaning Separation

Compared to the established tiers:

| Tier | Identity root | Meaning layer |
|---|---|---|
| Named formulas | `formulaCatalog` (wired) | `prescriptionFormulaDefinitions` (wired) |
| Herbs | `herbCatalog` (wired) | *(future herb-definitions)* |
| Principles / families | **— none —** (identity bundled in meaning) | `formulaDefinitions` (pending, combined) |

- For named formulas and herbs, **identity is a standalone Vocabulary root**; meaning
  (where it exists) references it.
- Principles/families are architecturally the **same kind of thing** as named formulas:
  a canonical vocabulary that (a) has meaning attached and (b) is referenced by
  relationship layers. They occupy the identity-root role — but currently lack a
  dedicated root, unlike the two tiers above.

**Conclusion:** principles/families occupy the same architectural role as named
formulas, yet are modeled inconsistently (no identity root).

## 3. Dependency Analysis (consumers of the principle/family vocabulary)

- **`FormulaModule`** — requests `formulaDefinitions` to ground the strategy it emits
  (principle + family). Consumes *meaning*.
- **`treatmentFormulaMap`** (pending) — associations *principle/family → named formula*.
  Its **LHS** is the principle/family vocabulary (needs *identity*).
- **`patternTreatmentMap`** (pending) — associations *pattern → principle/family*. Its
  **RHS** is the principle/family vocabulary (needs *identity*).
- **Future consumers** — principle- or family-level mappings, classification/ontology,
  analytics — would reference *identity*, not meaning.

So the principle/family **identity** is referenced by **at least three** consumers
(FormulaModule indirectly via meaning; both maps directly). Shared identity across
multiple consumers is precisely the condition that justified a standalone
`formulaCatalog`.

## 4. Reference Architecture

```
Option B (split):                     Option A (combined):

formulaDefinitionCatalog  (identity)   formulaDefinitions  (identity + meaning)
        ↓
formulaDefinitions        (meaning)
```

- **Split** mirrors `formulaCatalog → prescriptionFormulaDefinitions`: a stable identity
  root, with meaning referencing it.
- **Combined** keeps one interface owning both — simpler, but identity and meaning share
  an owner (unlike every other tier).

## 5. Mapping Symmetry (the decisive lens)

`treatmentFormulaMap` has two sides:

```
LHS = principle / family        RHS = named formula
```

- **RHS already references an identity root** (`formulaCatalog`), *not* the named-formula
  meaning layer (`prescriptionFormulaDefinitions`). This is the established, correct
  design: a map references *identities*, and integrity is checked against a stable
  vocabulary root.
- **LHS today has no identity root** — under Option A it would reference
  `formulaDefinitions` (a *meaning* interface), making the two sides of the same map
  reference different *kinds* of interface (identity root vs. meaning corpus).

**Both sides of a relationship layer should reference identity roots.** Only Option B
provides an LHS identity root (`formulaDefinitionCatalog`), making `treatmentFormulaMap`
symmetric. The same applies to `patternTreatmentMap`'s RHS (principle/family), which
would likewise reference the catalog under Option B.

*(Consistency note: `patternTreatmentMap`'s **LHS** is a pattern, whose identity is today
bundled in `diagnosisPatternDefinitions`. Splitting principles/families but not patterns
would leave that map's LHS still referencing a combined interface — a parallel
asymmetry to resolve separately; see §9.)*

## 6. Ownership Boundaries — `formulaDefinitionCatalog`

**Would own:**
- the **canonical identities (names)** of the treatment-strategy vocabulary — treatment
  principles and/or formula families (subject to the granularity decision, §9) — one
  entry per identity, identity only (Minimal Vocabulary).

**Would explicitly NOT own:**
- **meaning** of principles/families (→ `formulaDefinitions`);
- **named-formula identity or meaning** (→ `formulaCatalog` /
  `prescriptionFormulaDefinitions`);
- **herb identity** (→ `herbCatalog`);
- **pattern identity/meaning** (→ `diagnosisPatternDefinitions`);
- **which named formulas realize a family** (a *relationship* → `treatmentFormulaMap`,
  never the catalog);
- **which principle a pattern implies** (→ `patternTreatmentMap`);
- **selection, reasoning, recommendation, execution** (runtime / other layers).

## 7. Dependency Graph (DAG if split)

```
IDENTITY ROOTS
  formulaCatalog            herbCatalog            formulaDefinitionCatalog
  diagnosisPatternDefinitions*   (*combined identity+meaning, unless also split)

MEANING LAYERS
  prescriptionFormulaDefinitions → formulaCatalog
  formulaDefinitions             → formulaDefinitionCatalog

RELATIONSHIP LAYERS
  patternTreatmentMap → diagnosisPatternDefinitions (LHS)
                      → formulaDefinitionCatalog     (RHS, identity root)
  treatmentFormulaMap → formulaDefinitionCatalog     (LHS, identity root)
                      → formulaCatalog               (RHS, identity root)
```

- **Acyclic** — every edge points toward an identity root; roots have no outbound edges.
- **New root added:** `formulaDefinitionCatalog`. No runtime coupling introduced (per
  identifier resolution); map references simply target an identity root on both sides.

## 8. Alternative Analysis

**Option A — keep combined (`formulaDefinitions` owns identity + meaning).**
- *Pros:* fewest interfaces/sprints; simplest if the strategy vocabulary is small/stable;
  no new root to author/wire.
- *Cons:* inconsistent with `formulaCatalog`/`herbCatalog` identity-root pattern; maps
  reference identity embedded in a meaning corpus; `treatmentFormulaMap` stays
  asymmetric; identity references couple to a corpus whose meaning may be re-worded;
  ownership blur (one interface, two concerns).
- *Verdict:* workable, not a hard-principle violation, but architecturally inconsistent.

**Option B — split (`formulaDefinitionCatalog → formulaDefinitions`).**
- *Pros:* consistent with the established identity/meaning separation; gives both maps a
  stable identity root (symmetry); cleaner cross-content validation against a small stable
  corpus; identity is append-only/stable while meaning evolves independently;
  non-speculative (the dependents are imminent).
- *Cons:* one extra interface + its content/wiring lifecycle; potential over-abstraction
  if the vocabulary is tiny; raises the granularity fork (§9).
- *Verdict:* the additional root provides **meaningful, non-speculative value** — the two
  maps concretely need a stable LHS/RHS identity anchor.

## 9. Open Questions

- **Principle vs. family granularity (key).** The strategy vocabulary bundles *two*
  concept types: **treatment principles** (the therapeutic method) and **formula
  families** (a class of formulas realizing a principle). They are related but not
  identical; one principle may correspond to multiple families. Options:
  - **Single combined catalog** — one "strategy identity" space covering principles and
    families together, matching how both maps address "principle/family" as a unit
    (simplest; risks conflating two concept types).
  - **Two catalogs** — `treatmentPrincipleCatalog` + `formulaFamilyCatalog` (precise;
    but adds interfaces and may require a principle↔family relationship, and forces the
    maps to choose which they reference).
  This is the central unresolved question and should be decided before authoring. A single
  combined catalog is the simplest path and matches current map semantics; two catalogs
  are warranted only if principles and families must be mapped independently.
- **Single vs. multiple catalogs** — corollary of the above; also whether
  `FormulaModule`'s output (which emits both a principle and a family) implies the map
  intermediate is a *pair* rather than a single token.
- **Pattern-side consistency** — should `diagnosisPatternDefinitions` be split the same
  way (a pattern identity root for `patternTreatmentMap`'s LHS)? Out of scope here, but
  should be decided consistently with this outcome.
- **Naming** — `formulaDefinitionCatalog` vs. a name reflecting the chosen granularity
  (e.g., `treatmentStrategyCatalog`, `formulaFamilyCatalog`).

Settled (not open): `formulaDefinitions` ≠ `prescriptionFormulaDefinitions` (strategy vs.
execution — audit §4); no cycles; the transport/loader/registry/Option B pattern.

## 10. Sufficiency Assessment

- **Should `formulaDefinitionCatalog` exist?** **Yes (recommended).** Principles/families
  occupy the same identity-root role as named formulas and herbs, are referenced for
  *identity* by both imminent maps, and their absence forces `treatmentFormulaMap` into
  an asymmetric design. A dedicated identity root restores consistency and gives the
  relationship layers a stable anchor — the same justification that produced
  `formulaCatalog`.
- **Is the current architecture coherent?** Yes, and acyclic; the split is a consistency
  refinement, not a fix for incoherence.
- **What must be decided before implementation?** The **granularity fork** (§9): single
  combined strategy catalog vs. two catalogs. Recommend a single combined
  `formulaDefinitionCatalog` for v1 unless principles and families must be mapped
  independently.
- **Recommended sequence (for review, not executed):** approve the split and its
  granularity → catalog content sprint (identity) → definitions content sprint (meaning,
  referencing the catalog) → wire both → then the maps (`patternTreatmentMap`,
  `treatmentFormulaMap`), each with build-time cross-content checks into the catalog.
  If Option A is chosen instead, a single `formulaDefinitions` content sprint may begin
  directly, accepting the documented asymmetry.

## Scope

Read-only architecture review. No content, catalogs, definitions, mappings, generators,
sources, contracts, validation, registry changes, implementation plans, or code; no
change to any existing file other than the creation of this document.

STOP. Review complete. No implementation begun. Nothing committed. Awaiting review.
