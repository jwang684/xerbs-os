# Pattern Treatment Map — Validation Layer Review

**Pattern Treatment Map · Validation Layer Review.** Status: **PROPOSED — PENDING REVIEW.**
A read-only review that **freezes validation ownership** for the architecture's first
relationship layer, before the contract or cross-content validator is implemented. It
creates no contract, validator, code, test, registry change, content, or wiring. It grounds
in the approved decisions (`docs/architecture/51`–`54`) and the live implementation state
(the authored `pattern-treatment-map.md`, its derivation + generated artifact + source, and
the two wired identity roots `diagnosisPatternCatalog` and `formulaDefinitionCatalog`), and
in the established contract/cross-content precedents (`formulaDefinitionsContract` /
`formulaDefinitionsCrossContent`, etc.). Settled decisions (Option A, ownership, many-to-many,
dual cross-content) are not reopened.

## Grounded State

- **Entry shape (derived):** `{ pattern: string; principle: string }` — two identity
  references, no free text, no metadata (per Doc 52/54; verified in the generated artifact).
- **Two separate identity domains:** `pattern` ∈ `diagnosisPatternCatalog` (85);
  `principle` ∈ `formulaDefinitionCatalog` (69). Disjoint vocabularies.
- **Precedent — Contracts:** every prior contract validates *structure only* for one slice —
  array, exact field set, non-empty strings, **intra-slice uniqueness of the referenced
  identity**, deterministic passthrough (no repair).
- **Precedent — Cross-content:** every prior validator does *reference integrity* (identity ∈
  its catalog) plus **informational** coverage/parity and duplicate reporting; build-time,
  side-effect-free, reports all issues.
- **Key difference:** prior layers were identity or **meaning** layers (meaning layers carry
  free-text definitions and therefore have editorial gates — Docs 41/42/49/50). This is the
  first **relationship** layer: no free text, two references, many-to-many.

## 1. Duplicate Pair Validation → **Contract layer**

A duplicate is a duplicate **pair** (`pattern` + `principle`). Whether a pair repeats is
determinable from the slice alone — no catalog required — so it is a **structural** property.
By precedent, intra-slice uniqueness is a contract responsibility (prior contracts reject
duplicate single identities; here the unit of uniqueness is the pair).

**Recommendation:** the **Contract** owns duplicate-pair rejection (a repeated `{pattern,
principle}` pair is structurally invalid). The cross-content validator MAY additionally
*report* duplicates informationally (as prior validators did), but the authoritative gate is
the contract.

## 2. Cardinality Validation → **documented, NOT validated**

Many-to-many is settled (Doc 52 §C/§D): one pattern → many principles, one principle → many
patterns. Enforcing one-to-one / many-to-one / one-to-many would encode a selection decision
(which principle "wins") — reasoning the map must not own.

**Recommendation:** **do not validate cardinality** in any layer; it is documented as
many-to-many. The only structural uniqueness rule is *no duplicate pairs* (§1) — which does
**not** restrict cardinality (a pattern may still map to many distinct principles). No
min/max association counts are enforced.

## 3. Self-Reference Analysis → **not meaningful; no validation**

A relationship's two sides draw from **different catalogs** with disjoint vocabularies
(pattern names vs treatment-principle names). "Self-reference" (an entry pointing to itself)
is not representable: the two fields reference different identity domains. Even a coincidental
string match across the two catalogs would be two valid references, not a harmful
self-reference. The two-sided cross-content check already confirms each side resolves to its
own catalog.

**Recommendation:** **no self-reference validation** — it is not meaningful for a two-domain
relationship.

## 4. Coverage Ownership → **requirement: nowhere; reporting: cross-content (informational)**

Per Doc 52 §L / Doc 53 §10, there is **no coverage or parity requirement** (Option B keeps
partial coverage valid). "All patterns appear" / "all principles appear" is **not enforced**
by the contract, the cross-content validator, or an editorial gate.

**Recommendation:** coverage belongs **nowhere as a requirement**. The **cross-content
validator MAY report** coverage counts (distinct patterns/principles referenced, catalog
identities with no association) **informationally**, never as a failure — mirroring prior
validators' non-failing coverage fields.

## 5. Structural vs Referential Validation Boundary (frozen)

| Concern | Contract (structural, slice-only) | Cross-Content (referential, two corpora, build-time) |
|---|---|---|
| value is an array | ✅ | — |
| each entry is an object with exactly `{pattern, principle}` (no missing/extra fields) | ✅ | — |
| `pattern` / `principle` are non-empty strings | ✅ | — |
| no duplicate `{pattern, principle}` pair | ✅ (authoritative gate) | may report (informational) |
| deterministic passthrough (`value: raw`, no repair) | ✅ | — |
| `pattern` ∈ `diagnosisPatternCatalog` | — | ✅ |
| `principle` ∈ `formulaDefinitionCatalog` | — | ✅ |
| orphan pattern / orphan principle reporting | — | ✅ |
| coverage counts (informational) | — | ✅ (non-failing) |
| meaning / recommendation / ranking / confidence | ❌ neither (structurally impossible — see §7) | ❌ neither |

The contract assumes nothing about the catalogs; the cross-content validator assumes the
slice is already structurally valid. The layers never merge.

## 6. Reporting Ownership

| Reported item | Owner |
|---|---|
| orphan patterns | **Cross-content** |
| orphan principles | **Cross-content** |
| pair count / unique-pair count | **Cross-content** (result object) and/or derivation test |
| coverage counts (distinct patterns/principles, catalog items unreferenced) | **Cross-content** (informational) |
| duplicate counts | **Contract** is the *gate* (rejects); **cross-content** may *report* informationally |

Recommendation: orphans and coverage are cross-content; duplicate **rejection** is the
contract, duplicate **reporting** may also appear in cross-content for a complete diagnostic
picture (as with prior validators).

## 7. Relationship Semantics Protection → **Contract (structural exact-shape rule)**

Drift toward recommendation / ranking / confidence / priority / deterministic routing would
require attaching data to an entry (e.g. a `weight`, `rank`, `confidence`, or free-text
field). The **contract's exact-two-fields rule** (`{pattern, principle}` and nothing else)
**structurally prevents this**: any entry bearing an extra field is invalid. Because entries
contain **only two identity references and no free text**, there is no place for
recommendation wording to hide.

**Recommendation:** the **Contract** is the structural guard against metadata/recommendation
drift (exact-shape rejection). **No editorial review gate is needed** for this corpus — unlike
the meaning layers (Docs 41/42/49/50), there is no prose to audit for neutrality or context
independence. This is the defining validation difference of a relationship layer.

## 8. Consistency Analysis

| Aspect | Meaning layers (`formulaDefinitions`, `diagnosisPatternDefinitions`) | Relationship layer (`patternTreatmentMap`) |
|---|---|---|
| Entry | `{ identity, free-text definition }` | `{ identity, identity }` |
| Contract | exact 2 fields; identity + non-empty definition; **unique identity**; passthrough | exact 2 fields; two non-empty identities; **unique pair**; passthrough |
| Cross-content | one-sided (identity ∈ its catalog) | **two-sided** (pattern ∈ catalog A, principle ∈ catalog B) |
| Editorial gates | **required** (Neutrality + Context Independence — free text can drift) | **none** (no free text to audit; contract shape suffices) |
| Cardinality | one definition per identity (contract uniqueness) | many-to-many (documented; only pair-uniqueness enforced) |

The relationship layer reuses the same *structure-only contract / referential cross-content*
split, extended to two sides, and **drops the editorial gate** because its entries carry no
prose. This is a clean, consistent extension of the established model.

## 9. Risk Analysis

| Risk | Description | Mitigation (owner) |
|---|---|---|
| **Metadata / recommendation drift** | A future field (weight, rank, confidence, rationale) folded into an entry | Contract exact-two-fields rejection (§7) |
| **Duplicate-pair fragmentation** | The same association authored twice → ambiguous reference set | Contract duplicate-pair gate (§1) |
| **Orphan references** | A renamed/removed pattern or principle breaks an association | Two-sided cross-content (§5); Canonical Naming Stability on both roots |
| **Over-validation** | Enforcing cardinality or coverage would violate many-to-many / Option B | Explicitly **not** enforced (§2, §4) |
| **Editorial-gate misapplication** | Adding a neutrality/context audit where there is no prose | Documented as unnecessary for relationship layers (§7, §8) |

No hypothetical/speculative concerns included.

## 10. Sufficiency Assessment

**The architecture is sufficiently settled to begin Step 3 (Contract) and, after it, Step 4A
(Dual Cross-Content Validator) without further architectural review.** Validation ownership is
frozen:
- **Contract:** array; exact `{pattern, principle}`; non-empty strings; **no duplicate pairs**;
  deterministic passthrough. (Structural guard against metadata drift.)
- **Cross-content (dual, build-time):** `pattern ∈ diagnosisPatternCatalog`;
  `principle ∈ formulaDefinitionCatalog`; orphan reporting both sides; informational coverage.
- **No cardinality enforcement, no self-reference check, no coverage requirement, no editorial
  gate.**

These settle every question the relationship layer newly raises; the remaining work is
implementation following this ownership split.

## Scope

Read-only validation-layer review. No contract, validator, code, test, registry change,
content, or wiring; no change to any existing file other than the creation of this document.

STOP. Validation-layer ownership frozen. No implementation begun. Nothing committed. Awaiting
review.
