# Herb Catalog — Content Specification

**Herb Catalog · Content Sprint · Step 2 (Specification).** Status:
**PROPOSED — PENDING REVIEW.** This is the complete conceptual specification for the
`herbCatalog` knowledge interface's *content* — the structure of one entry, its
ownership, canonical naming policy, corpus scope rule, source-of-truth policy,
validation expectations, dependency model, evolution rules, and invariants. It
authors no herb content, proposes no herb names, estimates no counts, and defines no
implementation (no schema, code, generator, contract, or validation logic). It
conforms to the frozen Knowledge Content architecture (`docs/architecture/13`–`14`),
the completed Formula Catalog content and wiring sprints (`docs/architecture/15`–`17`,
`25`–`27`), the Prescription Formula Definitions sprints (`docs/architecture/18`–`24`),
and the Herb Catalog Content Review (`docs/architecture/29`). It changes no existing
file.

**Grounding (verified):** `herbCatalog` remains `pending("herbCatalog")` in
`productionRegistry.ts`; `PrescriptionModule` already requests `herbCatalog` and reads
it via `knowledgeOrNone`; `prescription.md` already renders `{{herbCatalog}}`; no
authoritative herb corpus exists anywhere in the repository. This specification governs
the *content* that must be authored to remove that gap; wiring is a later sprint.

---

## Part A — Purpose

- **What Herb Catalog content is.** An authoritative, representation-neutral list of
  **canonical herb identities** — the single source of truth for the canonical name of
  each herb. It is a Vocabulary/identity corpus, not a description of herbs.
- **Why it exists.** To establish a stable, canonical herb name-space that every
  future herb-based interface references, so herb identity is defined exactly once and
  never re-invented or duplicated downstream.
- **What future interfaces depend upon it.** A future herb-definitions/properties
  interface (herb meaning), herb pairings, formula-composition maps (formula → herbs),
  herb-function mappings, and the execution/prescription layer — all reference herb
  identities owned here (see Part H).
- **Why it must exist before `herbCatalog` wiring.** Wiring is a lossless projection of
  an authoritative corpus (derivation → source → contract → registry upgrade). With no
  corpus there is nothing to derive, validate, serve, or verify end-to-end. Both
  completed precedents authored and froze a corpus *before* wiring; the Herb Catalog
  Wiring Review (`28`) identified the absent corpus as the sole blocker.

**Why it is a foundational identity corpus rather than a knowledge corpus.** A
*knowledge* corpus asserts something *about* an entity (meaning, attributes,
relationships) and can change as understanding changes. An *identity* corpus only
fixes *what an entity is called* — the most stable, most foundational fact, on which
knowledge layers are later attached by reference. The Herb Catalog carries no
assertions about herbs; it fixes their canonical names. That is why it is foundational
(everything references it) and why it is not a knowledge corpus (it states no
knowledge).

## Part B — Ownership Definition

**The Herb Catalog owns canonical herb identities only** — the canonical name of each
herb, one entry per identity, and nothing else.

It must **never** own the following; each belongs to a different future interface:

| Excluded from Herb Catalog | Owned instead by (future interface) |
|---|---|
| **definitions / meaning** | a future herb-definitions interface (herb meaning), the herb-side analogue of `prescriptionFormulaDefinitions` |
| **actions / functions** | herb-definitions / herb-function mappings |
| **temperature / nature** | herb-definitions (herb properties) |
| **flavor** | herb-definitions (herb properties) |
| **channels entered** | herb-definitions (herb properties) |
| **indications** | reasoning / clinical evaluation layer (never identity or meaning) |
| **contraindications** | herb-definitions (cautions) and/or the execution/safety layer |
| **toxicity** | herb-definitions (cautions) and/or the execution/safety layer |
| **pairings** | a herb-pairing relationship interface |
| **formula membership / composition** | a formula-composition mapping (referencing both `formulaCatalog` and `herbCatalog`) |
| **recommendations** | reasoning / recommendation layer |
| **reasoning** | the runtime reasoning modules |
| **classifications** (categories, families) | a future classification/ontology interface |
| **aliases / alternate spellings** | a future alias/synonym layer (localization/lookup) |
| **translations** | the deferred localization layer |

This mirrors the frozen Formula Catalog ownership boundary and Minimal Vocabulary
principle: identity is in scope; everything else is out of scope and owned elsewhere.

## Part C — Entry Model

**One entry equals one canonical herb identity.** Implementation-neutral (no schema,
format, or type implied).

- **Minimum content per entry** — exactly one canonical herb name (a non-empty name).
- **Maximum content per entry** — exactly one canonical herb name. No additional field
  is permitted.
- **Metadata allowed?** — No. No provenance, category, id, or annotation on an entry.
- **Comments allowed?** — Structural/section commentary in the authored artifact
  (headers, batch/status notes) is editorial scaffolding, not entries; an *entry*
  carries no comment. Nothing in an entry beyond the name.
- **Attributes allowed?** — No. No property, action, nature, flavor, channel, or any
  other attribute.

**The catalog is identity-only, vocabulary-only, and non-descriptive.** An entry
names a herb; it describes nothing about it. This is the herb analogue of the frozen
Formula Catalog entry model.

## Part D — Canonical Naming Policy

- **Naming convention** — pinyin romanization, Title Case, syllable-separated, no tone
  marks, English translation excluded (translation is the deferred localization
  layer). This deliberately mirrors the frozen Formula Catalog canonicalization
  convention for cross-catalog consistency. (Any preparation-form or standard-name
  distinction that is genuinely part of a herb's canonical identity is retained as
  part of the single canonical name, exactly as the formula catalog retains
  preparation suffixes.)
- **Normalization expectations** — one canonical representation per herb identity;
  authored in the canonical form directly (the authoring standard is applied at author
  time). Downstream layers never re-normalize.
- **Capitalization policy** — Title Case per the convention.
- **Spacing policy** — syllable-separated, single spaces; no leading/trailing
  whitespace.

**What makes a name canonical** — it is the single, agreed, authoritative
representation of one herb identity under the convention above; there is exactly one
canonical name per identity, and exactly one identity per canonical name.

**Synonyms, alternate spellings, translated names — excluded from the catalog.**
- **Aliases** — do **not** belong in the catalog. Rationale: an alias is a *second
  name for the same identity*; admitting it would break "one entry per identity" and
  make the catalog a lookup/synonym layer. Aliases belong in a future alias/synonym
  interface that references the canonical identity.
- **Alternate spellings** — do **not** belong in the catalog, for the same reason;
  they are alias-class data owned by the future alias layer.
- **Translated names** — do **not** belong in the catalog; translation is the deferred
  localization layer, attached beside the identity by reference.

This preserves Minimal Vocabulary and Canonical Naming Stability: the catalog holds
exactly one canonical name per identity and never accretes variants.

## Part E — Corpus Scope

The specification defines the **inclusion rule**, not the contents. It remains
content-neutral: **no herbs are enumerated, no counts estimated, no target size set.**

- **Inclusion criterion** — a herb identity qualifies for inclusion when it is a
  canonical herb that the platform's clinical scope needs to *name* as a distinct
  identity, established from an authoritative materia-medica reference basis (fixed in
  the Authoring Plan) and expressible as a single canonical name under Part D. Herb
  identities are added deliberately and reviewed, one canonical name per identity.
- **Exclusion criterion** — excluded are: anything that is not a herb identity (a
  property, action, category, relationship, or formula); an alias/alternate
  spelling/translation of an already-included identity (owned by other layers, Part
  D); and any entry that cannot be reduced to a single canonical name under the
  convention.
- **No parity requirement** — unlike formula↔definitions (135↔135), the Herb Catalog
  is an **independent root** and need not match any other corpus's count. Its size is
  whatever the inclusion rule yields; Option B keeps partial coverage valid.

## Part F — Source-of-Truth Policy

- **Authoritative ownership** — a single future authored artifact,
  `src/ai/knowledge/content/herb-catalog.md`, is the single source of truth for herb
  identity (mirroring `formula-catalog.md`). It is representation-neutral markdown, one
  canonical name per line.
- **Authoring ownership** — the content is authored and frozen through the Herb Catalog
  content sprint (this sprint), under editorial/clinical review; the authored markdown
  is authoritative.
- **Future derivation ownership** — a later wiring sprint may derive a structured
  runtime artifact from the authoritative markdown (the herb analogue of
  `formula-catalog.generated.ts`). Any such generated artifact is a **derived,
  non-authoritative projection**, produced deterministically from the markdown and
  never hand-authored.
- **Single Source of Truth (preserved)** — meaning/identity lives in exactly one place
  (the markdown). No second corpus, no hand-maintained duplicate, and any future
  generated form is verified against the markdown (no drift).

## Part G — Validation Expectations (architecture only)

Future structural validation (a later wiring-sprint concern; **no implementation
here**) **should validate**:
- **collection shape** — the slice is a collection (array) of entries;
- **uniqueness** — no duplicate canonical names (unique identity);
- **non-empty entries** — each entry is a non-empty (trimmed) canonical-name string.

It **must not validate**:
- **clinical correctness** — whether a herb name denotes a real/appropriate herb
  (human/clinical review);
- **editorial quality** — style, phrasing, or aesthetic judgment (editorial review);
- **naming-convention enforcement** — Title Case / romanization / tone-mark rules
  (an authoring standard, not a structural fact);
- **meaning** — any herb property, action, or attribute (a different interface).

**Why** — a runtime structural contract can only adjudicate structural facts (type,
shape, presence, uniqueness). Convention, clinical accuracy, and meaning are authoring/
editorial/clinical concerns owned by human review or by other interfaces; encoding
them into a structural contract would couple runtime validation to mutable editorial
policy and risk rejecting a legitimately authored, frozen name. Structure, convention,
meaning, and referential integrity stay separate layers (as settled for the formula
catalog).

## Part H — Dependency Model

- **Herb Catalog depends on nothing** — it references no other corpus; it is an
  identity root.
- **Future herb interfaces depend on Herb Catalog** — herb-definitions, herb pairings,
  formula-composition maps, herb-function mappings, and execution all reference herb
  identities owned here. Direction is **inbound only: dependents → `herbCatalog`**.
- **Formula Catalog does not depend on Herb Catalog**, and **Herb Catalog does not
  depend on Formula Catalog** — they are independent, parallel identity roots.
  (Formula composition — "a formula contains herbs" — is a relationship owned by a
  *future third interface* referencing both catalogs, not by either catalog.)
- **Why cycles are impossible** — an entity that references nothing cannot participate
  in a cycle. Since the catalog has zero outbound references, no dependency path can
  return to it; all herb-based dependencies point one way, into the catalog.

## Part I — Future Evolution Rules

- Future herb-related interfaces (meaning, pairings, composition, classification,
  aliases, translations) attach **beside** the catalog as separate interfaces/layers,
  each referencing herb identities by name; **none** folds attributes or relationships
  into a catalog entry.
- **Future interfaces must reference Herb Catalog identities, never duplicate them.**
  Herb identity is defined once, here; downstream layers cite it. Duplicating a herb
  identity in another corpus is prohibited (it would create a competing source of
  truth).
- Growth is **additive**: new canonical names are appended; approved identities are
  preserved (Canonical Naming Stability); prior batches are never rewritten
  (append-only history). Ownership boundaries (Part B) are preserved across all
  evolution.

## Part J — Invariants

1. **Identity Ownership** — the Herb Catalog owns canonical herb identities; identity
   is defined here and nowhere else.
2. **Vocabulary Ownership** — it is a Vocabulary interface: a representation-neutral
   list of canonical names, one per identity.
3. **Single Source of Truth** — one authoritative artifact (`herb-catalog.md`) holds
   herb identity; any derived form is a non-authoritative projection with no drift.
4. **Minimal Vocabulary** — an entry is exactly one canonical name; no metadata,
   comment, or attribute is admitted into an entry.
5. **No Meaning Ownership** — the catalog carries no herb meaning, property, action,
   relationship, or reasoning; those are owned by other, future interfaces.
6. **Independent Root Corpus** — it depends on no other corpus and can be authored,
   frozen, and evolved independently.
7. **One-Way Dependencies** — all herb-based interfaces reference the catalog inbound;
   the catalog references nothing outbound; cycles are impossible.
8. **Canonical Naming Stability** — one canonical name per identity and one identity
   per canonical name; canonical names remain stable once frozen (a genuine change is
   an exceptional identity migration, not ordinary authoring).
9. **No Alias/Translation Accretion** — aliases, alternate spellings, and translations
   are excluded from the catalog and owned by future alias/localization layers.
10. **Append-Only Growth** — growth is by additive extension; approved entries and
    frozen batches are never rewritten.
11. **Option B Compatibility** — partial coverage is valid; a missing herb identity
    resolves to absence (never a runtime failure), so completeness is not required for
    usefulness.

## Part K — Open Questions

**Blocking (must be decided in Step 3 — Authoring Plan — before authoring begins):**
- **Inclusion basis & scope boundary** — the concrete authoritative materia-medica
  reference basis and the precise line for what counts as "within clinical scope,"
  operationalizing the Part E inclusion criterion. (Content-neutral here by design.)
- **Preparation-form / standard-name edge policy** — the rule for when a
  preparation form or processing distinction constitutes a *distinct canonical
  identity* versus the same identity (parallels the formula catalog's preparation-suffix
  handling, but herbs raise more processing cases).

**Non-blocking (can be settled in the Authoring Plan or deferred):**
- **Batch structure & size cadence** — how authoring is grouped into reviewable
  batches (an authoring-governance detail, not an architecture decision).
- **Parser reuse for the later wiring sprint** — whether wiring reuses the shared
  `- <Name>` markdown-list parser (a wiring-sprint concern, out of scope now).
- **Future alias/translation layer timing** — when (not whether) the deferred
  alias/localization interfaces are introduced.

No open question concerns the catalog's *architectural role* or *ownership* — those are
settled.

## Part L — Sufficiency Assessment

**The specification is sufficient to begin Step 3 (Authoring Plan).** It resolves every
architectural/content question left open by the Content Review: purpose (foundational
identity corpus), ownership (canonical herb identities only, with each exclusion
assigned an owner), entry model (one canonical name per entry; identity-only,
vocabulary-only, non-descriptive), canonical naming policy (convention + synonym/alias/
translation exclusion), corpus scope (inclusion/exclusion rule, content-neutral, no
parity requirement), source-of-truth policy (authoritative `herb-catalog.md`, derived
artifacts non-authoritative), validation expectations (structure-only, with explicit
exclusions), dependency model (independent root, one-way, acyclic), evolution rules
(reference-not-duplicate, additive), and a numbered invariant set. The remaining open
questions are authoring-governance decisions for the Authoring Plan (inclusion basis,
preparation-form edge policy), not architectural blockers. The specification is
consistent with the Formula Catalog content/wiring and Prescription Formula Definitions
architectures and introduces no implementation, code, content, or corpus size.

## Scope

Specification only. No herb content authored, no herb names proposed, no counts
estimated, no schema, code, generator, contract, validation logic, registry change, or
wiring plan; no change to any existing file.

---

STOP. Specification complete. Awaiting review before Step 3 (Authoring Plan).
