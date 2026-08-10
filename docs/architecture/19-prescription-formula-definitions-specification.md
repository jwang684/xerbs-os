# Prescription Formula Definitions Specification

**Knowledge Content Sprint · Prescription Formula Definitions · Step 2
(Specification).** Status: **Approved and frozen (2026-08-06).** This document is the
complete conceptual specification for the `prescriptionFormulaDefinitions`
knowledge interface — the structure of one Definition entry, its ownership,
validation, authoring philosophy, and future evolution. It authors no knowledge,
introduces no formula definitions or medical content, and defines no implementation
(no schemas, TypeScript, or JSON). It conforms to the approved Step 1 Architecture
Review (`docs/architecture/18-prescription-formula-definitions-review.md`) and
changes none of the frozen Runtime, Knowledge Transport, Production Loader,
Registry, Knowledge Content Architecture, or Formula Catalog artifacts.

## 1. Purpose

One Definition entry represents the **conceptual meaning of one formula** — an
objective statement of what that formula *is*. `prescriptionFormulaDefinitions` is
the Definition interface that owns this meaning layer.

An entry does **not** own:

- **identity** — the canonical name (owned by `formulaCatalog`);
- **mapping** — associations to strategies/patterns (owned by the Mapping
  interfaces);
- **reasoning** — selection logic (the modules, at runtime);
- **execution** — the act of prescribing (runtime);
- **dosage** and **composition** — deferred execution knowledge;
- **recommendations** — when/whether/why to choose a formula (context).

Its single responsibility is meaning.

## 2. Entry Model

Implementation-neutral; no schema, format, or type is implied.

- A `prescriptionFormulaDefinitions` slice is a **set of Definition entries**.
- **A Version 1 entry conceptually contains exactly two fields:**
  1. **referenced canonical formula** — the formula being defined, expressed as a
     reference to a canonical name owned by `formulaCatalog` (not a new name);
  2. **objective explanation** — the meaning of that formula: what it is, stated
     objectively.
- The entry carries **nothing else**. It does not introduce identifiers, aliases,
  metadata, citations, recommendations, or execution fields.

The two-field minimum is deliberate: a Definition adds exactly one thing —
*meaning* — to a name owned elsewhere, and holds nothing beyond the reference and
that meaning.

## 3. Ownership Model

Each conceptual field, and each neighbouring concern, has exactly one owner:

- **referenced canonical formula** — the *name* is owned by **Formula Catalog**;
  this entry only references it. The reference does not create or own identity.
- **objective explanation** — owned by **Prescription Formula Definitions**. This
  is the one fact the interface is authoritative for.

Neighbouring concerns, owned elsewhere and never present in an entry:

- **Formula Catalog** owns **canonical identity** (names).
- **Prescription Formula Definitions** owns **conceptual meaning**.
- **Mappings** own **relationships**.
- **Reasoning** owns **selection**.
- **Execution** owns **action**.

The interface references identity, owns meaning, and touches nothing else.

## 4. Definition Model

A proper Definition **explains** and only explains. Specifically, a Definition:

- **explains** — states what the formula is;
- **does not recommend** — never says when or whether to use it;
- **does not compare** — never states it is better than, or preferred over,
  another;
- **does not prescribe** — never states composition, dosage, or administration;
- **does not rank** — never orders or prioritizes formulas.

This is the frozen Definition Neutrality Principle applied to prescription
formulas: meaning is in scope; context (use, comparison, prescription, ranking) is
out of scope and belongs to Mappings, reasoning, or evaluation.

## 5. Meaning Stability

A Definition carries a **stable semantic meaning**. Once an approved Definition
exists:

- **editorial refinement is allowed** — wording may be clarified or improved
  without changing what the definition means;
- **semantic drift is not** — the *meaning* must not silently change.

Meaning must remain stable so that everything referring to the formula stays valid:

- **mappings remain valid** — an association made on the basis of what a formula
  *is* does not silently become wrong;
- **reasoning remains valid** — selection logic grounded in the meaning is not
  invalidated beneath it;
- **downstream systems remain deterministic** — consumers observe a fixed meaning
  per formula.

This is the **semantic counterpart of the Formula Catalog's Canonical Naming
Stability**: where Canonical Naming Stability keeps the *name* fixed, Meaning
Stability keeps the *meaning* fixed. A genuine change of meaning is exceptional —
the semantic analogue of an Identity Migration — not ordinary authoring.

## 6. Validation Model

Four layers, each with a distinct responsibility; structural validation is kept
strictly separate from semantic correctness:

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
  and a validation contract. Not content.
- **Validation Contract** — confirms each entry is structurally well-formed: it
  references a canonical formula and carries a non-empty explanation, with no
  duplicate definitions of the same referenced formula within the slice. Structure
  only, one slice in isolation.
- **Cross-content consistency** — confirms every referenced canonical formula
  exists in `formulaCatalog` (a build-time check spanning two slices; not a
  single-slice contract concern).
- **Clinical Evaluation** — confirms the explanation is clinically accurate and
  appropriate. Semantic judgment, owned by no runtime component; never a contract
  concern.

Structure (contract), referential integrity (cross-content), and meaning (Clinical
Evaluation) never merge.

## 7. Authoring Philosophy

Definitions should be **objective, timeless, reusable, context-free, and
policy-free**:

- **objective** — an account of what a formula is, not an opinion;
- **timeless** — enduring meaning, not present-day practice;
- **reusable** — usable by any consumer without re-editing;
- **context-free** — no usage, comparison, or selection;
- **policy-free** — no recommendation, preference, or ranking.

Why: a definition authored this way **survives future changes in reasoning and
mappings**. Because it owns only meaning and references (never restates) the
catalog's identity, changes to how formulas are selected or associated leave it
valid and untouched. Context and policy are the volatile parts; excluding them is
what makes the meaning layer as stable and reusable as the name layer beneath it.

## 8. Future Evolution (additive, deferred)

Future capabilities attach *beside* an entry, never inside its meaning:

- **citations** and **references** — sources supporting a definition (a
  references/RAG concern);
- **historical notes** — lineage of a formula's understanding;
- **provenance** and **metadata** — authorship/version (content versioning);
- **ontology** — relationships to other concepts (owned by mappings or a future
  graph subsystem, never folded into the definition).

Each is additive — a new field, layer, or interface resolving to the entry's
referenced formula — and none requires a change to the framework, loader, registry,
or contract mechanism. The v1 entry stays minimal (referenced formula + meaning).

## 9. Sufficiency Review

**The frozen Runtime, Knowledge Framework, Production Loader, Registry, and
Knowledge Content Architecture fully support implementing this specification. No
limitation; implementation may proceed.** The interface is already declared in the
frozen registry inventory; a Definition slice will sit behind its registry entry,
be structurally validated by its contract, cross-checked against `formulaCatalog`
for referential integrity, transported opaquely, and consumed with Option B. The
only new elements are the definitions *content* and its per-slice contract — both
Knowledge-Layer concerns for later steps, not architecture gaps. Nothing here
requires a change to the runtime, framework, loader, registry, or validation model.

## Scope

Specification only. No knowledge authored, no formula definitions, no medical
content, no code, and no change to any frozen artifact.
