# AI Runtime Contract

This document defines the **runtime contract** between AI modules in the Xerbs OS
AI engine (`src/ai/`). It fixes each module's responsibility, inputs, outputs,
and — most importantly — its **forbidden responsibilities**, so the pipeline can
grow without modules overlapping or duplicating each other's work.

It is a governance document. It does **not** change the framework. Only
`AssessmentModule` is executable today; the rest are contracts to build against.

## How the runtime works (recap)

- The engine runs registered modules **sequentially** over a single, shared
  `AIContext`.
- Each module reads what it needs from the context (raw inputs + earlier
  modules' results) and writes exactly one result to `context.results[<name>]`.
- Every module validates its output against a Zod schema before the result is
  stored; invalid output aborts the run (`ModuleExecutionError`).
- Model, provider, temperature, tokens, and prompt version come from `AIConfig`,
  keyed by module name. No module hardcodes these.

The context inputs are: `patient`, `visit`, `questionnaire`, `history`,
`tongue`, `knowledge`. The result slots are: `assessment`, `summary`,
`diagnosis`, `formula`, `prescription`, `followup`.

## Execution order

```
Patient Input
    ↓
1. Assessment     organizes reported findings
    ↓
2. Summary        condenses the assessment (no new facts)
    ↓
3. Diagnosis      the ONLY interpreter — names patterns/conditions
    ↓
4. Formula        selects the herbal strategy from the diagnosis
    ↓
5. Prescription   turns the formula into a dispensable prescription
```

An optional **FollowUp** step may run last (its result slot exists) but is out of
scope for this contract.

Each step depends only on **earlier** results. A module never reaches "forward"
to a result that has not been produced yet.

## The dividing lines (why order matters)

Three responsibilities are each owned by **exactly one** module. Overlap here is
the primary risk this contract exists to prevent:

| Responsibility | Owned by | Forbidden everywhere else |
|---|---|---|
| Organizing raw patient input into structured fields | **Assessment** | No other module restructures raw input |
| Interpreting findings — naming any condition/pattern/syndrome | **Diagnosis** | Assessment, Summary, Formula, Prescription must never interpret or name a condition |
| Recommending herbs / formulas / treatment | **Formula** (selection) and **Prescription** (dispensing) | Assessment, Summary, Diagnosis must never mention herbs, formulas, dosing, or treatment |

## Module contracts

### 1. AssessmentModule  ·  `results.assessment` — **implemented**

- **Responsibility:** organize the patient's reported information into a clean,
  structured intake. Restate facts faithfully; flag what is missing.
- **Input:** `AIContext` raw inputs (`patient`, `visit`, `questionnaire`,
  `history`, `tongue`). No prior results.
- **Output:** `AssessmentResult` — `chiefComplaint`, `presentingSymptoms[]`
  (name/duration/onset/severity/notes), `symptomSummary`, `relevantHistory[]`,
  `redFlags[]`, `dataGaps[]`, `confidence`.
- **Forbidden:** diagnosing or naming any condition/pattern; interpreting,
  assessing causation or prognosis; recommending herbs, formulas, tests, or
  treatment; inventing facts not reported by the patient.

### 2. SummaryModule  ·  `results.summary` — planned

- **Responsibility:** condense the structured assessment into a concise,
  human-readable narrative for quick clinician (or patient) reading.
- **Input:** `results.assessment` (primary); raw inputs for wording only.
- **Output:** `SummaryResult` — a short narrative synthesis (+ optional key
  points). Contains no new facts beyond the assessment.
- **Forbidden:** introducing any fact or field not already in the assessment;
  producing new structured data (that is Assessment's job); any interpretation,
  diagnosis, or mention of herbs/formulas/treatment.

### 3. DiagnosisModule  ·  `results.diagnosis` — planned

- **Responsibility:** the single interpreting step. Analyze the assessment (and
  summary) and name the clinical pattern(s)/condition(s) with rationale and
  confidence.
- **Input:** `results.assessment`, optionally `results.summary`, and
  `knowledge`.
- **Output:** `DiagnosisResult` — pattern(s)/condition(s), rationale, confidence,
  and required disclaimers.
- **Forbidden:** re-organizing raw input (Assessment) or re-summarizing
  (Summary); recommending or naming herbs, formulas, dosages, or treatment
  (Formula/Prescription); inventing findings not present in the assessment.

### 4. FormulaModule  ·  `results.formula` — planned

- **Responsibility:** select/compose the herbal **strategy** that addresses the
  diagnosis — which formula(s)/herbs and their roles, with rationale.
- **Input:** `results.diagnosis` (required), `results.assessment`, `knowledge`
  (herb/formula data).
- **Output:** `FormulaResult` — chosen formula/herbs and roles, rationale linked
  to the diagnosis.
- **Forbidden:** diagnosing or altering the diagnosis; producing concrete
  dispensing detail — dosages, quantities, administration, duration (that is
  Prescription); recommending anything not justified by the diagnosis.

### 5. PrescriptionModule  ·  `results.prescription` — planned

- **Responsibility:** turn the selected formula into a concrete, dispensable
  prescription — dosages, quantities, administration, duration, and cautions.
- **Input:** `results.formula` (required), `results.diagnosis`, `patient` (for
  patient-specific cautions), `knowledge`.
- **Output:** `PrescriptionResult` — dispensing instructions, duration,
  cautions/contraindications, and required disclaimers.
- **Forbidden:** diagnosing; changing the formula selection or its rationale
  (Formula); re-deriving findings (Assessment). It only operationalizes the
  chosen formula.

## Shared rules

- **One result per module**, written to its own slot; modules never overwrite
  another module's slot.
- **Read-backward only:** a module may read prior results, never a later one.
- **No skipping ownership:** if a module needs interpretation it must depend on
  `Diagnosis`, not interpret itself; if it needs a formula it depends on
  `Formula`, and so on.
- **Validation is mandatory:** every output conforms to that module's schema.
- **Facts are immutable downstream:** later modules build on earlier results but
  never contradict or silently rewrite them.
- **Configuration, not hardcoding:** provider/model/tunables/prompt version come
  from `AIConfig` keyed by module name.

## Global runtime rules

These three rules are binding on every current and future module. They generalize
the per-module contracts above into system-wide guarantees.

### 1. Evidence Flow Rule

The pipeline is strictly sequential, and each module consumes **only the
structured outputs of previous modules** — never raw inputs that an earlier
module has already normalized.

**AssessmentModule is the sole owner of raw clinical input.** Once it has
structured the questionnaire, symptoms, tongue findings, history, etc., no
downstream module may independently re-parse those raw inputs.

```
Patient Input → Assessment → Summary → Diagnosis → Formula → Prescription
```

- **Summary** consumes `AssessmentResult`.
- **Diagnosis** consumes `AssessmentResult` and `SummaryResult`.
- **Formula** consumes `DiagnosisResult`.
- **Prescription** consumes `FormulaResult`.

A downstream module must not re-read `questionnaire`, `tongue`, or other raw
`AIContext` inputs that have already been structured by Assessment. Raw inputs
enter the pipeline exactly once, through Assessment. This guarantees a **single
source of truth** for every fact.

### 2. Clinical Layer Rule

Every module belongs to **exactly one** clinical reasoning layer, and no module
may cross into another:

| Module | Clinical layer |
|---|---|
| Assessment | organizing facts |
| Summary | organizing and highlighting facts |
| Diagnosis | clinical interpretation and syndrome differentiation |
| Formula | treatment decisions and herbal formula selection |
| Prescription | executable prescriptions and patient instructions |

Consequences (non-exhaustive):

- Assessment must never diagnose.
- Summary must never recommend treatment.
- Diagnosis must never recommend dosages.
- Formula must never modify diagnoses.
- Prescription must never reinterpret diagnoses.

This layer separation must remain stable as the system evolves; new modules must
claim a single layer, not straddle two.

### 3. Immutable Result Rule

Once a module completes successfully, **its output is immutable**. Later modules
may only **read** previous results — never modify, overwrite, or reinterpret
them. Each module appends new information **into its own result object only**.

For example, `results.assessment` is immutable after AssessmentModule finishes:
Summary, Diagnosis, Formula, and Prescription may all read it, but none may
change it.

This guarantees **reproducibility, auditability, traceability, and deterministic
execution** across the pipeline.

## Status

| Module | Contract | Executable |
|---|---|---|
| Assessment | defined | ✅ yes |
| Summary | defined | ⬜ planned |
| Diagnosis | defined | ⬜ planned |
| Formula | defined | ⬜ planned |
| Prescription | defined | ⬜ planned |

The next module to build is **Summary**, per the execution order above.
