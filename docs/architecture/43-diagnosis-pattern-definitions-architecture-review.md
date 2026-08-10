# Diagnosis Pattern Definitions — Architecture Review

**Diagnosis Pattern Definitions · Architecture Review.** Status: **PROPOSED — PENDING
REVIEW.** A read-only review of `diagnosisPatternDefinitions`: its actual consumers,
ownership, and whether the diagnosis tier should split identity from meaning — mirroring
the now-complete strategy tier (`formulaDefinitionCatalog → formulaDefinitions`). It
authors no content, creates no specification/authoring rules/code, and changes no
registry or file. It builds on the audit (`docs/architecture/32`) and the formula-tier
split reviews (`33`–`35`, `37`).

## Grounded State

Verified from live code:

- **Registry** — `diagnosisPatternDefinitions` is `pending("diagnosisPatternDefinitions")`
  (absent → Option B); not wired.
- **Runtime consumer** — `DiagnosisModule.knowledgeRequest()` returns
  `{ diagnosisPatternDefinitions: true }`; `variables()` reads
  `knowledgeOrNone(this.knowledge, "diagnosisPatternDefinitions")` and exposes it as
  `patternDefinitions`.
- **Template block** — `diagnosis.md` renders `{{patternDefinitions}}`, labelled
  *"Canonical pattern definitions … canonical clinical definitions only … reference
  material to ground your differentiation. They are NOT rules."*
- **Inbound reference from a map** — `formula.md`'s `patternTreatmentMap` block is
  *"from **patterns** to treatment principles/families"* — i.e. the (pending) map's **LHS
  is a pattern**. So pattern *identity* is referenced by a relationship layer, exactly as
  formula-family/principle identity is.
- **No other interface** currently depends on it; `treatmentFormulaMap` does not
  reference patterns.

Wired tiers today: `formulaCatalog → prescriptionFormulaDefinitions` (execution
identity+meaning), `formulaDefinitionCatalog → formulaDefinitions` (strategy
identity+meaning), `herbCatalog` (herb identity). Pending: `diagnosisPatternDefinitions`,
`patternTreatmentMap`, `treatmentFormulaMap`.

## Ownership Matrix

`diagnosisPatternDefinitions` should own the **meaning** of a diagnostic pattern; its
**identity** should be owned by a catalog root (see Recommendation).

| Candidate ownership | Belongs? | Owner |
|---|---|---|
| **Pattern identity** (canonical pattern names) | Identity layer | **`diagnosisPatternCatalog`** (recommended split) — referenced, not restated, by the meaning layer |
| **Pattern meaning** (what a pattern intrinsically *is* — its clinical nature) | **Yes** | **`diagnosisPatternDefinitions`** |
| **Pattern relationships** (pattern ↔ pattern) | No | a future relationship interface (none exists) |
| **Pattern recommendations** | No | reasoning layer / runtime modules |
| **Pattern-to-treatment guidance** (pattern → principle) | No | `patternTreatmentMap` |
| **Pattern-to-formula guidance** | No | not a direct interface — flows pattern → principle (`patternTreatmentMap`) → formula (`treatmentFormulaMap`); never owned by patterns |

Also excluded from a definition entry: diagnostic decision procedures, symptom checklists,
disease names, indications, ranking. (Definition altitude/neutrality is a content-spec
concern, not decided here.)

## Identity vs Meaning Analysis

Applying the precedent `formulaDefinitionCatalog → formulaDefinitions`:

- **Consumer of identity** — `patternTreatmentMap` (LHS) references pattern identity;
  `DiagnosisModule` consumes pattern *meaning*. So pattern identity has a relationship-
  layer consumer plus a module consumer — the same condition that justified splitting the
  strategy tier.
- **Stable vocabulary?** — Diagnostic patterns form a well-defined canonical vocabulary
  (a fixed name-space), suitable to be an identity root — exactly like formula names and
  treatment principles.
- **Single concept type** — unlike the strategy tier (which bundled *principles* and
  *families*), patterns are a **single** concept type, so a pattern catalog is cleanly
  one vocabulary with no internal granularity fork.

This favors the split `diagnosisPatternCatalog → diagnosisPatternDefinitions`, and is
in fact a *simpler* split than the strategy tier's.

## Dependency Graph

**If split (recommended):**
```
diagnosisPatternCatalog        (identity root — references nothing)
        ↑
diagnosisPatternDefinitions → diagnosisPatternCatalog   (meaning → identity)
        ↑
DiagnosisModule  (consumes meaning)

patternTreatmentMap → diagnosisPatternCatalog     (LHS, identity root)
                    → formulaDefinitionCatalog     (RHS, identity root)
```

**If kept combined (current shape):**
```
diagnosisPatternDefinitions   (identity + meaning; root)
        ↑
DiagnosisModule
patternTreatmentMap → diagnosisPatternDefinitions (LHS, identity-in-meaning)
                    → formulaDefinitionCatalog     (RHS, identity root)   ← asymmetric
```

- **Outbound (meaning layer):** one edge → `diagnosisPatternCatalog` (split) / none
  (combined root).
- **Inbound:** `DiagnosisModule` (meaning) and `patternTreatmentMap` (identity).
- **Acyclicity:** both models are acyclic (edges point toward roots).
- **Runtime coupling:** none — per-identifier resolution; references are content/build-time.
- **Ownership separation:** clean only in the split model (identity vs meaning in
  distinct interfaces).

## Relationship Analysis

`patternTreatmentMap` has `LHS = pattern`, `RHS = treatment principle/family`. Post the
strategy-tier split, its **RHS references `formulaDefinitionCatalog` (an identity root)**.
For a relationship layer, **both sides should reference identity roots** — so the map's
**LHS should reference a `diagnosisPatternCatalog`**, which exists only if patterns are
split. This is the identical mapping-symmetry argument used for
`formulaDefinitions vs formulaDefinitionCatalog` (doc 34 §5): under the combined model the
map references a meaning interface on one side and an identity root on the other; under the
split it references identity roots on both sides.

## Consistency Analysis

| Tier | Identity root | Meaning layer | Shape |
|---|---|---|---|
| Named formulas (execution) | `formulaCatalog` | `prescriptionFormulaDefinitions` | **split** ✓ |
| Treatment strategy | `formulaDefinitionCatalog` | `formulaDefinitions` | **split** ✓ |
| Herbs | `herbCatalog` | *(future herb-definitions)* | identity-only (no meaning consumer yet) |
| **Diagnosis patterns** | *(none — combined)* | `diagnosisPatternDefinitions` | **combined** ← asymmetry |

Diagnosis patterns are the **last remaining tier** where identity and meaning would be
combined, and — like the strategy tier — its identity is referenced by a map. Keeping it
combined is the sole inconsistency; splitting completes the symmetric pattern across all
tiers.

## Risk Analysis

| Risk | Description | Mitigation |
|---|---|---|
| **Ownership leakage** | Pattern definitions absorbing symptoms, treatment guidance, or decision procedures | Two-field meaning entry (referenced pattern + intrinsic meaning); intrinsic-identity boundary + neutrality (content-spec), mirroring definitions |
| **Recommendation leakage** | Definitions stating when/whether to diagnose a pattern | Definition Neutrality (content-spec); the template already frames it as "definitions only, NOT rules" |
| **Map contamination** | Encoding pattern→principle inside pattern meaning | Meaning intrinsic-only; the association is owned by `patternTreatmentMap` |
| **Duplication** | Meaning restating identity, or identity re-invented outside the catalog | Split: identity owned once by the catalog; meaning references it; build-time cross-content check |
| **Identity instability** | Renamed/re-scoped patterns breaking map references | Canonical Naming Stability on the catalog root (append-only, stable) |
| **Future migration cost** | Authoring combined now, splitting later → re-homing identities mid-stream | Decide the split **before** the content sprint (exactly as done for the strategy tier) |

## Open Questions

Genuine, unresolved:
- **Naming** — `diagnosisPatternCatalog` (working name) for the identity root; and whether
  the meaning layer keeps `diagnosisPatternDefinitions`.
- **Pattern meaning altitude / neutrality** — the intrinsic-identity abstraction for a
  pattern's meaning and its neutrality boundary (no symptoms/decision-rules) — a
  **content-specification** concern, not this review.
- **Scope / parity** — the canonical pattern vocabulary's inclusion rule and whether the
  meaning layer targets 1:1 parity with the catalog (a content-plan concern).

Not reopened (settled): the identity/meaning split precedent (33/34); catalogs as identity
roots (35); Option B fallback; maps reference identity roots.

## Recommendation

**Option B — Split into `diagnosisPatternCatalog` (identity) → `diagnosisPatternDefinitions`
(meaning).**

Justification:
1. **Mapping symmetry** — `patternTreatmentMap`'s RHS already references an identity root
   (`formulaDefinitionCatalog`); the split gives its LHS a matching identity root, making
   the map symmetric (identity roots on both sides).
2. **Consistency** — completes the identity/meaning separation applied to every other
   tier; removes the last architectural asymmetry.
3. **Stable identity for the map** — pattern identity referenced by a relationship layer
   deserves a stable, meaning-independent root (Canonical Naming Stability).
4. **Future extensibility** — a clean identity root supports future pattern-referencing
   interfaces without coupling them to the meaning corpus.
5. **Simpler than the strategy tier** — patterns are a single concept type (no
   principle/family granularity fork), so the split is clean.

Cost is one extra interface + its proven content/wiring lifecycle — the same low-risk
pattern executed four times. Option A (keep combined) remains workable and simpler in
interface count, but leaves `patternTreatmentMap` asymmetric and couples pattern identity
to meaning; not recommended.

## Sufficiency

- **Architecture coherent?** Yes — acyclic, tiered; the only wrinkle is the
  identity/meaning asymmetry this review resolves.
- **May a content sprint begin?** Not yet for the meaning layer — **a catalog decision
  must be resolved first.** As with the strategy tier, authoring a combined corpus now and
  splitting later would force re-homing pattern identities mid-stream.
- **Recommended sequence:** approve the split → `diagnosisPatternCatalog` content spec →
  catalog content → wire catalog → `diagnosisPatternDefinitions` content spec → definitions
  content → wire → then `patternTreatmentMap` (with build-time cross-content into both
  identity roots).
- **Additional architecture work required?** Only the split decision (this review) and, if
  approved, the per-interface content specifications; no framework/loader/transport change.

## Scope

Read-only architecture review. No implementation, content, specification, authoring rules,
generators, sources, contracts, registry changes, or wiring; no change to any existing file
other than the creation of this document.

STOP. Architecture review complete. No implementation begun. Nothing committed. Awaiting
review.
