# Knowledge Architecture Audit — Formula Knowledge Layer Review

**Knowledge Architecture · Audit.** Status: **PROPOSED — PENDING REVIEW.** A read-only
audit of the seven knowledge interfaces: their actual ownership, dependencies, and
consumers, traced from the live code (not inferred from identifier names). It creates
no content, source, contract, or registry change and modifies nothing.

## 1. Grounded Current State (verified)

**Registry (`productionRegistry.ts`), seven entries — 3 wired, 4 pending:**

| Interface | Registry binding | Runtime |
|---|---|---|
| `prescriptionFormulaDefinitions` | real (source + contract) | present — 135 |
| `formulaCatalog` | real | present — 135 |
| `herbCatalog` | real | present — 288 |
| `formulaDefinitions` | `pending(...)` | absent → Option B |
| `diagnosisPatternDefinitions` | `pending(...)` | absent → Option B |
| `treatmentFormulaMap` | `pending(...)` | absent → Option B |
| `patternTreatmentMap` | `pending(...)` | absent → Option B |

**Runtime consumers (verified via `knowledgeRequest()` + `knowledgeOrNone` + template
slots):**

| Module | Requests | Template slot | Block label (from prompt text) |
|---|---|---|---|
| `DiagnosisModule` | `diagnosisPatternDefinitions` | `{{patternDefinitions}}` (diagnosis.md) | "Canonical pattern definitions … clinical definitions only" |
| `FormulaModule` | `formulaDefinitions`, `patternTreatmentMap` | `{{formulaDefinitions}}`, `{{patternTreatmentMap}}` (formula.md) | "Canonical definitions of **treatment principles and formula families**"; "associations from **patterns → treatment principles/families**" |
| `PrescriptionModule` | `prescriptionFormulaDefinitions`, `treatmentFormulaMap`, `formulaCatalog`, `herbCatalog` | `{{prescriptionFormulaDefinitions}}`, `{{treatmentFormulaMap}}`, `{{formulaCatalog}}`, `{{herbCatalog}}` (prescription.md) | "Canonical definitions of **named formulas**"; "associations from **treatment principle/family → candidate named formulas**"; formula/herb name vocabularies |

All consumption is optional-with-graceful-fallback (Option B via `knowledgeOrNone` →
`"(none provided)"`). The loader/transport/BaseModule are generic and unchanged.

**Key evidence:** the *prompt block descriptions* — not the identifiers — reveal the
true altitude of each interface. `formulaDefinitions` is about **treatment principles
and formula families** (strategy), whereas `prescriptionFormulaDefinitions` is about
**named formulas** (execution). This distinction drives the redundancy analysis (§4).

## 2. Ownership Matrix

| Interface | Owns | Does NOT own |
|---|---|---|
| `formulaCatalog` | canonical **named-formula identities** (vocabulary) | meaning, families, herbs, mappings, reasoning |
| `herbCatalog` | canonical **herb identities** (vocabulary) | herb meaning/properties, composition, mappings, reasoning |
| `prescriptionFormulaDefinitions` | **meaning of a named formula** (what a named formula *is*), referencing `formulaCatalog` identity | identity (names), families, mappings, selection, execution |
| `formulaDefinitions` | **meaning of treatment principles & formula families** (strategy-tier vocabulary + meaning) | named-formula identity/meaning, pattern meaning, mappings, selection |
| `diagnosisPatternDefinitions` | **canonical pattern definitions** (pattern identity + meaning, strategy-upstream) | treatment principles, formulas, mappings, selection |
| `patternTreatmentMap` | **relationship: pattern → treatment principle/family** (associations) | pattern meaning, principle/family meaning, named formulas, deterministic selection |
| `treatmentFormulaMap` | **relationship: treatment principle/family → candidate named formulas** (associations) | principle/family meaning, named-formula identity/meaning, herbs, deterministic selection |

**Tiers that emerge:**
- **Identity roots (vocabulary):** `formulaCatalog`, `herbCatalog`.
- **Meaning layers:** `prescriptionFormulaDefinitions` (named-formula meaning),
  `formulaDefinitions` (principle/family meaning), `diagnosisPatternDefinitions`
  (pattern meaning). The latter two also *carry their own vocabulary* — there is no
  separate "pattern catalog" or "treatment-principle catalog" (see §7).
- **Relationship layers:** `patternTreatmentMap`, `treatmentFormulaMap` — the
  architecture's first mapping interfaces.

## 3. Dependency Graph (actual content-reference direction)

```
IDENTITY ROOTS (reference nothing)
  formulaCatalog ......... named-formula identities
  herbCatalog ............ herb identities
  diagnosisPatternDefinitions ... pattern identity+meaning (root)
  formulaDefinitions ..... principle/family identity+meaning (root)

MEANING LAYER
  prescriptionFormulaDefinitions → formulaCatalog            (names it defines)

RELATIONSHIP LAYERS
  patternTreatmentMap  → diagnosisPatternDefinitions (LHS patterns)
                       → formulaDefinitions          (RHS principles/families)
  treatmentFormulaMap  → formulaDefinitions          (LHS principles/families)
                       → formulaCatalog              (RHS named formulas)
```

- **All edges point toward roots** (meaning → identity; relationship → identity/meaning).
- **Cycles:** none. Roots have no outbound edges; every other edge terminates at a root
  or at a meaning layer that itself only points to a root. The graph is a DAG.
- **Runtime coupling:** none — each interface resolves independently per identifier;
  the dependencies above are *content/build-time* references (e.g. the existing
  `prescriptionFormulaDefinitions → formulaCatalog` cross-content check), not runtime
  load-order requirements.

## 4. Redundancy Analysis — `prescriptionFormulaDefinitions` vs `formulaDefinitions`

**Conclusion: DISTINCT (Case B). Not redundant.**

Justification, grounded in the live prompt text and consumer wiring:

- **Different altitude.**
  - `formulaDefinitions` (formula.md): "Canonical *definitions* of **treatment
    principles and formula families**." It defines the *strategy* vocabulary — e.g. a
    treatment principle and a formula *family* (a class of formulas), **not** any
    specific named formula.
  - `prescriptionFormulaDefinitions` (prescription.md): "Canonical *definitions* of
    **named formulas**." It defines specific *named* formulas — the 135 already
    authored — at the execution tier.
- **Different owner-consumer.** `formulaDefinitions` is requested only by
  `FormulaModule` (which produces treatment principle + formula family — the strategy).
  `prescriptionFormulaDefinitions` is requested only by `PrescriptionModule` (which
  turns a formula *family* into a specific *named formula* — the execution). The
  pipeline itself separates them: Formula owns strategy, Prescription owns execution,
  and the prompts explicitly forbid crossing that boundary.
- **Different identity relationship.** `prescriptionFormulaDefinitions` references
  `formulaCatalog` (named-formula identities). `formulaDefinitions` does **not**
  reference `formulaCatalog` at all — it concerns families/principles, which have no
  entry in `formulaCatalog`.
- **Neither can absorb the other.** Removing `formulaDefinitions` leaves `FormulaModule`
  with no grounding for principles/families; removing `prescriptionFormulaDefinitions`
  leaves `PrescriptionModule` with no grounding for named formulas. Folding named-formula
  meaning into `formulaDefinitions` would violate the strategy/execution boundary and
  the single-responsibility of each meaning layer; folding families into
  `prescriptionFormulaDefinitions` would put strategy vocabulary in an execution-tier
  interface.

The identifier names are misleading (both say "…Definitions"), but the architecture is
**two distinct meaning layers at two pipeline tiers**. `formulaDefinitions` remains
justified.

## 5. Interface Priority Analysis (of the 4 pending)

Grounding: `PrescriptionModule` is already fully grounded (all four of its interfaces
wired). The two modules still running with **no** grounded knowledge are
`DiagnosisModule` (needs `diagnosisPatternDefinitions`) and `FormulaModule` (needs
`formulaDefinitions` + `patternTreatmentMap`).

- **`formulaDefinitions` — highest leverage.** It is an independent root (authorable
  now, no prerequisites) and is a **prerequisite for BOTH mapping layers**
  (`patternTreatmentMap` RHS and `treatmentFormulaMap` LHS both reference the
  principle/family vocabulary it owns) **and** it grounds `FormulaModule`. Unblocks the
  most downstream capability — the keystone.
- **`diagnosisPatternDefinitions` — highest upstream value.** Independent root,
  authorable now; grounds the earliest pipeline module (`DiagnosisModule`), whose
  quality propagates to every downstream tier; and is a prerequisite for
  `patternTreatmentMap`.
- **`patternTreatmentMap` — blocked** until both `diagnosisPatternDefinitions` and
  `formulaDefinitions` exist (it references both).
- **`treatmentFormulaMap` — partially blocked** until `formulaDefinitions` exists
  (its RHS target `formulaCatalog` is already wired).

**Which unlocks the most future capability:** `formulaDefinitions` (prerequisite for
two maps + grounds a module). **Which should be next:** either root is defensible; see
§6 for the recommended order and rationale.

## 6. Recommended Roadmap (remaining four interfaces)

Author the **identity/meaning roots first, mapping layers second** (maps reference the
roots). Roots are mutually independent, so either root order is valid.

1. **`diagnosisPatternDefinitions`** (root) — grounds `DiagnosisModule` (earliest,
   currently ungrounded; diagnosis quality gates the whole pipeline); prerequisite for
   `patternTreatmentMap`.
2. **`formulaDefinitions`** (root, keystone) — grounds `FormulaModule`'s strategy
   vocabulary; prerequisite for **both** mapping layers.
3. **`patternTreatmentMap`** (relationship) — now that both roots exist; completes
   `FormulaModule`'s grounding (pattern → principle/family).
4. **`treatmentFormulaMap`** (relationship) — `formulaDefinitions` (LHS) and
   `formulaCatalog` (RHS) both present; completes `PrescriptionModule`'s mapping
   grounding.

Each interface follows the proven content-then-wiring lifecycle (content sprint →
derivation → source → contract → registry upgrade), reusing existing infrastructure.
Mapping layers additionally need a build-time cross-content check that their referenced
identities resolve into the corresponding root corpora.

*Alternative:* if maximum downstream leverage is preferred over pipeline order, swap
steps 1 and 2 (do `formulaDefinitions` first). Both are correct; the difference is
whether Diagnosis or Formula gets grounded first.

## 7. Open Questions (genuine)

- **Identity/meaning asymmetry.** For named formulas, *identity* (`formulaCatalog`) and
  *meaning* (`prescriptionFormulaDefinitions`) are **separate** interfaces — because the
  identity is shared by two consumers (the meaning layer and `treatmentFormulaMap`'s
  RHS). But for **patterns** and **treatment principles/families**, identity and meaning
  are **combined** into a single "definitions" interface (`diagnosisPatternDefinitions`,
  `formulaDefinitions`) with no separate catalog. Yet the principle/family vocabulary is
  *also* shared across multiple consumers (`FormulaModule`, both maps). **Should
  `formulaDefinitions` (and possibly patterns) be split into a separate identity catalog
  + a meaning layer, to mirror the formula tier and give the maps a stable identity root
  to reference?** This is the central unresolved design question and should be settled in
  the `formulaDefinitions` content review before authoring.
- **Mapping entry shape & neutrality.** The mapping interfaces are the architecture's
  first relationship layers; their entry model (association shape) and the "reference,
  never a deterministic rule" neutrality (already asserted in the prompts) need a content
  spec — no precedent exists yet.
- **Cross-content checks for maps.** Each map references two corpora; the build-time
  referential-integrity checks (map LHS/RHS resolve into their root corpora) are new and
  must be specified when the maps are wired.

Settled (not open): the transport/loader/registry pattern; Option B; the redundancy
question (§4, Distinct); the identity roots `formulaCatalog`/`herbCatalog`.

## 8. Sufficiency Assessment

- **Is the architecture coherent?** **Yes.** Seven interfaces resolve into a clean,
  acyclic three-tier structure — identity roots → meaning layers → relationship layers —
  aligned to the pipeline (Diagnosis → Formula → Prescription). Consumers, ownership, and
  dependency directions are consistent; no cycles; no runtime coupling. The only
  structural wrinkle is the identity/meaning asymmetry (§7), which is a refinement
  question, not an incoherence.
- **Is `formulaDefinitions` still justified?** **Yes** — it is a distinct strategy-tier
  meaning layer (treatment principles + formula families) consumed by `FormulaModule` and
  required by both maps; it is not redundant with `prescriptionFormulaDefinitions`
  (§4). *Caveat:* the open asymmetry question (§7) may reshape it into catalog+meaning,
  but the interface's existence is justified regardless.
- **What should the next sprint be?** A **content sprint for a root interface** —
  recommended **`diagnosisPatternDefinitions`** (upstream-first; grounds the earliest
  ungrounded module; prerequisite for `patternTreatmentMap`), with **`formulaDefinitions`
  immediately after** (keystone for both maps). Resolve the identity/meaning asymmetry
  (§7) as the first decision of whichever root sprint is taken. Mapping layers follow
  once their roots exist.

## Scope

Read-only architecture audit. No content corpora, generators, sources, contracts,
registry changes, module changes, or template changes; no implementation begun; no
change to any existing file other than the creation of this document.
