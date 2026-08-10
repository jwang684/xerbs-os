# Herb Catalog — Content Architecture Review

**Herb Catalog · Content Sprint · Step 1 (Architecture Review).** Status:
**PROPOSED — PENDING REVIEW.** This review determines whether a Herb Catalog *content*
sprint should exist and what architectural role the Herb Catalog plays. It authors no
content, creates no herb entries, defines no herb properties, and creates no schema,
source, contract, generator, validation, registry change, or implementation plan. It
is consistent with, and subordinate to, the frozen Knowledge Content architecture
(`docs/architecture/13`–`14`), the completed Formula Catalog content sprint
(`docs/architecture/15`–`17`), the completed Prescription Formula Definitions content
sprint (`docs/architecture/18`–`21`), and the Herb Catalog Wiring Review
(`docs/architecture/28`), which identified the missing corpus as the blocker.

## 1. Grounded Repository State (verified facts)

- **`herbCatalog` remains placeholder-bound.** `src/ai/knowledge/productionRegistry.ts`
  binds `herbCatalog` via `pending("herbCatalog")` (line 67): `emptySource` +
  `unauthoredContract`. At runtime it resolves to absence → Option B →
  `"(none provided)"`.
- **The consumption seam already exists.** `PrescriptionModule.knowledgeRequest()`
  includes `herbCatalog: true` (line 57); `variables()` reads
  `knowledgeOrNone(this.knowledge, "herbCatalog")` (line 81); `prescription.md`
  renders `{{herbCatalog}}` (line 76), labelled "Herb name vocabulary (optional
  reference) … Vocabulary only — no herb properties, no composition."
- **No herb corpus exists.** There is no `herb-catalog.md`, no authored herb corpus,
  no herb identity source of truth, and no herb catalog content anywhere in the
  repository. The content directory holds only `formula-catalog.md` and
  `prescription-formula-definitions.md`.
- **Two completed precedents exist** — `formulaCatalog` (135 canonical formula
  identities) and `prescriptionFormulaDefinitions` (135 definitions), each authored,
  frozen, and runtime-wired.

**Consequence:** the runtime path is ready to receive herb identities, but the content
prerequisite is unmet. Content, not wiring, is the current gating concern.

## 2. Purpose of Herb Catalog

Evaluated against the candidate roles:

- **Identity layer — YES.** Its purpose is to establish the canonical identities of
  herbs: the authoritative answer to "what is the canonical name of this herb?"
- **Vocabulary layer — YES (the same thing).** In this architecture a Vocabulary
  interface *is* an identity layer: a representation-neutral list of canonical names,
  one entry per identity. `herbCatalog` is the herb-side analogue of `formulaCatalog`.
- **Reference corpus — YES, in the narrow sense** that consumers reference it; but it
  is a *name* reference only, carrying no attributes.
- **Lookup source — only as a name-scoping vocabulary**, not a property/attribute
  lookup. It answers "is this a canonical herb name?" and "what herb names are
  canonical?" — never "what does this herb do?"

**Determination:** the Herb Catalog is an **identity / Vocabulary layer** owning the
canonical herb name-space and nothing else — structurally identical in role to the
Formula Catalog.

## 3. Ownership Analysis

**Herb Catalog owns:**
- **canonical herb identities** — the canonical name of each herb, one entry per
  identity, and nothing else (Minimal Vocabulary).

**Herb Catalog does NOT own:**
- **meaning / attributes** — functions, actions, temperature (nature), flavor,
  channels entered, dosage ranges, contraindications, cautions, toxicity;
- **relationships** — herb pairings, formula composition (which herbs compose a
  formula), synergies/antagonisms;
- **reasoning / selection / recommendation** — which herb to use, when, or why;
- **execution** — quantities, preparation, administration.

Each of these belongs to a *different, future* interface (a herb-definitions/meaning
interface, a composition/mapping interface, the reasoning modules, or the execution
layer). The catalog references none of them and must never absorb them — the herb
analogue of the frozen Definition Neutrality / Minimal Vocabulary boundaries.

## 4. Relationship to Formula Catalog

- **Parallels** — both are Vocabulary/identity roots: representation-neutral lists of
  canonical names, one entry per identity, identity-only, governed by the same
  canonicalization discipline and Minimal Vocabulary principle.
- **Differences** — different domains of identity: `formulaCatalog` names *formulas*;
  `herbCatalog` names *herbs*. A formula is (clinically) *composed of* herbs, but that
  composition is a **relationship owned by neither catalog** — it is a future
  mapping/execution concern.
- **Dependency direction** — **neither depends on the other.** They are independent,
  parallel roots. Wiring/authoring one imposes nothing on the other. (Any future link
  between them — e.g. "formula X contains herbs A, B, C" — would live in a separate
  composition interface referencing *both* catalogs, not inside either.)

## 5. Relationship to Prescription Formula Definitions

- **Identity vs. meaning** — `prescriptionFormulaDefinitions` is a *meaning* layer
  (what a formula *is*), referencing formula *identity*. `herbCatalog` is an *identity*
  layer (what a herb *is called*). They are different tiers (meaning vs. identity) in
  different domains (formula vs. herb).
- **Should Herb Catalog ever contain definitions? — NO.** Herb *meaning* (properties,
  functions, nature, flavor, channels) is the responsibility of a **future
  herb-definitions interface** — the herb-side analogue of
  `prescriptionFormulaDefinitions` — which would reference herb identities owned by
  `herbCatalog`. Folding meaning into the catalog would violate ownership
  (Identity ≠ Meaning) exactly as it would for the formula catalog. The catalog stays
  identity-only.

## 6. Future Dependency Analysis

Likely future dependents (analyzed for direction only; **not designed here**):

- **herb definitions / herb properties** — a meaning layer referencing herb identities;
- **herb pairings** — a relationship layer referencing pairs of herb identities;
- **herb composition maps** (formula → herbs) — a mapping referencing *both* herb and
  formula identities;
- **herb-function mappings** — associations referencing herb identities;
- **execution / prescription** — herb names in a concrete prescription.

**Dependency direction — inbound only: dependents → `herbCatalog`.** The catalog
references nothing; every future herb-based interface references *into* it. This makes
`herbCatalog` a foundational root: no cycle is possible, and it can exist and be
authored before any of its dependents.

## 7. Content Prerequisite Analysis

**Content must exist before wiring — confirmed, grounded in both precedents.**

- `formulaCatalog` and `prescriptionFormulaDefinitions` each followed the same order:
  a *content* sprint authored and froze an authoritative corpus (`formula-catalog.md`,
  `prescription-formula-definitions.md`) **before** any wiring (derivation → source →
  contract → registry upgrade). Wiring is a lossless projection of an authoritative
  corpus; with no corpus, there is nothing to derive, validate, or serve, and the
  end-to-end retrieval cannot be verified.
- The Herb Catalog Wiring Review (`28`) reached the same conclusion from the wiring
  side: the wiring pattern is fully determined, but blocked solely by the absent
  corpus.

Therefore a **Herb Catalog content sprint is the correct and necessary first step**;
wiring is deferred until it completes and freezes `herb-catalog.md`.

## 8. Validation Implications (architectural level only)

Future validation would sit in the same separated layers used by the siblings — **no
implementation designed here**:

- **Identity / structure validation** — a future structural contract would confirm the
  slice is a collection of non-empty, unique canonical herb-name strings (structure
  only). Convention/editorial correctness (romanization, casing) is an authoring/
  human-review concern, not a structural rule — the same boundary settled for the
  formula catalog.
- **Cross-content validation** — `herbCatalog` is an identity **root** with no outbound
  references, so it needs **no outbound cross-content check of its own**. It would be
  the *target* of future dependents' checks (e.g. herb-definitions→herbCatalog,
  composition→herbCatalog), which would read authoritative corpora at build time. None
  of those dependents exists yet.
- **Runtime trust** — a loaded slice is structurally trusted; herb-name correctness
  remains human/editorial review (Clinical/Editorial Evaluation).

## 9. Future Evolution Analysis

- **What can be added later** — additional canonical herb names (additive batches);
  and, *beside* the catalog as separate interfaces/layers, herb meaning/properties,
  pairings, composition maps, aliases, and translations (localization). Each attaches
  to a herb identity by reference; none folds into a catalog entry.
- **What must remain out of scope (permanently, for the catalog)** — any herb
  attribute, relationship, reasoning, recommendation, or execution detail. The catalog
  is identity-only; growth is by extension, never by accretion into the entry (Minimal
  Vocabulary; the herb analogue of Canonical Naming Stability).

## 10. Sufficiency Assessment

**Yes — a Herb Catalog content sprint can begin.** Its architectural role is settled:
an independent identity/Vocabulary root, owning canonical herb identities only,
depending on nothing, and a prerequisite for all future herb-based interfaces and for
herb-catalog wiring. It can be authored independently (it references no other corpus).
No architectural blocker exists to *authoring*; the only blocker was to *wiring*, and
this content sprint removes it.

**Open decisions that remain (for the content Specification / Authoring Plan, not
resolved here):**
- **Scope & size** — how many canonical herbs, and by what inclusion criterion (e.g.
  the herbs implied by the current 135-formula catalog, a standard materia-medica
  subset, or another bound). Note: **no parity target is architecturally required** —
  unlike formula↔definitions (135↔135), the herb catalog is an independent root and
  need not match any other corpus count.
- **Canonicalization convention** — the romanization/casing/spacing/tone-mark standard
  for canonical herb names (presumptively pinyin Title Case, mirroring the formula
  catalog, to be ratified).
- **Entry shape** — presumptively one canonical name per entry (identity-only), the
  representation-neutral list mirroring `formula-catalog.md`.
- **Naming edge cases** — handling of herb-name variants/synonyms (aliases are a
  deferred, separate layer, not catalog entries) and any preparation-form
  distinctions.
- **Sourcing & review** — the authoritative reference basis and the editorial/clinical
  review process for canonical herb identities.

## Deliverables

- **Review document** — this file.
- **Review report, open questions, sufficiency assessment** — provided above
  (Findings in §§2–9; Open Questions in §10; Sufficiency in §10).

## Scope

Architecture review only. No herb content authored, no herb entries, no herb
properties, no schema, source, contract, generator, validation, registry change, or
implementation plan; no change to any existing file.
