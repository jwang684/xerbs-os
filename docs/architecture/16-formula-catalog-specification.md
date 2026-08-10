# Formula Catalog Specification

**Knowledge Content Sprint · Step 4 (Formula Catalog Specification).** Status:
**Approved and frozen (2026-08-06).** This document is the complete conceptual
specification for the `formulaCatalog` knowledge interface — what an entry is, its
conceptual fields, and how entries are authored, validated, and evolved. It authors
no knowledge, introduces no formula names, and defines no implementation (no
schemas, formats, or code). It is fully consistent with, and changes none of, the
frozen Runtime, Knowledge Framework, Production Loader, Registry, Content
Architecture / Specification, and Formula Catalog Architecture Review
(`docs/architecture/13`, `14`, `15`).

## 1. Purpose

A Formula Catalog entry represents **identity only** — the canonical name by which
one formula is known throughout the system. `formulaCatalog` is the authoritative
name-space of formulas.

An entry explicitly does **not** represent:

- **meaning** — what a formula *is* or is *for* (owned by
  `prescriptionFormulaDefinitions`);
- **relationships** — associations to strategies or anything else (owned by the
  Mapping interfaces);
- **execution** — composition, quantities, dosage, administration (produced at
  runtime, never stored here).

The entry is a stable identity and nothing more.

## 2. Conceptual Structure

Implementation-neutral; no schema, format, or type is implied.

- A `formulaCatalog` slice is a **set of entries**.
- **A Version 1 entry has exactly one conceptual field: the canonical name** — the
  single authoritative representation of a formula's identity.
- The entry carries no other field. There is no description, no category, no alias
  list, no identifier distinct from the canonical name, and no metadata in v1.

The minimal-information rule is deliberate: a Vocabulary interface holds names and
nothing else, so the entry is reduced to the one fact it owns.

## 3. Identity

- **Canonical identity** — the canonical name *is* the identity of the entry. It is
  the single authoritative form the rest of the system refers to.
- **Natural key** — in v1 the canonical name is the natural key: entries are
  distinguished from one another by canonical name, with no separate key.
- **Future stable identifier** — a synthetic, representation-independent identifier
  is deferred. It becomes valuable only when aliases, renaming, or localization
  arrive, so that identity can survive a change of canonical name.
- **Future alias layer** — alternate representations (synonyms, abbreviations,
  historical names, alternate spellings) are deferred and, when added, **resolve to
  the canonical name**; they never become separate identities.
- **Future localization** — translated/localized names are a deferred additive
  dimension that likewise resolves to the canonical identity.

**How identity evolves while remaining stable:** the *identity layer expands*
(aliases, ids, locales added around the canonical name) while the *canonical name
itself stays fixed*. New ways to refer to a formula are introduced as resolutions
*to* the existing canonical identity — growth is additive around a stable center,
never a replacement of it (see §7).

## 4. Validation

Five owners, each with a distinct responsibility:

- **Registry validation** — confirms the `formulaCatalog` entry exists in the
  inventory with a source and a validation contract (inventory integrity). It does
  not inspect content.
- **Contract validation** (single slice, structural) — confirms each entry has a
  **non-empty canonical name**, that the slice contains **no exact duplicate
  canonical name** (within-slice uniqueness), and that an entry carries **only** a
  name (no smuggled meaning, composition, or metadata). Structure only.
- **Author validation** — the human authoring responsibility: choosing the single
  canonical representation, resolving equivalent names to it, and preventing
  **near-duplicate identities** (variant spellings/romanizations that a contract
  cannot detect). This is judgment aided by convention, not a mechanical check.
- **Cross-content validation** (build-time) — confirms **referential integrity**:
  every canonical name referenced by `prescriptionFormulaDefinitions` and
  `treatmentFormulaMap` exists in the catalog. This spans slices, so it is not a
  single-slice contract concern.
- **Clinical Evaluation** — confirms the canonical name is *correct and appropriate*
  for the formula (semantic/clinical judgment). Owned by no runtime component.

Boundary: exact duplicates → contract; near-duplicates/variant spellings → author
validation; cross-slice references → cross-content check; clinical correctness →
Clinical Evaluation.

## 5. Authoring Rules

| Rule | Why it exists |
|---|---|
| **One canonical entry per formula** | The catalog is a name-space; one identity per formula prevents duplicate identities and reference ambiguity. |
| **Canonical spelling** (one specified convention) | A single canonicalization convention prevents variant-spelling entries the contract cannot catch (the primary vocabulary risk). |
| **No aliases** | Aliases are a future identity-layer capability that resolves *to* the canonical name; storing them now would create competing identities. |
| **No translations** | Localization is a future additive dimension; v1 is one canonical-language name-space. |
| **No abbreviations** | Abbreviations are a kind of alias — future, resolving to the canonical name. |
| **No explanations** | Meaning is owned by `prescriptionFormulaDefinitions`; a name must not carry meaning (Ownership Follows Meaning). |
| **No dosage** | Dosage is execution, produced at runtime — never stored in a name-space. |
| **No composition** | Composition is future execution knowledge, not identity. |
| **No usage** | Usage/context is policy owned by mappings/reasoning — never a name. |
| **No recommendations** | Recommendation is reasoning, not identity (a stricter case of Definition Neutrality). |
| **No metadata** | Provenance/version/author is deferred content-versioning; not part of the identity fact. |

The unifying rule: **an entry is a canonical name and nothing else.** Everything
excluded is owned by another interface, produced at runtime, or deferred.

## 6. Canonicalization

- **How canonical representations are chosen** — during authoring, for each formula
  identity the author selects exactly one representation as canonical, following a
  single specified naming convention (the convention itself is an authoring
  standard, fixed here as a requirement and applied consistently by authors).
- **How alternate representations are deferred** — all other forms (synonyms,
  abbreviations, historical, localized, translated) are **not recorded in v1**;
  they are future identity-layer content.
- **How future aliases relate to canonical identities** — when introduced, every
  alternate representation **resolves to exactly one canonical name** and never
  stands as an independent identity. Resolution happens entirely during authoring,
  before knowledge enters the runtime; no runtime component canonicalizes.

## 7. Canonical Stability

- **Why canonical identities should rarely change** — downstream interfaces
  (`prescriptionFormulaDefinitions`, `treatmentFormulaMap`) and documentation refer
  to a formula *by its canonical name*; changing it ripples through every
  reference. Stability keeps those references valid.
- **What qualifies as identity migration** — replacing an entry's canonical name is
  not ordinary editing; it is an **identity migration** that must update every
  reference to it. Such migrations are intentionally exceptional.
- **Why aliases are preferred** — when a better or additional representation is
  wanted, adding an alias that resolves to the existing canonical name achieves the
  same accessibility with **no reference churn** — the preferred evolution path.
- **Why stability benefits the runtime** — because canonical names are stable and
  resolved before runtime, the registry, loader, contracts, and modules observe one
  fixed identity per formula, keeping runtime behaviour deterministic and
  references stable.

### 7a. Minimal Vocabulary Principle

**A Vocabulary interface is intentionally minimal.** It exists only to establish
canonical identity. Minimality here is an **architectural goal**, not a temporary
Version 1 limitation — `formulaCatalog` is meant to stay a name-space, not to
accumulate fields over time.

**Philosophy.** Fields must not be added to a Vocabulary interface simply because
they are convenient to place there. **Convenience is never sufficient architectural
justification.** Every proposed field must first answer: *why does this belong in
Vocabulary rather than in another interface?* If the honest answer is that the
field's ownership lies outside identity, the field belongs elsewhere.

**Ownership.** The boundary is explicit:

- **Vocabulary** owns only identity.
- **Definition** owns meaning.
- **Mappings** own relationships.
- **Execution** owns runtime behaviour.
- **Metadata** belongs to a future metadata facility.
- **Aliases** belong to the future identity layer.
- **Localization** belongs to the future localization layer.
- **References** belong to future reference systems.

A Vocabulary interface must not absorb responsibilities owned elsewhere.

**Preferred future evolution.** Growth should introduce **new interfaces or layers**
rather than expand Vocabulary entries. Conceptually, instead of:

```
Vocabulary → more and more fields
```

prefer:

```
Vocabulary → identity only
Definition → meaning
Metadata   → provenance / versioning
Aliases    → alternate representations
References → citations / sources
```

Each concern is added *beside* Vocabulary, resolving to its canonical identity —
never *inside* the Vocabulary entry.

**Why minimality matters.** Keeping Vocabulary entries minimal provides **clear
ownership, stable interfaces, easier validation, independent evolution, and reduced
architectural drift.** A one-field entry has an unambiguous owner, a trivial
contract, and nothing that can drift into another interface's territory. Minimal
Vocabulary keeps identity permanently independent from every other concern.

**Relationship to existing principles.** This complements — without modifying — the
frozen content and formula-catalog principles:

- **Content Granularity** limits *what a Vocabulary slice may contain*.
- **Minimal Vocabulary** explains *why it should resist future expansion* of that
  content.
- **Content Independence** and **Ownership Follows Meaning** fix that each fact has
  a single semantic owner; Minimal Vocabulary keeps identity from quietly annexing
  facts those principles assign elsewhere.
- **Canonicalization** and **Canonical Naming Stability** create and preserve one
  identity; Minimal Vocabulary ensures that identity stays the *only* thing the
  entry holds.

Together they preserve the long-term integrity of the content architecture.

**Governing principle.** *Identity first. Minimality preserves ownership. Add
interfaces before adding fields. Vocabulary grows by extension, not accumulation.*

## 8. Future Evolution (deferred, additive)

| Capability | Why deferred |
|---|---|
| **aliases / synonyms / abbreviations / historical names** | Future identity layer; each resolves to the canonical name, needs alias→canonical resolution (+ likely stable ids). |
| **translations / localization** | Additive i18n dimension; v1 is one canonical language. |
| **stable identifiers** | Identity layer that arrives with aliases/renaming so identity survives name changes. |
| **metadata** (provenance, version, author) | Content versioning; not part of the identity fact. |
| **citations** | Belong to a definitions/references corpus, never to a Vocabulary interface; a separate subsystem. |
| **ontology / relationships** | Relationships are owned by Mappings or a future graph subsystem, never by a name-space. |

Every item is additive — a new field, layer, or interface — and none requires a
change to the framework, loader, registry, or contract mechanism.

## 9. Specification Sufficiency

**The frozen Runtime, Framework, Loader, Registry, Content Architecture, and
Formula Catalog Architecture completely support implementing `formulaCatalog`. No
limitation; not stopping.** A catalog slice is a set of canonical names behind its
registry entry, validated structurally by its contract, referenced by definitions
and mappings, transported opaquely, and consumed with Option B — every mechanism
exists and is frozen. The one authoring-standard the specification fixes (the
canonical naming convention) is a content-authoring concern, not a
framework/loader/contract gap. Implementation of the catalog (its contract and
content) may proceed against this specification without further architectural
decisions.

## Scope

Specification only. No knowledge authored, no catalog entries, no formula names, no
code, and no change to architecture, runtime, framework, registry, loader, or
contracts.
