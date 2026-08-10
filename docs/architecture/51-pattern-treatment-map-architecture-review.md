# Pattern Treatment Map — Architecture Review

**Pattern Treatment Map · Architecture Review.** Status: **PROPOSED — PENDING REVIEW.** A
read-only review of `patternTreatmentMap` — the architecture's **first relationship
(mapping) layer**, bridging the diagnosis tier to the strategy tier. It authors no content
or mappings, creates no specification/authoring rules/generator/source/contract/validator/
registry change/wiring, and modifies no file. It builds on the completed diagnosis tier
(`docs/architecture/43`–`50`), the strategy tier (`33`–`40`), and the tier-completeness
snapshot's map-direction recommendation.

## 1. Grounded Consumer Analysis (verified from live code)

- **Registry** — `pending("patternTreatmentMap")`; absent → Option B; no architecture,
  content, or implementation exists.
- **Consumer** — `FormulaModule.knowledgeRequest()` returns
  `{ formulaDefinitions: true, patternTreatmentMap: true }`; `variables()` reads
  `knowledgeOrNone(this.knowledge, "patternTreatmentMap")` and renders it into
  `{{patternTreatmentMap}}` (formula.md).
- **Intent (from the template block)** — *"Reference associations from **patterns to
  treatment principles/families**. Reference only — **NEVER deterministic rules.** If the
  block is empty, rely on clinical reasoning."* And formula.md's boundary note:
  *"`patternTreatmentMap` [is] reference [associations], never a rule engine."*
- **Who references its output** — only `FormulaModule` (at runtime, as optional reference
  context). No other module or interface consumes it; nothing downstream references the map
  as data.

**Conclusion:** the sole consumer is `FormulaModule`, which uses the map as *optional
reference associations* to help it reason from a diagnosis pattern toward a treatment
strategy — explicitly not as a deterministic dispatch table.

## 2. Relationship Ownership Analysis

| Concern | Owns? | Justification |
|---|---|---|
| **identity** | **Does Not Own** | Pattern identity is owned by `diagnosisPatternCatalog`; principle identity by `formulaDefinitionCatalog`. The map only *references* both. |
| **meaning** | **Does Not Own** | Pattern meaning is `diagnosisPatternDefinitions`; principle meaning is `formulaDefinitions`. |
| **relationships** | **Owns** | Its single responsibility: the *association* between a pattern identity and a treatment-principle identity. |
| **recommendations** | **Does Not Own** | "Which to choose" is reasoning; the template forbids the map being a rule/selection engine. |
| **reasoning** | **Does Not Own** | Selection logic lives in `FormulaModule` at runtime. |
| **treatment selection** | **Does Not Own** | The module decides; the map only offers candidate associations. |
| **formula selection** | **Does Not Own** | Named-formula selection is the Prescription tier's job, downstream and unrelated. |
| **ranking** | **Does Not Own** | Priority/weighting is reasoning/recommendation, not a reference association. |

**Owns exactly one thing:** the pattern→principle *relationship* (identity-to-identity
association).

## 3. Option A vs Option B Review

- **Option A — pure relationship** (pattern identity → treatment-principle identity):
  an association referencing two identity roots, and nothing else.
- **Option B — relationship entries with metadata ownership** (weights, rationale,
  confidence, conditions, ranking attached to each association).

**Recommendation: Option A.** It is the only choice consistent with the established
ownership model, in which every interface is minimal and single-responsibility (catalogs
own identity only; definitions own meaning only). A relationship layer should own **the
relationship only**. Option B would make the map own reasoning/recommendation metadata
(weights, rationale, ranking) — which the frozen template explicitly forbids ("reference
only, NEVER deterministic rules") and which belongs to the reasoning layer. Any future
metadata attaches *beside* the association by reference (additive), never folded into a v1
map entry — exactly how meaning/aliases/citations were deferred beside the catalogs. (No
structure is designed here.)

## 4. Dependency Graph Analysis

**Inbound (must exist first):** the two identity roots the map references —
`diagnosisPatternCatalog` (LHS) and `formulaDefinitionCatalog` (RHS). Both are **wired and
available today**, so the map is unblocked.

**Outbound (who depends on it):** `FormulaModule` (runtime consumer). No knowledge
interface depends on the map (maps are consumed by modules, not referenced by other
knowledge slices).

```
IDENTITY ROOTS (wired)
  diagnosisPatternCatalog        formulaDefinitionCatalog
        ↑                                ↑
        └────────── patternTreatmentMap ─┘        (LHS → pattern id ; RHS → principle id)
                          ↑
                   FormulaModule (runtime consumer)

(meaning layers sit beside, referenced by their own modules, not by the map:)
  diagnosisPatternDefinitions → diagnosisPatternCatalog
  formulaDefinitions          → formulaDefinitionCatalog
```

**Acyclic:** **Yes.** The map has two outbound reference edges, both terminating at
identity roots that reference nothing; no cycle is possible. Resolution is per-identifier
(no runtime coupling); the references are content/build-time.

## 5. Ownership Boundary Analysis — what MUST remain outside the map

| Item | Proper owner |
|---|---|
| definitions / meaning of patterns | `diagnosisPatternDefinitions` |
| definitions / meaning of principles | `formulaDefinitions` |
| rationale / explanations for an association | reasoning layer (`FormulaModule`) — never stored in the map |
| confidence / weights | reasoning layer (a runtime judgement, not reference data) |
| rankings / priorities | reasoning layer / recommendation (forbidden as "deterministic rules") |
| reasoning chains | `FormulaModule` at runtime |
| formulas (named) / formula selection | `formulaCatalog` / `prescriptionFormulaDefinitions` (execution tier) |
| pattern or principle **identity** (names) | the two catalogs (referenced, never restated) |

## 6. Cross-Content Requirements (architecture only)

A relationship layer bridges two identity roots, so it needs **two** build-time
cross-content checks — **both should be enforced**:
- **LHS:** every association's pattern **∈ `diagnosisPatternCatalog`**;
- **RHS:** every association's principle **∈ `formulaDefinitionCatalog`**.

This is the first *two-sided* cross-content validator (prior validators were one-sided,
meaning → its own catalog). Direction remains one-way (map → identity roots); acyclic.
Both target roots are wired, so both checks are satisfiable. **No implementation here.**

## 7. Relationship Semantics Review

**Many-to-many**, at the architectural level. Reasoning from ownership/structure:
- **One pattern → many principles:** a single diagnostic pattern can legitimately
  associate with more than one treatment principle (the module chooses among them).
- **One principle → many patterns:** a treatment principle can be associated with more than
  one pattern.
Because the map is a *reference association set* (not a deterministic 1:1 dispatch), the
general and correct cardinality is **many-to-many**. Restricting to 1:1 or many-to-1 would
bake a selection decision (which principle "wins") into the map — a reasoning concern the
map must not own. (No mappings authored or enumerated.)

## 8. Consistency Review

| Property | Catalogs / Definitions (built) | `patternTreatmentMap` (proposed) |
|---|---|---|
| **Ownership symmetry** | identity-only / meaning-only (single responsibility) | relationship-only (single responsibility) ✓ |
| **Dependency symmetry** | meaning → identity root (one-way, acyclic) | map → two identity roots (one-way, acyclic) ✓ |
| **Option-B architecture** | minimal entries; neighbours attach by reference | minimal association (Option A); metadata deferred beside, by reference ✓ |

The proposed relationship layer **preserves ownership symmetry, dependency symmetry, and
the minimal-interface (Option-B) discipline** — it extends the pattern by adding a
relationship tier that references identity roots, exactly as meaning layers do (just with
two references instead of one).

## 9. Risks

| Risk | Description | Mitigation |
|---|---|---|
| **Ownership drift** | The map accreting meaning/metadata (weights, rationale) | Option A (relationship-only); minimal entry; metadata attaches beside by reference |
| **Recommendation leakage** | The map becoming a deterministic "IF pattern THEN principle" rule / ranking | Keep it reference associations only (template already mandates "NEVER deterministic rules"); no ranking/priority fields |
| **Reasoning contamination** | Encoding selection logic or confidence into the map | Reasoning stays in `FormulaModule`; the map carries no decision data |
| **Duplication** | Restating pattern/principle identity or meaning | Reference both catalogs; never restate names or meaning; two-sided cross-content check |
| **Identity instability breaking references** | Renamed pattern/principle orphaning associations | Canonical Naming Stability on both catalog roots; build-time cross-content check catches orphans |

No speculative future systems assumed; all risks derive from the existing model.

## 10. Sufficiency

**The architecture is sufficiently settled to begin the Pattern Treatment Map
specification.** Ownership (relationship-only, Option A), the dependency model (references
two wired identity roots; one-way; acyclic), the two-sided cross-content requirement,
many-to-many semantics, and consistency with the established tiers are all resolved. Both
inbound prerequisites (`diagnosisPatternCatalog`, `formulaDefinitionCatalog`) are wired, so
the map is unblocked. No additional *architectural* decision is required.

Open questions (for the **specification**, not this review):
- **Entry model shape** — how one association is represented (e.g. a pattern with its
  associated principle(s)); to be fixed in the spec, staying Option-A minimal.
- **Authored representation** — the two-sided nature means the source markdown is not a
  flat single-name bullet list; the spec must define a representation that still derives
  losslessly and supports the two-sided cross-content check (a genuinely new content shape —
  the first non-single-identity corpus).
- **Cross-content validator shape** — first two-sided validator; to be specified at wiring.
- **Coverage/parity policy** — whether every pattern must have at least one association
  (Option-B partial coverage remains valid); a content-plan decision.

## Deliverable Summary

- **Recommendation:** Option A — pure pattern-identity → principle-identity relationship;
  metadata deferred beside by reference.
- **Ownership matrix:** §2 / §5 (owns relationships only).
- **Dependency graph:** §4 (references two wired identity roots; acyclic).
- **Risks:** §9. **Open questions:** §10. **Sufficiency:** settled; spec may begin.

## Scope

Read-only architecture review. No implementation, content, mappings, specification,
generators, sources, contracts, validators, registry changes, or wiring; no change to any
existing file other than the creation of this document.

STOP. Architecture review complete. No implementation begun. Nothing committed. Awaiting
review.
