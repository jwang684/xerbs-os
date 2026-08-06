# Knowledge Content — Architecture Review

**Knowledge Content Sprint · Step 1 (Architecture Review).** Status: **Approved and
frozen (2026-08-06).** This document reviews the architecture of the Knowledge Content
Layer — what belongs in curated knowledge, what belongs in the loader, what
belongs in modules, and what belongs nowhere. It designs no implementation and
authors no content. It depends on and changes none of the frozen Runtime or
Knowledge Transport architecture.

## 1. Major architectural decisions

- **Content is pure data behind the loader** — the values registry sources yield,
  validated by their contracts, authored/validated/versioned independently. The
  loader never changes as content grows.
- **v1 content is three kinds only — Definitions, Vocabulary, Reference Mappings —
  i.e. exactly the seven existing interfaces.** No new interface is proposed.
  Composition, dosage, safety, and references are Future.
- **Validation splits by owner:** registry (inventory integrity), contract
  (structure of one slice), module (behaviour), Clinical Evaluation (correctness).
- **The one new element the Content Layer implies is a build-time cross-content
  consistency check** (referential integrity across slices) — a Knowledge-Layer/CI
  concern, not a framework or loader change.

## 2. Category review (per interface)

| Interface | Belongs (v1) | Must **never** belong | Why |
|---|---|---|---|
| **diagnosisPatternDefinitions** | canonical pattern *definitions* (name + concise meaning) | criteria, relationships/ontology, ids/i18n, any treatment/formula/herb, rules | Diagnosis interprets; definitions scope its vocabulary without dictating matching. |
| **formulaDefinitions** | canonical *definitions* of treatment principles + formula families | named formulas, herbs, composition, dosage, associations, rules | Formula owns strategy *vocabulary*, not execution or associations. |
| **patternTreatmentMap** | reference *associations* pattern → principle/family | dispatch, weights implying auto-selection, named formulas, herbs | Reference informing reasoning; never a rule engine. |
| **prescriptionFormulaDefinitions** | canonical *definitions* of named formulas (name + indication) | composition, quantities, dosage, administration, modifications, safety, herb lists | Grounds `formulaName`; composition/dosage are Future. |
| **treatmentFormulaMap** | reference *associations* family/strategy → candidate named formulas | dispatch/auto-pick, ranking implying auto-selection, composition, dosage | Reference shortlist; strongest reference-only discipline. |
| **formulaCatalog** | canonical *vocabulary* of formula names | composition, dosage, indications, properties, aliases/i18n | Fixes the canonical name-space; meaning lives in definitions. |
| **herbCatalog** | canonical *vocabulary* of herb names | properties, composition, dosage, contraindications, interactions | Identity only; properties/safety are Future/subsystem. |

Boundaries are complete and non-overlapping, with one flagged near-overlap:
`prescriptionFormulaDefinitions` and `formulaCatalog` both enumerate formula names
(definitions = names+meaning; catalog = names only) — intentional layering, but a
duplication/drift risk (see §9), resolved by the Content Independence Principle
(§5) and a cross-content check.

## 3. Knowledge ownership (v1 / future / subsystem)

| Category | Verdict | Owner |
|---|---|---|
| Definition | **v1** | Content |
| Vocabulary | **v1** | Content |
| Reference Mapping | **v1** | Content (reference, never rules) |
| Composition | **Future** | Content |
| Dosage (reference) | **Future** | Content; dosage *rules/calculation* → separate Safety subsystem |
| Contraindications | **Future** | Separate Safety subsystem |
| Interactions | **Future** | Separate Safety subsystem |
| Evidence | **Future** | Separate Evidence/RAG subsystem |
| Classical References | **Future** | Separate reference/RAG corpus |
| Modern References | **Future** | Separate reference/RAG corpus |

## 4. Content granularity

- Formula Definition includes composition? **No** — composition is Future.
- Herb Catalog includes dosage? **No** — catalog is names only.
- Treatment Map includes decision rules? **No** — associations only (rules =
  rule engine, forbidden).
- Formula Catalog includes aliases? **No** for v1 — alias→canonical resolution is
  a vocabulary-ids concern (Future).
- Vocabulary includes multilingual names? **No** — localization is Future; v1 is
  one canonical-language name-space.

## 5. Content Independence Principle

**Every knowledge interface owns exactly one category of information.** Information
already owned by another interface must **never be duplicated**; interfaces
reference one another *conceptually* rather than redefining each other's content.
The purpose is to prevent semantic drift while allowing every interface to evolve
independently.

Stated across the three kinds:

- **Vocabulary identifies.** `formulaCatalog` owns the canonical formula *names*;
  `herbCatalog` owns the canonical herb *names*. They fix the name-space and
  nothing more.
- **Definitions explain.** `prescriptionFormulaDefinitions` owns the *meaning* of
  those formulas; `formulaDefinitions` owns treatment-principle and formula-family
  *meaning*; `diagnosisPatternDefinitions` owns pattern *meaning*. Definitions must
  **not** redefine vocabulary — they attach meaning to names owned elsewhere.
- **Mappings associate.** `patternTreatmentMap` associates patterns with treatment
  principles/families; `treatmentFormulaMap` associates families with candidate
  named formulas. A mapping must **never restate the meanings** its endpoints
  carry — `patternTreatmentMap` must not re-explain a pattern that
  `diagnosisPatternDefinitions` already defines; `treatmentFormulaMap` must not
  redefine a treatment family that `formulaDefinitions` already owns.

Concretely: `formulaCatalog` owns canonical formula names;
`prescriptionFormulaDefinitions` owns the meaning of those formulas; definitions
must not redefine vocabulary. `diagnosisPatternDefinitions` owns pattern meaning;
`patternTreatmentMap` must never restate those meanings. `formulaDefinitions` owns
treatment-family meaning; `treatmentFormulaMap` must never redefine treatment
families.

**Duplication is prohibited even when the duplicated values appear identical
today.** Future evolution is expected — a name, a definition, or an association
will change on its own schedule — and only independent, single-owner ownership
lets each interface evolve without silently contradicting another. Duplicated
content would drift apart the moment one copy changed; conceptual reference keeps a
single authoritative source per fact.

**Governing principle.** *Every knowledge interface owns exactly one kind of
information. Information already owned by another interface must never be
duplicated. Interfaces reference each other rather than redefining each other's
content. This preserves independent evolution while preventing semantic drift.*

### 5a. Ownership Follows Meaning

Knowledge ownership is determined **entirely by semantic authority** — by which
interface is the authoritative source of a piece of information. Ownership must
**never** be determined by:

- implementation convenience,
- UI convenience,
- author convenience,
- duplication convenience,
- serialization convenience.

**Information belongs where it is authoritative, never where it is easiest to
duplicate.** If a value would be convenient to copy into a second interface, that
convenience is not a reason to store it there; it is stored once, in its
authoritative owner, and referenced everywhere else.

**Every knowledge interface owns exactly one semantic responsibility**, and stores
only the information it is authoritative for. Every other interface *references*
that information rather than redefining it:

- **Vocabulary owns names.**
- **Definitions own meaning.**
- **Mappings own relationships.**

Applied to the seven interfaces:

- **Formula** — `formulaCatalog` owns canonical formula names;
  `prescriptionFormulaDefinitions` owns the meaning of those formulas. Definitions
  may reference canonical names but must **never redefine vocabulary**.
- **Diagnosis** — `diagnosisPatternDefinitions` owns pattern meaning;
  `patternTreatmentMap` owns only associations. Mappings must **never restate
  pattern meaning**.
- **Treatment** — `formulaDefinitions` owns treatment-family meaning;
  `treatmentFormulaMap` owns only associations. Mappings must **never redefine
  treatment-family meaning**.

**Duplication is prohibited even when the duplicated values appear identical
today.** Independent evolution is expected: names, meanings, and relationships each
change on their own schedule, and every future change must occur in exactly one
authoritative location. Storing a fact where it is merely convenient guarantees
that the convenient copy drifts from its authoritative source the moment either
changes — which is precisely the semantic drift this rule prevents.

**Governing principle.** *Ownership follows meaning, never convenience. Information
is stored where it is authoritative, not where it is easiest to duplicate. Every
interface owns only its unique semantic responsibility, and all other interfaces
reference that ownership rather than redefining it.*

## 6. Recommended v1 content

Exactly the seven interfaces, each populated as its declared kind, in canonical
language, reference-only, with **no** composition/dosage/safety/references/ids/
aliases:

- `diagnosisPatternDefinitions` — canonical pattern definitions (name + meaning)
- `formulaDefinitions` — canonical treatment-principle + formula-family definitions
- `patternTreatmentMap` — reference pattern→principle/family associations
- `prescriptionFormulaDefinitions` — canonical named-formula definitions
- `treatmentFormulaMap` — reference family→named-formula associations
- `formulaCatalog` — canonical formula-name vocabulary
- `herbCatalog` — canonical herb-name vocabulary

Content may be authored **incrementally, slice by slice**; an empty slice falls
back via Option B, so v1 is not all-or-nothing.

## 7. Future content (deliberately outside v1)

- **Composition, Dosage (reference)** — highest-value Future content; structured
  and (dosage) safety-adjacent.
- **Contraindications, Interactions** — a separate **Safety subsystem** with a
  curated KB (free-text authoring = fabrication risk).
- **Classical/Modern references, Evidence** — a **RAG/reference subsystem**; may
  need an additive loader retrieval capability.
- **IDs / i18n / aliases** — vocabulary identity layer; additive, Future.
- **Graph / ontology** — pattern/formula relationships; needs a graph
  representation and possibly an additive loader query method.

All are additive (content + contracts, occasionally an additive loader method) —
never a framework/loader redesign.

## 8. Validation ownership

- **Registry** — inventory integrity (§5a of the loader spec).
- **Validation Contract** — *structural* shape of one slice. Authoritative for
  structure.
- **Module** — *behavioural* use only; never re-validates structure; reference-only
  + Option B.
- **Clinical Evaluation** — clinical *correctness* of content; owned by none of the
  above.

Named ambiguity: cross-slice **referential integrity** (mapping endpoints resolve
to known vocabulary/definitions) is neither a single-slice contract concern nor a
clinical-evaluation concern → treat it as a **build-time cross-content consistency
check** in the Knowledge Layer/CI.

## 9. Architectural risks

| Risk | Assessment | Mitigation |
|---|---|---|
| Duplication (formula names in catalog + definitions) | requires action (mild) | Catalog is the authoritative name-space; definitions reference it; build-time check. (Content Independence Principle, §5.) |
| Overlapping ownership | acceptable | Boundaries clean; §5 governs. |
| Future coupling | acceptable | Content is data behind contracts; loader independent. |
| Hidden rule engines (mappings) | deferred-but-watched | Contracts validate associations only (no weights implying auto-selection); modules reference-only. |
| Semantic drift | requires action | §5 (single-owner) + build-time referential checks + Clinical Evaluation. |
| Content versioning | deferred | In-content version fields; registry-immutable-per-run. |
| Knowledge explosion | deferred, acceptable | Loader lazy-loads + caches per slice; defer large datasets. |

## 10. Sufficiency review

**The frozen Runtime and Knowledge Transport architecture fully support the
Knowledge Content Layer.** Content is exactly the values registry sources yield,
validated by contracts, transported opaquely, consumed with Option B — all frozen.
Growth is additive content behind contracts, loader and framework untouched. The
only new element (a build-time cross-content consistency check) lives outside the
frozen framework. No limitation; no new interface required for v1.

## Scope

Architecture review only. No content authored, no code, no framework/loader/module
change, no commit.
