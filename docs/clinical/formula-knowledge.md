# FormulaModule — Knowledge Architecture Review

**Formula Sprint · Step 3 (Knowledge).** Status: **Approved and frozen
(2026-08-04).** This is the agreed knowledge architecture for FormulaModule;
changes require explicit clinical/architectural justification.

This document reviews the **knowledge architecture** for FormulaModule — what
treatment knowledge it should depend on, and where each category belongs. It
designs nothing and populates nothing. No knowledge content, no code, no commit.

Formula is the treatment-strategy layer. The AI model performs the treatment
reasoning; the Knowledge Base, when present, supplies stable clinical knowledge
that *supports* reasoning. Knowledge must never *replace* reasoning, and Formula
must never become a rule engine. Formula owns **treatment strategy** only — never
named formulas, herbs, dosage, prescription generation, or follow-up.

## Sources of truth (candidate owners)

- **DiagnosisResult / SummaryResult / AssessmentResult** — patient-specific
  evidence (not knowledge).
- **Runtime Contract** — governance rules (e.g. confidence propagation).
- **Provider model** — general clinical/TCM treatment-reasoning capability
  (sufficient for v1).
- **Knowledge Base** — curated, versioned clinical knowledge, loaded via
  `KnowledgeLoader`.
- **Future Knowledge Graph** — treatment/formula relationships and vocabulary.
- **Prescription module** — named formulas, herbs, dosage, prescription rules,
  execution-level safety (out of Formula's scope).

## 1. Category-by-category review

Recommendation is one of **v1 / v2 / Future / Reject**. "Reject" means the
category belongs to another owner, not that it is worthless.

| # | Category | Recommendation | Owner | Rationale |
|---|---|---|---|---|
| 1 | Treatment Principles (e.g. "Tonify Qi") | **v1** | Knowledge Base (Formula definitions) | Canonical *definitions* of the principle vocabulary Formula emits. Stable, unique, non-derivable → passes the four-condition test. Externalize; scopes Formula's `treatmentPrinciple`. |
| 2 | Formula Families (e.g. "Qi-tonifying formulas") | **v1** | Knowledge Base (Formula definitions) | Canonical *definitions* of family/direction categories Formula emits (`formulaFamily`) — category level only, never named formulas. Same test passes. |
| 3 | Formula Selection Principles (general strategy) | **Reject** | Prompt / Spec + Runtime | This is *how to reason*, not clinical data. It lives in the frozen spec and the Prompt, not the Knowledge Base — encoding it as knowledge pushes toward a rule engine. |
| 4 | Pattern-to-Treatment Mapping | **v1 · Required Architecture · Optional Content** | Knowledge Base (Formula mapping) | Reference associations from diagnostic patterns to treatment principles/families — it *supports* reasoning, never replaces it. The interface exists from v1; content is optional with graceful fallback. Provided as reference, **not** deterministic mapping rules (no rule engine). Passes the four-condition test. See §1b. |
| 5 | Contraindications | **Future** | Prescription / Safety (mostly) | Herb/formula-level contraindications are execution → Prescription. The thin strategy-level slice can be a future Safety-knowledge concern. For v1, strategy caution is already handled by red flags (Summary) + confidence + reasoning. |
| 6 | Treatment Priority Rules | **Reject** | Provider model (reasoning) | Ranking is reasoning, expressed via `rank`. A priority *rules* base would make Formula a rule engine. |
| 7 | Formula Relationships | **Future** | Knowledge Graph | Relationships are ontology, not patient output; belong to a future KG keyed by canonical vocabulary. |
| 8 | Classical References | **Future** | Knowledge Base / RAG corpus | Explainability nicety; a curated citation corpus is a future RAG asset. Model-generated citations risk fabrication → not v1. |
| 9 | Modern Evidence References | **Future** | Knowledge Base / RAG corpus | Same as #8 for modern literature; RAG territory, later. |
| 10 | Treatment Vocabulary (ids / i18n) | **v2** | Knowledge Base (future) | Canonical *names* arrive with the v1 definitions; stable *identifiers* and localization are the identity layer, deferred (as `patternId` was for Diagnosis). |
| 11 | Named Formula Library (e.g. "Bu Zhong Yi Qi Tang") | **Reject** | Prescription | Named formulas are execution — forbidden for Formula by the frozen spec. |
| 12 | Herb Library | **Reject** | Prescription | Herbs are execution — forbidden for Formula. |
| 13 | Dosage Guidance | **Reject** | Prescription | Dosage is execution — forbidden for Formula. |
| 14 | Safety Guidance | **Reject** | Prescription / Safety layer | Execution-level safety belongs to Prescription; strategy caution is already covered by red flags + confidence + reasoning. Not a Formula knowledge category. |
| 15 | Prescription Rules | **Reject** | Prescription | Prescription generation is another module's domain — forbidden for Formula. |

**Net:** no category requires curated *content* for Formula v1; two narrow
surfaces — canonical **treatment-principle and formula-family definitions** (§1a)
and **pattern-to-treatment mapping** (§1b) — are **Required Architecture with
Optional Content**.

## 1a. The v1 surface — Formula Definitions (definitions only)

The narrow category of **canonical treatment-principle and formula-family
definitions** — stable clinical definitions of the principles (e.g. "Tonify Qi")
and family/direction categories (e.g. "Qi-tonifying formulas") Formula may use,
and nothing else (no named formulas, no herbs, no mapping tables, no
relationships, no ids, no references) — is the v1 knowledge surface.

**Verdict: Required Architecture · Optional Knowledge Content** (mirroring the
frozen Diagnosis decision for `diagnosisPatternDefinitions`):

- **Required Architecture (v1):** Formula exposes the knowledge interface
  `formulaDefinitions` from v1. The seam is part of the architecture.
- **Optional Knowledge Content:** the definitions *content* is optional. When no
  external definitions are supplied, Formula **gracefully falls back** to the
  model's internal treatment knowledge, without changing output structure or
  quality.

Four-condition test (definitions-only): **stable producer** (a small curated set
of canonical definitions), **stable consumer** (FormulaModule, grounding its
`treatmentPrinciple`/`formulaFamily` in an in-scope vocabulary), **unique** (domain
knowledge absent from patient data and runtime rules), **non-derivable** (cannot
be derived from the diagnosis/evidence). All four hold — unlike the fuller
library, mappings, or references.

**Not a rule engine.** Definitions are *reference context* that scope and ground
the model's strategy; they do not dictate which strategy to pick.

## 1b. The v1 surface — Pattern-to-Treatment Mapping (reference)

Reference associations linking diagnostic patterns to treatment principles /
formula families (e.g. a pattern is *associated with* a tonifying principle),
provided as reference knowledge — not as a decision procedure.

**Verdict: Required Architecture · Optional Knowledge Content** — the same
philosophy as Diagnosis Pattern Definitions and the Formula Definitions surface:

- **Required Architecture (v1):** Formula exposes the `patternTreatmentMap`
  interface from v1.
- **Optional Knowledge Content:** the mapping content is optional; when absent,
  Formula falls back to model reasoning grounded by the definitions, without
  changing output structure or quality.

Four-condition test holds: **stable producer** (a curated set of associations),
**stable consumer** (FormulaModule), **unique** domain knowledge, and
**non-derivable** from patient data.

**Reference, never rules.** The mapping *informs* the model's choice of strategy;
it is **never** applied as deterministic dispatch, never overrides the model's
reasoning, and never collapses or overrides the diagnostic differential. No
deterministic mapping rules are introduced — this keeps Formula a reasoning
module, not a rule engine.

## 2. KnowledgeLoader

**Two interfaces, both Required Architecture · Optional Content:**

- `formulaDefinitions` — canonical treatment-principle and formula-family
  definitions.
- `patternTreatmentMap` — reference associations from patterns to treatment
  principles/families (reference, not rules).

For each: the **interface (key) is Required Architecture** in v1; the **content it
returns is Optional**, with **graceful fallback** to the model's internal
knowledge when empty.

These are architectural *directions*, not deployment requirements — identical to
how `diagnosisPatternDefinitions` was handled. As with Diagnosis, the frozen
`KnowledgeRequest`/`KnowledgeBundle` types have no fields for this content, so
actually wiring the loader keys requires a small framework extension. Per the
established resolution (Diagnosis "option b"), that framework change is **not**
made until all three hold: canonical content exists, `KnowledgeLoader` has a
stable producer, and Formula becomes a real consumer. Until then the Module ships
with graceful fallback and the existing framework is untouched.

## 3. Extension points

- **v1:** `formulaDefinitions` (canonical treatment-principle + formula-family
  definitions) and `patternTreatmentMap` (pattern-to-treatment *reference*
  associations) — both Required Architecture · Optional Content.
- **v2:** treatment **vocabulary** (stable ids + i18n).
- **Future:** **formula relationships** (Knowledge Graph); **classical** and
  **modern evidence references** (RAG); the thin strategy-level **contraindication**
  slice (as Safety knowledge).

## 4. Final recommendation

1. **Recommended Formula Knowledge v1:** two interfaces — `formulaDefinitions`
   (canonical treatment-principle + formula-family definitions) and
   `patternTreatmentMap` (pattern-to-treatment reference associations) — both as
   Required Architecture with Optional Content. No curated content is required for
   v1; the module falls back to model reasoning when either is empty.
2. **Rejected categories:** Formula Selection Principles (3), Treatment Priority
   Rules (6), Named Formula Library (11), Herb Library (12), Dosage Guidance (13),
   Safety Guidance (14), Prescription Rules (15) — each owned elsewhere
   (prompt/spec, reasoning, or Prescription/Safety) and several forbidden to
   Formula by the frozen spec.
3. **Deferred categories:** Treatment Vocabulary/ids/i18n (10, v2),
   Contraindications (5, Future), Formula Relationships (7, Future), Classical
   References (8, Future), Modern Evidence References (9, Future).
4. **Runtime contract sufficiency:** the frozen runtime contract is **sufficient**
   — no runtime-contract change is needed. (The only pending item is the same
   deferred `KnowledgeRequest`/`KnowledgeBundle` framework extension noted for
   Diagnosis, gated on a real producer/consumer.)

## Architecture principle

Prefer the smallest knowledge surface that fully supports Formula v1; reject
speculative knowledge and anything that would make Formula a rule engine or cross
into execution. Knowledge should exist only when there is a **stable producer, a
stable consumer, unique information, and non-derivable information**. Two
categories meet all four for v1 — canonical **treatment-principle and
formula-family definitions**, and **pattern-to-treatment mapping** (as reference,
never rules).

## Boundary (non-negotiable)

Formula owns treatment **strategy**. Named formulas, herbs, dosage, prescription
generation, and follow-up are **never** Formula knowledge — they are owned by
Prescription (and later layers), consistent with the frozen Formula clinical
specification.

## Scope

Architecture review only. No knowledge files, no code, no framework changes.
