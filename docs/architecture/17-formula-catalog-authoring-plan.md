# Formula Catalog Authoring Plan

**Knowledge Content Sprint · Step 5 (Formula Catalog Authoring Plan).** Status:
**Approved and frozen (2026-08-06).** This document defines *how* Formula Catalog
authoring will be performed — its editorial process, quality standards, review
workflow, and consistency requirements. It creates no formula entries, contains no
formula names or medical content, and implements nothing. It is fully consistent
with, and changes none of, the frozen Runtime, Knowledge Transport, Content
Architecture / Specification, and the Formula Catalog Architecture Review and
Specification (`docs/architecture/13`–`16`).

## 1. Authoring Objectives

The objective of Formula Catalog authoring is to establish a **complete, stable,
canonical identity layer** for formulas — the authoritative name-space that
`prescriptionFormulaDefinitions` and `treatmentFormulaMap` reference.

Authoring produces **identity only**: one canonical name per formula, nothing more.
It does not produce meaning, relationships, execution detail, or context. Success
is measured by *stability and consistency of identity*, not by breadth of content:
a small, clean, canonical name-space is the goal, not a large one.

## 2. Authoring Workflow

Conceptual, order-significant; no tooling or format is implied:

1. **Identify a candidate formula** — a formula identity proposed for inclusion.
2. **Determine whether it already exists** — check the existing catalog for the
   same identity under any representation (including near-duplicate spellings).
3. **Apply the canonicalization policy** — select the single canonical
   representation per the frozen Canonicalization Principle and the naming
   convention (§3), resolving equivalent forms to it.
4. **Verify uniqueness** — confirm the canonical name is not already present and
   does not collide with, or near-duplicate, an existing entry.
5. **Create the canonical entry** — record the canonical name only (identity, no
   other field), per the Minimal Vocabulary Principle.
6. **Perform review** — subject the proposed entry to structural, editorial, and
   clinical review (§4).
7. **Approve for inclusion** — only a fully reviewed entry enters the catalog.

Rejected or deferred candidates do not enter the catalog; absence is acceptable
(the runtime falls back via Option B for anything not yet catalogued).

### 2a. Catalog Consistency Review

**Every new batch is reviewed against the entire approved catalog before authoring
proceeds.** A candidate is not authored in isolation; it is first checked against
everything already approved.

Consistency review includes:

- **existing identities** — comparison against the full set of approved entries;
- **canonical identity** — whether the candidate is genuinely a new identity;
- **duplicate detection** — the candidate is not already present;
- **near-duplicate detection** — the candidate is not a variant spelling/
  romanization of an existing entry;
- **canonicalization consistency** — the candidate obeys the same naming convention
  as the whole catalog;
- **batch independence** — the review never edits prior batches; it only decides
  whether the candidate may be added.

**This review occurs *before* canonicalization** — determining whether a candidate
is genuinely new precedes choosing its canonical representation. There is no point
canonicalizing a candidate that turns out to already exist under some form.

**Relationship.** The three concerns are distinct:

- **The Editorial Workflow** defines *the process* (the ordered steps).
- **Catalog Consistency Review** protects *the existing catalog* (nothing new
  collides with or duplicates what is already approved).
- **Canonicalization** establishes *identity* (one representation per identity).
- **Authoring Independence** protects *authoring history* (prior batches are
  immutable).

Workflow defines the process; Consistency Review protects the existing catalog;
Canonicalization establishes identity — separate responsibilities that compose.

**Governing principle.** *Review the catalog before extending it. Extend only when
the identity is genuinely new. Consistency precedes canonicalization.*

### 2b. Authoring Independence Principle

**Every approved authoring batch becomes a stable knowledge asset.** Future
authoring batches *extend* the catalog; they do **not** rewrite previously approved
identities.

**Each approved batch is considered stable.** Subsequent batches should only:

- add new canonical identities, and
- improve overall coverage.

They should **not**:

- rename existing canonical identities,
- replace approved identities, or
- reorganize previously approved content.

**Exception.** The only legitimate reason to modify an approved canonical identity
is a formal **Identity Migration**. Identity Migration is exceptional — it is not
normal authoring. **Normal authoring is additive.**

**Relationship.** This complements the frozen principles without changing them:

- **Canonical Naming Stability** governs *the identity* — a canonical name, once
  chosen, endures.
- **Minimal Vocabulary** governs *the entry* — it stays a bare canonical name.
- **The Authoring Workflow** governs *how an entry is produced*.
- **Authoring Independence** governs *the authoring history* — approved batches are
  not reopened by later ones.

Canonical Naming Stability protects the *identity*; Authoring Independence protects
the *authoring history*. One keeps a name from changing; the other keeps an
approved batch from being rewritten.

**Governing principle.** *Approved batches become stable assets. Future batches
extend. Identity migration is exceptional. Authoring is additive.*

### 2c. Batch Closure Principle

**Every frozen authoring batch becomes a complete, independently reviewable
knowledge asset.** Once a batch is frozen, it is closed.

After a batch is frozen:

- its **review is complete**,
- its **editorial decisions are complete**, and
- its **canonicalization is complete**.

Future batches review only *new* content; they do **not** reopen completed
batches. A frozen batch stands on its own — it can be read and audited as a
finished unit without reference to what came after it.

**Exception.** The only reason to revisit a frozen batch is a formal **Identity
Migration**. Normal authoring never reopens history.

**Relationship.** The three governance principles cover distinct concerns:

- **Authoring Independence** protects previously *approved identities* (they are not
  renamed or replaced).
- **Catalog Consistency Review** protects the *current catalog* (a new candidate
  collides with nothing already approved).
- **Batch Closure** defines the *lifecycle of an approved batch* (frozen = closed;
  reviewed once, stays reviewed).

Together they make the catalog append-only in practice: identities endure, the
whole catalog stays collision-free, and each batch is a settled review unit.

**Governing principle.** *Every frozen batch is a stable knowledge asset. Future
batches extend the catalog. Identity Migration is exceptional. History is
append-only.*

## 3. Editorial Standards

Every entry must satisfy:

- **Consistency** — all entries follow the same editorial conventions; the catalog
  reads as one coherent name-space, not a patchwork of styles.
- **Canonical naming convention** — a single, explicitly-agreed convention governs
  spelling/representation, applied uniformly (this is the standard that prevents
  variant-spelling entries the contract cannot detect).
- **One entry per identity** — exactly one canonical entry per formula; never two
  entries for the same identity.
- **Avoidance of duplicates** — no repeated canonical names.
- **Avoidance of alternate spellings** — variant spellings/romanizations of the
  same identity are resolved to the canonical form, not added as separate entries.
- **No contextual information** — no usage, indication, selection, or policy.
- **No explanatory text** — no meaning or description; meaning is owned by
  `prescriptionFormulaDefinitions`.

The unifying editorial rule: **an entry is a canonical name and nothing else.**

## 4. Review Process

Every proposed entry passes three distinct reviews before inclusion, kept separate
because they answer different questions:

- **Structural correctness** — is the entry well-formed (a non-empty canonical name,
  a name and nothing else, no exact duplicate within the slice)? This mirrors what
  the validation contract enforces mechanically; the reviewer confirms the entry is
  *contract-shaped*.
- **Editorial correctness** — does the entry follow the canonical naming convention,
  avoid near-duplicate/variant spellings, and read consistently with the rest of the
  catalog? This is the human judgment the contract cannot perform.
- **Clinical correctness** — is this the *right and appropriate* canonical name for
  the formula (Clinical Evaluation)? A semantic/clinical judgment, owned by
  clinically-qualified review, distinct from structure and editorial style.

An entry is included only when all three reviews pass. The three must not be
conflated: a structurally valid, editorially clean entry can still be clinically
wrong, and vice versa.

## 5. Consistency Checks

Conceptual checks authors perform before proposing an entry (mechanical aids may
assist, but the judgment is the author's):

- **Duplicate identities** — the same formula is not already catalogued under any
  representation.
- **Near-duplicate spellings** — the candidate is not a variant spelling/romanization
  of an existing entry (the check the contract cannot make).
- **Canonical naming consistency** — the candidate obeys the naming convention used
  by every other entry.
- **Reference consistency** — canonical names other interfaces will reference remain
  resolvable; existing references are not invalidated (identity stability, per the
  Canonical Naming Stability Principle).

## 6. Expansion Strategy

- **Growth is incremental** — the catalog is authored entry by entry; it need not be
  complete to be useful, since uncatalogued formulas fall back via Option B.
- **Quality over quantity** — a smaller, clean, consistently-canonical name-space is
  preferred to a larger one with duplicates or variant spellings.
- **Stability over rapid expansion** — established canonical identities are preserved;
  new identities are added *beside* them (never by churning existing names), and the
  identity layer is extended by additive capabilities (future aliases/localization),
  not by expanding entries (Minimal Vocabulary Principle).

Growth is deliberate and reviewable, never bulk or unreviewed.

### 6a. Catalog Coverage Principle

**Formula Catalog coverage is intentionally incremental.** The catalog is not
expected to become complete in a single batch, and completeness is not a
precondition for usefulness.

- Coverage is **not expected to become complete in one batch**.
- Coverage **grows through successive reviewed batches**.
- **Previously approved coverage remains stable** — earlier batches are not
  reopened to expand coverage.
- **New coverage is added beside existing coverage** — additively, never by
  reworking what already exists.

**Relationship to Option B.** Because Option B already guarantees graceful absence,
**missing catalog entries never become runtime failures** — an uncatalogued formula
simply falls back, and the pipeline continues unchanged. Coverage is therefore a
**knowledge-authoring concern, not a runtime concern**: the runtime's correctness
does not depend on how complete the catalog is.

**Governing principle.** *Coverage grows incrementally. Quality precedes breadth.
Option B permits partial coverage. Runtime is independent of catalog completeness.*

## 7. Completion Criteria (Version 1)

Qualitative only; no counts are estimated. Formula Catalog authoring is
sufficiently complete for Version 1 when:

- every catalogued entry is a single canonical name that has passed all three
  reviews;
- the catalog is internally consistent — no duplicates, no near-duplicate variant
  spellings, one uniform naming convention;
- every canonical name that other interfaces (`prescriptionFormulaDefinitions`,
  `treatmentFormulaMap`) need to reference is present and resolvable;
- the name-space is stable — canonical identities are settled and not expected to
  churn.

Completeness is defined by *consistency, stability, and reference-coverage of what
has been authored*, not by reaching any particular size. Because Option B covers
anything absent, v1 does not require exhaustiveness — it requires correctness of
what exists.

## 8. Sufficiency Review

**The frozen architecture completely supports beginning actual Formula Catalog
authoring after this plan. No limitation; not stopping.** Authoring produces a set
of canonical names that will sit behind the frozen `formulaCatalog` registry entry,
be validated structurally by its contract, referenced by definitions/mappings,
transported opaquely, and consumed with Option B. Every mechanism exists and is
frozen; the editorial process, standards, and reviews defined here are *authoring
governance*, not architecture. Nothing in this plan requires a change to the
runtime, framework, registry, loader, or contracts. Authoring may begin against
this plan and the frozen specification.

## Scope

Authoring plan only. No formula names, no catalog entries, no medical content, no
code, and no change to architecture, runtime, framework, registry, loader, or
contracts.
