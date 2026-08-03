# SummaryModule — Knowledge Design

**Summary Sprint · Step 3 (Knowledge).** Status: **Approved and frozen (2026-08-03).**
This is the agreed knowledge architecture for SummaryModule; changes require
explicit clinical/architectural justification.

This document designs the **knowledge architecture** for SummaryModule — *what
kinds of knowledge it may consume*, not *what that knowledge contains*. No
knowledge is populated here, and no code is written.

Every category below must stay inside Summary's single clinical layer —
**Organize + Highlight**. Nothing here may diagnose, interpret, differentiate
syndromes, or recommend herbs/formulas/treatment.

## Sources of truth (where knowledge can come from)

A category can be served by one of four sources — and choosing the *right* source
is the core of this design:

- **Assessment** — facts already structured in `AssessmentResult` (single source
  of truth per the Evidence Flow Rule). Summary never re-derives these.
- **Runtime Contract** — governance rules (e.g. confidence propagation). These are
  rules, not knowledge-base content.
- **Provider model** — the general language capability of the AI provider
  (recognizing synonyms, grouping by surface relatedness, tidying wording).
- **Knowledge Base** — curated, versioned domain data loaded via `KnowledgeLoader`.
  Reserved for when determinism/consistency demands more than the model provides.

## 1. Knowledge Categories

| Knowledge Category | Purpose (Organize + Highlight only) | Required? | Knowledge Source | Future Expansion |
|---|---|---|---|---|
| Symptom grouping | Cluster related reported findings so associated evidence reads together (surface relatedness, **not** mechanism) | Optional — v1: no | Provider model | KB `summaryGrouping` for deterministic, consistent grouping |
| Chief-complaint grouping | Carry/foreground the chief complaint | Not needed | Assessment (`chiefComplaint`) | — |
| Body-system classification | Optional neutral organizational labels for `category` | Optional — v1: no | KB (future) | KB `summaryGrouping` (neutral taxonomy); must stay organizational, never diagnostic framing |
| Timeline normalization | Canonicalize reported duration/onset for consistent ordering | Optional — v1: no | Assessment (raw) + provider model | KB `summaryTimelineNormalization` for deterministic temporal formatting |
| Terminology normalization | Map lay phrasing to standard terms | Optional — v1: no | Provider model | KB `summaryTerminology` (controlled vocabulary) |
| Synonym mapping | Recognize equivalent terms to support de-duplication | Optional — v1: no | Provider model | KB `summaryTerminology` (synonym sets) |
| Duplicate finding detection | Merge restated/duplicate findings (a core Summary responsibility) | Capability required; external knowledge optional | Provider model (+ optional synonyms KB) | Synonym-assisted determinism via `summaryTerminology` |
| Severity ordering | Order/prioritize using reported severity | Data required (present); ordering rule trivial | Assessment (`presentingSymptoms.severity`) | Configurable ordering via `summaryPriorityRules` |
| Clinical priority rules | Non-diagnostic salience heuristics that set finding `priority` | Optional — v1: no | Runtime heuristics | KB `summaryPriorityRules` for auditable, tunable prioritization — must remain salience-only, never clinical-importance judgment |
| Red-flag classification | Decide what *is* a red flag | **Not Summary's job (forbidden)** | Assessment (`redFlags`) — carried forward only | Belongs to Assessment / clinical-safety layer, never Summary |
| Missing-information guidance | Decide what information is missing | Carried forward, not derived | Assessment (`dataGaps`) | A follow-up-oriented gap taxonomy — likely an Assessment/Follow-up concern, not Summary |
| Confidence guidance | How to preserve/lower confidence | Required as a **rule**, not knowledge | Runtime Contract (Confidence Propagation Rule / Clinical Safety Principle) | Governance, not a KB category |

**Notes on the boundary-sensitive rows:**

- **Red-flag classification** and **missing-information** are deliberately *not*
  Summary capabilities. Independently classifying a red flag or inventing a gap
  would mean interpreting and adding facts — both forbidden. Summary carries these
  forward from Assessment unchanged.
- **Priority / grouping / body-system** categories are only admissible while they
  remain *organizational* (salience, topical clustering, neutral labels). The
  moment such rules encode clinical importance or mechanism, they cross into
  Diagnosis and are out of scope.
- **Confidence guidance** is a runtime rule baked into the module/prompt (later
  steps), not something loaded from the Knowledge Base.

## 2. Knowledge Dependencies

SummaryModule depends on, in order of authority:

1. **AssessmentResult (data)** — chief complaint, presenting symptoms (with
   severity/duration/onset), red flags, data gaps, confidence. This supplies
   essentially all the *facts* Summary needs.
2. **Runtime Contract (rules)** — confidence propagation, evidence flow,
   immutability. Governs behavior, not content.
3. **Provider model (capability)** — grouping, synonym/terminology recognition,
   de-duplication, wording — sufficient for v1.
4. **Knowledge Base** — **none required for v1.** Optional future categories only.

Consequence: for v1, Summary needs **no Knowledge Base**. Its "knowledge" is the
upstream `AssessmentResult` plus the model's general capability, disciplined by
the Runtime Contract.

## 3. KnowledgeLoader Contract (logical only)

For v1 the module requests **nothing** from `KnowledgeLoader`.

The following *logical* request keys are defined now so that, if a category is
ever needed, it can be added without redesigning SummaryModule. These are names +
intent only — not implemented, not populated:

| Logical request | Serves categories | v1 |
|---|---|---|
| `summaryTerminology` | terminology normalization, synonym mapping, duplicate detection | not requested |
| `summaryGrouping` | symptom grouping, body-system classification | not requested |
| `summaryPriorityRules` | clinical priority rules, severity ordering | not requested |
| `summaryTimelineNormalization` | timeline normalization | not requested |

Each key is **independent and optional**, so categories can be introduced one at a
time. (Wiring any of these into the framework's `KnowledgeRequest` would itself be
a future, separately justified framework change — the existing request shape has
no Summary-specific fields today. This document defines only the logical contract,
per scope.)

## 4. Future Extension Points

- Introduce any single logical request above **without touching the rest** — the
  categories are decoupled.
- `summaryTerminology` is the most likely first addition (deterministic
  de-duplication/normalization) if evaluation shows model-only grouping is
  inconsistent.
- Body-system labels, if ever added, live under `summaryGrouping` as a neutral
  organizational taxonomy — added as data, not as SummaryModule logic.
- All expansions are **data-only**: the Knowledge Base grows; SummaryModule's
  code should not need to change beyond declaring an additional request.

## 5. Recommendations

1. **v1 requests no knowledge.** SummaryModule declares an empty knowledge request
   and relies on AssessmentResult + provider capability + the Runtime Contract.
2. **Reserve the four logical request keys** above so future growth is additive,
   not a redesign.
3. **Keep every category organizational.** Grouping/priority/normalization must
   never encode diagnosis, mechanism, or clinical-importance judgment.
4. **Never let Summary classify red flags or invent gaps** — always carry those
   forward from Assessment.
5. **Revisit only on evidence.** Add a Knowledge Base category only when
   evaluation demonstrates the model-only approach is insufficient — gated by a
   spec update, consistent with "clinical capability over framework expansion."

## Scope

Design/determination only. No code, no framework changes, no knowledge content.
