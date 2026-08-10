# Treatment Formula Map — Authoring Rules

**Treatment Formula Map · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight authoring-governance document for
the strategy→execution **relationship** corpus (`treatment-formula-map.md`), the architecture's
final relationship layer. It authors no content, no mappings, and designs no generator, source,
contract, validator, test, registry change, or wiring. It is subordinate to the approved
architecture review (`docs/architecture/57`) and specification (`58`), mirrors the
`patternTreatmentMap` authoring rules (`53`), and honors the frozen ownership model and Option A
decision. Settled decisions (Option A; relationship-only ownership; dependency model;
many-to-many; dual cross-content; registry evolution) are **not** reopened. Examples use
abstract placeholders only.

## 1. Purpose

These rules govern **consistent relationship authoring** — **association authoring only** —
with **ownership-boundary preservation**, so content creation can begin consistently. This
document is **not** a clinical-review process, **not** a treatment-review process, **not** a
formula-selection process, **not** a recommendation process, and **not** a reasoning process.
It exists to keep **relationship ownership separate from reasoning ownership**: the map records
*that* a principle and a formula are related; deciding *which*, *how strongly*, or *why* is
reasoning owned by the runtime module, never by the map.

## 2. Identity Reference Rules

- **Left-hand references** (treatment principle) must resolve to **`formulaDefinitionCatalog`**.
- **Right-hand references** (named formula) must resolve to **`formulaCatalog`**.
- **References only** — the map references identities; it never duplicates, restates, or
  redefines them, and never duplicates their meanings.
- **No invented aliases / alternate spellings / translations** here.
- **Ownership stays with the source catalogs** — `treatmentFormulaMap` references identities but
  never owns them; every referenced identity must resolve to its catalog.

*Abstract form only (not content):* an association links `<Referenced Principle Identity>` to
`<Referenced Formula Identity>`.

## 3. Relationship Authoring Rules

The only relationship that may be authored is: **Treatment Principle Identity ↔ Formula
Identity**. An association communicates **only relatedness**.

Explicitly prohibited in an entry:
- recommendation, ranking, priority,
- confidence, certainty, probability, weighting, scoring,
- rationale, justification,
- preferred / best / strongest formula,
- automatic selection, deterministic routing,
- execution instructions.

**Ownership explanation:** relationship ownership **stops before** reasoning ownership begins.
The map states relatedness; selection, ranking, confidence, and rationale are reasoning that
remains **outside** the map (owned by `PrescriptionModule` at runtime).

## 4. Many-to-Many Rules

- **One treatment principle may reference many formulas.**
- **One formula may be referenced by many treatment principles.**

Many-to-many is **expected**. It does **not** imply strength, priority, or recommendation. The
number of associations a principle or formula has carries no reasoning meaning. **Cardinality is
ownership-neutral.**

## 5. Duplicate Prevention Rules

- **No duplicate pairs** — the same `(principle, formula)` association appears at most once.
- **Scan-before-add** — before adding an association, scan the corpus for the same pair.
- **Correct-not-duplicate** — if an existing association needs adjustment, correct the single
  existing entry rather than adding a second.

**Why:** duplicate pairs fragment relationship ownership and create ambiguity about the
authoritative association. Duplicate prevention concerns the **exact relationship pair**, not
each identity individually — a principle may still validly appear in many distinct pairs
(many-to-many), and a formula likewise.

## 6. Scope Rules

**Belongs in `treatmentFormulaMap`:**
- relationship associations,
- identity references (to the two catalogs),
- relationship ownership.

**Does NOT belong (owned elsewhere):**
- principle identities → `formulaDefinitionCatalog`; formula identities → `formulaCatalog`;
- principle meanings → `formulaDefinitions`; formula meanings → `prescriptionFormulaDefinitions`;
- recommendations, rankings, confidence, rationale → the reasoning layer (`PrescriptionModule`);
- formula selection / execution logic / herb logic → the execution tier
  (`PrescriptionModule` output, `herbCatalog`);
- diagnosis logic → the diagnosis layer;
- workflow logic / reasoning → the runtime modules.

## 7. Source of Truth Rules

- **Authored markdown is authoritative** — the future `treatment-formula-map.md` is the single
  source of truth for the relationships.
- **Generated and runtime artifacts are projections only** — non-authoritative, derived
  deterministically from the markdown.
- **Generated files are never edited directly** — edit the markdown and regenerate.
- **No-drift** — any derived form is verified against the authored markdown; the markdown always
  wins.

## 8. Review Rules

Reviewers verify:
- identity references (both sides resolve to their catalogs),
- association consistency,
- duplicate prevention,
- scope compliance,
- ownership compliance.

Reviewers do **NOT** evaluate: treatment quality, formula quality, recommendation quality,
clinical correctness, reasoning quality, or execution quality — those concerns belong to
separate layers (reasoning/execution/human clinical review), not to relationship authoring.

## 9. Future Compatibility Rules

Preserve relationship ownership, identity ownership, and meaning ownership. Future metadata
(confidence, rationale, ranking, weighting, supporting evidence) may exist **only beside the map
by reference** — in separate interfaces/layers. If ever added, such metadata must **never
migrate ownership into `treatmentFormulaMap`**; the map remains a pure relationship layer.

## 10. Completion Criteria

- **No coverage requirement.**
- **No parity requirement.**
- **No cardinality requirement.**

Authoring is **complete** when all intended associations have been recorded consistently
according to the ownership model and these authoring rules — every reference resolving, no
duplicate pairs, ownership respected, no prohibited content. Option B keeps partial coverage
valid.

## 11. Sufficiency Assessment

**Docs 57 (Architecture Review), 58 (Specification), and 59 (these Authoring Rules) together are
sufficient to begin content authoring.**
- **Ownership sufficiency:** relationship-only ownership and its exclusions are fully specified.
- **Dependency sufficiency:** two wired identity roots; two-sided, acyclic; no runtime coupling.
- **Governance sufficiency:** authoring, identity-reference, many-to-many, duplicate, scope, and
  source-of-truth rules are frozen.
- **Review sufficiency:** reviewer responsibilities and exclusions are defined.

**No governance blockers remain. Content authoring may begin.** (The only open items — authored
representation shape and derived record shape — reuse the `patternTreatmentMap` / Doc 54
precedent and are authoring-time details, not blockers.)

## Closing Note

This document governs **relationship authoring only**. It does not create content, does not
define mappings, does not perform validation, and does not modify runtime behavior.

## Scope

Authoring rules only. No content, mappings, derivation code, generators, sources, contracts,
validators, tests, registry entries, or runtime wiring; no change to any existing file other
than the creation of this document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
