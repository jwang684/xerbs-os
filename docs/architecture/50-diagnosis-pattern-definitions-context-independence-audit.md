# Diagnosis Pattern Definitions — Context Independence Audit

**Diagnosis Pattern Definitions · Content Sprint · Context Independence Audit (Gate 50).**
Status: **PROPOSED — PENDING REVIEW.** A read-only, **full-corpus** editorial review gate
performed before freezing `src/ai/knowledge/content/diagnosis-pattern-definitions.md`,
verifying that every entry stands on its own — describing *what the pattern is*, not *when
it should be diagnosed or selected*. It authors no content, freezes nothing, and changes no
code, registry, or corpus. **All 85 definitions are audited; no sampling.**

> **Architectural reminder.** This gate is an **Editorial Review Gate** — it is NOT a
> Knowledge Contract, NOT a Cross-Content Validator, and NOT runtime validation. It is an
> independent review layer, exactly like Docs 41/42 for Formula Definitions. A definition
> may pass structural and cross-content validation yet fail this gate.

## 1. Purpose & Method

A definition must be intelligible in a vacuum — with no patient, case, symptom,
diagnostic-procedure, or treatment context. It states the pattern's intrinsic clinical
identity, not a rule for identifying or selecting it. Method: mechanical scan of entry lines
for scenario/rule/selection language + template conformance, then a per-test review.
Read-only, full coverage (85/85).

## 2. Tests Applied (to every entry)

- **CI-1 Context Removal** — with all external context removed, does the sentence still
  hold as a complete statement of what the pattern is?
- **CI-2 Diagnosis-Rule Substitution** — can the definition be naturally rewritten as
  *"This pattern is diagnosed when …"*? If yes → FAIL (it has drifted into diagnostic-rule
  territory).
- **CI-3 Scenario Dependency** — does it depend on a patient state, symptom set, or clinical
  scenario to retain meaning?
- **CI-4 Standalone Meaning** — printed in a pattern dictionary with no cases, symptoms, or
  treatments, could a reader still understand what the pattern is?
- **CI-5 Hidden Treatment / Selection** — does it imply what to do next, or a
  patient-selection judgement?

## 3. Mechanical Scan Results (entry lines only)

| Scan | Target | Result |
|---|---|---|
| Diagnostic-rule / patient-selection / symptom-checklist markers (`diagnosed when`, `when the patient`, `patients who`, `presents with`, `commonly presents`, `symptoms include`, `signs include`, `if the patient`, `select`, `selection`, `use when`) | 0 matches | **PASS** |
| Hidden treatment / selection language (from Gate 49: `treat`, `requires`, `calls for`, `indicated`, `addressed by`, `should`) | 0 matches | **PASS** |
| Template conformance — every entry is `- **<Pattern>** — A diagnosis pattern …` | 85 / 85 conform | **PASS** |

The uniform template ("A diagnosis pattern characterized by / in which `<intrinsic state>`")
grammatically states *what the pattern is*, with no slot for a diagnostic condition,
patient, symptom list, or treatment.

## 4. Per-Test Verdicts (whole corpus, 85/85)

- **CI-1 Context Removal — PASS.** Each entry is a self-contained statement of the pattern's
  intrinsic pathological nature.
- **CI-2 Diagnosis-Rule Substitution — PASS.** No entry can be naturally rewritten as "This
  pattern is diagnosed when …": each asserts what the pattern *is*, not the conditions under
  which it is identified. (No `when`/`diagnosed`/conditional-selection language present.)
- **CI-3 Scenario Dependency — PASS.** No entry depends on a patient state, symptom set, or
  clinical scenario; referenced nouns are intrinsic (organs, substances, pathogenic factors,
  dynamics).
- **CI-4 Standalone Meaning — PASS.** Every entry reads as a valid dictionary definition of
  the pattern itself.
- **CI-5 Hidden Treatment / Selection — PASS.** No entry implies treatment, next action, or
  patient-selection judgement (cross-checked with Gate 49).

**Boundary note (in-scope):** intrinsic mechanism/consequence clauses such as "insufficient
blood **failing to nourish** the tissues" describe the pattern's intrinsic nature (the
functional deficit the imbalance denotes), not a symptom checklist or selection rule; they
hold in a vacuum and pass CI-1/CI-4.

## 5. Gate Verdict

**Gate 50 = PASS.** All 85 definitions are context-independent (CI-1..CI-5).

## 6. Combined Freeze-Review Gate

Per the combined rule (mirroring Formula Definitions Docs 41/42),
`diagnosis-pattern-definitions.md` may enter **Freeze Review** only when both editorial
gates pass:

- **Definition Neutrality Audit (Doc 49) = PASS** ✔, and
- **Context Independence Audit (Gate 50) = PASS** ✔.

Both now pass on the full 85-entry corpus. → `diagnosis-pattern-definitions.md` is **clear
to enter Freeze Review.** (The freeze and commit themselves remain your gate; this audit
freezes and commits nothing.)

## Scope

Read-only, full-corpus editorial review gate. No content authored or frozen, no
code/registry/module/template change, and no change to any existing file other than the
creation of this document. Nothing committed.

STOP. Context Independence Audit complete (PASS, 85/85). Combined freeze gate satisfied
(Neutrality PASS + Context Independence PASS). Nothing frozen. Nothing committed. Awaiting
review.
