# Treatment Formula Map — Specification

**Treatment Formula Map · Specification.** Status: **PROPOSED — PENDING REVIEW.** The formal
conceptual specification for `treatmentFormulaMap` — the architecture's **second relationship
layer** and **final registry interface**, bridging the strategy tier to the execution tier. It
authors no content or mappings and defines no implementation (no schema, source, contract,
generator, validator, registry change, or test). It conforms to the frozen transport/loader/
registry architecture (`docs/architecture/11`–`16`), the approved architecture review
(`docs/architecture/57`, Option A accepted), the proven `patternTreatmentMap` precedent
(`51`–`55`), and the wired identity roots it references. It changes no existing file. Settled
decisions are frozen and not reopened.

**Grounding (verified):** `treatmentFormulaMap` is `pending(...)`; `PrescriptionModule`
requests it and renders `{{treatmentFormulaMap}}` as *"reference associations from a treatment
principle/family to candidate named formulas — Reference only, NEVER deterministic rules, and
NEVER automatic selection."* The two identity roots — `formulaDefinitionCatalog` (69) and
`formulaCatalog` (135) — are wired and available.

---

## A. Purpose

- **What `treatmentFormulaMap` is.** The **strategy→execution relationship layer**: an
  authoritative set of *reference associations* linking a treatment-principle identity to a
  named-formula identity. It answers only *"which named formula(s) are associated with this
  treatment principle?"* — as reference material, never as a rule or selection.
- **Position in the chain:**
  `Diagnosis Pattern → (patternTreatmentMap) → Treatment Principle → (treatmentFormulaMap) →
  Named Formula → (execution) → Herb`.
  This interface is the second bridge, connecting the strategy tier to the execution tier.
- **Consumer.** `PrescriptionModule` uses it as optional reference context to help converge on
  one concrete prescription; it is not a dispatch table.
- **Ownership.** The interface owns **only the associations** — nothing about principle or
  formula identity or meaning.

## B. Ownership Model

**Owns:** treatment-principle ↔ named-formula **associations** (identity-to-identity
references).

| Interface | Owns | Does NOT own |
|---|---|---|
| `treatmentFormulaMap` | the **association** between a principle identity and a formula identity | everything below |

Excluded concerns and their owners:

| Excluded | Owner |
|---|---|
| principle identity | `formulaDefinitionCatalog` |
| formula identity | `formulaCatalog` |
| principle meaning | `formulaDefinitions` |
| formula meaning | `prescriptionFormulaDefinitions` |
| recommendation logic / best/preferred choice | reasoning layer (`PrescriptionModule`) |
| ranking / priority | reasoning layer |
| confidence / probabilities / weights | reasoning layer |
| rationale | reasoning layer |
| automatic selection | reasoning layer (template forbids it here) |
| prescription generation / execution priority | execution tier (`PrescriptionModule` output) |
| reasoning | runtime modules |
| herbs | `herbCatalog` / execution tier |

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- **A `treatmentFormulaMap` slice is a set of association entries.**
- **A v1 entry links one treatment-principle identity to a named-formula identity** — a
  reference to a `formulaDefinitionCatalog` identity and a reference to a `formulaCatalog`
  identity. It carries **nothing else** (no metadata, ranking, confidence, weight, or
  rationale).
- **Representation alternatives** (analyzed, not chosen here):
  - *flat-pair* — one principle→formula association per record (a principle with several
    candidate formulas recurs across records);
  - *grouped* — one principle heading its associated formulas.
  Both express the identical relationship set; the authored representation is a later
  representation-review/authoring-rules decision (consistent with Doc 54's flat-pair precedent
  for `patternTreatmentMap`).
- **Many-to-many semantics:** one principle → many candidate formulas; one formula → many
  principles.

**Why relationship ownership is independent of cardinality:** the map records *that* two
identities are related; how many relations a principle or formula has carries no selection or
preference meaning. Restricting cardinality (e.g. one-to-one) would encode a selection
decision the map must not own. The only structural uniqueness rule is *no duplicate pair*,
which does not restrict cardinality.

## D. Relationship Semantics

**What an association communicates:** only that a treatment-principle identity and a
named-formula identity are **related** — i.e. the formula is a candidate reference for the
principle.

**What it does NOT communicate:** recommendation, best choice, preferred choice, ranking,
confidence, certainty, probability, prescription order, or execution priority. Selecting and
committing to a formula — and any confidence/rationale behind it — is `PrescriptionModule`'s
runtime judgement (the template mandates "NEVER automatic selection"). Absence of an
association is not a prohibition; Option-B fallback keeps partial coverage valid and the module
may still reason clinically.

## E. Scope Boundary

| Belongs in `treatmentFormulaMap` | Does NOT belong |
|---|---|
| principle ↔ formula reference associations | principle / formula **identities** (referenced only) |
| references to `formulaDefinitionCatalog` identities | principle / formula **meanings** |
| references to `formulaCatalog` identities | rationale, ranking, confidence, weights, probabilities |
| — | treatment selection / formula selection |
| — | herb execution |
| — | workflow logic |
| — | diagnosis logic |
| — | automatic/deterministic routing |

## F. Source of Truth Model

- **Future authoritative file** — a single authored markdown under
  `src/ai/knowledge/content/` (e.g. `treatment-formula-map.md`), representation-neutral,
  expressing principle→formula associations by canonical name. It is the single source of truth
  for the relationship.
- **Generated artifacts are projections only** — any future derived artifact is produced
  deterministically from the markdown, is non-authoritative, and is verified against it (**no
  drift**). The markdown always wins.

## G. Dependency Model

```
formulaDefinitionCatalog        formulaCatalog        (identity roots — reference nothing)
        ↑                              ↑
        └────── treatmentFormulaMap ───┘        (LHS → principle id ; RHS → formula id)
                       ↑
                PrescriptionModule (runtime consumer)
```

- **Two-sided reference model** — references `formulaDefinitionCatalog` (LHS) and
  `formulaCatalog` (RHS); both wired.
- **Outbound:** two edges, both to identity roots. **Inbound:** `PrescriptionModule` (runtime).
- **Acyclic:** both edges terminate at roots that reference nothing; no cycle possible.
- **No runtime coupling** — per-identifier resolution; references are content/build-time.

## H. Cross-Content Validation Model

A **dual** build-time validator (the second such, mirroring `patternTreatmentMapCrossContent`),
both checks enforced:

- **Validation A (principle side):** every referenced principle **∈ `formulaDefinitionCatalog`**;
  a principle not in the catalog is an **orphan principle** and is reported.
- **Validation B (formula side):** every referenced formula **∈ `formulaCatalog`**; a formula
  not in the catalog is an **orphan formula** and is reported.

Build-time, side-effect-free, reports all issues (no fail-fast), reads derived corpora (not the
runtime bundle). Coverage/parity reporting is **informational only** (Option B — no coverage
requirement). **Validator ownership:** reference integrity only — structure and duplicate-pair
uniqueness belong to the **contract** (Doc 55); meaning/reasoning belong elsewhere.

## I. Future Evolution Model

- **Relationship ownership preserved** — the map always owns only associations; it never
  acquires identity, meaning, or reasoning ownership.
- **Additive growth** — new associations append; approved associations preserved; prior batches
  never rewritten (append-only).
- **Reference-not-duplicate** — associations always reference catalog identities and never
  restate names or meaning.
- **Metadata-beside rule** — any future weight, confidence, rationale, or ranking is a
  **separate** interface/layer referencing the association (or the identities), never folded
  into a map entry. Adding such metadata must not migrate ownership into the map.

## J. Invariants

1. **Relationship Ownership Only** — the map owns principle ↔ formula associations and nothing
   else.
2. **Identity Reference Only** — principle/formula identities are owned by their catalogs; the
   map only references them.
3. **Meaning Independence** — principle/formula meaning is owned by the definition layers; the
   map carries no meaning.
4. **No Recommendation Ownership** — no recommendations, best/preferred choices.
5. **No Ranking Ownership** — no ordering or priority.
6. **No Confidence Ownership** — no confidence, probabilities, or weights.
7. **No Automatic Selection Ownership** — never a deterministic rule or auto-select engine.
8. **Many-to-Many Semantics** — associations are inherently many-to-many; no cardinality
   restriction encodes a selection.
9. **Acyclic Dependency** — the two edges terminate at roots that reference nothing; no cycle.
10. **Dual Cross-Content Requirement** — principle ∈ `formulaDefinitionCatalog` and formula ∈
    `formulaCatalog`, both enforced at build time.
11. **Registry Evolution Principle** — served by a single registry entry; loader/framework
    unchanged.
12. **Source-of-Truth Principle** — one authoritative markdown; any derived form is a
    non-authoritative, no-drift projection.
13. **No Formula Meaning Ownership** — never restates or defines named formulas.
14. **No Herb Ownership** — never references herbs or execution.
15. **Metadata-Beside Rule** — future metadata attaches beside the map by reference; ownership
    never migrates in.
16. **No Duplicate Pair** — the same `(principle, formula)` association appears at most once
    (contract-enforced).
17. **Consumer Independence** — consumed only by `PrescriptionModule`; no knowledge slice
    depends on the map; Option-B fallback keeps partial coverage valid.
18. **No Reasoning Ownership** — selection/decision logic stays in the runtime module.

## K. Open Questions

**Genuine, unresolved (for authoring rules / representation review):**
- **Authored representation shape** — flat-pair (per Doc 54 precedent) vs grouped; to be fixed
  in authoring rules / a brief representation note.
- **Derived runtime shape** — presumptively `{ principle, formula }` pairs (mirroring
  `patternTreatmentMap`'s `{ pattern, principle }`); to be ratified.
- **Informational coverage reporting** — exact coverage fields to surface (non-failing).
- **Authoring ergonomics** — batch cadence and duplicate-scan workflow.

**Explicitly NOT reopened (settled):** Option A; ownership model; dependency model; relationship
semantics; dual cross-content model.

## L. Sufficiency Assessment

**The architecture is sufficient to begin authoring-rule design; no architectural blockers
remain.** Purpose, ownership (relationship-only, full exclusion matrix), entry model
(identity→identity, many-to-many), relationship semantics (reference-only), scope boundary,
source-of-truth, dependency model (two-sided, acyclic, no runtime coupling), the dual
cross-content model, evolution rules, and an 18-item invariant set are all resolved. Both
identity roots are wired and the consumer already requests/renders the interface, so the
interface is fully unblocked. The remaining open items are authoring-representation decisions,
not architectural blockers.

## Deliverable Summary

- **Ownership analysis:** §B (owns associations only; full exclusion matrix).
- **Dependency analysis:** §G (two-sided, references two wired identity roots, acyclic).
- **Relationship-semantics analysis:** §D (relatedness only; never recommendation/ranking/
  confidence/selection).
- **Validation analysis:** §H (dual: principle-side + formula-side; orphan reporting;
  informational coverage; reference-integrity ownership only).
- **Sufficiency assessment:** §L (sufficient to begin authoring rules; no blockers).

## Scope

Specification only. No content, mappings, derivation code, generators, sources, contracts,
validators, tests, registry entries, runtime wiring, or commits; no change to any existing file
other than the creation of this document.

STOP. Specification complete. No content authored. Nothing committed. Awaiting review.
