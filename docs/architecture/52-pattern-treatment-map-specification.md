# Pattern Treatment Map — Specification

**Pattern Treatment Map · Specification.** Status: **PROPOSED — PENDING REVIEW.** The
formal conceptual specification for the `patternTreatmentMap` knowledge interface — the
architecture's **first relationship (mapping) layer**, bridging the diagnosis tier to the
strategy tier. It authors no content, no mappings, and defines no implementation (no
schema, source, contract, generator, validator, registry change, or test). It conforms to
the frozen transport/loader/registry architecture (`docs/architecture/11`–`16`), the
approved architecture review (`docs/architecture/51`, Option A accepted), and the wired
identity roots it references. It changes no existing file. Option A, ownership, and
dependency decisions are settled and not reopened.

**Grounding (verified):** `patternTreatmentMap` is `pending(...)`; `FormulaModule` requests
it and renders `{{patternTreatmentMap}}` as *"reference associations from patterns →
treatment principles/families — Reference only, NEVER deterministic rules."* The two
identity roots it references — `diagnosisPatternCatalog` (85) and
`formulaDefinitionCatalog` (69) — are wired and available.

---

## A. Purpose

- **What `patternTreatmentMap` is.** The **diagnosis→strategy relationship layer**: an
  authoritative set of *reference associations* linking a diagnostic pattern identity to a
  treatment-principle identity. It answers only *"which treatment principle(s) are
  associated with this pattern?"* — as reference material, never as a rule.
- **Tier ownership context:**
  - `diagnosisPatternCatalog` owns **diagnosis identity** (pattern names);
  - `diagnosisPatternDefinitions` owns **diagnosis meaning**;
  - `formulaDefinitionCatalog` owns **treatment-principle identity**;
  - `formulaDefinitions` owns **treatment-principle meaning**;
  - **`patternTreatmentMap` owns only the *relationship* between those two identity
    roots** — nothing about their identity or meaning.
- **Consumer.** `FormulaModule` uses it as optional reference context to help reason from a
  diagnosis pattern toward a treatment strategy; it is not a dispatch table.

## B. Ownership Model

**Owns:** pattern ↔ principle **associations** (identity-to-identity references).

| Interface | Owns | Does NOT own |
|---|---|---|
| `patternTreatmentMap` | the **association** between a pattern identity and a treatment-principle identity | everything below |

Excluded concerns and their proper owners:

| Excluded | Owner |
|---|---|
| identity (pattern names) | `diagnosisPatternCatalog` |
| identity (principle names) | `formulaDefinitionCatalog` |
| definitions / meaning (patterns) | `diagnosisPatternDefinitions` |
| definitions / meaning (principles) | `formulaDefinitions` |
| recommendations | reasoning layer / runtime modules |
| rankings / priorities | reasoning layer (a selection judgement) |
| rationale / explanations | reasoning layer (`FormulaModule`) |
| probabilities / confidence | reasoning layer (runtime judgement) |
| treatment selection | `FormulaModule` (strategy) |
| formula selection | Prescription tier (`formulaCatalog` / `prescriptionFormulaDefinitions`) |
| reasoning chains | `FormulaModule` at runtime |
| decision procedures | reasoning layer (forbidden as "deterministic rules") |
| symptoms | not owned by any knowledge slice; runtime evidence |
| diagnosis criteria | reasoning layer (`DiagnosisModule`) |
| clinical guidance | reasoning / execution layers |

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- **A `patternTreatmentMap` slice is a set of association entries.**
- **A v1 entry conceptually links one pattern identity to its associated treatment-
  principle identity(ies)** — a reference to a `diagnosisPatternCatalog` identity, and a
  reference to one or more `formulaDefinitionCatalog` identities. It carries **nothing
  else** (no metadata, rationale, weight, rank, or confidence).

**Alternatives analyzed:**
- *Flat pair per line* (one pattern → one principle per entry) — simplest; a pattern with
  several associations appears in several entries.
- *Grouped* (one pattern → a list of principles) — same relationship content, grouped by
  pattern for human legibility.

Both express the identical relationship set and are equivalent under Option A; the exact
authored shape is an authoring-rules/spec-detail (§F, §K), constrained only to reference
identities and carry no metadata. **Preferred form:** `Pattern Identity → Treatment
Principle Identity` associations — pure identity-to-identity references, because that is the
minimal representation that owns *only* the relationship (consistent with catalogs owning
identity only and definitions owning meaning only).

**Semantic model — many-to-many** (see §D): one pattern may associate with many principles,
and one principle with many patterns. Restricting to one-to-one or many-to-one would encode
a selection decision ("which principle wins") that the map must not own.

## D. Relationship Semantics

**What the presence of an association communicates:** *"these two concepts are related"* —
specifically, that a treatment principle is a recognized reference association for a
diagnostic pattern. Nothing more.

**What it does NOT communicate:**
- not a **recommendation**,
- not a **priority** or ordering,
- not the **best choice**,
- not a **preferred treatment**,
- not **confidence** or **certainty**,
- not a **deterministic rule** ("IF pattern THEN principle").

The map is a *reference association set*. Selecting among associated principles — and the
rationale, confidence, or ranking behind that selection — is the reasoning layer's job
(`FormulaModule`), never the map's. Absence of an association is likewise not a prohibition;
Option-B fallback keeps partial coverage valid and the module may still reason clinically.

## E. Scope Boundary

| Belongs | Does NOT belong |
|---|---|
| pattern ↔ principle reference associations | deterministic routing / dispatch |
| references to `diagnosisPatternCatalog` identities | ranking / prioritization |
| references to `formulaDefinitionCatalog` identities | treatment rules |
| — | diagnosis rules / diagnosis criteria |
| — | workflow / decision logic |
| — | meaning, rationale, confidence, recommendations |
| — | formulas, herbs, execution |

**Explicitly rejected:** deterministic routing, ranking, treatment rules, diagnosis rules,
and workflow logic. The map is reference-only.

## F. Source of Truth

- **Future authoritative file** — a single authored markdown under
  `src/ai/knowledge/content/` (e.g. `pattern-treatment-map.md`), representation-neutral,
  expressing pattern→principle associations by canonical name. It is the single source of
  truth for the relationship.
- **Generated projections** — any future derived artifact is produced deterministically
  from the authored markdown, is non-authoritative, and is verified against it (**no
  drift**). The markdown always wins.
- No implementation details are fixed here; the authored representation is a first
  *two-sided* content shape (references on both sides) and its exact layout is an
  authoring-rules decision (§K).

## G. Dependency Model

```
diagnosisPatternCatalog        formulaDefinitionCatalog        (identity roots — reference nothing)
        ↑                              ↑
        └────── patternTreatmentMap ───┘        (LHS → pattern id ; RHS → principle id)
                      ↑
               FormulaModule (runtime consumer)
```

- **Two-sided reference model** — the map references two identity roots: patterns (LHS,
  `diagnosisPatternCatalog`) and principles (RHS, `formulaDefinitionCatalog`). This is the
  first interface with references on both sides.
- **Outbound:** two edges, both to identity roots. **Inbound:** `FormulaModule` (runtime).
- **Acyclic:** both edges terminate at roots that reference nothing; no cycle possible.
- **No runtime coupling** — per-identifier resolution; the references are content/build-time
  (cross-content), not runtime load-order requirements.

## H. Cross-Content Validation Model

**Mandatory — this is the first interface requiring dual (two-sided) reference validation.**
Two independent build-time checks, both enforced:

- **Validation A (pattern side):** every referenced pattern **∈ `diagnosisPatternCatalog`**.
  A pattern reference not in the catalog is an **orphan pattern reference** and must be
  reported.
- **Validation B (principle side):** every referenced principle **∈
  `formulaDefinitionCatalog`**. A principle reference not in the catalog is an **orphan
  principle reference** and must be reported.

Both are build-time, side-effect-free, report all issues (no fail-fast), and read the
authoritative/derived corpora — never the runtime bundle. Direction is one-way (map →
identity roots); acyclic. (Coverage/parity reporting — e.g. patterns or principles lacking
any association — may be included as informational, following the existing validators'
precedent; it is not a hard requirement since partial coverage is valid.) **No code is
designed here — only architectural ownership of the two checks.**

## I. Future Evolution

- **Relationship ownership preserved** — the map always owns only associations; it never
  acquires identity, meaning, or reasoning ownership.
- **Additive growth** — new associations append; approved associations are preserved;
  prior batches are never rewritten (append-only).
- **Reference-not-duplicate** — associations always reference catalog identities and never
  restate names or meaning.
- **Metadata, if ever added, lives beside the map** — any future weight, rationale,
  confidence, or ranking is a *separate* interface/layer referencing the association (or the
  identities), never folded into a map entry. Adding such metadata must not change the map's
  ownership; the map stays a pure relationship layer.

## J. Invariants

1. **Relationship Ownership** — the map owns pattern ↔ principle associations and nothing
   else.
2. **Identity Separation** — pattern and principle identities are owned by their catalogs;
   the map only references them.
3. **Meaning Separation** — pattern and principle meaning are owned by their definition
   layers; the map carries no meaning.
4. **Reference-Only Semantics** — an association communicates relatedness, not
   recommendation, priority, or certainty.
5. **No Recommendation Ownership** — no recommendations, preferences, or "best choice".
6. **No Reasoning Ownership** — no rationale, confidence, probabilities, ranking, or
   decision procedures.
7. **Two-Sided Referential Integrity** — every pattern ∈ `diagnosisPatternCatalog` and
   every principle ∈ `formulaDefinitionCatalog`.
8. **Stable Identity References** — references rely on canonical names kept stable by the
   catalog roots (Canonical Naming Stability).
9. **Acyclic Dependencies** — the map's two edges terminate at roots that reference
   nothing; no cycle.
10. **Relationship Neutrality** — the map is reference associations only, never a
    deterministic rule or dispatch engine.
11. **Many-to-Many Semantics** — associations are inherently many-to-many; no cardinality
    restriction encodes a selection.
12. **Single Source of Truth** — one authoritative markdown holds the relationships; any
    derived form is a non-authoritative, no-drift projection.
13. **No Runtime Coupling** — resolution is per-identifier; references are
    content/build-time only.
14. **Additive / Append-Only Evolution** — growth by extension; approved associations and
    frozen batches are never rewritten.
15. **Metadata-Beside Rule** — any future metadata attaches beside the map by reference and
    never changes the map's ownership.
16. **Consumer Independence** — consumed only by `FormulaModule`; no knowledge slice depends
    on the map; Option-B fallback keeps partial coverage valid.
17. **No Formula/Execution Ownership** — the map never references named formulas or
    execution; principle→formula is a separate downstream interface.

## K. Open Questions

**Genuine, unresolved (for the authoring rules / authoring plan):**
- **Authored representation shape** — the first *two-sided* content corpus: how one
  association is written in markdown (flat pattern→principle pairs vs. one pattern with a
  grouped principle list) so it derives losslessly and supports both cross-content checks.
- **Derivation/runtime shape** — the structured form of an association (e.g. a
  `{ pattern, principle }` pair vs. `{ pattern, principles[] }`); to be ratified with the
  representation decision, staying Option-A minimal.
- **Coverage/parity policy** — whether every pattern must have ≥1 association, or whether
  partial coverage (Option B) is accepted (recommended: partial coverage valid; coverage
  reported informationally).
- **Authoring cadence** — batch grouping for review.

**Explicitly NOT reopened (settled):** Option A vs B; ownership; dependency model; the
two-sided cross-content requirement.

## L. Sufficiency

**The specification is sufficient to begin the authoring rules and content sprint without
additional architecture work.** Purpose, ownership (relationship-only, with a full
exclusion matrix), entry model (Option-A identity→identity, many-to-many), relationship
semantics (reference-only), scope boundary, source-of-truth, dependency model (two-sided,
acyclic, no runtime coupling), the dual cross-content validation model, evolution rules, and
a 17-item invariant set are all resolved. Both identity roots are wired, so the interface is
unblocked. The remaining open items are authoring-representation decisions (the new
two-sided content shape), not architectural blockers.

Recommended next step (for review, not executed): a lightweight **authoring-rules** document
(defining the two-sided authored representation), then content creation, then the wiring
lifecycle (derivation → source → contract → **dual cross-content validator** → registry
upgrade).

## Deliverable Summary

- **Ownership analysis:** §B (owns associations only; full exclusion matrix).
- **Dependency analysis:** §G (two-sided, references two wired identity roots, acyclic).
- **Cross-content validation analysis:** §H (dual checks: pattern-side + principle-side;
  orphan reporting).
- **Relationship semantics analysis:** §D (communicates relatedness only, never
  recommendation/priority/certainty).
- **Sufficiency assessment:** §L (sufficient to begin authoring rules + content).

## Scope

Specification only. No content, mappings, source files, generators, contracts, validators,
registry changes, runtime code, or tests; no change to any existing file other than the
creation of this document.

STOP. Specification complete. No content authored. Nothing committed. Awaiting review.
