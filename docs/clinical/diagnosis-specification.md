# DiagnosisModule — Clinical Specification

**Diagnosis Sprint · Step 1 (Clinical Specification).** Status: **Approved and
frozen (2026-08-04).** This is the agreed clinical contract for DiagnosisModule;
changes require explicit clinical/architectural justification.

This document specifies **DiagnosisModule** as a *clinical capability*. It is
implementation-independent: it describes clinical intent, ownership, and
boundaries — not how the module is built. It conforms to the AI Runtime Contract
(`docs/architecture/10-ai-runtime.md`): sequential evidence flow, one clinical
layer per module, immutable results, and evidence-driven confidence.

---

## 1. Purpose

DiagnosisModule is the **first interpreting module** in the pipeline. Where
Assessment collects and organizes facts and Summary highlights them, Diagnosis
**reasons about what those facts mean**: it interprets the organized evidence and
differentiates the clinical pattern(s) / syndrome(s) that best explain it.

Its value is *interpretation*: turning a clean, prioritized evidence set into a
reasoned clinical picture — one or more candidate patterns, each justified by the
evidence and carrying an explicit likelihood, plus an honest statement of
diagnostic confidence and its limits.

Diagnosis is the single owner of clinical interpretation. No earlier module
interprets (Assessment and Summary only organize/highlight), and no later module
re-interprets — Formula, Prescription, and Follow-up act on Diagnosis's output,
they do not revisit it.

Diagnosis answers **"what is going on?"** It never answers "what should we do
about it?" — that is Formula's and Prescription's domain.

Crucially, Diagnosis produces clinical **hypotheses**, not confirmed facts. Every
diagnosis it produces represents the best-supported interpretation of the
currently available evidence — never a confirmed clinical fact.
**Diagnosis transforms evidence into clinical hypotheses, never hypotheses into
confirmed facts.**

---

## 2. Clinical Layer

```
Patient Input → Assessment → Summary → Diagnosis → Formula → Prescription → Follow-up
```

Diagnosis occupies the **"clinical interpretation / syndrome differentiation"**
layer, immediately after Summary and immediately before Formula. It is the
hinge of the pipeline: everything before it is factual organization; everything
after it is treatment. Diagnosis is where organized evidence becomes clinical
meaning, and it is the *only* place that transition happens.

Because interpretation is inherently uncertain, this layer is also where the
pipeline first reasons under uncertainty — producing a differential rather than a
single forced answer when the evidence supports more than one explanation.

Diagnosis **owns differential reasoning**: it maintains multiple candidate
interpretations whenever appropriate and must not assume that only one diagnosis
exists. The highest-ranked hypothesis is only the *current best interpretation*;
alternative hypotheses remain valid until additional evidence becomes available.

**Clinical principle:** *Diagnosis transforms evidence into hypotheses, never
hypotheses into facts.*

---

## 3. Inputs

Per the Evidence Flow Rule, Diagnosis consumes **only structured outputs of
earlier modules** and never re-parses raw inputs that Assessment already
normalized.

**Allowed inputs**

- **SummaryResult** — the prioritized, de-duplicated evidence set. Diagnosis uses
  it as the focused view of what matters.
- **AssessmentResult** — the full, immutable factual record. Diagnosis may consult
  it as the authoritative source of the complete findings (the Summary is a
  focus, not a replacement).
- **Diagnostic knowledge** — the domain knowledge needed to differentiate
  patterns (differentiation criteria, pattern definitions). Whether and how this
  is consumed is defined later in the Knowledge step; the specification only
  records that Diagnosis, unlike Summary, is expected to require it.

**Forbidden inputs**

- **Raw clinical inputs already normalized by Assessment** — questionnaire,
  tongue, pulse, history, etc. Diagnosis must not re-read or re-derive these.
- **Any downstream module's output** — FormulaResult, PrescriptionResult,
  Follow-up. Diagnosis must never consume a result produced after it.

---

## 4. Outputs

*(Clinical intent only — no shape is defined here.)*

Diagnosis produces a **diagnostic interpretation**: the reasoned clinical picture
derived from the evidence. Its clinical intent is to convey:

- the **differentiated pattern(s) / syndrome(s)** that best explain the findings —
  one when the evidence is clear, or a ranked **differential** when more than one
  explanation is plausible. Diagnosis maintains the full set of plausible
  candidates, not only the top one: the highest-ranked hypothesis is the *current
  best interpretation*, and the alternatives remain open until new evidence
  arrives;
- for each, the **diagnostic reasoning** that justifies it, tied to the specific
  evidence it rests on;
- a **relative likelihood** for each candidate — expressing *comparative support
  among the competing hypotheses*, never objective probability, diagnostic
  certainty, or confirmed truth;
- the **diagnostic confidence** overall, with its rationale;
- explicit **uncertainty / insufficiency** notes — what is unresolved, and what
  evidence would change the picture;
- any **required clinical disclaimers** (the output is informational, not a
  substitute for a clinician's judgment).

The output contains interpretation only. It carries no treatment, formula, herb,
prescription, follow-up, or patient-education content.

---

## 5. Responsibilities

Diagnosis **owns**:

- **Clinical interpretation** — determine what the organized evidence means.
- **Syndrome / pattern differentiation** — identify the candidate pattern(s) that
  explain the findings.
- **Diagnostic reasoning** — justify each candidate against the specific evidence
  it rests on, traceably.
- **Differential reasoning** — maintain multiple candidate interpretations
  whenever appropriate and rank them by relative (comparative) support; never
  assume that only one diagnosis exists.
- **Diagnostic confidence** — state overall certainty and explain it.
- **Uncertainty handling** — surface conflicts, ambiguity, and insufficient
  evidence rather than forcing a false-certain answer; note what would resolve it.
- **Insufficient-evidence outcome** — when the available evidence is inadequate,
  conflicting, or incomplete, return an explicit inability to determine a
  diagnosis rather than forcing one. Uncertainty is an acceptable clinical
  result.

---

## 6. Forbidden Responsibilities

Diagnosis must **never**:

- recommend or select **treatment**, a **formula**, **herbs**, or a
  **prescription**;
- produce **follow-up** plans or **patient education**;
- **collect or re-organize** raw findings (that is Assessment / Summary);
- **modify** AssessmentResult or SummaryResult, or any other result;
- **invent facts** not present in the Assessment/Summary evidence;
- **re-parse raw inputs** already normalized by Assessment;
- **resolve, remove, or ignore missing information** inherited from Summary — only
  new Assessment evidence may reduce that uncertainty;
- **inflate confidence** (raise certainty without new clinical evidence).

If a task requires deciding *what to do*, it belongs to Formula/Prescription, not
Diagnosis.

---

## 7. Relationship with Assessment

**What Diagnosis uses.** Assessment is the authoritative, complete, immutable
record of the normalized findings. Diagnosis treats it as ground truth for the
facts: every interpretation must rest on evidence that exists in the Assessment.

**Why Diagnosis never modifies it.** Under the Immutable Result Rule, Assessment
is read-only. Keeping it unchanged guarantees traceability (each diagnostic claim
can be traced to an unaltered fact), auditability, and reproducibility. Diagnosis
reads Assessment and writes only its own result.

---

## 8. Relationship with Summary

**What Diagnosis uses.** Summary provides the prioritized, de-duplicated,
highlighted evidence set — the focused view that lets Diagnosis reason
efficiently rather than sift raw volume. Summary also carries forward the red
flags, data gaps, and confidence that Diagnosis must take into account.

**Boundaries.** Summary's highlighting *guides attention* but must not *bias the
conclusion*: salience is not diagnosis. Diagnosis forms its own interpretation and
must not treat a Summary highlight as if it were already a diagnostic finding.
Where the Summary notes data gaps or conflicts, Diagnosis must reflect that in its
uncertainty and confidence. Diagnosis never modifies the Summary.

Diagnosis may interpret the existing evidence, but it may **never resolve, remove,
or ignore the missing information** carried forward from Summary. Missing
information stands until **new Assessment evidence** fills it — interpretation
alone can never reduce that uncertainty.

---

## 9. Relationship with Formula

**What Diagnosis provides to Formula.** Diagnosis produces the interpreted
clinical picture — the differentiated pattern(s), their reasoning, likelihood, and
confidence — which is the sole input Formula needs to decide on a herbal strategy.

**The hand-off boundary.** Diagnosis defines **"what is going on"**; Formula
defines **"what to do about it."** Diagnosis must stop at interpretation and must
never pre-empt Formula by naming or implying herbs, formulas, or treatment.
Conversely, Formula must not re-interpret or alter the diagnosis — it acts on the
diagnosis as given. This clean seam keeps interpretation and treatment decisions
independently auditable.

Explicitly (a clarification of existing runtime ownership, not a new runtime
rule):

- Formula **consumes** the diagnosis.
- Formula **never edits** the diagnosis.
- Formula **never removes** hypotheses from the differential.
- Formula **never changes** diagnostic confidence.
- Formula **owns treatment only**.

---

## 10. Confidence

Diagnosis follows the **Clinical Safety Principle**: clinical confidence is
evidence-driven, not reasoning-driven.

- Diagnosis inherits the confidence carried from Summary (and ultimately
  Assessment). Interpretation is **reasoning over existing evidence, not new
  evidence** — so diagnostic confidence must **never exceed** the inherited
  confidence.
- Interpretation typically **adds uncertainty** (organized facts can support more
  than one explanation), so Diagnosis will often **preserve or lower** confidence
  relative to the input. Any decrease should carry a recorded reason (e.g.
  conflicting evidence, insufficient data, several equally plausible patterns).
- Overall diagnostic confidence must **never increase** without new clinical
  evidence entering the pipeline (e.g. tongue/pulse findings, labs, imaging,
  physician review, additional history).
- Within a differential, individual candidates may carry their own **relative
  likelihoods** — comparative support among competing hypotheses, not objective
  probability. This ranking is internal to the differential and does not raise the
  module's overall confidence above the inherited bound.
- When the evidence is inadequate, conflicting, or incomplete, an explicit
  **insufficient-evidence** outcome (no determinable diagnosis) is a valid,
  expected result — always preferable to a forced, falsely-confident answer.

---

## 11. Examples

The following illustrate the *shape* of the Assessment/Summary → Diagnosis
transition. They are illustrative only — not authoritative clinical content — and
show interpretation without any treatment.

**Example A — Single clear interpretation**

- *Summary (evidence):* fatigue worse in the afternoon, poor appetite, loose
  stools, all reported consistently.
- *Diagnosis:* differentiates a single best-fit pattern, with reasoning that ties
  each supporting finding to the interpretation, and states confidence consistent
  with the (clear, consistent) evidence. No treatment is named.

**Example B — Differential under ambiguity**

- *Summary (evidence):* poor sleep and irritability, but with conflicting reports
  about energy levels.
- *Diagnosis:* presents a **ranked differential** of two plausible patterns, each
  with its rationale and relative likelihood, and **lowers** overall confidence
  with the reason "conflicting reports about energy." It resolves nothing it
  cannot justify.

**Example C — Insufficient evidence**

- *Summary (evidence):* a chief complaint with several data gaps flagged and few
  corroborating findings.
- *Diagnosis:* states that the evidence is insufficient for a confident
  interpretation, lists what is missing, offers only tentative candidate(s) at low
  confidence, and does not force a conclusion.

**Example D — Respecting the boundary**

- *Summary (evidence):* a coherent set of findings pointing to one pattern.
- *Diagnosis:* names and justifies the pattern and its confidence — and stops.
  It does **not** suggest herbs, a formula, or any next step; that is Formula's
  job.

---

## 12. Acceptance Criteria

DiagnosisModule is ready to implement, and a produced diagnosis is acceptable,
when all of the following hold:

1. **Input discipline** — it consumes only SummaryResult and AssessmentResult
   (and diagnostic knowledge, once defined); it never reads raw inputs already
   normalized by Assessment, and never consumes any downstream result.
2. **Interpretation only** — it produces differentiated pattern(s)/syndrome(s)
   with reasoning, likelihood, and confidence, and nothing outside interpretation.
3. **Evidence-grounded** — every diagnostic claim is justified by evidence present
   in the Assessment/Summary; no facts are invented.
4. **Honest uncertainty** — it maintains a differential when the evidence is
   ambiguous, and it may return an explicit **insufficient-evidence** result (no
   determinable diagnosis) rather than forcing a false-certain answer; uncertainty
   is an acceptable outcome.
5. **No treatment leakage** — it contains no herb, formula, prescription,
   follow-up, or patient-education content.
6. **Inputs untouched** — AssessmentResult and SummaryResult are unchanged;
   Diagnosis writes only its own result.
7. **Confidence integrity** — overall diagnostic confidence never exceeds the
   inherited confidence and is never raised without new evidence; any reduction
   carries a recorded reason (Clinical Safety Principle).
8. **Clean hand-off to Formula** — the output is sufficient for Formula to act on
   and does not pre-empt treatment decisions.
9. **Reviewable** — a clinician comparing the diagnosis against the Summary and
   Assessment would judge it a faithful, well-reasoned interpretation with its
   uncertainty honestly represented.

---

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract (execution order,
  Evidence Flow, Clinical Layer, Immutable Result, Confidence Propagation, and the
  Clinical Safety Principle).
