# Formula Definitions — Content Specification

**Formula Definitions · Content Sprint · Specification.** Status: **PROPOSED — PENDING
REVIEW.** The formal conceptual specification for the `formulaDefinitions` knowledge
interface's *content* — the structure of one entry, its ownership, definition boundary,
neutrality, scope, source-of-truth, dependency model, evolution rules, and invariants.
It authors no treatment-principle content, creates no definitions or mappings, and
defines no implementation (no schema, source, contract, generator, validation, or
plan). It conforms to the frozen architecture (`docs/architecture/11`–`16`), the
completed `prescriptionFormulaDefinitions` sprint (`18`–`21`) as the mirror precedent,
the split reviews (`33`–`35`, `37`), and the frozen Formula Definitions content review
(`38`). It changes no existing file.

**Grounding (verified):** `formulaDefinitionCatalog` is wired and serves 69 canonical
treatment-principle identities (v1: principles only). `formulaDefinitions` is
`pending(...)`; no corpus exists. `FormulaModule` requests it and renders
`{{formulaDefinitions}}`; the two maps reference the *catalog* identity, not this
interface (Review 38).

---

## A. Purpose

- **What `formulaDefinitions` is.** The **strategy-tier meaning layer**: an
  authoritative set of entries giving the objective *meaning* of each treatment
  principle — what the therapeutic strategy intrinsically *is* — keyed by reference to
  a canonical identity owned by `formulaDefinitionCatalog`.
- **Role relative to `formulaDefinitionCatalog`.** The catalog owns **identity** (the
  canonical name of each treatment principle); `formulaDefinitions` owns **meaning** and
  references that identity. This is the exact one-tier-up analogue of
  `formulaCatalog → prescriptionFormulaDefinitions`: identity root + meaning layer.
- **Why it exists.** To ground `FormulaModule`'s strategy reasoning in curated,
  objective principle meanings rather than the model's own knowledge, without owning
  identity, associations, or reasoning.

## B. Ownership

**Owns:** the objective *meaning* of a treatment principle (its intrinsic therapeutic
identity), attached by reference to a catalog identity.

**Ownership matrix:**

| Interface | Owns | Does NOT own |
|---|---|---|
| `formulaDefinitionCatalog` | canonical treatment-principle **identity** (names) | meaning, associations, reasoning |
| `formulaDefinitions` | **meaning** of each treatment principle (by reference) | identity (names), pattern associations, formula associations, reasoning, ranking, recommendations, execution, dosage, herbs, named formulas, families, aliases, translations |

Identity ownership (catalog) and meaning ownership (`formulaDefinitions`) are strictly
separate: an entry **references** a name it does not own and adds exactly one thing —
meaning.

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- A `formulaDefinitions` slice is a **set of Definition entries**.
- **A v1 entry conceptually contains exactly two fields:**
  1. **`principle`** — a **reference** to a canonical treatment-principle identity owned
     by `formulaDefinitionCatalog` (not a new name);
  2. **`definition`** — the **intrinsic therapeutic meaning** of that principle, stated
     objectively.
- The entry carries **nothing else** — no identifiers, aliases, metadata, citations,
  indications, associations, recommendations, or execution fields.

The two-field minimum is deliberate and mirrors `prescriptionFormulaDefinitions`: a
Definition adds exactly *meaning* to a name owned elsewhere. No additional field is
admitted in v1 unless a future, justified spec revision adds it *beside* the entry.

## D. Definition Boundary

**What qualifies as intrinsic therapeutic meaning:** an objective account of what the
treatment strategy *is* — its therapeutic intent and the aspect it acts on — expressed
timelessly and context-free (e.g. the nature of the strategy as a method).

**What must be excluded:**
- **indications** — when/whether/why to apply the principle to a patient;
- **pattern references** — which diagnostic patterns call for it (owned by
  `patternTreatmentMap`);
- **formula references** — which formulas/families realize it (owned by
  `treatmentFormulaMap`);
- **reasoning / selection** — how to choose among principles;
- **ranking / recommendation / preference**;
- **execution** — dosage, composition, administration, herbs, named formulas.

This is the strategy-tier application of the frozen **Intrinsic Therapeutic Identity
Principle**: intrinsic strategy meaning is in scope; patient-facing indication and all
context are out of scope.

## E. Definition Neutrality

A `formulaDefinitions` entry **explains and only explains**. It:

- **does not recommend** — never says when or whether to use a principle;
- **does not rank** — never orders or prioritizes principles;
- **does not state preferred use cases** — no context of application;
- **does not reference patterns** — no pattern names or associations;
- **does not reference formulas** — no named-formula or family associations.

Neutrality is what keeps the meaning layer stable and reusable while patterns, mappings,
and reasoning evolve around it (the frozen Definition Neutrality Principle, one tier up).

## F. Scope

Content-neutral (no principles authored, no counts, no enumeration):

- **Belongs** — the objective meaning of treatment-principle identities already present
  in `formulaDefinitionCatalog` (v1: principles only, per doc 37).
- **Does not belong** — meaning for anything not a catalogued treatment principle;
  identity/names; pattern or formula associations; reasoning; recommendations; execution;
  formula families (deferred); aliases/translations.
- Every `principle` reference must resolve to a `formulaDefinitionCatalog` identity
  (cross-content integrity, §H); a definition may not reference a principle the catalog
  does not own.

## G. Source of Truth

- **Future authoritative file** — `src/ai/knowledge/content/formula-definitions.md`,
  representation-neutral markdown (mirroring `prescription-formula-definitions.md`): one
  entry per line, referenced canonical principle in bold + its objective explanation.
- **Single Source of Truth** — principle meaning lives only in that markdown.
- **Derived artifacts are projections only** — any future generated form (the analogue of
  `prescription-formula-definitions.generated.ts`) is produced deterministically from the
  markdown, is non-authoritative, and is verified against it (no drift).

## H. Dependency Model

```
formulaDefinitionCatalog        (identity root — references nothing)
        ↑
formulaDefinitions → formulaDefinitionCatalog     (meaning → identity)
        ↑
FormulaModule  (runtime consumer of meaning)

(maps reference the CATALOG identity, NOT formulaDefinitions:)
  patternTreatmentMap → formulaDefinitionCatalog
  treatmentFormulaMap → formulaDefinitionCatalog , formulaCatalog
```

- **Outbound (from `formulaDefinitions`):** exactly one — a reference to
  `formulaDefinitionCatalog` identities. Referential integrity is a **build-time
  cross-content** check (every `principle` resolves into the catalog).
- **Inbound:** only `FormulaModule` consumes it. The maps do **not** reference it — they
  reference the identity root — so the meaning layer is a leaf consumed by a module.
- **Acyclic:** the single edge points to a root that references nothing; no cycle
  possible. Runtime resolution is per-identifier; no runtime coupling.

## I. Future Evolution

- **Additive** — new principle definitions append; approved meanings are preserved
  (Meaning Stability); prior batches are never rewritten (append-only).
- **Reference-by-identity** — definitions always reference catalog identities and never
  duplicate names; identity remains owned solely by the catalog.
- **Compatible with future maps** — because the maps depend on the catalog (identity),
  not on `formulaDefinitions`, the meaning layer can grow or be re-worded without
  affecting map references.
- **Neighbouring concerns attach beside** — future citations, provenance, families'
  meaning, aliases/translations are separate fields/layers/interfaces referencing the
  identity; none folds into a definition entry.

## J. Invariants

1. **Meaning Ownership** — `formulaDefinitions` owns treatment-principle meaning and
   nothing else.
2. **Identity Separation** — identity (names) is owned by `formulaDefinitionCatalog`;
   entries reference, never restate, it.
3. **Definition Neutrality** — entries explain only; no recommendation, ranking, or
   preferred use.
4. **Intrinsic Meaning Boundary** — meaning is intrinsic strategy identity; indications
   and all context are excluded.
5. **No Mapping Ownership** — no pattern or formula associations are carried; those are
   owned by the map interfaces.
6. **No Recommendation Logic** — no when/whether/why to use, and no selection.
7. **Catalog Reference Integrity** — every referenced principle resolves to a
   `formulaDefinitionCatalog` identity (build-time cross-content).
8. **Single Source of Truth** — one authoritative markdown holds meaning; any derived
   form is a non-authoritative, no-drift projection.
9. **Minimal Entry** — exactly two fields (referenced principle + objective explanation);
   nothing accretes into an entry.
10. **Append-Only Evolution** — growth is additive; approved meanings and frozen batches
    are never rewritten (save an exceptional meaning migration).
11. **Consumer Independence** — consumed only by `FormulaModule`; the maps depend on the
    catalog, not on this interface; Option-B fallback keeps partial coverage valid.

## K. Open Questions

**Genuine, unresolved (for the authoring rules / authoring plan):**
- **Meaning altitude & permitted vocabulary** — the concrete intrinsic-identity
  abstraction level and allowed phrasing for a treatment-principle definition (the
  strategy-tier analogue of the prescription-definitions Intrinsic Therapeutic Identity
  vocabulary). To be fixed in the authoring rules.
- **Parity target** — whether v1 authors a definition for all 69 catalogued principles
  (1:1 parity, giving a clean cross-content basis) or accepts Option-B partial coverage.
  Recommend targeting parity, but this is an authoring-plan decision, not architectural.
- **Batch cadence** — how authoring is grouped into reviewable batches.

**Explicitly NOT reopened (settled):** the identity/meaning split (33); catalog as
identity root (34/35); principles-only v1 (37); `formulaDefinitions` ≠
`prescriptionFormulaDefinitions` (audit 32); the two-field entry model and neutrality
(this spec, §C–§E).

## L. Sufficiency

**The specification is sufficient to begin the `formulaDefinitions` authoring rules and
content creation.** Purpose, ownership (with matrix and identity/meaning separation),
entry model (two fields), definition boundary and neutrality, scope, source-of-truth,
dependency model (acyclic, catalog-referencing, consumer-independent), evolution rules,
and invariants are all resolved. The only open items are authoring-style decisions
(meaning altitude, parity target, batch cadence), not architectural blockers. The
interface mirrors the proven `prescriptionFormulaDefinitions` content lifecycle and
introduces no implementation, content, or corpus size.

Recommended next step (for review, not executed): a lightweight **authoring-rules**
document (the strategy analogue of the prescription-definitions authoring plan), then
content creation of `formula-definitions.md`, then the standard wiring lifecycle.

## Scope

Specification only. No treatment-principle content, definitions, mappings, generators,
sources, contracts, validation, registry changes, or plans; no change to any existing
file other than the creation of this document.

STOP. Specification complete. No content authored. Nothing committed. Awaiting review.
