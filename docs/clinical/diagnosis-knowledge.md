# DiagnosisModule — Knowledge Architecture Review

**Diagnosis Sprint · Step 3 (Knowledge).** Status: **Approved and frozen
(2026-08-04).** This is the agreed knowledge architecture for DiagnosisModule;
changes require explicit clinical/architectural justification.

This document reviews the **knowledge architecture** for DiagnosisModule — what
medical knowledge it should depend on, and where each category belongs. It
designs nothing and populates nothing. No knowledge content, no code, no commit.

Diagnosis is the first reasoning module. The AI model performs the
interpretation; the Knowledge Base, when present, supplies stable clinical
knowledge that *supports* reasoning. Knowledge must never *replace* reasoning, and
Diagnosis must never become a rule engine.

## Sources of truth (candidate owners)

- **AssessmentResult / SummaryResult** — patient-specific evidence (not knowledge).
- **Runtime Contract** — governance rules (e.g. confidence propagation). Rules, not knowledge.
- **Provider model** — general clinical/TCM reasoning capability (sufficient for v1).
- **Knowledge Base** — curated, versioned clinical knowledge, loaded via `KnowledgeLoader`.
- **Future Knowledge Graph** — pattern ontology / relationships / canonical vocabulary.
- **Formula / Prescription modules** — treatment knowledge (out of Diagnosis scope).
- **Future billing/coding & multi-domain subsystems** — coding and cross-paradigm mapping.

## 1. Category-by-category review

Recommendation is one of **Required / Optional / Reject / Future** (for Diagnosis
v1). "Reject" means the category belongs to another owner, not that it is
worthless.

| # | Category | Recommendation | Owner | Why |
|---|---|---|---|---|
| 1 | Syndrome Pattern Library (full: criteria, ids, relationships, references) | **Future** | Knowledge Base | The *full* library is a large asset not needed for v1. But its narrowest core — canonical **pattern definitions only** — is reconsidered in §1a: its interface is Required Architecture in v1, with Optional Content. |
| 2 | Diagnostic Principles (general reasoning) | **Reject** | Prompt / Spec + Runtime Contract | These are *how to reason*, not clinical data. They live in the frozen spec and the Prompt (Step 4), not the Knowledge Base — encoding them as knowledge pushes toward a rule engine. |
| 3 | Supporting Symptom Knowledge (typical manifestations) | **Future** | Knowledge Base (Pattern Library) | Part of pattern definitions; model supplies it for v1. Bundle with the Pattern Library. |
| 4 | Exclusion Knowledge (findings against a syndrome) | **Future** | Knowledge Base (Pattern Library) | The negative half of pattern definitions. Per-patient conflicting evidence is already in the schema (`conflictingEvidence`); curated exclusion *criteria* are Pattern-Library data, later. |
| 5 | Pattern Relationships (syndrome → syndrome) | **Future** | Knowledge Graph | Ontology, not patient output (already rejected from the result). Belongs to a future KG, keyed by canonical id. |
| 6 | Severity Rules | **Reject** | Assessment (data) + Diagnosis reasoning | Reported symptom severity is already Assessment data; interpreting overall severity is model reasoning. A severity *rule base* is rule-engine territory and non-derivable knowledge is absent. |
| 7 | Classical References | **Future** | Knowledge Base / RAG corpus | Explainability nicety; a curated citation corpus is a future RAG asset. Model-generated citations risk fabrication, so not v1. |
| 8 | Evidence References (literature) | **Future** | Knowledge Base / RAG corpus | Same as #7 for modern literature; RAG territory, later. |
| 9 | Formula Mapping (Diagnosis → Formula) | **Reject** | Formula Module | Treatment. Explicitly forbidden for Diagnosis. Belongs to Formula. |
| 10 | Herb Mapping (Diagnosis → Herbs) | **Reject** | Formula / Prescription Module | Treatment. Out of Diagnosis scope. |
| 11 | Western Diagnosis Mapping (TCM ↔ Western) | **Future** | Future multi-domain / mapping component | Cross-paradigm mapping ties to the deferred `type`; belongs to future multi-domain architecture, not v1. |
| 12 | ICD Mapping (billing / coding) | **Reject** | Future billing/coding subsystem | Coding/billing is outside the clinical AI layer entirely; not Diagnosis knowledge. |
| 13 | Pattern Vocabulary (canonical names / ids / i18n) | **Future** | Knowledge Base (Pattern Library) | The identity layer underpinning the deferred `patternId` and localization. Introduce *with* the Pattern Library. |
| 14 | Diagnostic Confidence Guidance | **Reject** | Runtime Contract + Module guards | Confidence is governed by the Confidence Propagation Rule / Clinical Safety Principle — a rule, not knowledge. |
| 15 | Recommended Additional Evidence (what would distinguish hypotheses) | **Future** | Knowledge Base (Pattern Library, differentiation criteria) | Supports reasoning (not treatment) — valid concept. For v1 the model already expresses this per-case via the schema's `uncertaintyNotes`; a curated differentiation set is a future Pattern-Library addition. |

**Net:** no category requires curated *content* for Diagnosis v1; but one
surface — canonical pattern definitions — is **Required Architecture with
Optional Content**: its interface is exposed in v1, its content is optional
(see §1a).

## 1a. Refinement — Canonical Pattern Definitions (definitions only)

On reconsideration, the *narrow* category of **canonical pattern definitions** —
stable clinical definitions of diagnostic patterns (e.g. Qi Deficiency, Blood
Stasis, Yin Deficiency) and nothing else (no relationships, no graph, no ids, no
criteria, no formulas, no herbs, no references) — is distinct from the full
Pattern Library and should be treated differently.

**Verdict: Required Architecture · Optional Knowledge Content.**

Architecture and content are different things, and they get different verdicts:

- **Required Architecture (v1):** Diagnosis permanently exposes the knowledge
  interface `diagnosisPatternDefinitions` from v1. The seam is part of the
  contract, not an optional add-on.
- **Optional Knowledge Content:** the definitions *content* behind that interface
  is optional. When no external definitions are supplied, Diagnosis **gracefully
  falls back** to the model's internal medical knowledge.

This is deliberately stronger than "optional knowledge": the *ability* to consume
external definitions is guaranteed from day one; only the *initial content* is
allowed to be empty (or intentionally small).

Four-condition test, applied to definitions-only:

- **Stable producer** — yes: a small, curated, hand-authored set of canonical
  definitions, maintained deliberately.
- **Stable consumer** — yes: DiagnosisModule, grounding its differentiation in a
  defined, in-scope diagnostic vocabulary.
- **Unique information** — yes: canonical definitions are domain knowledge, absent
  from patient data and from runtime rules.
- **Non-derivable** — yes: they cannot be derived from Assessment/Summary evidence.

All four hold — unlike the *full* library — so this surface qualifies.

**Why this changes the earlier "Future" call.** The initial review folded
definitions into the larger Pattern Library and deferred the whole thing, which
conflated two different things. Definitions-only is small and practical to
externalize now, and the project principle — *medical knowledge should be
externalized whenever practical* — tips a category that passes the test from
"Future" to "adopt." Relying entirely on the LLM's internal, opaque,
version-drifting notion of *which patterns exist and what they mean* is exactly
the embedded medical knowledge that principle asks us to externalize.
Externalizing definitions gives the clinic explicit, auditable control over the
diagnostic vocabulary the AI may use.

**It does not make Diagnosis a rule engine.** Definitions are *reference context*,
not decision rules — they scope and ground the model's reasoning; they do not
dictate deterministic pattern-matching. Diagnosis stays model-reasoned.
Supporting/exclusion *criteria* and relationships remain Future precisely to
avoid rule-engine drift.

## 2. Recommended Diagnosis Knowledge v1

**Required Architecture:** one knowledge interface — `diagnosisPatternDefinitions`
(canonical definitions only; see §1a) — exposed by Diagnosis from v1.
**Optional Knowledge Content:** the definitions behind it may be empty or small.
When supplied they ground the model's differentiation in an explicit, in-scope
vocabulary; when absent, Diagnosis **degrades gracefully** to the model's own
knowledge, so v1 has a working path even before any content exists. Diagnosis v1
depends on nothing more. All other categories remain Future/Reject exactly as
tabled — keeping the surface minimal and Diagnosis a reasoning module, not a rule
engine.

This resolves the specification's open note ("Diagnosis, unlike Summary, is
expected to require knowledge — to be decided here"): Diagnosis **does** take a
knowledge dependency, but the smallest possible one — canonical definitions only.

## 3. Recommended KnowledgeLoader request keys (v1)

**One key: `diagnosisPatternDefinitions`** — canonical pattern definitions only.
The **key (interface) is part of v1 architecture**; the **content it returns is
optional**, with **graceful fallback** to the model's internal knowledge when it
is empty. No other keys.

Introducing this single key now improves long-term architecture rather than being
premature:

- it establishes the correct seam immediately — Diagnosis consumes *external*
  definitions, not opaque model knowledge;
- it is a *single, optional* key with graceful fallback, so v1 works whether or
  not content exists yet;
- it is backward-compatible and content-agnostic — authoring the definitions is a
  separate task (not this step), and the surface can be populated later with no
  further schema/module change.

Premature design would be introducing the *full* library, ids, graph, or criteria
now — which this deliberately does not. (Per scope, the definitions content itself
is **not** created here; this step only fixes the decision to depend on an
optional canonical-definitions surface and to expose one optional loader key.)

## 4. Future extension points (reserved, not implemented)

Logical keys to introduce *only when actually needed*, each independently and
backward-compatibly:

- **`diagnosisPatternLibrary`** — the *fuller* library beyond v1 definitions:
  supporting and exclusion criteria, canonical vocabulary / ids, and
  differentiation criteria (categories 3, 4, 13, 15). It unblocks the deferred
  `patternId` and internationalization. (Canonical **definitions only** are not
  here — they are the v1 surface `diagnosisPatternDefinitions`; see §1a/§3.)
- **`diagnosisReferences`** — classical and modern literature corpus for grounded
  citation (categories 7, 8); a RAG concern.
- **`diagnosisPatternGraph`** — syndrome relationships (category 5); properly a
  Knowledge Graph, keyed by canonical id.

Categories 9, 10 (Formula/Herb mapping), 12 (ICD), and 14 (confidence guidance)
are **not** Diagnosis knowledge at all and should never be added here — they
belong to Formula/Prescription, a billing subsystem, and the Runtime Contract
respectively. Category 11 (Western mapping) belongs to future multi-domain work.

## 5. Final recommendation

- **Implement now (Required Architecture):** the knowledge interface
  `diagnosisPatternDefinitions` (canonical definitions only), consumed with
  graceful fallback. The module + loader **seam** is the commitment here.
- **Optional now (content):** the definitions **content** may be empty or
  intentionally small in v1; author it as a separate task, on its own schedule.
- **Deliberately wait:** the fuller Pattern Library
  (`diagnosisPatternLibrary`) — supporting/exclusion criteria, canonical
  ids/vocabulary (unblocking `patternId`), i18n, and differentiation criteria —
  plus References/RAG and the Pattern Graph.
- **Never here:** Formula/Herb mapping, ICD/billing, and confidence "rules" —
  owned by other components.

**Externalizing medical knowledge is an architectural direction, not a deployment
requirement.** The architecture must *support* external knowledge from v1 — the
interface is guaranteed — even though the initial knowledge collection stays
intentionally small (or empty). Growing the content is an ongoing, incremental
effort that never requires a schema or module change; the seam absorbs it. This
keeps day-one delivery light while ensuring the system is never locked into
relying solely on the model's internal knowledge.

## Architecture principle

Prefer the smallest knowledge surface that fully supports Diagnosis v1; reject
speculative knowledge. Knowledge should exist only when there is a **stable
producer, a stable consumer, unique information, and non-derivable information**.
Exactly one category meets all four for v1 — canonical **pattern definitions**
(§1a); every other category fails at least one condition and stays Future/Reject.

## Scope

Architecture review only. No knowledge files, no code, no framework changes.
