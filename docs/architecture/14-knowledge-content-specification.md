# Knowledge Content Specification

**Knowledge Content Sprint · Step 2 (Content Specification).** Status: **Approved
and frozen (2026-08-06).** This document specifies every Knowledge Content interface —
structure, ownership, validation responsibility, and authoring rules. It does
**not** author knowledge, populate any interface, or define implementation
(no code, no formats). It depends on and changes none of the frozen Runtime,
Knowledge Framework, Production Loader, or the frozen Knowledge Content
Architecture (`docs/architecture/13-knowledge-content.md`).

## 1. Specification philosophy (major decisions)

- **Conceptual only.** Fields are described as *concepts*, not types or formats. A
  later step chooses representation.
- **Three kinds, one shape each.** Every interface is one of three kinds —
  **Vocabulary** (owns names), **Definition** (owns meaning), **Mapping** (owns
  relationships) — and inherits that kind's conceptual shape (§2).
- **Natural identity in v1.** An entry is identified by its canonical name/term.
  Synthetic identifiers, aliases, and translations are deferred (§6).
- **Single-owner fields.** Per the frozen Ownership-Follows-Meaning rule, each
  field has exactly one authoritative owner; other interfaces *reference* it, never
  restate it.
- **Validation is layered by owner** (§5): registry (inventory), contract (single-
  slice structure), cross-content check (referential integrity across slices),
  module (behaviour), Clinical Evaluation (correctness).

## 2. Shared conceptual model by kind

**Vocabulary** (owns names)
- *canonical name* — the one authoritative name of a concept. The interface is a
  set of canonical names.

**Definition** (owns meaning)
- *term* — the concept being defined. Where a Vocabulary interface exists for that
  concept (formulas), the term **references** the canonical name Vocabulary owns;
  where none exists (patterns, principles, families), the term is the definition's
  own authoritative identity.
- *explanation* — the concept's meaning: objective, reusable, implementation-
  independent.

**Mapping** (owns relationships)
- *source* — a reference to a term/name owned by another interface.
- *target* — a reference to a term/name owned by another interface.
- A mapping owns only the *association* (the source–target pair). A source may
  associate with several targets (several pairs). It never carries weights,
  priority, conditions, or rules.

## 3. Interface specifications

### 3.1 diagnosisPatternDefinitions — *Definition* (Diagnosis)
- **Purpose / unique responsibility:** the authoritative *meaning* of diagnostic
  patterns the Diagnosis module may emit. It scopes the diagnostic vocabulary
  without dictating how patterns are matched.
- **Conceptual fields:** *term* (pattern; its own authoritative identity — no
  separate pattern vocabulary exists), *explanation* (pattern meaning).
- **Ownership:** owns both the pattern *term* and its *explanation* — it is the
  sole authority for "which patterns exist and what they mean." No other interface
  may own this; `patternTreatmentMap` only *references* the term and must never
  restate the meaning (Ownership Follows Meaning).
- **Validation:** contract — each entry has a non-empty term and non-empty
  explanation; terms unique within the slice. Clinical Evaluation — is the meaning
  medically accurate?
- **Authoring rules:** objective, reusable, implementation-independent meaning
  only. No criteria, relationships, treatment, formulas, herbs, reasoning, or
  recommendations.
- **v1 scope:** term + explanation. Defer ids, criteria, relationships,
  translations, citations, metadata.

### 3.2 formulaDefinitions — *Definition* (Formula)
- **Purpose:** the authoritative *meaning* of the treatment **principles** and
  **formula families** the Formula module emits (category level only).
- **Conceptual fields:** *term* (a principle or a family; own authoritative
  identity), *explanation* (its meaning), *category* (principle vs family — a
  structural distinction so each grounds the module's `treatmentPrinciple` and
  `formulaFamily` respectively).
- **Ownership:** owns treatment-principle and formula-family terms and meanings.
  `patternTreatmentMap` and `treatmentFormulaMap` reference these terms; they must
  never redefine treatment-family meaning.
- **Validation:** contract — term + explanation present; category present and one
  of the two allowed kinds; terms unique within the slice. Clinical Evaluation —
  accuracy of meaning.
- **Authoring rules:** meaning only; category-level (never a named formula, herb,
  dosage, composition, or association). No reasoning or recommendations.
- **v1 scope:** term + explanation + category. Defer ids, relationships,
  translations, citations, metadata.

### 3.3 prescriptionFormulaDefinitions — *Definition* (Prescription)
- **Purpose:** the authoritative *meaning* of the named formulas the Prescription
  module may select (definition/indication level).
- **Conceptual fields:** *term* (a named formula — **references** the canonical
  name owned by `formulaCatalog`), *explanation* (the formula's meaning /
  indication).
- **Ownership:** owns the *meaning* only. The *name* is owned by `formulaCatalog`;
  this interface references it and must never redefine vocabulary.
- **Validation:** contract — term + explanation present; terms unique within the
  slice. Cross-content check — every term exists in `formulaCatalog`. Clinical
  Evaluation — accuracy of meaning/indication.
- **Authoring rules:** meaning only; never composition, quantities, dosage,
  administration, modifications, safety, or herb lists. No reasoning/recommendation.
- **v1 scope:** term (referencing catalog) + explanation. Defer composition,
  dosage, ids, translations, citations, metadata.

### 3.3a Definition Neutrality Principle

*(Applies to all three Definition interfaces above: `diagnosisPatternDefinitions`,
`formulaDefinitions`, `prescriptionFormulaDefinitions`.)*

**Every Definition is completely context-free.** A definition exists only to
explain **what something is**. It must never explain:

- when it should be used,
- why it should be selected,
- what it is better than,
- what it replaces,
- how it should be executed,
- what should happen next.

Those belong to other layers. The three knowledge kinds have strictly separate
responsibilities, and beyond content two further layers act on that content:

- **Definitions explain meaning.**
- **Mappings describe relationships.**
- **Reasoning selects.**
- **Execution performs.**

A definition must never absorb reasoning or execution.

**Conceptual examples (no medical content).** A Definition may explain what a
formula *is*. It must **never** state things of the form *"usually used for…",
"commonly selected when…", "typically prescribed for…",* or *"preferred over…".*
Likewise: pattern definitions must never contain treatment recommendations;
formula definitions must never contain selection policy; prescription definitions
must never contain prescribing guidance.

**Why.** Contextual language eventually becomes clinical policy. Wording such as
*usually, commonly, often, preferred, recommended, first-line,* or *should* encodes
*when* and *whether* to act — which belongs to **mappings**, **reasoning**, or
**evaluation**, never to a definition. A definition that stays free of such
language remains **reusable**: it holds no matter how associations or clinical
reasoning evolve around it.

**Governing principle.** *Definitions describe, never recommend. Definitions
explain meaning, never clinical context. Context belongs to reasoning, not
definition. A definition remains valid regardless of how clinical reasoning
evolves.*

### 3.4 patternTreatmentMap — *Mapping* (Formula)
- **Purpose:** authoritative *associations* from diagnostic patterns to treatment
  principles/families — reference that informs strategy reasoning.
- **Conceptual fields:** *source* (a pattern — references
  `diagnosisPatternDefinitions`), *target* (a treatment principle/family —
  references `formulaDefinitions`).
- **Ownership:** owns the *association* only. Endpoints' names and meanings are
  owned by the referenced definitions; the mapping never restates them.
- **Validation:** contract — source + target present; well-formed pairs; no
  duplicate identical pairs. Cross-content check — source resolves to a known
  pattern, target to a known principle/family. Clinical Evaluation — is the
  association clinically sound?
- **Authoring rules:** reference only. No weights, priority, conditions, rules,
  reasoning, recommendations, or automatic selection.
- **v1 scope:** source + target. Defer rationale, confidence/weights, conditions,
  citations, metadata.

### 3.5 treatmentFormulaMap — *Mapping* (Prescription)
- **Purpose:** authoritative *associations* from treatment family/strategy to
  candidate named formulas — reference that informs formula selection.
- **Conceptual fields:** *source* (a treatment family — references
  `formulaDefinitions`), *target* (a named formula — references `formulaCatalog`).
- **Ownership:** owns the *association* only; endpoints referenced, never
  redefined. (Highest dispatch temptation — strongest reference-only discipline.)
- **Validation:** contract — source + target present; well-formed pairs; no
  duplicate pairs. Cross-content check — source resolves to a known family, target
  to a catalogued formula. Clinical Evaluation — soundness of the association.
- **Authoring rules:** reference only. No weights, ranking, dispatch, rules, or
  reasoning; a mapping is a candidate shortlist, never an automatic pick.
- **v1 scope:** source + target. Defer rationale, confidence, conditions,
  citations, metadata.

### 3.6 formulaCatalog — *Vocabulary* (Prescription)
- **Purpose:** the authoritative canonical *name-space* of formulas the system may
  reference.
- **Conceptual fields:** *canonical name*.
- **Ownership:** owns formula names. `prescriptionFormulaDefinitions` (meaning) and
  `treatmentFormulaMap` (target) reference these names; no interface may redefine
  them.
- **Validation:** contract — non-empty canonical name; canonical uniqueness within
  the slice. Clinical Evaluation — is the canonical name correct/appropriate?
- **Authoring rules:** canonical names only — one canonical form per formula. No
  meaning, composition, dosage, aliases, or translations.
- **v1 scope:** canonical name. Defer ids, aliases, translations, descriptions,
  metadata.

### 3.7 herbCatalog — *Vocabulary* (Prescription)
- **Purpose:** the authoritative canonical *name-space* of herbs.
- **Conceptual fields:** *canonical name*.
- **Ownership:** owns herb names. Referenced by future composition; no interface
  may redefine them.
- **Validation:** contract — non-empty canonical name; canonical uniqueness within
  the slice. Clinical Evaluation — correctness of the canonical name.
- **Authoring rules:** canonical names only. No properties, composition, dosage,
  contraindications, interactions, aliases, or translations.
- **v1 scope:** canonical name. Defer ids, aliases, translations, properties,
  metadata.

## 4. Cross-interface model

References point from a relationship, to a meaning, to a name — always toward the
owner, never back:

```
Vocabulary (names)        ← Definitions (meaning)        ← Mappings (relationships)
  formulaCatalog          ← prescriptionFormulaDefinitions ← treatmentFormulaMap (target)
  herbCatalog             ← (future composition)
                            diagnosisPatternDefinitions   ← patternTreatmentMap (source)
                            formulaDefinitions            ← patternTreatmentMap (target),
                                                            treatmentFormulaMap (source)
```

- **Reference direction:** Mappings → Definitions → Vocabulary.
- **Ownership direction:** each layer owns only its own kind (names / meaning /
  relationships).
- **Dependency direction:** higher layers depend on lower; nothing depends on a
  Mapping, and Vocabulary depends on nothing.

No interface references a Mapping, no Definition references a Mapping, and no
Vocabulary references anything — so the dependency graph is a **DAG with no
cycles**. (Pattern/principle/family definitions are "root" owners of their own
terms because no Vocabulary interface exists for them; this adds no edge and no
cycle.)

## 5. Validation Contract philosophy

**Every contract validates the STRUCTURE of one slice** and nothing else:
required fields present, correct conceptual shape for its kind, and within-slice
well-formedness (canonical uniqueness for Vocabulary; term uniqueness for
Definitions; non-duplicate well-formed pairs for Mappings).

**Contracts never validate:**
- **cross-slice references** — that a mapping endpoint or a definition's term
  exists in another interface is a **build-time cross-content consistency check**,
  not a single-slice contract (a contract sees one slice in isolation);
- **semantics** — whether a meaning or association is the *right* one;
- **clinical correctness** — medical accuracy (Clinical Evaluation);
- **reasoning** — contracts encode no decision logic;
- **execution** — contracts never touch dosage, administration, or any runtime act.

Distinctions: **Structure → contract. Cross-slice referential integrity →
cross-content check. Semantics & clinical correctness → Clinical Evaluation.
Reasoning & execution → not content at all** (modules/runtime; forbidden in
content).

## 6. Future evolution (deferred fields)

| Field / capability | Verdict | Why deferred |
|---|---|---|
| aliases / synonyms | **Future** | Needs alias→canonical resolution (a vocabulary-identity concern). |
| translations / i18n | **Future** | Localization is an additive dimension; v1 is one canonical language. |
| stable identifiers | **Future** | v1 identity is the canonical name; synthetic ids are the identity layer. |
| citations (classical/modern) | **Future / subsystem** | A reference/RAG corpus, possibly an additive loader retrieval method. |
| metadata (provenance, version, author) | **Future** | Content versioning; not needed for v1 meaning/associations. |
| relationships (pattern↔pattern, formula↔formula) | **Future / subsystem** | Ontology/graph; may need an additive loader query method. |
| weights / confidence on mappings | **Future (guarded)** | Must never become automatic selection — added only as reference, if ever. |
| composition / dosage | **Future** | Structured (and dosage safety-adjacent) content; separate interfaces later. |

Every deferred item is additive — a new field, contract, or interface — and none
requires a framework or loader change.

## 7. Risks

| Risk | Requires |
|---|---|
| semantic drift | **specification** (single-owner fields, §3) + **authoring discipline** + the cross-content check |
| field overlap | **specification** — this document pins each field to one interface |
| validation overlap | **specification** — §5 separates contract / cross-content / evaluation |
| future coupling | already prevented by the frozen architecture (additive) — no action |
| versioning | **authoring discipline** now; metadata deferred (§6) |
| author inconsistency | **authoring discipline** + contract structural checks |

No risk requires an architecture change; all are addressed by specification and/or
authoring discipline.

## 8. Sufficiency review

**The frozen Runtime, Knowledge Framework, Production Loader, and Knowledge Content
Architecture fully support these specifications.** Each interface is a slice of
data behind a registry entry, structurally validated by its contract, transported
opaquely, and consumed with Option B — all frozen. The only element beyond a
single-slice contract is the **build-time cross-content consistency check**, which
lives in the Knowledge Layer/CI and requires no framework or loader change. No
limitation exists; no interface change is required. Not stopping.

## Scope

Content specification only. No medical knowledge authored, no interface populated,
no code, and no change to loader, registry, framework, runtime, prompts, or
schemas.
