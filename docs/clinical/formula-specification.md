# FormulaModule — Clinical Specification

**Formula Sprint · Step 1 (Clinical Specification).** Status: **Approved and
frozen (2026-08-04).** This is the agreed clinical contract for FormulaModule;
changes require explicit clinical/architectural justification.

This document specifies **FormulaModule** as a *clinical capability*. It is
implementation-independent: it describes clinical intent, ownership, and
boundaries — not how the module is built. It conforms to the AI Runtime Contract
(`docs/architecture/10-ai-runtime.md`): sequential evidence flow, one clinical
layer per module, immutable results, and evidence-driven confidence.

---

## 1. Purpose

FormulaModule is the **first treatment-planning layer**. Where Diagnosis
determines what is most likely happening, Formula determines **how, in principle,
it should be treated**.

Its value is *strategy*: it turns a diagnostic picture into a **treatment
strategy** — the treatment principle(s) to pursue and the candidate formula
family(ies) that embody them — with reasoning tied to the diagnosis, an honest
confidence, and explicit uncertainty.

Across the pipeline:

- Assessment answers *"What information exists?"*
- Summary answers *"What information matters?"*
- Diagnosis answers *"What is most likely happening?"*
- **Formula answers *"Given the diagnosis, what treatment strategy should be
  selected?"***

Formula stops at **strategy**. It does not choose herbs, dosages, or a concrete
prescription, and it does not plan follow-up or patient education — those belong
to later layers.

Formula produces **treatment hypotheses, not treatment decisions.** A treatment
hypothesis is a clinical *proposal*: it remains provisional until a later layer
transforms it into an executable prescription. Formula never makes the final,
executable treatment decision.

**Clinical principle.** *Treatment selection is different from prescription
generation.* Formula transforms **diagnostic hypotheses into treatment
hypotheses**; it never transforms treatment hypotheses into actual prescriptions.
Formula reasons about **strategy, not execution.**

---

## 2. Clinical Layer

```
Patient Input → Assessment → Summary → Diagnosis → Formula → Prescription → Follow-up
```

Formula occupies the **treatment-strategy** layer, immediately after Diagnosis and
immediately before Prescription. It is the first layer that reasons about *action*
rather than *interpretation* — but only at the level of principle and direction.
Diagnosis defines **WHAT** is happening; Formula defines **HOW** to treat it;
Prescription defines **exactly WHAT to give**. Keeping strategy (Formula) separate
from execution (Prescription) keeps treatment decisions independently auditable
and safe.

---

## 3. Inputs

Per the Evidence Flow Rule, Formula consumes **only structured outputs of earlier
modules** and never re-parses raw inputs.

**Allowed inputs**

- **DiagnosisResult** — the primary input. Formula plans against the diagnostic
  hypotheses and their ranking/confidence.
- **SummaryResult** — the prioritized evidence, for context and salience.
- **AssessmentResult** — the full, immutable factual record, consulted for detail
  (e.g. reported constraints or red flags relevant to treatment caution).
- **Future Formula knowledge** — canonical treatment-principle / formula-family
  knowledge. Whether and how this is consumed is defined later in the Knowledge
  step; the specification only records that Formula is expected to draw on it.

**Forbidden inputs**

- **Raw patient input** already normalized by Assessment (questionnaire, tongue,
  pulse, history, etc.).
- **Any downstream module's output** — PrescriptionResult, Follow-up. Formula must
  never consume a result produced after it.

---

## 4. Outputs

*(Clinical intent only — no shape is defined here.)*

Formula produces a **treatment strategy**. Its clinical intent is to convey:

- the **treatment principle(s)** — the method(s) of treatment indicated by the
  diagnosis (e.g. to tonify, to move, to clear, to warm), expressed as principle,
  not as any specific remedy;
- the **candidate formula strategy** — the family/direction of formulas that
  embody those principles. When the diagnosis carries a differential, Formula may
  present **more than one candidate strategy**, aligned to the diagnostic
  hypotheses and their ranking, rather than forcing a single strategy;
- the **treatment reasoning** — why each strategy follows from the diagnosis, tied
  to the diagnostic hypotheses (and, through them, the evidence);
- the **confidence** in the strategy, with its rationale;
- the **uncertainty** — what is unresolved and what would refine the strategy.

The output contains **strategy only**. It carries no specific formula selection,
herbs, dosage, prescription, follow-up, or patient-education content.

---

## 5. Responsibilities

Formula **owns**:

- **Selecting treatment principles** — deriving the method(s) of treatment from
  the diagnosis.
- **Choosing candidate formula families** — the direction(s) of treatment, not a
  concrete formula.
- **Explaining treatment reasoning** — justifying each strategy against the
  diagnostic hypotheses.
- **Respecting diagnostic uncertainty** — when the diagnosis is a differential or
  is low-confidence, planning cautiously (e.g. addressing the leading hypothesis
  while remaining adaptable, or favoring gentler/common-ground strategies)
  instead of committing prematurely.
- **Preserving confidence boundaries** — never presenting more certainty than the
  diagnosis supports.

---

## 6. Forbidden Responsibilities

Formula must **never**:

- prescribe **herbs** or choose specific **medications**;
- determine **dosage**;
- write a **prescription** or select the exact formula;
- plan **follow-up**;
- produce **patient education**;
- **reinterpret** or change the Diagnosis (its hypotheses, ranking, or confidence);
- **modify** the Summary or the Assessment;
- **invent facts** or clinical findings not present upstream;
- **resolve** diagnostic uncertainty that the Diagnosis left open.

If a task requires deciding the exact remedy, dose, or how to dispense it, it
belongs to Prescription — not Formula.

---

## 7. Relationship with Assessment

Assessment is the authoritative, immutable record of the normalized findings.
Formula may consult it for treatment-relevant detail and cautions, but treats it
as **read-only facts** and never modifies it. Under the Immutable Result Rule this
preserves traceability, auditability, and reproducibility.

---

## 8. Relationship with Summary

Summary determines which evidence is salient and carries forward red flags and
gaps. Formula **may use** that salience to weight and caution its strategy, but it
**never changes** the Summary. Where Summary flags gaps or conflicts, Formula
reflects that in its caution and confidence.

---

## 9. Relationship with Diagnosis

Diagnosis is Formula's primary input and the owner of interpretation. Formula
**accepts the Diagnosis as the authoritative clinical interpretation** and plans
treatment **on the diagnosis as given** — it must never reinterpret, replace, or
correct it, even if the diagnosis seems incomplete or uncertain.

Formula MUST NEVER:

- **reinterpret** the diagnosis;
- **remove** hypotheses from the differential;
- **alter** the ranking;
- **increase** diagnostic confidence;
- **resolve** diagnostic uncertainty.

**Diagnosis defines WHAT is happening. Formula defines HOW to treat it.** If the
diagnosis is uncertain, Formula's strategy must remain correspondingly cautious;
it cannot manufacture certainty by choosing a confident treatment.

---

## 10. Relationship with Prescription

Prescription consumes Formula. Prescription chooses the **exact formula, the
herbs, and the dosage** — the execution. Formula provides only the **strategy**
(principles + candidate families) that Prescription acts on.

Formula MUST NEVER perform Prescription's tasks (exact formula, herbs, dosage),
and Prescription must not re-select the treatment strategy or re-plan principles.
This clean seam separates *what to treat and how, in principle* (Formula) from
*exactly what to give* (Prescription).

Concretely, Formula selects a **treatment principle** or a **formula family** —
never a **named prescription formula**. For example, *"Tonify Qi"* (a principle)
or *"a Qi-tonifying formula"* (a family) is Formula's remit; naming a specific
formula such as *"Bu Zhong Yi Qi Tang"* belongs to Prescription.

---

## 11. Confidence

Formula follows the **Clinical Safety Principle**: confidence is evidence-driven,
not reasoning-driven.

- Formula **inherits** the Diagnosis confidence. Treatment reasoning is **not new
  evidence**, so Formula confidence must **never exceed** the Diagnosis confidence.
- Formula **may lower** confidence — for example when the diagnosis is a close
  differential, when treatment-relevant information is missing, or when red flags
  warrant caution. Any decrease should carry a recorded reason.
- Formula must **never raise** confidence without new clinical evidence (which it
  does not introduce).

---

## 12. Examples

Illustrative only — showing the *shape* of the Diagnosis → Formula transition.
They contain **no herbs and no prescriptions**; only principle and strategy.

**Example A — Clear diagnosis → clear treatment principle**

- *Diagnosis:* a single high-confidence pattern.
- *Formula:* a matching treatment principle and a single candidate formula family
  that embodies it, with confidence no higher than the diagnosis. Direction only —
  no specific formula named.

**Example B — Uncertain diagnosis → cautious strategy**

- *Diagnosis:* a two-hypothesis differential at moderate confidence.
- *Formula:* either two candidate strategies aligned to the two hypotheses
  (ranked to match), or a single principle targeting their common ground — with
  confidence at or below the diagnosis and a note that the strategy may need to
  adapt once the differential resolves. The differential is preserved, not
  collapsed.

**Example C — Insufficient evidence → conservative planning**

- *Diagnosis:* an explicit insufficient-evidence outcome.
- *Formula:* a conservative posture — a gentle, low-risk directional principle, or
  an explicit recommendation to withhold a committed strategy pending more
  evidence — at low confidence, stating what additional information would enable a
  firmer strategy. No aggressive treatment direction is proposed.

**Example D — Respecting the boundary**

- *Diagnosis:* a coherent, treatable picture.
- *Formula:* states the treatment principle and candidate family — and stops. It
  does **not** name a specific formula, herbs, or dose; that is Prescription's
  role.

---

## 13. Acceptance Criteria

FormulaModule is ready to implement, and a produced strategy is acceptable, when
all of the following hold:

1. **Input discipline** — it consumes only DiagnosisResult (primary),
   SummaryResult, and AssessmentResult (and future Formula knowledge); it never
   reads raw inputs or any downstream result.
2. **Strategy only** — it produces treatment principle(s) and candidate formula
   family(ies) with reasoning, confidence, and uncertainty, and nothing beyond
   strategy.
3. **No execution content** — no specific formula, herb, dosage, prescription,
   follow-up, or patient-education content.
4. **Diagnosis integrity** — it does not reinterpret the diagnosis, remove or
   reorder hypotheses, raise diagnostic confidence, or resolve diagnostic
   uncertainty; the strategy is traceable to the diagnostic hypotheses.
5. **Uncertainty respected** — an uncertain or insufficient-evidence diagnosis
   yields a correspondingly cautious/conservative strategy, not a confident one.
6. **Inputs untouched** — Assessment, Summary, and Diagnosis are unchanged;
   Formula writes only its own result.
7. **Confidence integrity** — Formula confidence never exceeds the Diagnosis
   confidence and is never raised without new evidence; any reduction carries a
   recorded reason (Clinical Safety Principle).
8. **Clean hand-off to Prescription** — the strategy is sufficient for
   Prescription to act on and does not pre-empt exact-formula/herb/dose decisions.
9. **Reviewable** — a clinician comparing the strategy against the diagnosis would
   judge it a sound, appropriately-hedged treatment direction that invents nothing.

---

## Clinical Principle

**Formula transforms diagnostic hypotheses into treatment hypotheses. It never
transforms treatment hypotheses into prescriptions.**

Treatment selection is *strategy*; prescription generation is *execution*. Formula
reasons about strategy and stops there — the executable prescription is produced,
and owned, downstream.

---

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract (execution order,
  Evidence Flow, Clinical Layer, Immutable Result, Confidence Propagation, and the
  Clinical Safety Principle).
- `docs/clinical/summary-specification.md`, `docs/clinical/diagnosis-specification.md`
  — sibling layer specifications whose structure this document follows.
