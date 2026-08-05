# PrescriptionModule — Clinical Specification

**Prescription Sprint · Step 1 (Clinical Specification).** Status: **Approved and
frozen (2026-08-05).** This is the agreed clinical contract for
PrescriptionModule; changes require explicit clinical/architectural justification.

This document specifies **PrescriptionModule** as a *clinical capability*. It is
implementation-independent: it describes clinical intent, ownership, and
boundaries — not how the module is built. It conforms to the AI Runtime Contract
(`docs/architecture/10-ai-runtime.md`): sequential evidence flow, one clinical
layer per module, immutable results, and evidence-driven confidence.

---

## 1. Purpose

PrescriptionModule is the **execution layer**. Where Formula decides the
treatment *strategy*, Prescription turns that strategy into the concrete,
**executable prescription** — the actual thing to be dispensed.

Its value is *execution*: it operationalizes the selected treatment hypothesis
into a named prescription formula (with any modifications), herb composition,
quantities, dosage, administration, and treatment duration — with reasoning tied
to the strategy, an honest confidence, and explicit uncertainty.

**Execution converges.** Prescription produces exactly **one** executable
prescription; it never returns multiple competing prescriptions. Where earlier
layers may hold a differential (Diagnosis) or several treatment hypotheses
(Formula), Prescription is where the pipeline commits to a single course. When it
cannot responsibly converge, it returns an explicit insufficient-evidence outcome
rather than a set of alternatives.

Across the pipeline:

- Assessment answers *"What facts are present?"*
- Summary answers *"What facts are most important?"*
- Diagnosis answers *"What is going on?"*
- Formula answers *"What treatment strategy should be used?"*
- **Prescription answers *"Exactly what should be prescribed?"***

**Clinical principle.** Prescription transforms **treatment hypotheses into an
executable prescription**. It never turns strategy into new strategy, or reasoning
into new reasoning. *Execution never modifies strategy; strategy never modifies
diagnosis; diagnosis never modifies facts.*

---

## 2. Clinical Layer

```
Patient Input → Assessment → Summary → Diagnosis → Formula → Prescription → Follow-up
```

Prescription occupies the **execution** layer, immediately after Formula. It is
the point at which the pipeline commits: everything upstream is reasoning
(organize → highlight → interpret → strategize); Prescription is where a chosen
strategy becomes a concrete prescription. It is the last clinical decision layer
before Follow-up, and it never reaches back to change any upstream reasoning.

---

## 3. Inputs

Per the Evidence Flow Rule, Prescription consumes **only structured outputs of
earlier modules** and never re-parses raw inputs.

**Allowed inputs**

- **FormulaResult** — the primary input. Prescription operationalizes the
  selected treatment strategy (normally the leading treatment hypothesis).
- **DiagnosisResult** — the interpretation the strategy rests on, for context.
- **SummaryResult** — the prioritized evidence, for context and salience.
- **AssessmentResult** — the full, immutable factual record, consulted for
  execution-relevant detail (e.g. reported allergies, current medications,
  cautions).
- **Future prescription knowledge** — canonical formula/herb/dosing knowledge.
  Prescription is expected to rely on external clinical knowledge; its
  architecture is reviewed in Step 3, not decided here.

**Forbidden inputs**

- **Raw patient input** already normalized by Assessment.
- **Any downstream module's output** (Follow-up). Prescription never consumes a
  result produced after it.

---

## 4. Outputs

*(Clinical intent only — no shape is defined here.)*

Prescription produces an **executable prescription**. Its clinical intent is to
convey:

- the **selected prescription** — the named formula (with any modifications), its
  herb composition, quantities, dosage, route/administration, and treatment
  duration — operationalizing the selected treatment hypothesis;
- the **prescription reasoning** — why this prescription realizes the selected
  strategy;
- the **supporting evidence** and, separately, the **conflicting evidence**,
  traceable to the Formula/Diagnosis/Summary/Assessment;
- the **prescription confidence**, with its explanation;
- the **uncertainty** — what is unresolved and what would refine the prescription;
- an explicit **insufficient-evidence outcome** — when the upstream reasoning is
  too uncertain to responsibly commit to an executable prescription, no
  prescription is forced.

The output identifies which treatment hypothesis it operationalizes; it does not
re-rank, remove, or re-plan the strategy.

---

## 5. Responsibilities

Prescription **owns**:

- selecting the **named prescription formula** (from the strategy's formula
  family);
- any **formula modification**;
- **herb composition**;
- **herb quantities**;
- **dosage**;
- **administration** (route/method);
- **treatment duration**;
- **prescription reasoning**;
- **prescription confidence**.

It transforms the selected **treatment hypothesis** into an **executable
prescription**, respecting the upstream reasoning exactly as given.

---

## 6. Forbidden Responsibilities

Prescription must **never**:

- **reinterpret** the Diagnosis;
- **change** the Summary;
- **modify** the Assessment;
- **replace or re-plan** the Formula strategy (including re-ranking or removing
  its treatment hypotheses);
- generate **follow-up**;
- provide **patient education**;
- **schedule visits**;
- generate **billing information**;
- generate **ICD codes**;
- **invent facts** not present upstream.

If a task is about *what happens after* the prescription (education, scheduling,
billing, coding, follow-up), it belongs to other layers — not Prescription.

---

## 7. Relationship with Assessment

Assessment is the authoritative, immutable record of the normalized findings.
Prescription may consult it for execution-relevant detail (e.g. reported
allergies, current medications, cautions) but treats it as **read-only facts** and
never modifies it. Under the Immutable Result Rule this preserves traceability,
auditability, and reproducibility.

---

## 8. Relationship with Summary

Summary determines which evidence is salient and carries forward red flags and
gaps. Prescription **may use** that salience to weight and caution the
prescription, but it **never changes** the Summary. Red flags and gaps are
reflected in its caution and confidence.

---

## 9. Relationship with Diagnosis

Diagnosis owns the clinical interpretation and remains **authoritative**.
Prescription plans on the diagnosis as given: it must **never reinterpret,
replace, or correct** it. The diagnosis defines *what is going on*; Prescription
only executes a treatment for it.

---

## 10. Relationship with Formula

Formula is Prescription's primary input and the owner of treatment **strategy**.
Prescription **accepts the selected Formula treatment hypothesis as
authoritative** and operationalizes it — it selects a named formula from the
indicated **formula family** and turns the treatment principle into a concrete
prescription. It **never substitutes another treatment strategy** for the one
Formula selected.

Prescription MUST NEVER:

- **replace or re-plan** the strategy;
- **re-rank or remove** Formula's treatment hypotheses;
- promote a treatment hypothesis the Formula did not support.

**Formula defines HOW (in principle); Prescription defines exactly WHAT to give.**
Formula names a *family* (e.g. "a Qi-tonifying formula"); Prescription may name the
*specific* formula and its concrete composition. This is the one boundary Formula
was forbidden to cross, and it is exactly what Prescription owns.

---

## 11. Confidence

Prescription follows the **Clinical Safety Principle**: confidence is
evidence-driven, not reasoning-driven.

- Prescription **inherits** the Formula confidence. Prescribing reasoning is **not
  new evidence**, so Prescription confidence must **never exceed** the Formula
  confidence.
- Prescription **may lower** confidence — for example when the strategy was itself
  uncertain, when execution-relevant information is missing, or when red flags or
  reported cautions warrant it. Any decrease should carry a recorded reason.
- Prescription must **never raise** confidence without new clinical evidence
  (which it does not introduce).

---

## 12. Knowledge

Mentioned here only at a high level: Prescription is expected to rely on **external
clinical knowledge** (canonical formulas, herb composition, and dosing references)
more than any earlier module. Its knowledge architecture — what is required, what
is optional, and how it is consumed — is reviewed in **Step 3**, not decided here.

---

## 13. Examples

Illustrative only — showing the *shape* of the Formula → Prescription transition.
They deliberately contain **no executable dosage values and no real prescribing
instructions**; concrete composition, quantities, and schedules are produced at
runtime and are omitted here.

**Example A — Clear strategy → concrete prescription**

- *Formula:* a single high-confidence treatment hypothesis — e.g. a Qi-tonifying
  strategy (principle + formula family).
- *Prescription:* selects a specific named formula from that family and
  operationalizes it (composition, quantities, dosing schedule, duration), with
  confidence no higher than the Formula's. (Values omitted — conceptual only.)

**Example B — Uncertain / differential strategy → cautious prescription**

- *Formula:* a differential of treatment hypotheses at moderate confidence.
- *Prescription:* operationalizes the leading (top-ranked) treatment hypothesis
  conservatively, at confidence at or below the Formula's, noting that the
  prescription may need to change if the strategy is revised. It does not
  re-rank or invent an alternative strategy.

**Example C — Insufficient evidence → no executable prescription**

- *Formula:* an insufficient-evidence outcome (or a very low-confidence strategy).
- *Prescription:* returns an explicit insufficient-evidence outcome — declining to
  force an executable prescription — at low confidence, stating what additional
  information would enable one. No prescription is fabricated.

**Example D — Respecting the boundary**

- *Formula:* a coherent, actionable strategy.
- *Prescription:* produces the executable prescription and stops. It does **not**
  add follow-up, patient education, visit scheduling, billing, or ICD codes; those
  belong to other layers.

---

## 14. Acceptance Criteria

PrescriptionModule is ready to implement, and a produced prescription is
acceptable, when all of the following hold:

1. **Input discipline** — it consumes only FormulaResult (primary),
   DiagnosisResult, SummaryResult, and AssessmentResult (and future prescription
   knowledge); it never reads raw inputs or any downstream result.
2. **Execution only** — it produces an executable prescription (named formula,
   composition, quantities, dosage, administration, duration) that operationalizes
   the selected treatment hypothesis, with reasoning, confidence, and uncertainty.
3. **Strategy integrity** — it does not replace, re-plan, re-rank, or remove
   Formula's treatment hypotheses; it operationalizes the selected one, and the
   prescription is traceable to it.
4. **Upstream integrity** — it does not reinterpret the Diagnosis or modify the
   Summary or Assessment.
5. **Uncertainty respected** — an uncertain or insufficient-evidence strategy
   yields a correspondingly cautious prescription or an explicit
   insufficient-evidence outcome, never a forced prescription.
6. **Boundary respected** — no follow-up, patient education, scheduling, billing,
   or ICD content.
7. **Evidence-grounded** — supporting and conflicting evidence are kept separate
   and trace to Formula/Diagnosis/Summary/Assessment; no facts are invented.
8. **Confidence integrity** — Prescription confidence never exceeds the Formula
   confidence and is never raised without new evidence; any reduction carries a
   recorded reason (Clinical Safety Principle).
9. **Inputs untouched** — Assessment, Summary, Diagnosis, and Formula are
   unchanged; Prescription writes only its own result.
10. **Reviewable** — a clinician comparing the prescription against the Formula
    strategy and the diagnosis would judge it a faithful, safe operationalization
    that invents nothing and honors the stated uncertainty.

---

## Clinical Principle

**Prescription transforms treatment hypotheses into executable prescriptions. It
never transforms executable prescriptions into follow-up plans.**

Prescription is the execution layer and it converges to a single prescription.
What happens *after* the prescription — follow-up, patient education, scheduling —
belongs to later layers, not here.

---

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract (execution order,
  Evidence Flow, Clinical Layer, Immutable Result, Confidence Propagation, and the
  Clinical Safety Principle).
- `docs/clinical/formula-specification.md`, `docs/clinical/diagnosis-specification.md`,
  `docs/clinical/summary-specification.md` — sibling layer specifications whose
  structure this document follows.
