# Formula Definitions — Authoring Rules

**Formula Definitions · Content Sprint · Authoring Rules.** Status: **PROPOSED — PENDING
REVIEW.** A deliberately lightweight, practical rulebook for authoring the strategy-tier
meaning corpus (`formula-definitions.md`), so content creation can begin consistently. It
authors no treatment-principle content, no definitions, and no mappings, and designs no
generator, contract, validation, registry change, source, wiring, or plan. It is
subordinate to the frozen content specification (`docs/architecture/39`) and mirrors the
prescription-definitions authoring plan (`20`) and the catalog authoring rules (`31`,
`36`); it repeats no settled architecture — it only fixes authoring conventions. Examples
below use abstract placeholders only.

## 1. Purpose

These rules exist so the treatment-principle meaning corpus is authored **consistently and
maintainably, with stable meaning ownership**. They ensure consistency, maintainability,
and stable ownership of *meaning* — **not clinical validation** (clinical/editorial
accuracy is human review, not the job of these rules). Their single goal is to unblock
authoring of `formula-definitions.md` with conventions that will not need to change later.

## 2. Identity Reference Rules

- **Every entry must reference a canonical identity from `formulaDefinitionCatalog`** — a
  treatment-principle name the catalog already owns.
- **Meaning is attached by reference** — an entry pairs a referenced catalog identity with
  its meaning; it never introduces a new identity.
- **Identity is never duplicated** — the canonical name is owned solely by the catalog;
  the definition cites it, and a name not in the catalog is not eligible (the reference
  must resolve).

*Abstract form only (not content):* `- **<Referenced Catalog Identity>** — <intrinsic
therapeutic meaning>`.

## 3. Definition Writing Rules

- **Intrinsic therapeutic meaning only** — a definition states what the treatment strategy
  intrinsically *is* (its therapeutic intent and the aspect it acts on).
- **Objective** — an account of what the principle is, not an opinion.
- **Timeless** — enduring meaning, not present-day practice or context.
- **Independent of patterns, formulas, and recommendations** — the meaning stands on its
  own and does not rely on, or refer to, any pattern, formula, or usage decision.

## 4. Prohibited Content

An entry must not contain:

- pattern references,
- formula references,
- recommendations,
- rankings,
- preferred use cases,
- treatment decisions,
- execution guidance,
- dosage,
- reasoning chains,
- mappings.

These are owned by other interfaces (the maps, the reasoning layer, the execution tier) or
are out of scope entirely.

## 5. One Definition Per Identity

- **One identity, one definition.**
- **No duplicate entries** — a referenced identity appears at most once.
- **No alternate versions** — a single canonical meaning per identity; competing or
  variant definitions of the same identity are not authored.

## 6. Scope Rules

**Belongs:**
- the intrinsic therapeutic meaning of a catalogued treatment principle.

**Does not belong:**
- identities (owned by `formulaDefinitionCatalog`),
- patterns, formulas, herbs,
- mappings,
- recommendations,
- aliases, translations.

## 7. Source of Truth Rules

- **Future authoritative source** — `src/ai/knowledge/content/formula-definitions.md`,
  representation-neutral markdown, one entry per line (referenced identity + meaning).
- **Authoring ownership** — authored and frozen through this content sprint under human
  editorial/clinical review.
- **Generated artifacts are non-authoritative** — any future derived form is a projection
  of the markdown; the markdown always wins.

## 8. Review Rules

Lightweight, human review before an entry (or batch) is accepted — no automated clinical
validation:

- **Identity reference correctness** — the referenced name exists in
  `formulaDefinitionCatalog`.
- **Consistency** — terminology and style are consistent across the collection.
- **Duplicate prevention** — the identity is not already defined.
- **Ownership boundaries** — the entry carries only intrinsic meaning (no prohibited
  content, §4).

Anything failing a check is corrected or deferred to discussion before inclusion.

## 9. Future Compatibility

Future interfaces **reference identities; they must not duplicate meanings.** Meaning is
defined once, here, keyed to a catalog identity; downstream layers (maps, reasoning,
future strategy interfaces) cite the identity and rely on this meaning without copying it.

## 10. Completion Criteria

The corpus is "complete enough to begin wiring" when — **independent of any entry count**:

- **every entry references a catalog identity** that resolves in
  `formulaDefinitionCatalog`;
- **every entry contains one intrinsic definition** (referenced identity + objective
  meaning);
- **ownership boundaries respected** (no prohibited content, §4);
- **duplicates removed** (one definition per identity, §5);
- **consistency maintained** across terminology and style.

When these hold and the corpus is frozen, the wiring lifecycle (derivation → source →
contract → registry upgrade, plus a build-time catalog cross-content check) may begin,
reusing the proven pattern. No specific number of entries is required (Option B keeps
partial coverage valid).

## Sufficiency

These authoring rules, together with the frozen specification (`docs/architecture/39`),
are sufficient to begin **content authoring** of `formula-definitions.md` upon approval.
The only remaining decisions (meaning altitude specifics, parity target, batch cadence)
are authoring-time choices, not blockers.

## Scope

Authoring rules only. No treatment-principle content, definitions, mappings, generators,
contracts, validation, registry changes, sources, runtime wiring, plans, or code; no change
to any existing file other than the creation of this document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
