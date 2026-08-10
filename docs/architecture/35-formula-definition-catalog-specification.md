# Formula Definition Catalog — Specification

**Formula Definition Catalog · Content Sprint · Step (Specification).** Status:
**PROPOSED — PENDING REVIEW.** The formal conceptual specification for the identity-layer
interface `formulaDefinitionCatalog`: its purpose, ownership, entry model, naming
policy, scope rule, source-of-truth policy, dependency model, evolution rules, and
invariants. It authors no content, proposes no principles/families, estimates no
counts, and defines no implementation (no schema, source, contract, generator, mapping,
validation, or registry change). It conforms to the frozen transport/loader/registry
architecture (`docs/architecture/11`–`16`), the completed catalog precedents
(`formulaCatalog`, `herbCatalog`), and the approved architecture reviews
(`docs/architecture/33` — Option B split; `docs/architecture/34` — single combined
catalog for v1). It changes no existing file.

**Grounding (verified):** `formulaDefinitionCatalog` does not yet exist. `formulaCatalog`,
`prescriptionFormulaDefinitions`, `herbCatalog` are wired; `formulaDefinitions`,
`diagnosisPatternDefinitions`, `patternTreatmentMap`, `treatmentFormulaMap` are pending.
Reviews 33 and 34 approved splitting identity from meaning for the strategy tier and
using a single combined catalog (principles + families together) for v1.

---

## A. Purpose

- **Role.** `formulaDefinitionCatalog` is the **identity root of the strategy tier**: the
  authoritative canonical name-space of the treatment-strategy vocabulary — treatment
  principles and formula families. It answers only *"what is the canonical name of this
  treatment principle or formula family?"*
- **Why separate from `formulaDefinitions`.** `formulaDefinitions` owns the **meaning** of
  those strategies; the catalog owns their **identity**. Separating them mirrors
  `formulaCatalog → prescriptionFormulaDefinitions`, gives the relationship layers a
  **stable identity root** to reference (Review 34 §5: `treatmentFormulaMap` already
  references `formulaCatalog` on its RHS; its LHS needs a matching identity root), and
  lets identity stay append-only/stable while meaning evolves independently.
- **Place in the strategy tier.** Pipeline tiers: Diagnosis (patterns) → **Formula
  (strategy: principle + family)** → Prescription (named formula + herbs). The catalog is
  the identity foundation of that middle, strategy tier — the analogue of `formulaCatalog`
  for the execution tier.

## B. Ownership

**Owns:**
- **canonical treatment-principle identities** — the canonical name of each treatment
  principle;
- **canonical formula-family identities** — the canonical name of each formula family.

(one combined name-space; §D).

**Does NOT own:**

| Not owned | Owned instead by |
|---|---|
| meanings / descriptions of principles or families | `formulaDefinitions` |
| named formulas (identity or meaning) | `formulaCatalog` / `prescriptionFormulaDefinitions` |
| herbs | `herbCatalog` |
| diagnosis patterns (identity or meaning) | `diagnosisPatternDefinitions` |
| mappings (pattern→strategy, strategy→formula) | `patternTreatmentMap` / `treatmentFormulaMap` |
| which named formulas realize a family | `treatmentFormulaMap` (a relationship — never the catalog) |
| recommendations / selection | reasoning layer / runtime modules |
| reasoning | runtime modules |

**Ownership matrix:**

| Interface | Owns | Does NOT own |
|---|---|---|
| `formulaDefinitionCatalog` | canonical treatment-principle **and** formula-family identities (names) | meaning, named formulas, herbs, patterns, mappings, recommendations, reasoning |

## C. Entry Model

Implementation-neutral (no schema/format/type implied).

- **One entry = one canonical strategy identity** (a single treatment-principle *or*
  formula-family canonical name).
- **Identity only** — the entry is the canonical name; nothing else.
- **Minimum content:** exactly one canonical identity string (non-empty).
- **Maximum content:** exactly one canonical identity string.
- **No metadata** — no id, provenance, or annotation.
- **No descriptions** — no meaning of any kind.
- **No categories attached to entries** — an entry is not tagged as "principle" vs.
  "family" or grouped under headings (no classification leaks into an entry; see §D and
  §K).
- **No comments** — an entry carries no inline note (file-level headers/status banners are
  editorial scaffolding, not entries).

Identity-only, vocabulary-only, non-descriptive — the strategy-tier analogue of the
Formula Catalog entry model.

## D. Combined-Catalog Decision (approved, v1)

**Decision (Review 34):** a **single combined catalog** holds both **treatment
principles** and **formula families** in one canonical name-space.

**Why:**
- **Shared consumers** — the strategy vocabulary is referenced by `FormulaModule` (via
  meaning) and by *both* maps; a single root serves all of them.
- **Shared mapping layer** — `patternTreatmentMap` (RHS) and `treatmentFormulaMap` (LHS)
  both address "treatment principle/family" as a single unit; one catalog matches that
  addressing.
- **Avoids premature principle↔family relationship modeling** — two catalogs would force
  an explicit principle↔family relationship and a choice of which the maps reference; v1
  defers that complexity.

**Explicitly rejected for v1:** `treatmentPrincipleCatalog` and `formulaFamilyCatalog` as
separate interfaces. No further subdivision in v1. (This decision is settled; not an open
question — see §K.)

*Note:* because entries are identity-only with no attached category (§C), the combined
catalog does not record whether a given entry is a principle or a family; that
distinction, if ever needed, is a future concern, not an entry field.

## E. Canonical Naming Policy

- **One canonical representation per identity** — exactly one canonical name per
  principle/family, and one identity per name.
- **No aliases** — a second name for the same identity is excluded (future alias layer).
- **No alternate spellings** — excluded (alias-class data).
- **No translations** — excluded (deferred localization layer).
- **Convention** — a consistent canonicalization standard applied to every entry
  (casing, spacing, romanization where applicable), to be fixed by the authoring rules,
  consistent in spirit with `formulaCatalog`/`herbCatalog`. Convention *correctness* is
  an authoring/editorial concern, not a structural one.

Rationale: aliases/spellings/translations would break one-entry-per-identity and turn the
catalog into a lookup/synonym layer; they belong to future layers that reference the
canonical identity.

## F. Corpus Scope

Content-neutral: **no counts, no target size, no enumeration.**

- **Inclusion criterion** — a treatment principle or formula family qualifies when the
  platform needs to *name* it as a distinct strategy identity referenced by the strategy
  meaning layer or the mapping layers, expressible as a single canonical name under §E.
- **Exclusion criterion** — anything that is not a strategy identity (a meaning, a named
  formula, an herb, a pattern, a mapping, a recommendation); an alias/spelling/translation
  of an already-included identity; or a name not reducible to a single canonical form.
- **No parity requirement** — as an independent identity root, its size is whatever the
  inclusion rule yields; Option B/Option-B-fallback keeps partial coverage valid.

## G. Source of Truth

- **Future authoritative file** — `src/ai/knowledge/content/formula-definition-catalog.md`,
  representation-neutral markdown, one canonical name per line (mirroring
  `formula-catalog.md` / `herb-catalog.md`).
- **Single Source of Truth** — strategy identity lives only in that markdown.
- **Generated artifacts are projections only** — any future derived artifact (the strategy
  analogue of `formula-catalog.generated.ts`) is produced deterministically from the
  markdown, is non-authoritative, and is verified against it (no drift). The markdown
  always wins.

## H. Dependency Model

```
formulaDefinitionCatalog        (identity root — references nothing)
        ↑            ↑            ↑
formulaDefinitions   patternTreatmentMap   treatmentFormulaMap
(meaning)            (RHS: strategy)       (LHS: strategy; RHS: formulaCatalog)
```

- **Inbound only.** `formulaDefinitions` references it (meaning → identity);
  `patternTreatmentMap` references it (RHS); `treatmentFormulaMap` references it (LHS).
- **No outbound dependencies** — the catalog references no other interface.
- **No cycles** — an interface that references nothing cannot be in a cycle; all edges
  point inbound toward the catalog.
- **No runtime coupling** — per-identifier resolution; the above are content/build-time
  references, not runtime load-order requirements.

## I. Future Evolution

- Future interfaces (`formulaDefinitions`, `patternTreatmentMap`, `treatmentFormulaMap`,
  and any later strategy-level mapping/classification) **reference** strategy identities
  from this catalog **and must never duplicate them.** Identity is defined once, here.
- **Additive growth** — new canonical strategy names append; approved identities are
  preserved; prior batches are never rewritten (append-only).
- **Neighbouring concerns attach beside the catalog** — meaning (`formulaDefinitions`),
  aliases/translations (future layers), and any principle↔family relationship (a future
  relationship interface, *if* ever needed) reference identities by name; none folds into
  a catalog entry.

## J. Invariants

1. **Identity Ownership** — the catalog owns canonical strategy identities; identity is
   defined here and nowhere else.
2. **Minimal Vocabulary** — an entry is exactly one canonical name; no metadata,
   description, category, or comment enters an entry.
3. **Single Source of Truth** — one authoritative markdown holds strategy identity; any
   derived form is a non-authoritative, no-drift projection.
4. **Independent Root** — the catalog depends on no other interface and can be authored,
   frozen, and evolved independently.
5. **No Meaning Ownership** — the catalog carries no meaning, description, or attribute;
   meaning is owned by `formulaDefinitions`.
6. **One-Way Dependencies** — all references are inbound; the catalog references nothing;
   cycles are impossible.
7. **Append-Only Growth** — growth is by additive extension; approved entries and frozen
   batches are never rewritten.
8. **No Alias Accretion** — aliases, alternate spellings, and translations are excluded
   and owned by future layers.
9. **Stable Canonical Identity** — one canonical name per identity and one identity per
   name; canonical names remain stable once frozen (a genuine change is an exceptional
   identity migration, not ordinary authoring).
10. **Option B Compatibility** — partial coverage is valid; a missing strategy identity
    resolves to absence (never a runtime failure), so completeness is not required for
    usefulness.
11. **Combined Name-Space (v1)** — principles and families share one catalog; no
    per-entry principle/family classification and no separate principle/family catalogs
    in v1.

## K. Open Questions

**Genuine, unresolved:**
- **Canonicalization convention specifics** — the exact casing/spacing/romanization rules
  for strategy names (a treatment principle may be a short English phrase, a formula
  family a descriptive phrase); to be fixed in the authoring rules. This is a naming-style
  decision, not an architectural one.
- **Naming of the authoritative file/interface** — `formulaDefinitionCatalog` /
  `formula-definition-catalog.md` are the working names; a clearer strategy-oriented name
  could be considered before authoring, but is non-blocking.

**Explicitly NOT reopened (already decided):** split vs. combined (split, Review 33);
principle catalog vs. family catalog (single combined catalog, Review 34). These are
settled and out of scope for further debate.

## L. Sufficiency Assessment

**The specification is sufficient to begin the `formulaDefinitionCatalog` authoring rules
and content creation.** Purpose, ownership (with matrix), entry model (identity-only,
one canonical name), the approved combined-catalog decision, naming policy, scope rule
(content-neutral), source-of-truth policy, dependency model (independent inbound-only
root, acyclic), evolution rules, and invariants are all resolved. The only open items are
authoring-style decisions (canonicalization specifics, naming), not architectural
blockers. The interface is consistent with the `formulaCatalog`/`herbCatalog` precedents
and introduces no implementation, content, or corpus size.

Recommended next step (for review, not executed): a lightweight **authoring-rules** document
(the strategy analogue of `31-herb-catalog-authoring-rules.md`), then content creation of
`formula-definition-catalog.md`, then the standard wiring lifecycle.

## Scope

Specification only. No content, catalog entries, principles, families, definitions,
mappings, generators, sources, contracts, validation code, registry changes,
implementation plans, or wiring artifacts; no change to any existing file other than the
creation of this document.

STOP. Specification complete. No implementation begun. Nothing committed. Awaiting review.
