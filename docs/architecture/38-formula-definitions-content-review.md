# Formula Definitions — Content Architecture Review

**Formula Definitions · Content Sprint · Architecture Review.** Status:
**PROPOSED — PENDING REVIEW.** A read-only review determining what `formulaDefinitions`
should own now that `formulaDefinitionCatalog` owns the strategy-tier identity. It
authors no content, no definitions, no mappings, no specification, and makes no registry
or code change. It builds on the audit (`docs/architecture/32`), the split reviews
(`33`, `34`), the catalog spec/amendment (`35`, `37`), and mirrors the completed
`prescriptionFormulaDefinitions` content sprint (`18`–`21`).

## Grounded State (verified)

- **`formulaDefinitionCatalog` is wired** — serves 69 canonical **treatment-principle**
  identities (v1 scope, principles only per doc 37); identity only.
- **`formulaDefinitions` remains `pending(...)`** — absent → Option B; no authored corpus
  exists.
- **Consumer** — `FormulaModule.knowledgeRequest()` requests `formulaDefinitions` and
  renders `{{formulaDefinitions}}` (formula.md: *"Canonical definitions of treatment
  principles and formula families — definitions only, reference material, not rules"*).
- **Sibling precedent** — `formulaCatalog` (identity) → `prescriptionFormulaDefinitions`
  (meaning) is the exact pattern to mirror one tier up:
  `formulaDefinitionCatalog` (identity) → `formulaDefinitions` (meaning).

## Ownership Analysis

**`formulaDefinitions` should own the *meaning* of a treatment principle** — an
objective statement of what the therapeutic strategy *is* — keyed by reference to a
canonical identity owned by `formulaDefinitionCatalog`.

**Belongs in `formulaDefinitions`:**
- a **reference** to a canonical treatment-principle identity (owned by the catalog), and
- an **objective explanation** of that principle's intrinsic therapeutic meaning.

**Does NOT belong (owned elsewhere):**

| Excluded | Owner |
|---|---|
| the canonical name (identity) itself | `formulaDefinitionCatalog` (referenced, not restated) |
| when/whether to use a principle (indications) | reasoning / clinical evaluation layer |
| which patterns call for a principle | `patternTreatmentMap` |
| which formulas realize a principle | `treatmentFormulaMap` |
| named formulas / their meaning | `formulaCatalog` / `prescriptionFormulaDefinitions` |
| herbs | `herbCatalog` |
| formula families (deferred v1) | future family interface |
| recommendations / ranking / selection | reasoning layer / runtime modules |
| aliases / translations | future alias / localization layers |
| dosage / composition / execution | prescription/execution tier |

Its single responsibility is **meaning** — the strategy-tier analogue of the frozen
Definition Neutrality / Intrinsic Therapeutic Identity principles.

## Dependency Graph

```
IDENTITY ROOT      formulaDefinitionCatalog        (references nothing)
                          ↑
MEANING LAYER      formulaDefinitions → formulaDefinitionCatalog   (meaning → identity)
                          ↑
CONSUMER           FormulaModule (reads meaning; grounds its strategy output)

(maps reference the CATALOG identity, NOT formulaDefinitions:)
  patternTreatmentMap → formulaDefinitionCatalog (RHS)
  treatmentFormulaMap → formulaDefinitionCatalog (LHS), formulaCatalog (RHS)
```

- **Outbound (from `formulaDefinitions`):** one edge → `formulaDefinitionCatalog`
  (reference to identity). Nothing else.
- **Inbound (to `formulaDefinitions`):** `FormulaModule` (runtime consumer). The two maps
  do **not** reference `formulaDefinitions` — they reference the identity root — so the
  meaning layer is a leaf on the reference graph, consumed only by a module.
- **Acyclic:** the only edge points toward an identity root that references nothing; no
  cycle is possible. (Directly parallels `prescriptionFormulaDefinitions → formulaCatalog`.)

## Meaning Boundary

For a treatment-principle identity, its **meaning** is an **objective account of what the
strategy intrinsically is/does** — e.g. the therapeutic intent and the aspect it acts on —
stated timelessly and context-free. It **explains** and only explains:

- **states intrinsic therapeutic identity** — what the principle *is* as a strategy;
- **does not indicate** — never says when/whether/why to apply it to a patient;
- **does not map** — never names the patterns that call for it or the formulas that
  realize it;
- **does not rank or recommend** — never orders or prefers principles;
- **does not prescribe** — no dosage, composition, or execution.

This is the strategy-tier counterpart of the Intrinsic Therapeutic Identity Principle
ratified for `prescriptionFormulaDefinitions` (which distinguishes intrinsic action —
permitted — from patient-facing indication — forbidden). The same line applies here.

## Relationship Analysis

- **`formulaDefinitionCatalog`** — owns identity; `formulaDefinitions` references it and
  adds meaning. Exactly mirrors `formulaCatalog → prescriptionFormulaDefinitions`.
- **`prescriptionFormulaDefinitions`** — the *execution-tier* meaning layer (named-formula
  meaning); `formulaDefinitions` is the *strategy-tier* meaning layer (principle meaning).
  Different tiers, same shape; neither absorbs the other (audit §4).
- **`formulaCatalog` / `herbCatalog`** — unrelated identity roots (named formulas, herbs);
  `formulaDefinitions` references neither.
- **`patternTreatmentMap` / `treatmentFormulaMap`** — reference the **catalog** identity,
  not `formulaDefinitions`. The meaning layer and the maps are independent consumers of the
  same identity root; the maps never depend on meaning.

## Risks

| Risk | Description | Mitigation (for the spec/authoring) |
|---|---|---|
| **Duplication** | Restating catalog names or re-inventing identities inside definitions | Reference the catalog identity; never author names; build-time cross-content check that every referenced principle exists in `formulaDefinitionCatalog` |
| **Ownership leakage** | Smuggling indications, dosage, families, or recommendations into a definition | Two-field entry (referenced identity + objective explanation); explicit exclusions; editorial review |
| **Map contamination** | Encoding "this principle applies to pattern X" or "is realized by formula Y" in the meaning | Meaning is intrinsic-only; pattern/formula associations belong to the maps, never here |
| **Recommendation logic** | Definitions drifting into when/whether/why to choose a principle | Definition Neutrality — explain, never recommend/rank |
| **Altitude drift** | Meaning too specific (naming formulas/herbs) or too vague (empty tautology) | Fix an intrinsic-identity abstraction level in the spec, mirroring prescription definitions |

## Open Questions

- **Meaning altitude & vocabulary** — the exact intrinsic-identity abstraction for a
  treatment principle (its therapeutic intent + the aspect acted on) and the permitted
  vocabulary, mirroring the prescription-definitions Intrinsic Therapeutic Identity
  ratification. To be fixed in the specification.
- **Parity vs. partial coverage** — should every one of the 69 catalog principles have a
  definition (1:1 parity, as formula↔definitions), or is Option-B partial coverage
  acceptable? (Parity gives a clean cross-content basis; partial coverage is still valid.)
- **Entry model confirmation** — presumptively two fields (referenced canonical principle
  + objective explanation), mirroring `prescriptionFormulaDefinitions`; to be ratified.
- **Families (deferred)** — v1 covers principles only (doc 37); when families arrive, their
  meaning is an additive expansion referencing future family identities — out of scope now.

Settled (not open): the split (Review 33); the catalog as identity root (34/35);
principles-only v1 (37); `formulaDefinitions` ≠ `prescriptionFormulaDefinitions` (audit).

## Recommendation

**Model `formulaDefinitions` as the strategy-tier meaning layer** — objective meaning of
each treatment principle, keyed by reference to `formulaDefinitionCatalog`, two-field
entries, intrinsic-identity-only, consumed by `FormulaModule`, never referenced by the
maps. This is the direct one-tier-up analogue of `prescriptionFormulaDefinitions →
formulaCatalog`, reusing that sprint's proven content lifecycle (content review →
specification → authoring plan → batches → completion audit → wiring) and its
Intrinsic Therapeutic Identity / Definition Neutrality principles.

## Sufficiency Assessment

- **Is the ownership clear?** **Yes** — meaning of treatment principles, referencing
  catalog identity; every neighbouring concern is assigned to an existing/future owner.
- **Is the architecture coherent & acyclic?** **Yes** — one outbound edge to an identity
  root; the maps depend on identity, not meaning; no cycle.
- **Can a content sprint begin?** **Yes** — the identity root is wired, the pattern is
  proven, and the ownership boundary is settled. The remaining decisions (meaning altitude,
  parity target, entry-model ratification) are **specification** concerns, not
  architectural blockers.
- **Recommended next step:** a `formulaDefinitions` **content specification** (mirroring
  `19-prescription-formula-definitions-specification.md`), resolving the open questions
  above, then an authoring plan and authoring.

## Scope

Read-only architecture review. No content authored, no definitions, no mappings, no
specification, no registry or code change; no change to any existing file other than the
creation of this document.

STOP. Architecture review complete. No content authored. Nothing committed. Awaiting review.
