# Treatment Formula Map — Architecture Review

**Treatment Formula Map · Architecture Review.** Status: **PROPOSED — PENDING REVIEW.** A
read-only review of `treatmentFormulaMap` — the **final pending registry interface** and the
architecture's **second relationship layer**, bridging the strategy tier to the execution
tier. It authors no content or mappings, creates no specification/authoring rules/generator/
source/contract/validator/registry change/wiring, and modifies no file. It grounds in live
code and reuses the proven relationship-layer precedent (`patternTreatmentMap`, Docs 51–55)
and the completeness snapshot (Doc 56).

## Grounded State (verified from live code)

- **Registry** — `pending("treatmentFormulaMap")` (line 90); absent → Option B; no
  architecture, content, or implementation exists (Doc 56 confirmed no artifacts).
- **Consumer** — `PrescriptionModule.knowledgeRequest()` includes `treatmentFormulaMap: true`;
  `variables()` reads `knowledgeOrNone(this.knowledge, "treatmentFormulaMap")`; `prescription.md`
  renders `{{treatmentFormulaMap}}`.
- **Intent (template block)** — *"Reference **associations** from a treatment
  principle/family to candidate named formulas. Reference only — **NEVER deterministic rules,
  and NEVER automatic selection.** If the block is empty, rely on clinical reasoning."*
- **Identity roots it will reference** — `formulaDefinitionCatalog` (69 treatment-principle
  identities, LHS) and `formulaCatalog` (135 named-formula identities, RHS); **both wired and
  available**.
- **Relationship precedent** — `patternTreatmentMap` is fully built and wired (Option A;
  dual cross-content); **structurally identical** to this interface.

## 1. Consumer Analysis

The sole consumer is **`PrescriptionModule`**, which uses the map as *optional reference
associations* from a treatment principle/family toward candidate named formulas, to help it
converge on one concrete prescription. The template is explicit that it is **not** a rule
engine and **not** automatic selection. No other module or knowledge interface consumes it;
nothing downstream references the map as data. This mirrors `patternTreatmentMap`'s single
consumer (`FormulaModule`) exactly one tier down.

## 2. Ownership Analysis

| Concern | Owns? | Justification |
|---|---|---|
| **identity** | **No** | Principle identity → `formulaDefinitionCatalog`; formula identity → `formulaCatalog`. The map only references both. |
| **meaning** | **No** | Principle meaning → `formulaDefinitions`; formula meaning → `prescriptionFormulaDefinitions`. |
| **relationships** | **Yes** | Its single responsibility: the *association* between a principle identity and a named-formula identity. |
| **recommendations / best choice** | **No** | The template forbids "automatic selection"; selection is reasoning. |
| **ranking / priority / confidence / weights** | **No** | Reasoning/recommendation, owned by the module at runtime. |
| **rationale** | **No** | Reasoning (`PrescriptionModule`). |
| **treatment selection / formula selection** | **No** | The module decides which formula; the map offers candidates only. |
| **herbs / execution** | **No** | Execution tier (`herbCatalog`, prescription output). |

**Owns exactly one thing:** the principle→formula *relationship* (identity-to-identity
association).

## 3. Dependency Graph Analysis

**Inbound (must exist first):** `formulaDefinitionCatalog` (LHS) and `formulaCatalog` (RHS) —
**both wired**, so the interface is unblocked. **Outbound (who depends on it):**
`PrescriptionModule` (runtime consumer); no knowledge interface depends on the map.

```
formulaDefinitionCatalog        formulaCatalog        (identity roots — reference nothing)
        ↑                              ↑
        └────── treatmentFormulaMap ───┘        (LHS → principle id ; RHS → formula id)
                       ↑
                PrescriptionModule (runtime consumer)
```

- Two outbound reference edges, both to identity roots; **acyclic** (roots reference nothing).
- Adding this interface keeps the whole graph acyclic (Doc 56 §4).
- No runtime coupling — per-identifier resolution; references are content/build-time.

## 4. Relationship Semantics Analysis

An association communicates only *"this treatment principle and this named formula are
related"* — i.e. the formula is a **candidate reference** for the principle. It does **not**
communicate: recommendation, best/preferred formula, ranking, priority, confidence,
certainty, or deterministic/automatic selection. Cardinality is **many-to-many** (one
principle → many candidate formulas; one formula → many principles); cardinality implies no
preference. Absence of an association is not a prohibition (Option B fallback; the module may
still reason clinically). Identical semantics to `patternTreatmentMap`, one tier down.

## 5. Cross-Content Validation Analysis

As a two-sided relationship layer, it requires a **dual** build-time cross-content validator
(the second such validator, mirroring `patternTreatmentMapCrossContent`), enforcing **both**:
- **LHS:** every principle **∈ `formulaDefinitionCatalog`** (orphan principles reported);
- **RHS:** every formula **∈ `formulaCatalog`** (orphan formulas reported).

Build-time, side-effect-free, reports all issues (no fail-fast), reads derived artifacts (not
the runtime bundle). Coverage/parity reporting is informational only (Option B — no coverage
requirement). Structure and duplicate-pair uniqueness remain the **contract's** job, not the
validator's (Doc 55). Both target roots are wired → both checks satisfiable.

## 6. Runtime Impact Analysis

Once wired (a later step), the only observable change: `PrescriptionModule` receives real
`treatmentFormulaMap` associations in its `{{treatmentFormulaMap}}` block instead of
`"(none provided)"`. No module, template, loader, framework, or transport change — served
purely by a registry entry (Registry Evolution Principle), exactly as the prior eight
interfaces were. Wiring this interface completes the **9-interface** knowledge architecture.

## 7. Consistency / Symmetry Analysis

`treatmentFormulaMap` is the structural twin of `patternTreatmentMap`, one tier down:

| Property | `patternTreatmentMap` (built) | `treatmentFormulaMap` (this) |
|---|---|---|
| Shape | pattern id → principle id | principle id → formula id |
| LHS root | `diagnosisPatternCatalog` | `formulaDefinitionCatalog` |
| RHS root | `formulaDefinitionCatalog` | `formulaCatalog` |
| Ownership | relationship-only | relationship-only |
| Cardinality | many-to-many | many-to-many |
| Contract | exact 2 fields + duplicate-pair | same |
| Cross-content | dual | dual |
| Editorial gate | none | none |
| Consumer | `FormulaModule` | `PrescriptionModule` |

It completes the mirrored relationship layer (Doc 56 §5) and preserves full ownership/
dependency symmetry. It also completes the end-to-end reasoning chain:
Diagnosis Pattern → (patternTreatmentMap) → Treatment Principle → (treatmentFormulaMap) →
Named Formula → (execution) → Herbs.

## 8. Risk Analysis

| Risk | Description | Mitigation |
|---|---|---|
| **Metadata / selection drift** | A future field (priority, confidence, ranking, weight, rationale) folded into an entry | Contract exact-two-fields rejection (Option A); metadata attaches beside by reference |
| **Recommendation leakage** | The map becoming "IF principle THEN formula" auto-selection | Reference-only associations (template mandates "NEVER automatic selection"); no ranking/priority |
| **Reasoning contamination** | Encoding which-formula-wins / confidence into the map | Reasoning stays in `PrescriptionModule`; map carries no decision data |
| **Duplication** | Restating principle/formula identity or meaning | Reference both catalogs; never restate; dual cross-content |
| **Identity instability** | Renamed principle/formula orphaning associations | Canonical Naming Stability on both roots; dual cross-content catches orphans |

No speculative concerns; all derive from the existing model and are already handled by the
proven relationship-layer pattern.

## 9. Option A vs Option B Evaluation

- **Option A — simple identity→identity relationship** (principle identity → formula identity):
  references only, no metadata.
- **Option B — relationship entries with metadata** (priority, confidence, ranking, rationale,
  weights, selection metadata).

**Recommendation: Option A.** Grounded in:
- **Ownership model** — relationship maps own only associations; catalogs own identity; the
  map must not own meaning or reasoning.
- **Reasoning ownership** — "which candidate formula to commit to, how strongly, why" is
  `PrescriptionModule`'s runtime judgement; the template explicitly forbids the map performing
  "automatic selection." Option B would move that reasoning into a reference layer.
- **`patternTreatmentMap` precedent** — the twin relationship layer is Option A and works
  cleanly; matching it reuses the parser, contract, and dual-validator shapes verbatim and
  preserves symmetry.
- **Validation ownership (Doc 55)** — Option A fits the frozen split exactly (contract's
  exact-two-fields structurally blocks metadata drift; dual cross-content checks both sides);
  Option B would demand metadata validation that no layer owns and reintroduce an editorial
  concern relationship layers deliberately lack.

Any future metadata attaches **beside** the map by reference, never inside an entry. Option B
is rejected for v1.

## 10. Sufficiency Assessment

**The architecture is sufficiently settled to proceed to the `treatmentFormulaMap`
specification (and, given the precedent, the specification can be brief).** Ownership
(relationship-only, Option A), the dependency model (references two wired identity roots; one-
way; acyclic), the dual cross-content requirement, many-to-many semantics, runtime impact, and
full symmetry with `patternTreatmentMap` are all resolved. Both inbound prerequisites are
wired, and the consumer already requests/renders the interface. No additional *architectural*
decision is required.

Open items (for the specification / authoring rules, not this review): the authored
representation reuses Doc 54's flat-pair shape (`- **<Principle>** — <Formula>`); the derived
record shape is `{ principle, formula }`; coverage policy is informational (Option B). None is
a blocker.

## Recommendation (summary)

**Option A — principle identity → formula identity, relationship-only.** Reuse the
`patternTreatmentMap` lifecycle end-to-end (flat-pair content → shared parser adapter → source
→ exact-shape+duplicate-pair contract → dual cross-content validator → single-entry registry
upgrade). This completes the final interface and the full 9-interface knowledge architecture
with maximal symmetry and minimal new machinery.

## Scope

Read-only architecture review. No specification, authoring rules, content, derivation, source,
contract, validator, registry change, or wiring; no change to any existing file other than the
creation of this document.

STOP. Architecture review complete. No implementation begun. Nothing committed. Awaiting
review.
