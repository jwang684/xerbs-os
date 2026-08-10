# Diagnosis Pattern Definitions — Definition Neutrality Audit

**Diagnosis Pattern Definitions · Content Sprint · Definition Neutrality Audit (Gate 49).**
Status: **PROPOSED — PENDING REVIEW.** A read-only, **full-corpus** editorial review gate
performed before freezing `src/ai/knowledge/content/diagnosis-pattern-definitions.md`,
verifying that every entry stays within Definition Neutrality (Doc 47 §E). It authors no
content, freezes nothing, and changes no code, registry, or corpus. **All 85 definitions
are audited; no sampling.**

> **Architectural reminder.** This gate is an **Editorial Review Gate** — it is NOT a
> Knowledge Contract, NOT a Cross-Content Validator, and NOT runtime validation. It is an
> independent review layer, exactly like Docs 41/42 for Formula Definitions. A definition
> may pass structural and cross-content validation yet fail this gate.

## 1. Scope & Method

- **Target:** `diagnosis-pattern-definitions.md` — 85 authored two-field entries
  (referenced pattern + objective definition), v1.
- **Method:** (a) a mechanical scan of entry lines for prohibited language, and (b) a
  criteria review against the frozen neutrality boundary. Read-only, full coverage.

## 2. Neutrality Criteria (Doc 47 §E, §B)

A definition must describe **what the pattern is, not what should be done about it**. It
must NOT contain: recommendation language, treatment guidance, treatment principles,
formula references, herb references, ranking/preference language, or pattern→principle /
pattern→formula mappings.

## 3. Mechanical Scan Results (entry lines only)

| Scan | Target | Result |
|---|---|---|
| Treatment / recommendation / ranking language (`treat`, `treatment`, `therapy`, `tonify`, `clear the`, `drain`, `dispel`, `resolve`, `recommend`, `prefer`, `first-line`, `should`, `indicated`, `use/used`, `requires`, `calls for`, `addressed by`, `principle`, `formula`, `herb`, `decoction`) | 0 matches | **PASS** |
| Formula-name markers (Title-Case `… Tang/San/Wan/Dan`, `Decoction`, `Pill`, `Powder`) | 0 matches | **PASS** |
| Template conformance — every entry is `- **<Pattern>** — A diagnosis pattern …` | 85 / 85 conform | **PASS** |

## 4. Criteria-by-Criteria Review (whole corpus, 85/85)

- **No recommendation language — PASS.** No entry advises action, preference, or ranking.
- **No treatment guidance — PASS.** No entry states what to do about the pattern.
- **No treatment principles — PASS.** No principle names appear (principles are the
  strategy tier).
- **No formula references — PASS.** No named formulas or formula families.
- **No herb references — PASS.** No herb names.
- **No ranking / preference — PASS.** No ordering or preference among patterns.
- **No pattern→principle mappings — PASS.** No pattern-to-treatment associations.
- **No pattern→formula mappings — PASS.** No pattern-to-formula associations.

**Permitted intrinsic vocabulary (in-scope, not a failure):** describing the pattern's
intrinsic pathological nature — organ/system relationships, qi/blood dynamics, yin/yang and
fluid states, and pathogenic-factor relationships — is the pattern's meaning, not treatment
or mapping, and is in scope (e.g. "insufficient qi with weakened movement", "cold congeals
the blood").

## 5. Structural Confirmations (from content QA, restated)

- 85 entries; two fields each; no duplicate referenced patterns.
- Bidirectional parity with `diagnosis-pattern-catalog.md` (85 ↔ 85); every referenced
  pattern resolves to a catalog identity; no catalog identity lacks a definition.

## 6. Audit Verdict

**Gate 49 = PASS.** All 85 definitions satisfy Definition Neutrality. No neutrality
violations found by mechanical scan or criteria review. The corpus is **clear on neutrality
grounds** (freeze itself remains a separate gate; this audit freezes and commits nothing).

## Scope

Read-only, full-corpus editorial review gate. No content authored or frozen, no
code/registry/module/template change, and no change to any existing file other than the
creation of this document. Nothing committed.

STOP. Neutrality audit complete (PASS, 85/85). Nothing frozen. Nothing committed. Awaiting
review.
