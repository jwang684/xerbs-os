# Herb Catalog — Authoring Rules

**Herb Catalog · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight, practical rulebook for
authoring the herb identity corpus, so content creation can begin consistently. It
authors no herb content, lists no herbs, estimates no size, and designs no
implementation, generator, contract, validation, or wiring. It is subordinate to the
approved Herb Catalog Content Specification (`docs/architecture/30`) and follows the
Formula Catalog precedent (`docs/architecture/15`–`17`); it repeats no settled
architecture — it only fixes authoring conventions.

## 1. Purpose

These rules exist so the herb corpus is authored **consistently, maintainably, and
with stable canonical identities**. They are about *how to write entries*, not about
whether a herb is clinically correct — **clinical/editorial accuracy is human review,
not the job of these rules**. Their single goal is to unblock authoring of
`herb-catalog.md` with conventions that will not need to change later.

## 2. Canonical Naming Rules

Each canonical herb name is written as:

- **Pinyin only** — romanized pinyin; no Chinese characters, no English name.
- **Title Case** — each syllable capitalized.
- **No tone marks** — plain letters only (no diacritics).
- **Consistent spacing** — syllables separated by single spaces; no leading, trailing,
  or double spaces.
- **One canonical representation per identity** — exactly one spelling/format per herb.

*Formatting style only (not catalog entries):* a multi-syllable pinyin name is written
`Xxx Xxx Xxx` — Title Case, space-separated, no accents. (The formula catalog's names
demonstrate the same style.)

## 3. One Identity Per Entry

- **One line = one herb identity.**
- **No descriptions** — nothing about what the herb does.
- **No metadata** — no id, category, provenance, or annotation.
- **No comments** — an entry carries no inline note. (Section headers/status notes in
  the file are editorial scaffolding, not entries.)
- **No classifications** — no family/group labels on entries.

An entry contains **only the canonical herb name** — nothing before it, nothing after
it.

## 4. Duplicate Prevention Rules

- **Each identity appears exactly once.**
- **Alternate spellings are not separate entries** — pick the one canonical spelling;
  the variant is not added.
- **Aliases are not separate entries** — a second name for the same herb is not a new
  identity.
- **Translations are not separate entries** — English/other-language names are excluded
  (a deferred localization layer).

**Handling during authoring:** before adding a name, scan the existing corpus for the
same identity under any spelling/alias/translation. If it already exists, do not add
it; if a better canonical spelling is warranted, correct the single existing entry
rather than adding a second. When in doubt whether two names are the same identity,
resolve it in review (§8) before inclusion.

## 5. Prepared-Herb Policy

**Policy: a preparation/processing variant is a distinct canonical identity only when
it is conventionally named and used as a distinct herb; otherwise it is the same
identity and is not duplicated.**

- If clinical practice treats a processed form as its own named herb (a standard,
  distinct canonical name in common use), it is authored as its **own entry**.
- If a processing form is merely a state of the same herb without a distinct
  conventional identity, it is **not** a separate entry — the base identity stands.

**Rationale:** the catalog fixes *identities*, not preparation states. Admitting every
processing variation as a new entry would inflate the corpus with non-identities and
blur what counts as one herb; but refusing genuinely distinct, conventionally-named
prepared herbs would lose real identities. Naming-in-practice is the test. This mirrors
the formula catalog's retention of a preparation form only when it is part of the
canonical identity. Borderline cases are decided in review (§8) and, once decided,
stay stable.

## 6. Scope Rules

Content-neutral (no herbs enumerated, no target count):

- **Qualifies for inclusion** — a canonical herb that the platform needs to *name* as a
  distinct identity, drawn from an authoritative materia-medica reference basis and
  expressible as a single canonical pinyin name.
- **Does not qualify** — anything that is not a herb identity (a property, action,
  category, relationship, or formula); an alias/alternate spelling/translation of an
  already-included herb; or a name that cannot be reduced to a single canonical form.

No parity with any other corpus is required (the catalog is an independent root).

## 7. Source-of-Truth Rules

- **Future authoritative file** — `src/ai/knowledge/content/herb-catalog.md`,
  representation-neutral markdown, one canonical name per line (mirroring
  `formula-catalog.md`).
- **Authoring ownership** — authored and frozen through this content sprint under
  human editorial/clinical review.
- **Single source of truth** — herb identity lives only in that markdown. Any future
  generated/derived artifact is a **non-authoritative** projection of it and never a
  second source; the markdown always wins.

## 8. Review Rules

Lightweight, human review before an entry (or batch) is accepted — no formal
validation system:

- **Uniqueness check** — the identity is not already present under any
  spelling/alias/translation.
- **Naming consistency check** — pinyin, Title Case, no tone marks, single-spaced,
  one canonical form (§2).
- **Canonicalization check** — the entry is a single canonical name only, with no
  description/metadata/comment/classification (§3), and prepared-form cases follow §5.

Anything failing a check is corrected or deferred to discussion before inclusion.

## 9. Future Compatibility Rules

Future herb-related interfaces **reference Herb Catalog identities; they must never
duplicate them.** Herb identity is defined once, here; downstream layers cite it by
canonical name. Examples of such future, separate interfaces:

- **Herb Definitions** (herb meaning),
- **Herb Properties** (nature, flavor, channels),
- **Formula Composition** (formula → herbs, referencing both catalogs),
- **Herb Pairings** (herb ↔ herb relationships).

Each attaches beside the catalog by reference; none folds attributes or relationships
into a catalog entry.

## 10. Completion Criteria

The herb corpus is "complete enough to begin wiring" when — **independent of any entry
count**:

- **Stable identities** — the included canonical names are settled (no pending
  identity-migration debates); prepared-form borderline cases are decided.
- **Naming consistency** — every entry conforms to §2 (pinyin, Title Case, no tone
  marks, consistent spacing, one canonical form).
- **Duplicate-free** — no identity appears twice under any spelling/alias/translation
  (§4).

When these hold and the corpus is frozen, the Herb Catalog wiring sprint (derivation →
source → contract → registry upgrade) may begin, reusing the proven Formula Catalog
pattern. No specific number of entries is required (Option B keeps partial coverage
valid).

---

STOP. Authoring rules complete. Herb Catalog content creation may begin upon approval.
