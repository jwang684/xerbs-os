# Formula Definition Catalog — Authoring Rules

**Formula Definition Catalog · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight, practical rulebook for
authoring the strategy identity corpus (`formula-definition-catalog.md`), so content
creation can begin consistently. It authors no catalog content, no strategy identities,
no principles, families, definitions, or mappings, and designs no generator, contract,
validation, registry change, or plan. It is subordinate to the approved specification
(`docs/architecture/35`) and the reviews that finalized the split and combined-catalog
decisions (`docs/architecture/33`, `34`); it repeats no settled architecture — it only
fixes authoring conventions.

## 1. Purpose

These rules exist so the strategy identity corpus is authored **consistently and
maintainably, with stable canonical identities and stable references**. They ensure
identity consistency, naming consistency, stable references for downstream layers, and
maintainability — **not clinical correctness** (clinical/editorial accuracy is human
review, not the job of these rules). Their single goal is to unblock authoring of
`formula-definition-catalog.md` with conventions that will not need to change later.

## 2. Canonical Naming Rules

- **One canonical identity per entry** — exactly one treatment principle *or* one formula
  family per entry.
- **Consistent naming format** — every entry follows the same canonicalization standard
  (consistent casing and spacing; one agreed representation style), applied at author
  time.
- **Stable canonical representation** — one canonical form per identity, chosen once and
  kept stable.

*Abstract examples only (not catalog entries):* a principle-style name is written as a
concise canonical phrase `Aaa Bbb`; a family-style name as its canonical phrase `Ccc Ddd`
— both in the same consistent format, no trailing punctuation, no annotations.

## 3. One Identity Per Entry

- **One line = one strategy identity.**
- **No descriptions** — nothing about what the principle/family means or does.
- **No comments** — an entry carries no inline note (file-level headers/status banners are
  editorial scaffolding, not entries).
- **No metadata** — no id, provenance, or annotation.
- **No classifications** — no group/category labels on entries.

An entry contains **only the canonical strategy name** — nothing before it, nothing after
it.

## 4. Principle vs. Family Entries

- **Both may appear in the same catalog** — treatment principles and formula families
  share one combined name-space (per the finalized v1 decision).
- **Neither receives special formatting** — a principle entry and a family entry look
  identical in form; both are just canonical names on their own lines.
- **Identities are treated equally** — no ordering, grouping, or precedence by type.
- **No type tags** — an entry is **not** marked as "principle" or "family." The catalog is
  identity-only; the distinction (if ever needed) is a future concern, never an entry
  field.

## 5. Duplicate Prevention

- **Each identity appears exactly once.**
- **Aliases are not separate entries** — a second name for the same principle/family is
  not added.
- **Alternate spellings are not separate entries** — pick the one canonical spelling; the
  variant is not added.
- **Handling during authoring** — before adding a name, scan the corpus for the same
  identity under any spelling/alias. If it exists, do not add it; if a better canonical
  spelling is warranted, correct the single existing entry rather than adding a second.
  When unsure whether two names are the same identity, resolve it in review (§8) before
  inclusion.

## 6. Scope Rules

Content-neutral (no identities enumerated, no target count):

- **Belongs** — canonical strategy identities: treatment principles and formula families
  the platform needs to name as distinct identities, each expressible as a single
  canonical name.
- **Does not belong** — meanings/descriptions (owned by `formulaDefinitions`); named
  formulas (`formulaCatalog`); herbs (`herbCatalog`); diagnosis patterns
  (`diagnosisPatternDefinitions`); recommendations (reasoning layer); mappings
  (`patternTreatmentMap` / `treatmentFormulaMap`).

## 7. Source of Truth Rules

- **Authoritative file** — `src/ai/knowledge/content/formula-definition-catalog.md`,
  representation-neutral markdown, one canonical name per line (mirroring
  `formula-catalog.md` / `herb-catalog.md`).
- **Authoring ownership** — authored and frozen through this content sprint under human
  editorial/clinical review.
- **Generated artifacts are not authoritative** — any future derived/generated form is a
  non-authoritative projection of the markdown; the markdown always wins.

## 8. Review Rules

Lightweight, human review before an entry (or batch) is accepted — no automated system:

- **Duplicate check** — the identity is not already present under any spelling/alias.
- **Naming consistency check** — consistent format, one canonical form (§2).
- **Canonicalization consistency check** — the entry is a single canonical name only,
  with no description/metadata/comment/classification/type tag (§3, §4).

Anything failing a check is corrected or deferred to discussion before inclusion.

## 9. Future Compatibility

Future interfaces **reference strategy identities from this catalog; they must never
duplicate them.** Identity is defined once, here; downstream layers cite it by canonical
name. Such future interfaces include:

- **`formulaDefinitions`** (meaning of principles/families),
- **`patternTreatmentMap`** (pattern → principle/family),
- **`treatmentFormulaMap`** (principle/family → named formula).

Each references by name; none folds meaning, mappings, or attributes into a catalog entry.

## 10. Completion Criteria

The corpus is "complete enough to begin wiring" when — **independent of any entry
count**:

- **Stable identities** — the included canonical names are settled (no pending
  identity-migration debates).
- **Duplicates removed** — no identity appears twice under any spelling/alias (§5).
- **Naming consistent** — every entry conforms to §2/§3/§4.

When these hold and the corpus is frozen, the wiring lifecycle (derivation → source →
contract → registry upgrade) may begin, reusing the proven catalog pattern. No specific
number of entries is required (Option B keeps partial coverage valid).

## Scope

Authoring rules only. No catalog content, strategy identities, principles, families,
mappings, definitions, generators, contracts, validation, registry changes, or
implementation plans; no change to any existing file other than the creation of this
document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
