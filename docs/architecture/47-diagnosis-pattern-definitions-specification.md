# Diagnosis Pattern Definitions — Content Specification

**Diagnosis Pattern Definitions · Content Sprint · Specification.** Status:
**PROPOSED — PENDING REVIEW.** The formal conceptual specification for the
`diagnosisPatternDefinitions` knowledge interface's *content* — the structure of one
entry, its ownership, definition boundary, neutrality, scope, source-of-truth, dependency
model, evolution rules, and invariants. It authors no content, creates no definitions or
mappings, and defines no implementation (no schema, source, contract, generator,
validation, or plan). It conforms to the frozen architecture (`docs/architecture/11`–`16`),
the diagnosis-tier split and review (`43`, `46`), the catalog spec/rules (`44`, `45`), and
mirrors `39-formula-definitions-content-specification.md`. It changes no existing file. The
split, ownership, and dependency decisions are settled and not reopened.

**Grounding (verified):** `diagnosisPatternCatalog` is wired (85 identities);
`diagnosisPatternDefinitions` is `pending(...)`; `DiagnosisModule` requests it and renders
`{{patternDefinitions}}` ("definitions only … NOT rules"); the pending `patternTreatmentMap`
references patterns on its LHS.

---

## A. Purpose

- **What `diagnosisPatternDefinitions` is.** The **diagnosis-tier meaning layer**: an
  authoritative set of entries giving the objective *meaning* of each diagnostic pattern —
  what the pattern intrinsically *is* — keyed by reference to a canonical identity owned by
  `diagnosisPatternCatalog`.
- **Role relative to `diagnosisPatternCatalog`.** The catalog owns **identity** (the
  canonical name of each pattern); `diagnosisPatternDefinitions` owns **meaning** and
  references that identity. This is the diagnosis-tier analogue of
  `formulaDefinitionCatalog → formulaDefinitions` (and `formulaCatalog →
  prescriptionFormulaDefinitions`): identity root + meaning layer.
- **Why it exists.** To ground `DiagnosisModule`'s differentiation in curated, objective
  pattern meanings rather than the model's own knowledge, without owning identity,
  associations, selection, or reasoning.

## B. Ownership

**Owns:** the intrinsic clinical *meaning* of a diagnostic pattern, attached by reference
to a catalog identity.

**Ownership matrix:**

| Interface | Owns | Does NOT own |
|---|---|---|
| `diagnosisPatternCatalog` | canonical pattern **identity** (names) | meaning, associations, reasoning |
| `diagnosisPatternDefinitions` | **meaning** of each pattern (by reference) — a reference to a catalog identity + an objective pattern definition | identity (names), treatment guidance, recommendations, treatment principles, formulas, herbs, reasoning chains, diagnostic procedures, decision trees, mappings, aliases, translations, pattern↔pattern relationships |

Excluded concepts and their owners: identity → `diagnosisPatternCatalog`; treatment
guidance / pattern→treatment → `patternTreatmentMap` (and execution tier); recommendations
/ selection / reasoning / diagnostic procedures / decision trees → the reasoning layer
(`DiagnosisModule` at runtime); treatment principles → `formulaDefinitionCatalog` /
`formulaDefinitions`; formulas → `formulaCatalog` / `prescriptionFormulaDefinitions`; herbs
→ `herbCatalog`; pattern↔pattern relationships → a future relationship interface; aliases /
translations → future alias / localization layers.

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- A `diagnosisPatternDefinitions` slice is a **set of Definition entries**.
- **A v1 entry conceptually contains exactly two fields:**
  1. **`pattern`** — a **reference** to a canonical pattern identity owned by
     `diagnosisPatternCatalog` (not a new name);
  2. **`definition`** — the **intrinsic clinical meaning** of that pattern, stated
     objectively.
- The entry carries **nothing else** — no metadata, tags, categories, severity,
  recommendations, identifiers, aliases, citations, or execution fields.

The two-field minimum is deliberate and mirrors the other definition layers: a Definition
adds exactly *meaning* to a name owned elsewhere. No additional field is admitted in v1.

## D. Definition Boundary

**What qualifies:** an objective account of **what the pattern is** — its intrinsic
clinical nature (the disharmony/state the pattern denotes) — expressed timelessly and
context-free.

**What must be excluded:** *when* to diagnose it (selection), *what treatment* follows
(mapping/execution), symptom checklists, diagnostic criteria/procedures, decision trees,
reasoning, recommendations, and any reference to principles, formulas, or herbs.

**Intrinsic Pattern Identity Principle** — the diagnosis-tier analogue of the formula
tier's Intrinsic Therapeutic Identity: a definition states the pattern's *intrinsic
clinical meaning* (what the pattern is), never its selection criteria, indications,
treatment, or the reasoning used to reach it. A definition may reference the aspects/
mechanisms the pattern intrinsically denotes (its nature), but never a checklist of
presenting features or when-to-apply guidance.

### Editorial Review Gates (Non-Structural)

**Definition Neutrality** and **Context Independence** are **editorial review gates** for
this interface. They are:
- **authoritative review layers** over the authored corpus;
- **intentionally separate from structural validation** (the future
  `diagnosisPatternDefinitions` contract);
- **intentionally separate from future contracts**; and
- **intentionally separate from future cross-content validation** (the build-time
  `pattern ∈ diagnosisPatternCatalog` check).

Consequently, **a definition may pass structural validation while still failing an
editorial review gate** — e.g. a structurally well-formed two-field entry whose text smuggles
in treatment advice passes the contract but fails Definition Neutrality. This separation is
intentional (it mirrors the formula-definitions Docs 41/42 gates): structure, referential
integrity, and editorial meaning-quality are distinct layers and must not be conflated.

## E. Definition Neutrality

A `diagnosisPatternDefinitions` entry **describes what the pattern is, not what should be
done about it.** It must not contain: recommendations, preferred actions, treatment advice,
rankings, priorities, clinical decisions, treatment guidance, principle guidance, or formula
guidance. Neutrality keeps the meaning layer stable and reusable while patterns, mappings,
and reasoning evolve around it (the diagnosis-tier application of the frozen Definition
Neutrality Principle).

### Context Independence Requirement (Editorial Gate)

A valid pattern definition must **stand alone as a definition of the pattern itself** — not
as a diagnosis rule, a symptom checklist, a patient-selection guide, or a treatment
recommendation. It must remain complete and meaningful with no patient, case, symptom,
diagnostic-procedure, or treatment context present.

**Prohibited drift (examples):**
- "diagnosed when …"
- "characterized by patients who …"
- "commonly presents with …"
- "treated using …"
- "indicates the need for …"

Each of these belongs to another layer — selection/diagnostic-procedure (reasoning layer),
symptom data (not owned here), or treatment (`patternTreatmentMap` / execution) — and
violates the ownership boundary of `diagnosisPatternDefinitions`. Context Independence is an
**editorial review gate** (per the subsection above), applied before freeze, separate from
structural and cross-content validation.

## F. Scope

Content-neutral (no patterns authored, no counts, no enumeration):

- **Belongs** — the intrinsic clinical meaning of diagnostic patterns already present in
  `diagnosisPatternCatalog`.
- **Does not belong** — meaning for anything not a catalogued pattern; identity/names;
  treatment/selection/mapping/reasoning; symptoms-as-criteria; aliases/translations.
- **Meaning only.** Every entry's `pattern` must resolve to a `diagnosisPatternCatalog`
  identity (cross-content integrity, §H); no independent identities; no orphan definitions;
  no duplicate meaning ownership (one definition per pattern).

## G. Source of Truth

- **Future authoritative file** — `src/ai/knowledge/content/diagnosis-pattern-definitions.md`,
  representation-neutral markdown (mirroring the other definition corpora): one entry per
  line, referenced canonical pattern in bold + its objective definition.
- **Single Source of Truth** — pattern meaning lives only in that markdown.
- **Derived artifacts are projections only** — any future generated form is produced
  deterministically from the markdown, is non-authoritative, and is verified against it
  (**no drift**). The markdown always wins.

## H. Dependency Model

```
diagnosisPatternCatalog        (identity root — references nothing)
        ↑
diagnosisPatternDefinitions → diagnosisPatternCatalog     (meaning → identity)
        ↑
DiagnosisModule (consumes meaning)

(the map references the CATALOG identity, NOT the definitions:)
  patternTreatmentMap → diagnosisPatternCatalog (LHS) , formulaDefinitionCatalog (RHS)
```

- **Outbound (from `diagnosisPatternDefinitions`):** exactly one — a reference to
  `diagnosisPatternCatalog` identities. Referential integrity is a **build-time
  cross-content** check (every `pattern` resolves into the catalog).
- **Inbound:** only `DiagnosisModule` consumes it.
- **Maps reference the catalog, not the definitions** — because maps relate *identities*,
  and integrity is checked against a stable identity root; this keeps the meaning layer a
  module-only consumer that can evolve without affecting map references (exactly as the
  formula tiers do). 
- **Acyclic:** the single edge points to a root that references nothing; no cycle possible.
  Runtime resolution is per-identifier; no runtime coupling.

## I. Future Evolution

- **Additive** — new pattern definitions append; approved meanings are preserved (Meaning
  Stability); prior batches are never rewritten (append-only).
- **Reference-by-identity** — definitions always reference catalog identities and never
  duplicate names; identity remains owned solely by the catalog.
- **Stable references** — future maps and interfaces depend on **identities**, not
  meanings, so the meaning layer can grow or be re-worded without affecting them.
- **Neighbouring concerns attach beside** — future citations, provenance, aliases/
  translations, or pattern↔pattern relationships are separate fields/layers/interfaces
  referencing the identity; none folds into a definition entry.

## J. Invariants

1. **Meaning By Reference** — an entry pairs a referenced catalog identity with its
   meaning; it never introduces a new identity.
2. **Catalog Resolution Required** — every referenced pattern resolves to a
   `diagnosisPatternCatalog` identity (build-time cross-content).
3. **Identity Ownership Separation** — identity is owned by `diagnosisPatternCatalog`;
   this interface owns meaning only.
4. **One Definition Per Pattern** — at most one definition per referenced pattern; no
   duplicates.
5. **Definition Neutrality** — entries describe what the pattern is, never what to do about
   it (no recommendations/guidance/ranking).
6. **No Treatment Guidance** — no treatment, principle, or formula guidance in an entry.
7. **No Mapping Ownership** — no pattern→treatment or pattern→formula associations; those
   are owned by the map interfaces.
8. **Stable References** — canonical references remain stable; downstream consumers rely on
   fixed identities.
9. **Source Of Truth Preservation** — one authoritative markdown holds meaning; any derived
   form is a non-authoritative, no-drift projection.
10. **One-Way Dependency** — the only outbound edge is meaning → identity root; the catalog
    references nothing back.
11. **Minimal Entry Model** — exactly two fields (referenced pattern + objective
    definition); nothing accretes into an entry.
12. **Acyclic Dependency Graph** — no cycles; resolution is per-identifier with no runtime
    coupling.
13. **Intrinsic Pattern Identity** — meaning is the pattern's intrinsic clinical nature, not
    selection criteria, symptoms, or treatment.
14. **Editorial-Gate Separation** — Definition Neutrality and Context Independence are
    editorial review layers, separate from structural and cross-content validation; a
    structurally valid entry may still fail an editorial gate.

## K. Open Questions

**Genuine, unresolved (for the authoring rules / authoring plan):**
- **Meaning altitude & vocabulary style** — the concrete Intrinsic Pattern Identity
  abstraction and permitted phrasing (the diagnosis-tier analogue of the ratified
  intrinsic-action vocabulary).
- **Parity target** — whether v1 authors a definition for all 85 catalogued patterns (1:1
  parity, giving a clean cross-content basis) or accepts Option-B partial coverage.
- **Authoring cadence** — how authoring is grouped into reviewable batches.

**Explicitly NOT reopened (settled):** the split decision; ownership (meaning-only,
referencing the catalog); the dependency model; catalog existence/wiring; registry state.

## L. Sufficiency

**The specification is sufficient to begin the `diagnosisPatternDefinitions` authoring rules
and (later) content authoring.** Purpose, ownership (with matrix and identity/meaning
separation), entry model (two fields), definition boundary (Intrinsic Pattern Identity),
neutrality and context-independence (as editorial gates), scope, source-of-truth, dependency
model (acyclic, catalog-referencing, consumer-independent, maps→catalog), evolution rules,
and invariants are all resolved. The only open items are authoring-style decisions (meaning
altitude, parity target, cadence), not architectural blockers. The interface mirrors the
proven definition-layer lifecycle and introduces no implementation, content, or corpus size.

Recommended next step (for review, not executed): a lightweight **authoring-rules** document
(the diagnosis-tier analogue of `40-formula-definitions-authoring-rules.md`), then content
creation of `diagnosis-pattern-definitions.md`, then the standard wiring lifecycle (including
the build-time `pattern ∈ diagnosisPatternCatalog` cross-content check and the editorial
Neutrality / Context-Independence gates before freeze).

## Scope

Specification only. No content, definitions, mappings, generators, sources, contracts,
validation, registry changes, or wiring; no change to any existing file other than the
creation of this document.

STOP. Specification complete. No content authored. Nothing committed. Awaiting review.
