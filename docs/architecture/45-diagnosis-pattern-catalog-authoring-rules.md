# Diagnosis Pattern Catalog — Authoring Rules

**Diagnosis Pattern Catalog · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight, practical rulebook for
authoring the diagnosis-tier identity corpus (`diagnosis-pattern-catalog.md`), so content
creation can begin consistently. It authors no catalog content, no diagnosis-pattern
entries, no definitions, and no mappings, and designs no generator, source, contract,
validation, registry change, or wiring. It is subordinate to the approved architecture
review (`docs/architecture/43`) and specification (`docs/architecture/44`), and mirrors the
catalog authoring rules (`31`, `36`); it repeats no settled architecture — it only fixes
authoring conventions. The split (`diagnosisPatternCatalog → diagnosisPatternDefinitions`),
catalog existence, and identity ownership are frozen and not reopened. Examples below use
abstract placeholders only.

## 1. Purpose

The catalog exists to maintain **canonical diagnosis-pattern identities** with stable
references, consistency, maintainability, and duplicate prevention. Its goal is
identity/naming discipline — **not clinical review**. This document does **not** validate
clinical correctness, diagnostic accuracy, treatment decisions, mappings, or
recommendations; those are other layers/reviews.

## 2. Canonical Naming Rules

- **One canonical identity per entry** — exactly one diagnostic pattern per entry.
- **One canonical representation** per identity — a single agreed name, chosen once.
- **Consistent formatting** — the same canonicalization standard (casing, spacing,
  terminology) applied to every entry, at author time.

The rules prevent: alternate spellings, duplicate naming, inconsistent capitalization, and
inconsistent terminology.

*Abstract form only (not content):* a pattern name is written as a consistent canonical
phrase `Aaa Bbb Ccc` — same format across all entries, no trailing punctuation, no
annotations.

## 3. One Identity Per Entry

- **One line = one identity.**
- **No descriptions**, **no definitions**, **no comments**, **no metadata**, **no
  categories**, **no tags**.

An entry contains **only the canonical pattern name** — nothing before it, nothing after
it. (File-level headers/status banners are editorial scaffolding, not entries.)

## 4. Duplicate Prevention

- **Each identity appears exactly once.**
- **No aliases** — a second name for the same pattern is not a separate entry.
- **No alternate spellings** — pick the one canonical spelling; the variant is not added.
- **Scan before add** — before adding a name, scan the corpus for the same identity under
  any spelling/alias.
- **Correct, don't duplicate** — if a better canonical spelling is warranted, correct the
  single existing entry rather than adding a second; resolve genuine "same identity?"
  doubts in review (§7) before inclusion.

**Why it matters:** downstream layers (`diagnosisPatternDefinitions`, `patternTreatmentMap`)
reference identities *by name*. A duplicate or variant identity splits references,
breaks the one-to-one basis of cross-content checks, and destabilizes every reference that
resolves to it. Stable, unique identities are the whole point of an identity root.

## 5. Scope Rules

**Belongs:**
- canonical diagnosis-pattern identities.

**Does NOT belong (owned elsewhere):**
- definitions / meaning → `diagnosisPatternDefinitions`;
- recommendations, reasoning, clinical guidance, decision procedures → the reasoning layer /
  runtime modules;
- pattern → treatment mappings → `patternTreatmentMap`;
- pattern → formula mappings → not a direct interface (flows pattern → principle →
  formula); never the catalog;
- pattern ↔ pattern relationships → a future relationship interface;
- aliases, translations → future alias / localization layers.

## 6. Source of Truth Rules

- **Future authoritative file** — `src/ai/knowledge/content/diagnosis-pattern-catalog.md`,
  representation-neutral markdown, one canonical name per line (mirroring the existing
  catalogs).
- **Authoring ownership** — authored and frozen through this content sprint under human
  editorial review.
- **Generated artifacts are projections** — any future derived form is a non-authoritative
  projection of the markdown; **no manual editing of generated outputs** (edit the markdown
  and regenerate). The markdown always wins.

## 7. Review Rules

Lightweight, human review before an entry (or batch) is accepted:

- **Duplicate detection** — the identity is not already present under any spelling/alias.
- **Naming consistency** — consistent format, one canonical form (§2).
- **Canonicalization consistency** — the entry is a single canonical name only, with no
  description/definition/metadata/category/tag (§3).
- **Scope compliance** — the entry is a pattern *identity*, nothing else (§5).

Explicitly excluded from this review: clinical validation, treatment validation, and
recommendation review — those are separate concerns, not catalog authoring.

## 8. Future Compatibility

Future interfaces **reference identities; they must not duplicate them.** Identity is
defined once, here; downstream layers cite it by canonical name. Named future consumers:

- **`diagnosisPatternDefinitions`** (pattern meaning, referencing catalog identities),
- **`patternTreatmentMap`** (pattern → treatment principle/family; LHS references catalog
  identities).

Each references by name; none folds meaning, mappings, or attributes into a catalog entry
(reference-not-duplicate).

## 9. Completion Criteria

The corpus is "complete enough to begin wiring" when — **independent of any entry count**:

- **Stable identities** — the included canonical names are settled (no pending
  identity-migration debates).
- **Duplicates removed** — no identity appears twice under any spelling/alias (§4).
- **Naming consistent** — every entry conforms to §2/§3.
- **Scope respected** — identity-only, no leakage (§5).

**No required count, no coverage target, no parity requirement.** When these hold and the
corpus is frozen, the wiring lifecycle (derivation → source → contract → registry upgrade)
may begin, reusing the proven catalog pattern.

## 10. Sufficiency

These authoring rules, together with the approved specification (`docs/architecture/44`),
are sufficient to begin the **diagnosis-pattern-catalog content sprint** upon approval. The
only remaining decisions (the exact canonicalization convention, file/interface naming) are
authoring-time choices, not blockers.

## Scope

Authoring rules only. No diagnosis-pattern content, entries, definitions, mappings,
generators, sources, contracts, validation, registry changes, or wiring; no change to any
existing file other than the creation of this document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
