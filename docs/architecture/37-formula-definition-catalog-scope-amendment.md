# Formula Definition Catalog — Scope Amendment (v1: Treatment Principles Only)

**Formula Definition Catalog · Scope Amendment.** Status: **PROPOSED — PENDING REVIEW.**
A read-only architecture amendment narrowing the approved v1 scope of
`formulaDefinitionCatalog`. It authors no content, no principles, no families, no
mappings, no definitions, and creates no generator, contract, validation, registry
change, or plan. It **supersedes the v1 scope** stated in
`docs/architecture/34`–`36` (single combined catalog of principles **and** families) on
the single point of scope; all other conclusions of those documents — the identity/meaning
split (Review 33), the identity-root role, ownership, entry model, naming policy,
source-of-truth, dependency model, and invariants — remain in force.

## 1. Background

Reviews 33–35 established the strategy tier's identity/meaning separation and approved a
**single combined `formulaDefinitionCatalog`** holding two concept types in one canonical
name-space:

- **Treatment Principles** (the therapeutic method), and
- **Formula Families** (a class of formulas realizing a principle).

The combined decision (Review 34, Spec 35 §D, Authoring Rules 36 §4) deliberately avoided
two separate catalogs and any principle↔family relationship for v1, while keeping both
concept types in one identity root.

## 2. New Decision

**`formulaDefinitionCatalog` v1 contains Treatment Principles only.** Formula Families are
**deferred** — excluded from the v1 corpus, to be added later as an additive expansion
(§4, §6).

This narrows — it does not reverse — the prior decisions: the catalog remains the single
identity root of the strategy tier; it simply carries one concept type (principles) in v1
instead of two.

## 3. Rationale

- **Minimal viable strategy vocabulary.** Treatment principles are the smallest identity
  set that grounds the strategy tier and both mapping layers; families are not needed to
  make the tier functional.
- **Direct support for `patternTreatmentMap`.** Its RHS is a treatment principle — v1
  principles fully supply that identity anchor.
- **Direct support for `treatmentFormulaMap`.** Its LHS is a treatment principle — v1
  principles fully supply that identity anchor (its RHS, named formulas, is already served
  by `formulaCatalog`).
- **Avoids unnecessary relationship layers.** Including families would invite a
  principle↔family relationship (which family realizes which principle) that no
  implemented consumer requires yet; deferring families keeps that modeling out of v1.
- **Simpler strategy DAG.** One concept type in the strategy identity root yields a clean,
  linear strategy path (§5).

## 4. Deferred Scope

- **Formula Families remain valid future concepts** — they are excluded from v1, not
  rejected.
- Nothing in v1 forecloses families: the catalog's identity-only, append-only, Minimal
  Vocabulary model (Spec 35) admits families later without disturbing existing principle
  identities.
- No principle↔family relationship, no family meaning, and no family mapping is modeled in
  v1.

## 5. Architectural Impact

Resulting simplified strategy DAG (identity flow, top → bottom = pattern → execution):

```
Diagnosis Pattern            (diagnosisPatternDefinitions — identity+meaning)
        ↓   (patternTreatmentMap)
Treatment Principle          (formulaDefinitionCatalog v1 — identity root; formulaDefinitions — meaning)
        ↓   (treatmentFormulaMap)
Named Formula                (formulaCatalog — identity; prescriptionFormulaDefinitions — meaning)
        ↓   (execution: PrescriptionModule)
Herb                         (herbCatalog — identity)
```

- The strategy identity root (`formulaDefinitionCatalog`) now holds **treatment
  principles only**.
- Dependencies are unchanged in direction (inbound-only into the catalog; acyclic):
  `formulaDefinitions` → catalog; `patternTreatmentMap` (RHS) → catalog;
  `treatmentFormulaMap` (LHS) → catalog.
- No interface is added or removed by this amendment; only the catalog's v1 *content
  scope* narrows. The maps become conceptually cleaner (each references a single strategy
  concept type, not a principle/family union).

## 6. Future Evolution

Formula Families can be added later **without breaking existing references**, because
principle identities are stable and append-only (Canonical Naming Stability). Two
additive paths remain open, to be decided when a consumer actually needs families:

- **Same catalog (additive entries)** — append family identities into
  `formulaDefinitionCatalog` alongside principles (returning to the combined model),
  leaving every existing principle identity and reference untouched; or
- **Separate family catalog** — introduce a distinct `formulaFamilyCatalog` identity root
  and, if required, a principle↔family relationship interface — again purely additive,
  with existing principle references unaffected.

Either way, deferring families now costs nothing later: no v1 principle identity, meaning
entry, or map reference needs to change when families arrive.

## 7. Sufficiency Assessment

**The catalog content sprint can begin, scoped to treatment principles only.** The
identity/meaning split, identity-root role, ownership, entry model, naming policy,
source-of-truth policy, dependency model, and invariants from Spec 35 all hold unchanged;
this amendment only narrows the v1 corpus to principles. The authoring rules (Doc 36)
apply as written, with the understanding that v1 entries are treatment principles (the
"principle vs. family" equal-treatment guidance in Doc 36 §4 is simply inactive in v1
since families are deferred — no re-authoring of Doc 36 is required). No open architectural
question is introduced; the only deferred item (families) is explicitly out of v1 scope.

Recommended next step (for review, not executed): begin content creation of
`formula-definition-catalog.md` with **treatment principles only**, then the standard
wiring lifecycle.

## Scope

Architecture amendment only. No catalog content, treatment principles, formula families,
mappings, definitions, generators, contracts, validation, registry changes, or
implementation plans; no change to any existing file other than the creation of this
document.

STOP. Amendment complete. No implementation begun. Nothing committed. Awaiting review.
