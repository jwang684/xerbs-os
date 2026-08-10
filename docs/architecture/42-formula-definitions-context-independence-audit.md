# Gate 42 — Formula Definitions Context Independence Audit

**Formula Definitions · Content Sprint · Gate 42 (Context Independence Audit).** Status:
**PROPOSED — PENDING REVIEW.** A read-only, **full-corpus** audit performed before Freeze
Review, verifying that every definition in `src/ai/knowledge/content/formula-definitions.md`
stands on its own — describing *what the treatment principle is*, not *when it is used*.
It authors no content, freezes nothing, and changes no code, registry, or corpus. **All 69
definitions are audited; no sampling.**

## 1. Purpose

A `formulaDefinitions` entry must be intelligible in a vacuum — without any patient,
disease, symptom, pattern/syndrome, or prescription context. A definition states the
principle's intrinsic identity (direction, intent, effect); it must never state usage
conditions or imply a mapping. This gate is the context-independence counterpart to the
Definition Neutrality Audit (doc 41).

## 2. Tests Applied (to every entry)

- **CI-1 Context Removal** — with all external context removed, does the sentence still
  hold as a complete statement of what the principle is?
- **CI-2 Why/When Substitution** — can the definition be naturally rewritten as *"This
  principle is used when…"*? If yes → FAIL (it describes a usage condition).
- **CI-3 Scenario Dependency** — does the definition depend on a disease, symptom,
  syndrome, patient state, or clinical scenario to retain meaning?
- **CI-4 Standalone Meaning** — printed in a treatment-principle dictionary containing no
  cases, syndromes, diseases, or formulas, could a reader still understand the principle?
- **CI-5 Mapping Leakage** — does it use implicit-mapping language (*addresses, treats,
  indicated for, appropriate for, used for, chosen when, applied when*)? If yes → FAIL
  (that belongs to the maps / reasoning layer).

## 3. Method

- **Full coverage:** all 69 entries, no sampling.
- **Mechanical scan** of entry lines for CI-2/CI-3/CI-5 language + template conformance,
  followed by **per-entry judgment** against CI-1..CI-5.

## 4. Mechanical Scan Results

| Scan | Target | Result |
|---|---|---|
| CI-5 mapping-leakage verbs (`addresses`, `treats`, `treating`, `indicated`, `appropriate`, `used for`, `used to`, `chosen`, `applied when`, `suitable`, `manages`, …) | 0 matches | **PASS** |
| CI-2 / CI-3 usage/condition markers (`used when`, `when …`, `whenever`, `for patients`, `in cases`, `if the/there`, `presence of`, `due to`, `caused by`, `for the treatment`, …) | 0 matches | **PASS** |
| Template conformance — every entry is `- **<Principle>** — A treatment principle that <intrinsic action>` | 69 / 69 conform | **PASS** |

The uniform template is decisive: "A treatment principle that `<intrinsic action>`"
grammatically states *what the strategy does*, and contains no slot for a usage
condition, patient, or mapping.

## 5. Per-Test Verdicts (whole corpus, 69/69)

- **CI-1 Context Removal — PASS.** Each entry is a self-contained statement of the
  strategy's action (e.g. "disperses wind and cold from the exterior"; "enriches and
  replenishes yin and its fluids"); removing all external context leaves the sentence
  complete.
- **CI-2 Why/When Substitution — PASS.** No entry can be naturally rewritten as "This
  principle is used when…": each asserts an action the principle *performs*, not a
  condition under which it is chosen. (No `when`/`used`/conditional language present.)
- **CI-3 Scenario Dependency — PASS.** No entry depends on a disease, symptom, syndrome,
  patient state, or clinical scenario. Referenced nouns are intrinsic targets (organs,
  vital substances, pathogenic factors), not scenarios.
- **CI-4 Standalone Meaning — PASS.** Every entry reads as a valid dictionary definition
  of the principle itself, requiring no cases, syndromes, diseases, or formulas.
- **CI-5 Mapping Leakage — PASS.** No `addresses/treats/indicated for/appropriate
  for/used for/chosen when/applied when` language; nothing implies pattern→principle or
  principle→formula association (those remain owned by `patternTreatmentMap` /
  `treatmentFormulaMap`).

**Boundary note (in-scope, not a failure):** intrinsic purpose clauses such as
"unblocks the bowels **to** drive out heat" or "lubricates the intestines **to** ease and
restore the passage of stool" describe the action's *intrinsic mechanism/effect*, not a
usage condition; they remain true in a vacuum and pass CI-1/CI-4.

## 6. Gate Verdict

**Gate 42 = PASS.** All 69 definitions are context-independent (CI-1..CI-5).

## 7. Combined Freeze-Review Gate

Per the combined rule, `formula-definitions.md` may enter **Freeze Review** only when both:

- **Definition Neutrality Audit (doc 41) = PASS** ✔, and
- **Context Independence Audit (Gate 42) = PASS** ✔.

Both now pass on the full 69-entry corpus. → `formula-definitions.md` is **clear to enter
Freeze Review.** (The freeze and commit themselves remain your gate; this audit freezes and
commits nothing.)

## Scope

Read-only, full-corpus audit. No content authored or frozen, no code/registry/module/
template change, and no change to any existing file other than the creation of this
document. Nothing committed.

STOP. Context Independence Audit complete (PASS, 69/69). Combined freeze gate satisfied
(Neutrality PASS + Context Independence PASS). Nothing frozen. Nothing committed. Awaiting
review.
