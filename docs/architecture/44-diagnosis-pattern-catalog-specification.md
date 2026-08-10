# Diagnosis Pattern Catalog — Specification

**Diagnosis Pattern Catalog · Content Sprint · Step (Specification).** Status:
**PROPOSED — PENDING REVIEW.** The formal conceptual specification for the identity-layer
interface `diagnosisPatternCatalog`: its purpose, ownership, entry model, naming policy,
scope rule, source-of-truth policy, dependency model, evolution rules, and invariants. It
authors no content, proposes no patterns, estimates no counts, and defines no
implementation (no schema, source, contract, generator, mapping, validation, or registry
change). It conforms to the frozen transport/loader/registry architecture
(`docs/architecture/11`–`16`), the completed catalog precedents (`formulaCatalog`,
`herbCatalog`, `formulaDefinitionCatalog`), and the approved architecture review
(`docs/architecture/43` — split into `diagnosisPatternCatalog → diagnosisPatternDefinitions`).
The split decision is settled and not reopened here. It changes no existing file.

**Grounding (verified):** `diagnosisPatternCatalog` does not yet exist.
`diagnosisPatternDefinitions` is `pending(...)`; `DiagnosisModule` requests it and renders
`{{patternDefinitions}}`; the pending `patternTreatmentMap` references patterns on its LHS.
The identity/meaning split for this tier was approved in Doc 43.

---

## A. Purpose

- **Role.** `diagnosisPatternCatalog` is the **identity root of the diagnosis tier**: the
  authoritative canonical name-space of diagnostic patterns. It answers only *"what is the
  canonical name of this diagnostic pattern?"*
- **Why separate from `diagnosisPatternDefinitions`.** The definitions interface owns the
  **meaning** of each pattern; the catalog owns their **identity**. Separating them mirrors
  `formulaDefinitionCatalog → formulaDefinitions` (and `formulaCatalog →
  prescriptionFormulaDefinitions`): it gives the relationship layer a **stable identity
  root** to reference and lets identity stay append-only/stable while meaning evolves
  independently.
- **Stable identities for consumers.**
  - `DiagnosisModule` grounds its differentiation in curated pattern *meaning*
    (`diagnosisPatternDefinitions`), which references catalog identities.
  - `patternTreatmentMap` references pattern *identity* on its LHS. After the split, that
    map references identity roots on both sides (pattern identity on the LHS,
    `formulaDefinitionCatalog` identity on the RHS) — a symmetric, stable relationship
    layer.

## B. Ownership

**Owns:** canonical diagnosis-pattern identities (the canonical name of each pattern).

**Ownership matrix:**

| Interface | Owns | Does NOT own |
|---|---|---|
| `diagnosisPatternCatalog` | canonical diagnosis-pattern **identities** (names) | meaning, definitions, recommendations, mappings, pattern relationships, reasoning, clinical decisions, treatment guidance, formula guidance, decision procedures, aliases, translations |

Explicitly excluded (each owned elsewhere):
- **definitions / meaning** → `diagnosisPatternDefinitions`;
- **recommendations, reasoning, clinical decisions, decision procedures** → the reasoning
  layer / runtime modules;
- **pattern → treatment guidance** → `patternTreatmentMap`;
- **pattern → formula guidance** → not a direct interface (flows pattern → principle via
  `patternTreatmentMap`, then principle → formula via `treatmentFormulaMap`); never owned
  by the catalog;
- **pattern ↔ pattern relationships** → a future relationship interface (none exists);
- **aliases / alternate spellings / translations** → future alias / localization layers.

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- **One entry = one canonical diagnosis-pattern identity.**
- **Exactly one canonical name** per entry (a non-empty string).
- **No metadata** — no id, provenance, or annotation.
- **No categories** — no grouping/family labels on entries.
- **No descriptions** — no meaning of any kind.
- **No comments** — an entry carries no inline note (file-level headers/status banners are
  editorial scaffolding, not entries).
- **No tags** — no type/severity/classification markers.

Identity-only, vocabulary-only, non-descriptive — the diagnosis-tier analogue of the
Formula Definition Catalog entry model.

## D. Catalog Scope

- **Belongs:** canonical diagnosis-pattern identities — one canonical name per distinct
  pattern the platform needs to name.
- **Does not belong:** pattern meaning, definitions, symptoms, decision procedures,
  recommendations, mappings, relationships, reasoning, treatment/formula guidance, aliases,
  translations.

The scope is **identity-only** and **content-neutral**: this specification defines the
inclusion *rule*, not the patterns. No specific patterns are defined or enumerated.

## E. Naming Policy

- **One canonical representation per identity** — exactly one canonical name per pattern,
  and one identity per name.
- **No aliases** — a second name for the same pattern is excluded (future alias layer).
- **No alternate spellings** — excluded (alias-class data).
- **No translations** — excluded (deferred localization layer).
- **No duplicate identities** — each pattern appears at most once.
- **Convention** — a consistent canonicalization standard (casing, spacing, and
  romanization/wording approach) applied to every entry, to be fixed by the authoring
  rules and consistent in spirit with the existing catalogs. Convention *correctness* is
  an authoring/editorial concern, not a structural one.

Future layers may attach additional information (meaning, aliases, translations,
relationships) **by reference** to a canonical identity; none folds into a catalog entry.

## F. Corpus Scope

Content-neutral: **no counts, no target coverage, no enumeration.**

- **Inclusion criterion** — a diagnostic pattern qualifies when the platform needs to
  *name* it as a distinct identity referenced by the pattern meaning layer or the mapping
  layer, expressible as a single canonical name under §E.
- **Exclusion criterion** — anything that is not a pattern identity (a meaning, a symptom,
  a treatment principle, a formula, a mapping, a recommendation); an alias/spelling/
  translation of an already-included pattern; or a name not reducible to a single canonical
  form.
- **No parity requirement** — as an independent identity root, its size is whatever the
  inclusion rule yields; Option-B fallback keeps partial coverage valid.

## G. Source of Truth

- **Future authoritative file** — `src/ai/knowledge/content/diagnosis-pattern-catalog.md`,
  representation-neutral markdown, one canonical name per line (mirroring the existing
  catalogs).
- **Single Source of Truth** — pattern identity lives only in that markdown.
- **Generated artifacts are projections only** — any future derived artifact (the analogue
  of the existing `*.generated.ts` catalogs) is produced deterministically from the
  markdown, is non-authoritative, and is verified against it (**no drift**). The markdown
  always wins.

## H. Dependency Model

```
diagnosisPatternCatalog        (identity root — references nothing)
        ↑                    ↑
diagnosisPatternDefinitions   patternTreatmentMap
(meaning → identity)          (LHS: pattern identity)
        ↑
DiagnosisModule (consumes meaning)
```

- **Outbound dependencies:** **none.** The catalog references no other interface.
- **Inbound consumers:** `diagnosisPatternDefinitions` (meaning → identity) and
  `patternTreatmentMap` (LHS references identity). (`DiagnosisModule` consumes the meaning
  layer, which in turn references the catalog.)
- **Identity root / stable references** — a single stable name-space that inbound layers
  cite; identity is meaning-independent.
- **Acyclic** — an interface that references nothing cannot be in a cycle; all edges point
  inbound toward the catalog.
- **No runtime coupling** — per-identifier resolution; the above are content/build-time
  references, not runtime load-order requirements.

## I. Future Evolution

- **Append-only evolution** — new canonical pattern identities append; approved identities
  are preserved; prior batches are never rewritten.
- **Stable identities** — canonical names remain stable once frozen (a genuine change is an
  exceptional identity migration, not ordinary authoring — Canonical Naming Stability).
- **Reference, not duplicate** — future interfaces (`diagnosisPatternDefinitions`,
  `patternTreatmentMap`, and any later pattern-referencing layer) reference catalog
  identities and must never duplicate them; identity is defined once, here.
- **Neighbouring concerns attach beside** — meaning, aliases, translations, and any future
  pattern↔pattern relationship reference identities by name; none folds into a catalog
  entry. (No architectural decision is reopened.)

## J. Invariants

1. **Identity Ownership** — the catalog owns canonical diagnosis-pattern identities;
   identity is defined here and nowhere else.
2. **Canonical Naming** — one canonical representation per identity, applied consistently.
3. **One Identity Per Entry** — each entry is exactly one canonical name.
4. **No Meaning** — the catalog carries no meaning, definition, or description; meaning is
   owned by `diagnosisPatternDefinitions`.
5. **No Metadata** — no id, category, tag, comment, or annotation in an entry.
6. **No Relationships** — no pattern↔pattern or pattern↔anything associations.
7. **No Recommendations** — no clinical decisions, guidance, or reasoning.
8. **No Runtime Coupling** — resolution is per-identifier; references are content/build-time
   only; no load-order dependency.
9. **Single Source of Truth** — one authoritative markdown holds identity; any derived form
   is a non-authoritative, no-drift projection.
10. **Append-Only Evolution** — growth is additive; approved entries and frozen batches are
    never rewritten.
11. **No Alias Accretion** — aliases, alternate spellings, and translations are excluded and
    owned by future layers.
12. **One-Way Dependencies** — all references are inbound; the catalog references nothing;
    cycles are impossible.

## K. Open Questions

**Genuine, unresolved (for the authoring rules):**
- **Canonicalization convention** — the exact casing/spacing/romanization-or-English-wording
  standard for canonical pattern names (patterns may be expressed as standard TCM
  pattern phrases); to be fixed in the authoring rules. A naming-style decision, not
  architectural.
- **File / interface naming** — `diagnosis-pattern-catalog.md` and `diagnosisPatternCatalog`
  are the working names; confirmable before authoring, non-blocking.

**Explicitly NOT reopened (settled):** split vs combined; catalog existence; identity
ownership (all fixed by Doc 43).

## L. Sufficiency

**The specification is sufficient to begin the `diagnosisPatternCatalog` authoring rules and
content sprint.** Purpose, ownership (with matrix), entry model (identity-only, one canonical
name), catalog and corpus scope (content-neutral), naming policy, source-of-truth policy,
dependency model (independent inbound-only root, acyclic), evolution rules, and invariants
are all resolved. The only open items are authoring-style decisions (canonicalization
convention, naming), not architectural blockers. The interface mirrors the
`formulaDefinitionCatalog` / `herbCatalog` precedents and introduces no implementation,
content, or corpus size.

Recommended next step (for review, not executed): a lightweight **authoring-rules** document
(the diagnosis-tier analogue of the catalog authoring rules), then content creation of
`diagnosis-pattern-catalog.md`, then the standard wiring lifecycle.

## Scope

Specification only. No content, catalog entries, definitions, mappings, generators, sources,
contracts, validation code, registry changes, implementation plans, or wiring artifacts; no
change to any existing file other than the creation of this document.

STOP. Specification complete. No content authored. Nothing committed. Awaiting review.
