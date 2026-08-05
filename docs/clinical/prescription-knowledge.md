# PrescriptionModule — Knowledge Architecture Review

**Prescription Sprint · Step 3 (Knowledge).** Status: **Approved and frozen
(2026-08-05).** This is the agreed knowledge architecture for PrescriptionModule;
changes require explicit clinical/architectural justification. This document
reviews the **knowledge architecture** for
PrescriptionModule — what external clinical knowledge it should depend on, and
where each category belongs. It designs nothing and populates nothing. No
knowledge content, no code, no schema, no prompt, no module, no framework
changes, no commit.

Prescription is the **execution** layer. The AI model performs the prescribing
reasoning; the Knowledge Base, when present, supplies stable clinical knowledge
that *supports* that reasoning. Knowledge must never *replace* reasoning, and
Prescription must never become a rule engine — knowledge is **reference, never
deterministic dispatch**. Prescription owns **execution**: the named formula,
modifications, herb composition, quantities, dosage, administration, and
duration. It does not own follow-up, education, scheduling, billing, or coding.

This review follows the philosophy already frozen for
`docs/clinical/diagnosis-knowledge.md` and `docs/clinical/formula-knowledge.md`:
prefer the smallest surface; expose an interface only when a category passes the
four-condition test; distinguish **Required Architecture** (the seam) from
**Optional Content** (what flows through it, with graceful fallback).

## Sources of truth (candidate owners)

- **FormulaResult / DiagnosisResult / SummaryResult / AssessmentResult** —
  patient-specific evidence and the selected strategy (not knowledge).
- **Runtime Contract** — governance rules (e.g. confidence propagation). Rules,
  not knowledge.
- **Provider model** — general clinical/TCM prescribing capability (the v1
  fallback).
- **Knowledge Base** — curated, versioned clinical knowledge, loaded via
  `KnowledgeLoader`.
- **Future Safety subsystem** — contraindication / interaction / safety
  verification (defense-in-depth), possibly distinct from Prescription.
- **Future Knowledge Graph / RAG corpus** — formula/herb relationships,
  vocabulary/ids, classical and modern references.
- **Later layers** — follow-up, patient education; and the billing/coding
  subsystem (ICD) — never Prescription knowledge.

## 1. Category-by-category review

Recommendation is one of **Required Architecture · Optional Content** /
**Future** / **Reject**. "Reject" means the category belongs to another owner or
is a rule, not that it is worthless. "Future" means it is genuine Prescription
knowledge, deferred on scope / producer / risk grounds — several of these
*pass* the four-condition test as content and are deferred anyway (noted
explicitly), exactly as Diagnosis deferred its full Pattern Library.

| # | Category | Recommendation | Owner | Rationale |
|---|---|---|---|---|
| 1 | Named Formula Definitions | **Required Architecture · Optional Content** | Knowledge Base (Prescription definitions) | Canonical *definitions* of the named formulas Prescription may select — name + what it is, nothing structured. Grounds `formulaName`. Small, reference-only, low rule-engine risk. Passes all four conditions. Direct analog of `diagnosisPatternDefinitions` / `formulaDefinitions`. See §2a. |
| 2 | Formula Catalog | **Required Architecture · Optional Content** | Knowledge Base (Prescription vocabulary) | The canonical *vocabulary* of formula names Prescription may emit — enumeration/identity, **not** the structured composition (that stays 4). Vocabulary, not reasoning: grounds that `formulaName` is a canonical value. Interface from v1, content optional. See §2c. |
| 3 | Herb Catalog | **Required Architecture · Optional Content** | Knowledge Base (Prescription vocabulary) | The canonical *vocabulary* of herb names — Prescription is the first layer that produces herb names. Vocabulary, not reasoning: grounds `herbs[].name` as canonical values, **not** herb properties/composition. Interface from v1, content optional. See §2c. |
| 4 | Formula Composition Knowledge | **Future** | Knowledge Base | Standard herb composition of named formulas — grounds `herbs[]`. **Passes** the four-condition test as content; deferred on size, missing producer, and rule-engine risk (deterministic "formula → fixed composition" lookup). The single highest-value Future content — author first. See §4. |
| 5 | Formula Modification Knowledge | **Future** | Knowledge Base | Standard modification patterns (which herbs are added/subtracted for common variations) — grounds `modifications`. Structured content; the model reasons modifications for v1, grounded by definitions. |
| 6 | Dosage Guidance | **Future** | Knowledge Base | Reference dose ranges — grounds `dosage` and `herbs[].quantity`. Safety-critical and the highest fabrication / rule-engine risk (must be a reference range, never a dose *calculator*). The clinically weakest fallback in v1 — author early alongside composition. See §4. |
| 7 | Administration Guidance | **Future** | Knowledge Base | Standard route/method/frequency references — grounds `administration`. The model reasons this for v1. |
| 8 | Duration Guidance | **Future** | Knowledge Base | Standard course-length references — grounds `duration`. The model reasons this for v1. |
| 9 | Contraindications | **Future** | Knowledge Base (Safety) | Execution-level contraindication knowledge that supports caution. Needs a real KB; free-text generation is fabrication-prone. Execution-level safety lands at Prescription per the frozen Formula review, but as Future content. See §5. |
| 10 | Interaction Knowledge | **Future** | Knowledge Base (Safety) | Herb–herb / herb–drug interactions supporting caution. Needs a curated interaction KB; fabrication-prone as free text. Future. See §5. |
| 11 | Safety Guidance | **Future** | Knowledge Base (Safety) | Broader execution-safety references. For v1, caution is carried by red flags (Summary) + lowered `confidence` + `uncertaintyNotes` (per the frozen schema review). A dedicated Safety subsystem may own 9–11 — an open architecture question. See §5. |
| 12 | Classical References | **Future** | Knowledge Base / RAG | Curated classical citation corpus (explainability). Model-generated citations risk fabrication → not v1. Same call as both siblings. |
| 13 | Modern Evidence | **Future** | Knowledge Base / RAG | Modern literature corpus; RAG territory, later. Same call as both siblings. |
| 14 | Formula Vocabulary / IDs | **Future** | Knowledge Base | Stable identifiers + i18n — the identity layer underpinning the schema's deferred `formulaId` / `herbId`. Canonical *names* arrive with the v1 definitions; stable *ids* are deferred (as `patternId` and treatment vocabulary were). |
| 15 | Prescription Mapping | **Required Architecture · Optional Content** | Knowledge Base (Prescription mapping) | Reference associations from the selected treatment family/strategy → candidate named formulas — grounds the *selection* of `formulaName`. Reference, never dispatch. Direct analog of Formula's `patternTreatmentMap`. See §2b. |

**Net:** four narrow surfaces are **Required Architecture · Optional Content** —
**named formula definitions** (§2a), **treatment→formula mapping** (§2b), and the
two canonical **vocabulary** catalogs, **formula** and **herb** (§2c). The
remaining eleven are **Future**. **Zero categories are Reject**, and
that is the defining finding of this review (see §6): the "belongs to a later
module" escape hatch that let Diagnosis and Formula reject named-formula, herb,
dosage, and execution-safety knowledge **does not exist here** — Prescription is
the terminal execution owner where all of it finally lands.

## 2a. The v1 surface — Named Formula Definitions (definitions only)

The narrow category of **canonical named-formula definitions** — stable
definitions of the named formulas Prescription may select (name + concise
definition/indication), and nothing else (no composition, no herbs, no dosage, no
modification tables, no ids, no references) — is the primary v1 surface.

**Verdict: Required Architecture · Optional Content** (mirroring
`diagnosisPatternDefinitions` and `formulaDefinitions`):

- **Required Architecture (v1):** Prescription exposes the interface
  `prescriptionFormulaDefinitions` from v1. The seam is part of the architecture.
- **Optional Content:** the definitions content is optional. When none is
  supplied, Prescription **gracefully falls back** to the model's internal
  knowledge, without changing output structure.

Four-condition test (definitions-only): **stable producer** (a small curated set
of canonical named-formula definitions), **stable consumer** (PrescriptionModule,
grounding `formulaName` in an explicit, in-scope catalog of formula *names*),
**unique** (domain knowledge absent from patient data and runtime rules — and
absent from Formula, which names only *families*), **non-derivable** (cannot be
derived from the diagnosis or strategy). All four hold.

**Not a rule engine.** Definitions scope and ground *which named formulas exist*;
they do not dictate which to choose. Composition, dosage, and modification (the
structured internals, categories 4–6) remain Future precisely to avoid
rule-engine drift.

## 2b. The v1 surface — Treatment→Formula Mapping (reference)

Reference associations linking the selected treatment strategy (its
`treatmentPrinciple` / `formulaFamily`) to candidate named formulas — provided as
reference knowledge, not as a decision procedure.

**Verdict: Required Architecture · Optional Content** — the same philosophy as
Formula's `patternTreatmentMap`:

- **Required Architecture (v1):** Prescription exposes `treatmentFormulaMap` from
  v1.
- **Optional Content:** the mapping content is optional; when absent, Prescription
  falls back to model reasoning grounded by the definitions.

Four-condition test holds: **stable producer** (a curated set of associations),
**stable consumer** (PrescriptionModule selecting `formulaName` within the family
Formula chose), **unique** domain knowledge, **non-derivable** from patient data.

**Reference, never rules — and this surface carries the highest dispatch
temptation.** A "family → formula" association is one step from deterministic
lookup, so the caveat is stronger here than for `patternTreatmentMap`: the map
*informs* a shortlist; it is **never** applied as automatic selection, never
overrides the model's reasoning, and never bypasses the patient-specific evidence.
Prescription stays model-reasoned. (If a minimal v1 is preferred, §2a alone is
the irreducible core; §2b is the natural, sibling-consistent second surface.)

## 2c. The v1 surfaces — Formula and Herb Vocabulary Catalogs

Prescription is the first module that emits **canonical names** at execution
grain: a named formula (`formulaName`) and individual herb names
(`herbs[].name`). The canonical *vocabularies* those names are drawn from — the
enumerated, authoritative set of valid formula names and herb names — are
**identity/vocabulary, not reasoning**, and belong to architecture.

**Verdict (both): Required Architecture · Optional Content**, on the same
philosophy as the definitions surface:

- **Required Architecture (v1):** Prescription exposes `formulaCatalog` and
  `herbCatalog` from v1.
- **Optional Content:** the enumerations are optional; when empty, Prescription
  **gracefully falls back** to the model's internal knowledge, unchanged in
  structure. The interface exists from day one even if the content starts empty.

Four-condition test (vocabulary only): **stable producer** (a curated canonical
name list), **stable consumer** (Prescription, grounding `formulaName` /
`herbs[].name` in an in-scope vocabulary), **unique** (a domain name-space absent
from patient data and runtime rules), **non-derivable** (cannot be derived from
the diagnosis, strategy, or evidence). All four hold.

**Vocabulary, not the library.** These catalogs enumerate *which names are
canonical*; they do **not** carry formula composition (4), herb properties, or
dosage (6), which remain Future precisely so the catalogs stay a name-space
grounding surface and never become a composition/dosage lookup table. They
complement §2a: `prescriptionFormulaDefinitions` adds concise *meaning* to formula
names, while `formulaCatalog` fixes the canonical *name-space* itself. A single
producer may back both.

## 3. Knowledge interfaces (KnowledgeLoader keys)

**Four interfaces, all Required Architecture · Optional Content:**

- `prescriptionFormulaDefinitions` — canonical named-formula definitions (§2a).
- `treatmentFormulaMap` — reference associations from treatment strategy to
  candidate named formulas (§2b; reference, not rules).
- `formulaCatalog` — canonical vocabulary of formula names (§2c).
- `herbCatalog` — canonical vocabulary of herb names (§2c).

For each: the **interface (key) is Required Architecture** in v1; the **content it
returns is Optional**, with **graceful fallback** to the model's internal
knowledge when empty. No other keys in v1.

## 4. Future extension points (reserved, not implemented)

Logical keys to introduce **only when actually needed**, each independently and
backward-compatibly. Priority order reflects clinical value and fallback risk:

- **`formulaComposition` (4) and `dosageGuidance` (6)** — the highest priority.
  These are where graceful-fallback-to-model is *clinically weakest*: a model
  reciting formula compositions and dose ranges from opaque memory is the largest
  fabrication risk in the whole pipeline. Both pass the four-condition test as
  content; they are Future only for want of a curated producer. **Recommend these
  be the first content authored**, and they are the strongest argument for wiring
  the framework extension (§Framework).
- **`formulaModifications` (5)** — grounds `modifications`; author alongside
  composition.
- **`administrationGuidance` (7)`, `durationGuidance` (8)** — lower-risk reference
  content.
- **`prescriptionSafety` (9, 10, 11)** — contraindication / interaction / safety
  knowledge; may instead be owned by a dedicated Safety subsystem (see §5).
- **`prescriptionVocabulary` (14)** — stable formula/herb ids + i18n on top of the
  v1 name catalogs; unblocks the schema's deferred `formulaId` / `herbId`.
- **`prescriptionReferences` (12, 13)** — classical + modern citation corpus; a
  RAG concern.

The **full structured** formula library (attributes beyond names) is not a
separate Future key — it is covered by composition (4), modification (5), and
vocabulary/ids (14); the canonical formula-name *vocabulary* is now the v1
`formulaCatalog` (§2c).

## 5. Safety knowledge (categories 9–11) — an explicit note

Execution-level safety is genuinely Prescription-relevant (per the frozen Formula
review, it lands here), but it is deferred for three reasons: (a) it requires a
real curated contraindication/interaction KB that does not exist; (b) generating
it as free text invites the model to *fabricate* medical safety claims — the exact
risk the schema review avoided by **rejecting safety-warning output fields** and
routing caution through `uncertaintyNotes` + lowered `confidence`; (c) it may
belong to a **dedicated Safety/verification subsystem** (defense-in-depth) rather
than to Prescription's own knowledge surface. That ownership question is left
open; either way, safety knowledge is **Future**, and for v1 caution is carried
by the existing red-flag / confidence / uncertainty channels.

## 6. Is Prescription the first module that truly justifies external knowledge?

**Yes — with a precise distinction.**

Diagnosis and Formula *benefit* from external knowledge: canonical definitions
(and, for Formula, a reference map) ground the vocabulary they emit, but their
fallback to model reasoning is clinically acceptable — they produce
*interpretations* and *strategies*, which are reasoning artifacts.

Prescription is the first module whose **core output is itself specialized domain
knowledge**: a named formula, its herb composition, quantities, and dosage. Here
opaque model recall is at its clinically riskiest — a fabricated composition or
dose is a concrete safety hazard, not a debatable interpretation. So the
architectural *direction* toward external knowledge is strongest at Prescription,
and it is the first module where authoring real content (composition, dosage) is a
**near-term priority** rather than a "someday."

The distinction matters for scope discipline: "truly justifies" describes the
**direction and priority**, not a mandate to front-load a large KB into v1. The v1
*surface* stays minimal and vocabulary-only — definitions, a reference map, and
two canonical name catalogs, all optional-content — with the structured internals
(composition, dosage) still Future and the framework untouched under Option B. What changes at Prescription is
that the Future content (composition, dosage) is no longer speculative; it is the
first knowledge the clinic will actually want to curate.

## Framework

Per instruction and the established resolution, **`KnowledgeRequest` and
`KnowledgeBundle` are not modified here**, and the current **Option B** philosophy
(graceful fallback) stands. The v1 module requests no knowledge and injects a
`"(none provided)"` placeholder, exactly like the Diagnosis and Formula modules.

One nuance specific to Prescription is worth recording. The frozen
`KnowledgeRequest` / `KnowledgeBundle` already carry generic `formulas?` and
`herbs?` slices (typed `unknown`) — and the two promoted **vocabulary catalogs**
(`formulaCatalog`, `herbCatalog`) are precisely the catalog-shaped content those
generic slices were originally envisioned for. Prescription is therefore the
**one** module whose v1 knowledge could *nominally* ride the existing slices
without a framework change. But those slices are (a) `unknown`-typed (no real
contract) and (b) only catalog-shaped, so they still do **not** cleanly express
the definitions surface, the associative `treatmentFormulaMap`, or later dosage
semantics. Overloading them would trade a clean typed seam for an opaque one.

**Recommendation:** do **not** extend the framework now — Option B's three gates
(curated content exists, `KnowledgeLoader` has a stable producer, and the module
is a real consumer) are still unmet. But record that **Prescription is the module
that will justify the extension**, and the concrete trigger is the authoring of
the first real content (recommended: named-formula definitions, then composition
and dosage) together with a `KnowledgeLoader` producer. At that point introduce a
**typed extension** for the Prescription keys rather than reusing the untyped
`formulas?` / `herbs?` slices.

**Runtime-contract sufficiency:** the frozen runtime contract
(`docs/architecture/10-ai-runtime.md`) is **sufficient** — no runtime-contract
change is needed. The only pending item is the same deferred
`KnowledgeRequest` / `KnowledgeBundle` extension already noted for Diagnosis and
Formula, now with Prescription identified as its likely trigger.

## Final recommendation

1. **Recommended Prescription Knowledge v1:** four interfaces —
   `prescriptionFormulaDefinitions` (named-formula definitions),
   `treatmentFormulaMap` (treatment→formula reference associations), and the two
   canonical **vocabulary** catalogs `formulaCatalog` and `herbCatalog` — all as
   **Required Architecture · Optional Content**. No curated content is required for
   v1; the module falls back to model reasoning when any is empty.
2. **Future (genuine Prescription knowledge, deferred):** composition (4),
   modification (5), dosage (6), administration (7), duration (8),
   contraindications (9), interactions (10), safety (11), classical (12) and
   modern (13) references, and vocabulary/ids (14). Composition (4) and dosage (6)
   are the highest priority and the weakest v1 fallbacks — author first.
3. **Reject: none.** Prescription is the terminal execution owner; no category in
   scope belongs to another module. (ICD/billing, education, follow-up were
   rejected earlier as *output* concerns and are not knowledge categories here.)
4. **Framework:** unchanged; Option B holds. Prescription is identified as the
   likely trigger for the eventual typed `KnowledgeRequest`/`KnowledgeBundle`
   extension, gated on real content + a stable producer.
5. **Runtime contract:** sufficient; no change required.

## Architecture principle

Prefer the smallest knowledge surface that fully supports Prescription v1; reject
speculative knowledge and anything that would make Prescription a rule engine or a
deterministic dispatcher. Knowledge should exist only when there is a **stable
producer, a stable consumer, unique information, and non-derivable information**.
Four categories meet all four conditions *and* stay small enough for v1 —
named-formula **definitions**, the treatment→formula **mapping** (reference, never
rules), and the canonical **formula** and **herb** name **vocabularies**. Several
more (notably composition and dosage) meet the test but are deferred on scope and
safety-risk grounds until a curated producer exists.

## Boundary (non-negotiable)

Prescription owns **execution** knowledge — named formulas, composition,
quantities, dosage, administration, duration. It never owns follow-up, patient
education, scheduling, billing, or ICD/coding knowledge; those belong to later
layers and other subsystems, consistent with the frozen Prescription clinical
specification.

## Scope

Architecture review only. No knowledge files, no code, no schema, no prompt, no
module, no framework changes, no commit.
