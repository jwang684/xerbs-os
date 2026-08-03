# SummaryModule — Clinical Specification

**Status: Approved and frozen (2026-08-03).** This specification is the agreed
clinical contract for SummaryModule. It should not change during implementation;
any change requires explicit clinical/architectural justification.

This document specifies **SummaryModule** as a *clinical capability*. It is
implementation-independent: it describes clinical intent, ownership, and
boundaries — not how the module is built. It conforms to the AI Runtime Contract
(`docs/architecture/10-ai-runtime.md`): sequential evidence flow, one clinical
layer per module, immutable results, and evidence-driven confidence.

---

## 1. Purpose

SummaryModule turns the **complete, organized record** produced by Assessment
into a **concise, prioritized synthesis** of the clinically important findings —
the kind of focused "problem representation" a clinician forms in their head
before reasoning about a case.

Its value is *signal*: Assessment captures everything the patient reported,
faithfully but often verbosely and with duplication; Summary reduces that to what
matters, groups what belongs together, and surfaces what must not be missed — so
the next stage can reason over clean evidence rather than raw volume.

**Summary is not Assessment.** Assessment *organizes raw patient input* into
structured facts and owns completeness and fidelity. Summary does not re-collect
or re-structure raw input; it works from Assessment's output and owns concision
and salience.

**Summary is not Diagnosis.** Diagnosis *interprets* — it names patterns,
differentiates syndromes, and reasons about cause. Summary does none of that. It
re-expresses and prioritizes existing facts without adding any interpretation.

Explicitly, Summary **must not**:

- perform diagnosis or syndrome differentiation;
- interpret findings, or reason about cause or prognosis;
- recommend treatment, herbs, formulas, or a prescription.

Summary is responsible only for **organizing and highlighting clinically
important findings**.

---

## 2. Clinical Layer

```
Patient Input → Assessment → Summary → Diagnosis → Formula → Prescription → Follow-up
```

Summary occupies the **"organize and highlight" layer**, immediately after
Assessment and immediately before Diagnosis.

**Why Summary exists between Assessment and Diagnosis.** Assessment optimizes for
*completeness* — it records every reported symptom, its attributes, relevant
history, red flags, and gaps in the data. That record is comprehensive but noisy:
findings may be duplicated (the same complaint described several ways), scattered
(related findings recorded separately), and undifferentiated in importance.

Diagnosis reasons best over a *clean, prioritized* evidence set. Interpreting a
noisy record risks two failure modes: important evidence is buried and
overlooked, or the reasoning fixates on incidental detail. Summary sits between
the two layers to remove that noise **without interpreting** — de-duplicating,
grouping, and foregrounding the salient evidence, while preserving every fact and
carrying red flags, data gaps, and confidence forward. It reduces cognitive load
for the interpreting layer without making any interpretive decision itself.

---

## 3. Inputs

Per the Evidence Flow Rule, Summary consumes **only structured outputs of earlier
modules** and never re-parses raw inputs that Assessment has already normalized.

**Allowed inputs**

- **AssessmentResult** — the primary and authoritative source. All clinical facts
  Summary works with come from here.
- **AIContext** — read-only, for non-clinical/context metadata only (e.g. which
  encounter is being summarized). It must not be used to re-derive clinical facts.
- **Knowledge** — permitted only if genuinely required to group or normalize
  terminology (e.g. recognizing that two reported terms name the same finding).
  Knowledge may aid organization; it must never be used to interpret.

**Forbidden inputs**

- **Raw clinical inputs already normalized by Assessment** — the questionnaire,
  symptom lists, tongue findings, history, etc. Summary must not re-read or
  re-parse these. Assessment is the single owner of raw clinical input, and the
  single source of truth for the facts derived from it.
- **Any downstream module's output** — DiagnosisResult, FormulaResult,
  PrescriptionResult, Follow-up. Summary must never consume a result produced
  after it in the pipeline.

---

## 4. Outputs

*(Clinical intent only — the concrete output shape is defined in a later step.)*

Summary produces **SummaryResult**: a concise, prioritized synthesis of the
Assessment. Its clinical intent is to make the important evidence immediately
legible to a clinician and to the Diagnosis layer. It should convey:

- a short, plain-language synthesis of the case (a focused recap, not a retelling
  of everything);
- the **highlighted key findings** — the evidence most likely to matter,
  distinguished from incidental detail;
- **grouped/clustered** related findings, so associated evidence reads together
  rather than scattered;
- the **red flags** carried forward from Assessment, kept prominent;
- the **data gaps** carried forward from Assessment (what important information is
  missing);
- the **confidence** carried from Assessment (preserved or lowered — see §9).

SummaryResult contains **no fact that is not already present in AssessmentResult**.
It is a faithful reduction and re-organization, never an expansion.

---

## 5. Responsibilities

Summary **owns**:

- **Organize** the assessed findings into a clean, readable synthesis.
- **Remove redundancy** — collapse duplicate or restated findings into one,
  preserving the patient's meaning.
- **Highlight important evidence** — distinguish salient findings (e.g. dominant
  symptoms, red flags) from incidental ones.
- **Group related findings** — cluster findings that belong together.
- **Preserve clinical meaning** — every retained fact remains faithful to
  Assessment; nothing is distorted while being condensed.
- **Carry forward red flags and data gaps** — never silently drop them.
- **Produce a concise, structured summary** suitable as clean input to Diagnosis.
- **Restate confidence** — preserve it, or lower it with a recorded reason.

---

## 6. Forbidden Responsibilities

Summary must **never**:

- perform **diagnosis**;
- perform **syndrome differentiation**;
- **inflate confidence** (raise confidence without new clinical evidence);
- perform **formula selection**;
- make any **herb recommendation**;
- generate a **prescription**;
- perform **clinical interpretation** (including causation or prognosis);
- give **treatment advice**;
- **add facts** not present in AssessmentResult;
- **re-parse raw inputs** already normalized by Assessment;
- **modify AssessmentResult** or any other module's result.

If a task requires interpretation, it belongs to Diagnosis, not Summary.

---

## 7. Relationship with Assessment

**What Summary inherits.** Summary inherits the entire assessed record: the chief
complaint, the presenting findings and their reported attributes, relevant
history, red flags, data gaps, and the assessed confidence. This is the complete
set of clinical facts Summary is allowed to work with.

**Why Summary never modifies AssessmentResult.** Under the Immutable Result Rule,
a completed module's output is read-only. Assessment is the authoritative,
single-source-of-truth record of the normalized patient input; keeping it
unchanged guarantees:

- **Traceability** — every statement in the Summary can be traced back to an
  unaltered fact in the Assessment.
- **Auditability & reproducibility** — later reviewers (and later modules) can
  compare Summary against the original Assessment to confirm nothing was invented
  or lost.
- **Determinism** — no module rewrites shared state; each appends only to its own
  result.

Summary therefore reads AssessmentResult and writes only SummaryResult.

---

## 8. Relationship with Diagnosis

**What Diagnosis expects from Summary.** Diagnosis expects a **clean, prioritized,
non-redundant evidence set** in which the important findings are already
foregrounded and related findings are already grouped — plus the preserved red
flags, data gaps, and confidence. This lets Diagnosis spend its effort on
*interpretation* rather than on sifting raw volume.

**How Summary prepares evidence for Diagnosis.** Summary presents the facts in a
form optimized for reasoning: duplicates collapsed, related findings clustered,
salient evidence highlighted, gaps and red flags explicit. Crucially, Summary
prepares evidence **neutrally** — it must not pre-empt, bias, or narrow the
differential, because any interpretive framing is Diagnosis's responsibility.

Per the Runtime Contract, Diagnosis consumes **both** AssessmentResult **and**
SummaryResult: the Summary for focus, the Assessment as the full, immutable record
it can fall back to.

---

## 9. Confidence

Summary follows the **Clinical Safety Principle**: clinical confidence is
evidence-driven, not reasoning-driven.

Summary introduces **no new clinical evidence** — it only organizes and
highlights facts that already exist. Therefore:

- Summary **may preserve** the confidence carried from Assessment (the default,
  since no new evidence has entered the pipeline).
- Summary **may lower** confidence — for example if, while organizing, it exposes
  internal inconsistencies or conflicts among the findings, or if the assessed
  data is thin. Any decrease should be accompanied by a recorded reason (e.g.
  conflicting symptoms, incomplete information).
- Summary **must never raise** confidence. Re-expressing or further reasoning
  over the same data is not new evidence and must not increase certainty.

---

## 10. Examples

The following show how Summary makes an Assessment cleaner **without changing
clinical meaning and without interpreting**. (Findings only; no pattern is named,
no cause is inferred, no treatment is implied.)

**Example A — Remove redundancy**

- *Assessment:* separate findings "feeling tired", "low energy in the afternoons",
  and "fatigue" — three restatements of the same complaint.
- *Summary:* a single highlighted finding — "fatigue, worse in the afternoons" —
  noting it was described in several ways. No new fact added; nothing lost.

**Example B — Group related findings**

- *Assessment:* "loose stools", "bloating after meals", and "low appetite"
  recorded as three unconnected items.
- *Summary:* these are grouped together as related digestive findings, so they
  read as a cluster. The grouping is organizational only — it asserts no cause or
  diagnosis.

**Example C — Highlight important evidence**

- *Assessment:* a long list in which "sudden severe chest pain" appears among many
  minor complaints, and is also flagged as a red flag.
- *Summary:* the red flag is surfaced to the top of the synthesis and kept
  prominent, while minor findings are condensed beneath it. Salience changes;
  facts do not.

**Example D — Confidence preserved**

- *Assessment:* confidence is high; the intake is complete and internally
  consistent.
- *Summary:* condenses and groups the findings and **preserves** the high
  confidence — no new evidence was introduced, and none was needed.

**Example E — Confidence lowered (with reason)**

- *Assessment:* reports both "sleeps well, 8 hours" and "wakes several times each
  night" — a conflict recorded faithfully.
- *Summary:* keeps both facts, notes the inconsistency, and **lowers** confidence
  with the recorded reason "conflicting reports about sleep". It does not resolve
  the conflict (resolution would be interpretation).

---

## 11. Acceptance Criteria

SummaryModule is ready to implement, and a produced summary is acceptable, when
all of the following hold:

1. **Input discipline** — it consumes only AssessmentResult (plus read-only
   context, and knowledge only if required); it never reads raw inputs already
   normalized by Assessment, and never consumes any downstream result.
2. **No invented facts** — every statement in the Summary traces back to a fact in
   AssessmentResult; nothing is added.
3. **No lost safety information** — all red flags and data gaps from Assessment
   are carried forward and remain visible.
4. **Genuine reduction** — the Summary is more concise and less redundant than the
   Assessment while preserving clinical meaning; related findings are grouped and
   salient findings highlighted.
5. **No interpretation** — it contains no diagnosis, syndrome differentiation,
   causal/prognostic reasoning, treatment, formula, herb, or prescription content.
6. **Assessment untouched** — AssessmentResult is unchanged; Summary writes only
   its own result.
7. **Confidence integrity** — confidence is preserved or lowered (never raised),
   and any decrease carries a recorded reason, per the Clinical Safety Principle.
8. **Neutral hand-off** — the Summary prepares evidence for Diagnosis without
   biasing or narrowing the differential.
9. **Reviewable** — a clinician reviewing the Summary against the Assessment would
   judge it a faithful, prioritized recap with nothing important dropped or added.

---

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract (execution order,
  Evidence Flow, Clinical Layer, Immutable Result, Confidence Propagation, and the
  Clinical Safety Principle).
