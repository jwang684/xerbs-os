# formulaCatalog — Architecture Review

**Knowledge Content Sprint · Step 3 (Formula Catalog Architecture Review).**
Status: **Approved and frozen (2026-08-06).** This document reviews the architecture of
the first authored knowledge interface, `formulaCatalog` — what belongs in it and
what must never belong in it. It authors no knowledge, populates no catalog, and
defines no implementation. It depends on and changes none of the frozen Runtime,
Knowledge Framework, Production Loader, Registry, Content Architecture, or Content
Specification.

## 1. Major architectural decisions

`formulaCatalog` is the authoritative **canonical name-space of formulas** — the
enumerated set of canonical formula names the system may reference. Operationally
it is a **flat set of canonical names**, one entry per formula, identified in v1 by
the canonical name itself. It is the base of the content dependency graph: it
references nothing and is referenced by `prescriptionFormulaDefinitions` (meaning)
and `treatmentFormulaMap` (target endpoints). Nothing about a formula except its
canonical name lives here.

## 2. Vocabulary ownership

**Owns:** the fact *"which formula names are canonical"* — one authoritative name
per formula; the enumerated valid name-space.

**Why no other interface owns it:** by Ownership Follows Meaning, names are
Vocabulary's semantic responsibility. `prescriptionFormulaDefinitions` owns
*meaning* and only references these names; `treatmentFormulaMap` references them as
targets. If a definition owned the name, identity and meaning would couple and
drift; the catalog gives every formula name exactly one authoritative home so those
references stay stable.

**Never owns** (for any version — these are never part of a Vocabulary interface):
meaning/explanation, indication, usage/context, composition, herbs, dosage,
administration, associations, reasoning, recommendations, metadata. A Vocabulary
interface holds names and nothing but names.

## 3. Vocabulary Philosophy

"Canonical vocabulary" means the single authoritative name per concept — not the
full space of ways a formula might be written.

| Name kind | Verdict |
|---|---|
| canonical name | **v1** |
| synonyms | Future (alias layer) |
| aliases | Future (alias → canonical resolution) |
| abbreviations | Future (alias kind) |
| historic names | Future (alias kind) |
| translations | Future (i18n dimension) |

Nothing name-related is "never" — synonyms, aliases, abbreviations, historic names,
and translations are all legitimate *future* vocabulary-identity features. Only
**non-name content** is never part of `formulaCatalog`.

### 3a. Canonicalization Principle

**Version 1 stores exactly one canonical representation for every formula.** The
catalog owns only that canonical representation. The runtime never resolves
alternate spellings; the loader never resolves alternate spellings; the registry
contains no canonicalization logic. **Canonicalization is completed entirely during
knowledge authoring**, before knowledge enters the runtime.

**The problem.** A real-world formula may appear under multiple forms —
conceptually: alternate spellings, alternate romanizations, historical names,
abbreviated names, localized names, translated names. (No medical examples are
given here.) All such forms represent **the same semantic identity**. Version 1
deliberately chooses exactly one canonical representation for that identity and
records only it.

**Ownership.** Responsibilities are strictly separated:

- **Knowledge Authoring** owns: selecting the canonical representation; resolving
  equivalent names to it; preventing duplicate identities.
- **`formulaCatalog`** owns: the canonical name only.
- **Registry** owns: transporting the canonical identifier.
- **Loader** owns: loading the canonical identifier.
- **Runtime** owns: consuming the canonical identifier.

No runtime component performs canonicalization.

**Why authoring, not execution.** Canonicalization is a one-time editorial act, not
a per-run computation. Once authored, every downstream component observes only one
stable identity — which keeps the **Registry generic**, the **Loader generic**, the
**Runtime deterministic**, and **references stable**. If canonicalization happened
at runtime, the loader or runtime would have to embed name-resolution logic
(clinical vocabulary), breaking the domain-agnostic transport and making behaviour
depend on resolution rules. Future alias systems must therefore resolve to the
canonical representation **before** knowledge enters the runtime, never inside it.

**Relationship to existing principles.** This complements — without changing —
Content Independence and Ownership Follows Meaning:

- **Content Independence** governs *ownership of facts* (one owner per fact, no
  duplication).
- **Ownership Follows Meaning** governs *who owns each fact* (the semantic
  authority).
- **Canonicalization** governs *how one semantic identity becomes one authoritative
  representation* — the step that guarantees a single fact to own in the first
  place.

**Governing principle.** *One semantic identity maps to exactly one canonical
representation. Canonicalization is an authoring responsibility. Runtime consumes
canonical identities only. Future aliases resolve before runtime, never inside
runtime.*

### 3b. Canonical Naming Stability Principle

**Canonical names are intended to be stable identities.** The canonical
representation is not merely the "best" spelling of a formula; it is the **stable
identity** that every component — registry, definitions, mappings, runtime,
documentation — consumes and refers to. Its value is as much in its *permanence* as
in its correctness.

**Canonicalization vs. Canonical Stability — two separate concerns.**

- **Canonicalization** determines *which* representation becomes canonical (§3a). It
  acts once, at the moment an identity is first authored.
- **Canonical Stability** governs *whether that canonical representation should later
  change*. It acts across the identity's whole lifetime.

They are distinct architectural concerns: the first *creates* a canonical identity;
the second *preserves* it.

**Philosophy.** Once a canonical representation has been adopted, it should remain
stable unless there is a compelling architectural reason to change it. **Renaming a
canonical identity is not an ordinary authoring action — it is an identity
migration**, and such migrations should be intentionally rare.

**Preferred evolution.** When improved spellings or additional representations
become available, they should normally be introduced as *future capabilities* —
aliases, alternate spellings, historical names, localized names, translated names —
that **resolve to the existing canonical representation**. The preferred evolution
path is to **expand the identity layer, not replace the canonical identity**.

**Why stability matters.** Stable canonical identities keep **registry references
stable, definition references stable, mapping references stable, the runtime
deterministic, documentation consistent, and future extensions additive.** Because
downstream interfaces refer to a formula *by its canonical name*, renaming ripples
through every reference; frequent renaming introduces identity churn without
improving the architecture. Adding an alias achieves the same accessibility with
none of the churn.

**Relationship to existing principles.** This completes the identity model without
changing any prior principle:

- **Content Independence** governs *ownership of facts*.
- **Ownership Follows Meaning** governs *semantic authority*.
- **Canonicalization** governs *creation* of a canonical identity.
- **Canonical Naming Stability** governs *preservation* of a canonical identity.

Together they form the complete identity model — who owns a fact, why, how its
canonical form is created, and how that form endures.

**Governing principle.** *Prefer adding aliases over renaming canonical identities.
Stability is more valuable than perfect naming. Canonical identities evolve rarely.
Identity migration should be exceptional, not routine.*

## 4. Identity

- **v1: identify by canonical name** (natural key) — consistent with the frozen
  specification's deferral of synthetic identifiers.
- **Future: a stable synthetic identifier** becomes valuable when aliases / i18n /
  renaming arrive, so a formula's identity survives a canonical-name change and
  aliases resolve to a stable id. Not needed now; introduce it together with the
  alias/i18n layer so the canonical name can change without breaking references.

## 5. Validation philosophy

- **Registry** — the `formulaCatalog` entry exists with a source and contract;
  inventory integrity. Not content.
- **Validation Contract** (single-slice, structural) — each entry is a non-empty
  canonical name; **exact within-slice uniqueness**; structurally a name and
  nothing else.
- **Content Authoring / build-time cross-content check** — referential integrity
  across slices: names referenced by `prescriptionFormulaDefinitions` and
  `treatmentFormulaMap` exist in the catalog.
- **Clinical Evaluation** — is the canonical name correct/appropriate for the
  formula?

Boundary: **exact duplicates → contract; cross-slice references → build-time check;
near-duplicates / variant spellings → authoring discipline** (the contract cannot
detect "same formula, different romanization"; see §3a).

## 6. Authoring philosophy

- **Canonical spelling** — one authoritative spelling/romanization per formula,
  following a single specified naming convention.
- **One entry per formula** — no duplicates, no variant-spelling entries.
- **Names only** — no explanations, usage, dosage, composition, aliases, reasoning,
  recommendations, or metadata.
- **Reference-free** — the catalog references nothing (base of the DAG).
- **No context** — Vocabulary is stricter than Definition Neutrality: no policy and
  no meaning at all.

## 7. Future evolution (deferred)

- **aliases / synonyms / abbreviations / historic names** → Future alias layer
  (needs alias → canonical resolution + likely stable ids).
- **translations / i18n** → Future localization dimension.
- **stable identifiers** → Future identity layer (arrives with aliases/renaming).
- **metadata** (provenance / version / author) → Future (content versioning).
- **citations** → Future / separate references subsystem — and not part of a
  Vocabulary interface at all (they attach to definitions or a references corpus).

All additive; none require a framework, loader, registry, or contract change.

## 8. Risks

| Risk | Requires |
|---|---|
| duplicate names (exact) | **validation** (contract within-slice uniqueness) |
| near-duplicate names | **authoring discipline** (+ optional authoring lint) |
| variant spellings / romanizations | **specification** (canonical naming convention, §3a) + **authoring discipline** |
| future localization | already-supported **architecture** (additive); deferred |
| author inconsistency | **specification** (naming convention) + **authoring discipline** + contract checks |

The primary risk is canonicalization/variant spelling; it is resolved by the
Canonicalization Principle (§3a) plus a naming convention specified in Step 4, not
by the contract alone.

## 9. Sufficiency review

**The frozen Runtime, Knowledge Framework, Production Loader, Content Architecture,
and Content Specification completely support authoring `formulaCatalog`. No
limitation; not stopping.** It is a Vocabulary slice behind its registry entry,
structurally validated by its contract, referenced by definitions/mappings,
consumed with Option B — all frozen. The only new element authoring surfaces is the
**canonical naming convention**, a specification concern for Step 4, not a
framework/loader/contract limitation.

## Scope

Architecture review only. No knowledge authored, no catalog entries, no code, and
no change to contracts, loader, registry, framework, or runtime.
