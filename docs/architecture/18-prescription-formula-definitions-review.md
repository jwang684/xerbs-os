# prescriptionFormulaDefinitions — Architecture Review

**Knowledge Content Sprint · Prescription Formula Definitions · Step 1
(Architecture Review).** Status: **Approved and frozen (2026-08-06).** This document
reviews the architecture of the second authored knowledge interface,
`prescriptionFormulaDefinitions` — what it owns, its boundaries, and its
relationships — before specification and authoring begin. It authors no knowledge,
defines no implementation (no schemas, TypeScript, or JSON), and includes no
medical explanations. It depends on and changes none of the frozen Runtime,
Knowledge Transport, Production Loader, Registry, Knowledge Content Architecture,
or the Formula Catalog artifacts.

## 1. Purpose

`prescriptionFormulaDefinitions` is a **Definition** interface. It exists to own
the **meaning** of a prescription formula — what a formula *is* — so that a module
can be grounded in an explicit, curated understanding of the formulas it may
reference.

It does **not** own:

- **identity** — the canonical name (owned by `formulaCatalog`);
- **relationships** — associations to strategies or anything else (owned by the
  Mapping interfaces);
- **execution** — composition, quantities, dosage, administration (produced at
  runtime, never stored as knowledge here);
- **recommendations** — when/whether to use a formula (reasoning / mappings);
- **reasoning** — selection logic (the modules, at runtime);
- **composition** and **dosage** — deferred execution knowledge, not definitions.

Its single responsibility is meaning, and only meaning.

## 2. Definition Ownership

A Definition owns the **explanation** of a concept — an objective statement of what
the concept is. Meaning is distinct from identity: *identity* answers "which thing
is this, and by what name is it known," while *meaning* answers "what is this
thing." They change on different schedules and for different reasons, so they have
different owners.

`formulaCatalog` remains the sole owner of formula **names** (the canonical
name-space). `prescriptionFormulaDefinitions` **references** those canonical names
and attaches meaning to them; it never re-establishes, renames, or re-spells a
name. This preserves the frozen ownership principles: a name has exactly one
authoritative home (the catalog), and the definition is authoritative only for the
meaning layered on top of that name. If the definition owned the name too, identity
and meaning would couple and drift; keeping them separate lets the catalog's stable
identities be reused by the definition without duplication.

## 3. Relationship to Formula Catalog

```
Formula Catalog                → owns names (identity)
        ↓  (definition references a canonical name)
Prescription Formula Definitions → owns meaning
```

- **Formula Catalog answers: "What is this called?"** — it fixes the canonical
  identity.
- **Prescription Formula Definitions answers: "What is it?"** — it explains the
  formula whose name the catalog owns.

These are different questions because a name and its meaning are independent facts:
the same canonical name endures unchanged even as the explanation of it is refined,
and the explanation is meaningless without a stable name to attach to. The
definition therefore *depends on* the catalog (its term must be a catalogued name)
but never *modifies* it — the dependency points one way, name → meaning, and the
catalog remains the base of the content dependency graph.

## 4. Relationship to Future Mapping Interfaces

`treatmentFormulaMap` and `patternTreatmentMap` are **Mapping** interfaces; they
own *relationships*, not meaning. The boundary is strict and symmetric:

- **Definitions explain** — `prescriptionFormulaDefinitions` says what a formula
  is.
- **Mappings relate** — `treatmentFormulaMap` associates a treatment strategy with
  candidate formulas; `patternTreatmentMap` associates patterns with treatment
  principles/families.
- **Mappings never redefine** — a mapping references a formula (by its catalogued
  name / defined identity) but never restates the formula's meaning.
- **Definitions never map** — a definition explains a single formula and never
  encodes an association to a pattern, strategy, or another formula.

So a mapping may *point at* a formula that this interface defines, but the two never
overlap in ownership: one holds the association, the other holds the meaning, and
neither carries the other's content.

## 5. Definition Neutrality

The frozen Definition Neutrality Principle applies to prescription formulas
specifically: a definition explains **what a formula is** and nothing about its
use. It must never state:

- *when* to use it,
- *whether* it is preferred,
- *whether* it replaces another formula,
- *how* it should be selected,
- *whether* it is better than an alternative.

All such statements are **context** — selection policy that belongs to the Mapping
interfaces, to runtime reasoning, or to evaluation, never to a definition. Keeping
context out is what makes a definition reusable and durable: the explanation of
what a formula *is* remains valid regardless of how clinical reasoning or
associations evolve around it. Contextual language ("usually," "preferred,"
"first-line," "should") is the signal that content has strayed from meaning into
policy and belongs elsewhere.

### 5a. Intrinsic Therapeutic Identity Principle

**A Definition owns the intrinsic therapeutic identity of a formula.** It answers
only:

- *"What is this formula?"*

It never answers:

- *"When should it be used?"*
- *"What does it treat?"*
- *"Why should it be selected?"*
- *"Which patient should receive it?"*
- *"What is it preferred over?"*

**Intrinsic therapeutic identity vs. clinical application.** A formula's *intrinsic
therapeutic identity* is what the formula fundamentally *is* — including its
intrinsic therapeutic action or nature. Its *clinical application* is how, when,
whether, and for whom it is used. These are different kinds of fact with different
owners:

- **Intrinsic therapeutic identity belongs to the Definition layer.**
- **Clinical application belongs to mappings, reasoning, execution, or clinical
  evaluation** — never to a Definition.

Stated explicitly: **describing a formula's intrinsic therapeutic action is part of
defining what the formula is** and is therefore permitted in a Definition;
**describing indications, patient conditions, treatment selection, recommendations,
timing, preference, or comparative guidance is clinical application** and is
therefore outside the Definition layer. This is the boundary that resolves how much
semantic detail a Definition may carry: the intrinsic action, yes; the clinical
context around that action, no.

**Relationship to the other principles (complements, changes nothing).**

- **Definition Neutrality** prevents contextual and policy language — it fixes what
  a Definition must *exclude*.
- **Intrinsic Therapeutic Identity** specifies the highest level of semantic detail
  a Definition is *allowed to contain* — it fixes what a Definition is positively
  *responsible for owning* (the intrinsic therapeutic action/nature, and no
  further).
- **Meaning Stability** keeps that intrinsic identity fixed once approved.
- **Content Independence** and **Ownership Follows Meaning** keep the intrinsic
  identity singly owned and referencing — never restating — the catalog's name.
- **Minimal Definition** keeps the entry to that identity and nothing more.

Together, Definition Neutrality and Intrinsic Therapeutic Identity define both
edges of the Definition layer: what Definitions must **exclude** (clinical context)
and what they positively **own** (intrinsic therapeutic identity, up to and
including action, but no further).

## 6. Validation Philosophy

Validation is layered, each layer with a distinct responsibility:

```
Registry              → the interface exists in the inventory (source + contract)
        ↓
Validation Contract   → structural correctness of one slice
        ↓
Cross-content         → referential integrity across slices
        ↓
Clinical Evaluation   → correctness of the meaning
```

- **Registry** — confirms `prescriptionFormulaDefinitions` is present with a source
  and a validation contract (inventory integrity). Not content.
- **Validation Contract** — confirms each entry is structurally well-formed: it
  references a term and carries a non-empty explanation, with term uniqueness
  within the slice. Structure only; a single slice in isolation.
- **Cross-content consistency** — confirms every defined term corresponds to a
  canonical name that exists in `formulaCatalog` (a build-time check spanning two
  slices; not a single-slice contract concern).
- **Clinical Evaluation** — confirms the explanation is clinically accurate and
  appropriate. Semantic judgment, owned by no runtime component.

## 7. Authoring Philosophy

Definitions should be **timeless, reusable, objective, and context-free**:

- **timeless** — they state enduring meaning, not present-day practice;
- **reusable** — usable by any consumer without re-editing;
- **objective** — an account of what a formula is, not an opinion about it;
- **context-free** — no usage, selection, comparison, or recommendation.

A definition should **survive future changes in reasoning or mappings**: because it
owns only meaning and references (never restates) the catalog's identity, a change
to how formulas are *selected* (mappings/reasoning) or *named* elsewhere leaves the
definition valid and untouched. This is precisely why context is excluded — context
is the volatile part, and embedding it would make definitions churn every time
practice shifts. Definitions authored this way become stable knowledge assets, like
the catalog before them.

## 8. Future Evolution (additive, deferred)

Future capabilities attach *beside* the meaning, never inside it:

- **citations** — sources supporting a definition; a references/RAG concern.
- **historical notes** — provenance/lineage of a formula's understanding.
- **references** — links to a curated corpus.
- **metadata** — provenance, version, author (content versioning).
- **ontology links** — relationships to other concepts; owned by mappings or a
  future graph subsystem, never folded into the definition.

Each is additive — a new field, layer, or interface resolving to the definition's
term — and none requires a framework, loader, registry, or contract redesign; the
definition entry itself stays minimal (a referenced term + its meaning) under the
Minimal-Vocabulary-style discipline extended to definitions.

## 9. Sufficiency Review

**The frozen Runtime, Knowledge Framework, Production Loader, Registry, and
Knowledge Content Architecture fully support `prescriptionFormulaDefinitions`. No
limitation; implementation may proceed.** The interface is already declared in the
frozen registry inventory; it is a Definition slice that will sit behind its
registry entry, be structurally validated by its contract, cross-checked against
`formulaCatalog` for referential integrity, transported opaquely, and consumed with
Option B. Every mechanism exists and is frozen. The only new element is the
definitions *content* and its per-slice contract — both Knowledge-Layer concerns
for later steps, not architecture gaps. Nothing here requires a change to the
runtime, framework, loader, registry, or validation model.

## Scope

Architecture review only. No knowledge authored, no formula definitions, no medical
explanations, no code, and no change to any frozen artifact.
