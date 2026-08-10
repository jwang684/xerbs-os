# Formula Definitions — Definition Neutrality Audit

**Formula Definitions · Content Sprint · Definition Neutrality Audit.** Status:
**PROPOSED — PENDING REVIEW.** A read-only audit performed **before freezing**
`src/ai/knowledge/content/formula-definitions.md`, verifying that every entry stays
within Definition Neutrality and the Intrinsic Therapeutic Identity boundary. It also
**specifies** (does not implement) the future cross-content validation
`formulaDefinitions.principle ∈ formulaDefinitionCatalog`. It authors no content and
changes no code, registry, or corpus.

> Note: no prior "Doc 41" existed in the repository; this document introduces and
> records the audit. The audit criteria are drawn from the already-frozen Specification
> (`docs/architecture/39` §D Definition Boundary, §E Definition Neutrality) and
> Authoring Rules (`docs/architecture/40` §3–§4), not from a new principle.

## 1. Scope & Method

- **Target:** `formula-definitions.md` — 69 authored two-field entries (referenced
  treatment principle + objective explanation), v1 scope (principles only).
- **Method:** (a) a mechanical scan of entry lines for prohibited language, and (b) a
  criteria-by-criteria review against the frozen neutrality boundary. Read-only.

## 2. Neutrality Criteria (from docs 39/40)

An entry must state **only intrinsic therapeutic meaning** — therapeutic direction,
intent, and effect — and must NOT contain: pattern/syndrome names, disease names,
symptom lists, formula names, herb names, recommendations, rankings, preferred use
cases, indications (when/whether/why), diagnostic guidance, treatment decisions,
reasoning chains, dosage, execution, or mappings.

## 3. Mechanical Scan Results

Run against entry lines only:

| Scan | Target | Result |
|---|---|---|
| Recommendation / indication / ranking language (`should`, `recommend`, `prefer`, `first-line`, `indicated`, `used for`, `when to`, `whether to`, `in cases`, `patient`, `choose`, `select`, …) | 0 matches | **PASS** |
| Symptom / disease words (`fever`, `headache`, `insomnia`, `diarrhea`, `constipation`, `nausea`, `edema`, `rash`, `disease`, `syndrome`, `disorder`, `condition`, `symptom`, …) | 0 matches | **PASS** |
| Pattern-name markers (`deficiency pattern`, `pattern of`, `syndrome of`, `stagnation pattern`, …) | 0 matches | **PASS** |
| Formula-name markers (Title-Case `… Tang/San/Wan/Dan`, `Decoction`, `Pill`, `Powder`) | 0 matches | **PASS** |

## 4. Criteria-by-Criteria Review

- **No pattern/syndrome names — PASS.** Definitions reference only intrinsic targets
  (organs, vital substances, pathogenic factors), never a diagnostic pattern/syndrome.
- **No disease names — PASS.** No named diseases appear.
- **No symptom lists — PASS.** No symptom enumerations; borderline principle names
  (e.g. "Stop Cough and Calm Wheezing") were phrased mechanistically ("restores the
  lung's downward-directing function and calms rebellious lung qi") rather than by
  naming symptoms.
- **No formula names — PASS.** No named formulas.
- **No herb names — PASS.** No pinyin herb names; definitions are English intrinsic-action
  statements.
- **No recommendations / rankings / preferred use — PASS.** No when/whether/why, no
  ordering, no preference.
- **No indications / diagnostic guidance / treatment decisions — PASS.** Definitions
  state what a strategy *is/does*, never when to apply it.
- **No reasoning chains — PASS.** Each entry is a single objective statement.
- **No dosage / execution — PASS.** No dosage, composition, administration.
- **No mappings — PASS.** No pattern→principle or principle→formula associations.

**Permitted intrinsic-action vocabulary (consistent with the ratified prescription
definitions, doc 21):** naming pathogenic factors (wind, cold, heat, damp, phlegm,
stasis), vital substances (qi, blood, yin, yang, essence, fluids), and organs/aspects
(liver, spleen, kidney, lung, stomach, intestines, bladder, exterior, interior,
channels) **as the object of a therapeutic action** is intrinsic identity, not an
indication — e.g. "stanches bleeding", "cools the blood", "extinguishes wind". These
appear and are in-scope.

## 5. Structural Confirmations (from Step-1 QA, restated)

- 69 entries; two fields each (referenced principle + objective explanation).
- No duplicate referenced principles.
- Bidirectional parity with `formula-definition-catalog.md` (69 ↔ 69); every referenced
  principle resolves to a catalog identity; no catalog identity lacks a definition.

## 6. Audit Verdict

**PASS — `formula-definitions.md` satisfies Definition Neutrality and the Intrinsic
Therapeutic Identity boundary.** No neutrality violations found by mechanical scan or
criteria review. The corpus is **clear to freeze** from a neutrality standpoint (freeze
itself remains your gate; this audit does not freeze or commit anything).

## 7. Planned Future Cross-Content Validation

**Rule:** `formulaDefinitions.principle ∈ formulaDefinitionCatalog` — every referenced
treatment principle in `formulaDefinitions` must resolve to a canonical identity owned by
`formulaDefinitionCatalog`.

Specification (to implement in the Formula Definitions **wiring** sprint, not now):

- **Layer & ownership** — Validation Layer 3 (cross-content), owning *relationship
  verification* only; distinct from the per-slice structural contract (Layer 2) and from
  meaning/editorial review. Mirrors the existing
  `prescriptionFormulaDefinitions → formulaCatalog` check.
- **Direction** — one-way: `formulaDefinitions` (meaning) → `formulaDefinitionCatalog`
  (identity). The catalog references nothing back; acyclic.
- **Inputs (authoritative corpora, build-time)** — the derived
  `formulaDefinitionsData` principals and the derived `formulaDefinitionCatalogData`
  identities.
- **Checks** — (a) **reference resolution / no orphans:** every
  `formulaDefinitions.principle` exists in `formulaDefinitionCatalog` (report every
  orphan); (b) optionally **coverage/parity:** report catalog identities lacking a
  definition (v1 target is 69↔69 parity, already satisfied); (c) **duplicate protection:**
  no duplicate referenced principles.
- **Properties** — deterministic, side-effect-free, reports all issues (no fail-fast),
  never throws for ordinary validation failures; **build-time only** (reads authored/
  derived corpora, not the runtime bundle), so it is unaffected by whether either slice
  is runtime-wired.
- **Reuse** — parallels the existing cross-content validator
  (`prescriptionFormulaDefinitionsCrossContent.ts`), whose catalog-identity parsing is
  already reused across catalogs; the new check can follow the same shape.
- **Current status (informational):** verified today at 69 ↔ 69 with zero orphans and
  zero missing (Step-1 QA, §5) — so the future check will pass on the current corpora.
  **Not implemented here.**

## Scope

Read-only audit and forward specification. No content authored or frozen, no
cross-content code created, no registry/loader/module/template change, and no change to
any existing file other than the creation of this document. Nothing committed.

STOP. Neutrality audit complete (PASS). Cross-content validation specified for the
wiring sprint. Nothing frozen. Nothing committed. Awaiting review.
