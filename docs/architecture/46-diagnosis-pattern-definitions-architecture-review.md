# Diagnosis Pattern Definitions — Architecture Review

**Diagnosis Pattern Definitions · Architecture Review.** Status: **PROPOSED — PENDING
REVIEW.** A read-only review of `diagnosisPatternDefinitions`: its actual consumers,
ownership, and dependency model, now that `diagnosisPatternCatalog` is wired as the
diagnosis-tier identity root. It authors no content, creates no specification/authoring
rules/generator/source/contract/validator/registry change/wiring, and modifies no file.
It builds on the diagnosis-tier split decision (`docs/architecture/43`), the catalog
spec/rules (`44`, `45`), and the ratified formula-tier precedents (`33`–`35`, `38`, `39`).

## Grounded State (verified from live code)

- **Registry** — `diagnosisPatternCatalog` is **wired** (real entry: source +
  contract, `productionRegistry.ts`). `diagnosisPatternDefinitions` remains
  `pending("diagnosisPatternDefinitions")` (absent → Option B).
- **Consumer of pattern meaning** — `DiagnosisModule.knowledgeRequest()` returns
  `{ diagnosisPatternDefinitions: true }`; `variables()` reads
  `knowledgeOrNone(this.knowledge, "diagnosisPatternDefinitions")` and exposes it as
  `patternDefinitions`.
- **Rendering / intent** — `diagnosis.md` renders `{{patternDefinitions}}`, labelled
  *"Canonical pattern definitions … canonical clinical definitions only … reference
  material to ground your differentiation. They are NOT rules and do NOT constrain you to
  a fixed decision procedure."* → the consumer expects **definitions (meaning)**, not
  rules, guidance, reasoning, or a decision procedure.
- **Relationship reference** — `formula.md`'s `patternTreatmentMap` block is *"from
  **patterns** to treatment principles/families … Reference only — NEVER deterministic
  rules."* → the (pending) map's **LHS references pattern identity**. `treatmentFormulaMap`
  does not reference patterns.

This is the exact situation the strategy tier was in before its split: a meaning
consumer (`DiagnosisModule`) plus a relationship layer (`patternTreatmentMap`) that
references pattern *identity*.

## 1. Ownership Analysis

**`diagnosisPatternDefinitions` should own the intrinsic clinical *meaning* of a
diagnostic pattern** — an objective statement of what the pattern *is* — attached by
reference to a `diagnosisPatternCatalog` identity.

**Owns:**
- a **reference** to a canonical pattern identity (owned by `diagnosisPatternCatalog`);
- an **objective pattern definition** — the pattern's intrinsic clinical meaning.

**Does NOT own:**

| Excluded | Owner |
|---|---|
| pattern **identity** (names) | `diagnosisPatternCatalog` (referenced, not restated) |
| treatment guidance / "treat with" | `patternTreatmentMap` (pattern → principle) / execution tier |
| recommendations / "use when" / preference | reasoning layer / runtime modules |
| formulas | `formulaCatalog` / `prescriptionFormulaDefinitions` (never referenced here) |
| treatment principles | `formulaDefinitionCatalog` / `formulaDefinitions` |
| reasoning chains / diagnostic procedures / decision trees | the reasoning layer (`DiagnosisModule` at runtime) |
| symptoms-as-selection-criteria | not owned; a definition is not a diagnostic checklist (§6) |
| mappings (pattern→anything) | the map interfaces |
| pattern ↔ pattern relationships | a future relationship interface (none exists) |
| aliases / translations | future alias / localization layers |

## 2. Dependency Graph

**Outbound** — `diagnosisPatternDefinitions` **should depend on
`diagnosisPatternCatalog` by reference** (meaning → identity): each entry references a
canonical pattern identity the catalog owns. This is the only outbound edge — the exact
analogue of `formulaDefinitions → formulaDefinitionCatalog` and
`prescriptionFormulaDefinitions → formulaCatalog`. Why: identity is owned once (catalog);
the meaning layer cites it, enabling a build-time cross-content check and keeping identity
stable while meaning evolves.

**Inbound** — only `DiagnosisModule` consumes `diagnosisPatternDefinitions` (pattern
*meaning*). The map does **not** consume it.

**Which interface should the maps reference?** `patternTreatmentMap` should reference
**`diagnosisPatternCatalog`** (identity), **not** `diagnosisPatternDefinitions` (meaning)
— exactly as `treatmentFormulaMap` references `formulaCatalog`/`formulaDefinitionCatalog`
(identity), not the meaning layers. Maps relate *identities*; integrity is checked against
a stable identity root.

**Acyclic graph:**
```
diagnosisPatternCatalog        (identity root — references nothing)
        ↑                    ↑
diagnosisPatternDefinitions   patternTreatmentMap (LHS: pattern identity)
(meaning → identity)                              (RHS: formulaDefinitionCatalog identity)
        ↑
DiagnosisModule (consumes meaning)
```
One outbound edge (meaning → identity root); the map points to identity roots on both
sides; no cycle.

## 3. Meaning Boundary Analysis

A `diagnosisPatternDefinitions` entry answers **"what is this diagnostic pattern?"** — its
intrinsic clinical nature (the disharmony/state the pattern denotes), stated objectively
and timelessly. It does **not** answer *"when should I diagnose it?"* (selection) or
*"what treatment follows?"* (mapping/execution).

**Diagnosis-tier equivalent of Intrinsic Therapeutic Identity** (the formula-tier
principle): call it **Intrinsic Pattern Identity** — a definition states the pattern's
intrinsic clinical meaning (what the pattern *is*), never its selection criteria,
indications, treatment, or the reasoning to arrive at it. (Exact phrasing/altitude and
vocabulary are a **content-specification** concern, flagged in Open Questions — not decided
here.)

## 4. Relationship Analysis

- **Pattern → Treatment Principle** — owned by **`patternTreatmentMap`** (its LHS is a
  pattern, RHS a principle/family). **Not** owned by `diagnosisPatternDefinitions`.
- **Pattern → Formula** — **not** owned by `diagnosisPatternDefinitions`, and not a direct
  interface at all: it flows pattern → principle (`patternTreatmentMap`) → formula
  (`treatmentFormulaMap`). Definitions never name formulas.
- **Pattern → Pattern** — relationships among patterns do **not** belong here; a definition
  describes one pattern's intrinsic meaning in isolation. Any pattern↔pattern relationship
  is a future relationship interface, not the meaning layer.

## 5. Recommendation Leakage Analysis

Allowing treatment advice, preferred actions, recommendations, "use when", "treat with",
or "indicates" inside a pattern definition would **violate ownership**: it would fold
selection (reasoning layer) and pattern→treatment mapping (`patternTreatmentMap`) into the
meaning layer, exactly what the diagnosis template forbids ("definitions only … NOT
rules"). **Mitigation:** a Definition Neutrality boundary for patterns (content-spec) plus
a two-field entry (referenced pattern + objective meaning); such leakage is prohibited and
should be caught by an editorial neutrality gate (the diagnosis-tier analogue of the
formula-definitions Neutrality/Context-Independence audits).

## 6. Symptom Leakage Analysis

**Symptom lists, diagnostic criteria, and selection guidance do NOT belong** in
`diagnosisPatternDefinitions`. A definition states what a pattern *is*, not the checklist
used to *identify* it. Symptoms-as-selection-criteria are a diagnostic-procedure/reasoning
concern owned by `DiagnosisModule` at runtime; embedding them would turn a definition into
a decision rule (contradicting "NOT rules … no fixed decision procedure") and couple the
meaning layer to volatile diagnostic heuristics. A pattern's *intrinsic nature* may
reference the aspects/mechanisms it denotes (analogous to intrinsic actions in formula
definitions), but not a symptom checklist or selection criteria. **Mitigation:** the
Intrinsic Pattern Identity boundary + a symptom/decision-procedure exclusion in the
content spec and neutrality gate.

## 7. Consistency Analysis

| Tier | Identity root | Meaning layer | Shape |
|---|---|---|---|
| Named formulas (execution) | `formulaCatalog` | `prescriptionFormulaDefinitions` | split ✓ |
| Treatment strategy | `formulaDefinitionCatalog` | `formulaDefinitions` | split ✓ |
| **Diagnosis patterns** | `diagnosisPatternCatalog` (wired) | `diagnosisPatternDefinitions` (pending) | **split — completes here** |
| Herbs | `herbCatalog` | *(future herb-definitions)* | identity-only (no meaning consumer yet) |

Following the ratified split completes the diagnosis tier symmetrically with the two
formula tiers: identity root + meaning layer, meaning referencing identity, maps
referencing identity roots. **No asymmetry** arises from proceeding this way; the only
asymmetry would be *not* splitting (meaning owning identity while the map references a
meaning interface on the LHS but an identity root on the RHS) — already avoided by the
Doc-43 decision to create `diagnosisPatternCatalog`.

## 8. Risks

| Risk | Description | Mitigation |
|---|---|---|
| **Ownership leakage** | Definitions absorbing treatment/selection/mapping content | Two-field meaning entry; Intrinsic Pattern Identity boundary; editorial neutrality gate |
| **Recommendation leakage** | "use when"/"treat with"/"indicates" in definitions | Definition Neutrality (content-spec); template already frames "definitions only, NOT rules" |
| **Symptom / decision-procedure creep** | Definitions becoming diagnostic checklists or decision trees | Explicit symptom/criteria exclusion (§6); intrinsic-meaning-only altitude |
| **Map contamination** | Encoding pattern→principle inside pattern meaning | Meaning intrinsic-only; the association is owned by `patternTreatmentMap` |
| **Duplication** | Meaning restating identity, or identity re-invented outside the catalog | Reference the catalog; build-time cross-content check (`principle`/pattern ∈ catalog) |
| **Identity instability** | Renamed patterns breaking references | Canonical Naming Stability on the catalog root (append-only, stable) |
| **Future migration cost** | Authoring with wrong ownership then re-homing | Settle ownership now (this review) before the content sprint |

## 9. Open Questions

Genuine, unresolved (for the **content specification**, not this review):
- **Meaning altitude & neutrality vocabulary** — the precise Intrinsic Pattern Identity
  abstraction and permitted phrasing (the diagnosis-tier analogue of the ratified
  intrinsic-action vocabulary), and whether a Neutrality / Context-Independence audit gate
  applies before freeze.
- **Entry model confirmation** — presumptively two fields (referenced pattern + objective
  meaning), mirroring the other definition layers; to be ratified.
- **Parity target** — whether the meaning layer targets 1:1 with the 85 catalogued
  patterns or accepts Option-B partial coverage (a content-plan decision).

Not reopened (settled): `diagnosisPatternCatalog` existence and wiring; the split decision
(Doc 43); registry state.

## 10. Recommendation

**Option B — meaning-only, referencing `diagnosisPatternCatalog` identities.**

`diagnosisPatternDefinitions` should own **only pattern meaning** and reference pattern
identity from `diagnosisPatternCatalog`. Justification (grounded):
1. **The identity root already exists and is wired** (Doc 43 decision executed); the split
   is settled — the meaning layer must reference it, not re-own identity.
2. **Consumer evidence** — `DiagnosisModule` consumes `{{patternDefinitions}}` as
   "definitions only, NOT rules"; that is precisely a meaning layer.
3. **Mapping symmetry** — `patternTreatmentMap` references pattern *identity* (its LHS); it
   should reference `diagnosisPatternCatalog`, leaving the meaning layer a module-only
   consumer — matching the formula tiers exactly.
4. **Consistency** — this makes the diagnosis tier the exact analogue of
   `formulaDefinitionCatalog → formulaDefinitions` and `formulaCatalog →
   prescriptionFormulaDefinitions`.

Option A (identity + meaning combined) is **not** viable here — it would duplicate the
already-wired catalog's identity ownership and re-introduce the asymmetry Doc 43 removed.

## Sufficiency

**The architecture is sufficiently settled to begin the `diagnosisPatternDefinitions`
specification.** Ownership (meaning-only, referencing the catalog), the dependency model
(one outbound edge to the identity root; maps reference the catalog; acyclic), the meaning
boundary (Intrinsic Pattern Identity; no symptoms/selection/treatment/mapping), and
consistency with the ratified tiers are all resolved. No additional *architectural*
decision is required. The remaining items — meaning altitude/neutrality vocabulary, entry
model ratification, parity target — are **content-specification** concerns for the next
step, not architectural blockers.

Recommended next step (for review, not executed): a `diagnosisPatternDefinitions` **content
specification** (mirroring `39-formula-definitions-content-specification.md`), then authoring
rules, content, and the wiring lifecycle (including a build-time
`diagnosisPatternDefinitions.pattern ∈ diagnosisPatternCatalog` cross-content check).

## Scope

Read-only architecture review. No implementation, content, specification, authoring rules,
generators, sources, contracts, validators, registry changes, or wiring; no change to any
existing file other than the creation of this document.

STOP. Architecture review complete. No implementation begun. Nothing committed. Awaiting
review.
