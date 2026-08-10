# Pattern Treatment Map — Authoring Rules

**Pattern Treatment Map · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight, practical rulebook for authoring
the diagnosis→strategy **relationship** corpus, so content creation can begin consistently.
This is the **first relationship-layer** authoring-rules document. It authors no content, no
mappings, and designs no generator, source, contract, validator, registry change, or wiring.
It is subordinate to the approved architecture review (`docs/architecture/51`) and
specification (`52`), whose decisions (Option A; relationship-only ownership; two-sided
references; many-to-many) are settled and not reopened. It mirrors the established authoring
rules (`31`, `36`, `45`, `48`). Examples use abstract placeholders only.

## 1. Purpose

These rules exist so the relationship corpus is authored with **relationship consistency,
ownership discipline, duplicate prevention, and maintainability**. This document governs
**relationship authoring only**. It is **NOT** a clinical-review process, **NOT** a
recommendation framework, and **NOT** a reasoning framework — clinical accuracy, treatment
choice, and reasoning are owned by other layers, not by relationship authoring.

## 2. Identity Reference Rules

- **Every relationship references two identities:** a `diagnosisPatternCatalog` identity
  (the pattern side) and a `formulaDefinitionCatalog` identity (the treatment-principle
  side).
- **Relationships reference identities only** — never names re-stated, never meaning, never
  attributes.
- **Identity ownership remains with the catalogs;** a relationship never creates, renames,
  or duplicates an identity, and every referenced identity must resolve to its catalog.

*Abstract form only (not content):* an association links `<Referenced Pattern Identity>` to
`<Referenced Treatment-Principle Identity>`.

## 3. Relationship Authoring Rules

A relationship expresses exactly one thing: **"these concepts are associated"** — and
nothing more.

A relationship must **never** communicate:
- recommendation,
- ranking,
- priority,
- confidence,
- probability,
- certainty,
- preferred treatment,
- best treatment,
- deterministic routing.

**Why relationship ownership stops before reasoning ownership begins:** the map records
*that* a pattern and a principle are related; deciding *which* related principle to act on,
*how strongly*, or *why*, is a judgement — reasoning owned by the consuming module at
runtime. Folding any of that into the map would move reasoning/recommendation ownership into
a reference layer, breaking the single-responsibility discipline that keeps every interface
minimal. The map stops at relatedness; reasoning begins in the module.

## 4. Many-to-Many Rules

- **One pattern may reference multiple principles.**
- **One principle may be referenced by multiple patterns.**

**Relationship count is ownership-neutral.** The number of associations a pattern or
principle has does **not** imply importance, ranking, preference, or confidence. More
associations mean only "related to more concepts," never "more important" or "preferred."
Cardinality carries no reasoning meaning.

## 5. Duplicate Prevention

- **No duplicate relationships** — the same pattern↔principle association appears at most
  once.
- **Scan-before-add** — before adding an association, scan the corpus for the same
  pattern↔principle pair.
- **Correct, don't duplicate** — if an existing association needs adjustment, correct the
  single existing entry rather than adding a second.

**Why:** duplicate associations create ambiguity (two records of the same relationship) and
reference fragmentation — they undermine the clean, one-record-per-relationship basis that
downstream reference and integrity checks rely on.

## 6. Scope Rules

**Belongs:**
- pattern ↔ treatment-principle associations.

**Does NOT belong (owned elsewhere):**
- pattern identity → `diagnosisPatternCatalog`; principle identity → `formulaDefinitionCatalog`;
- definitions / meaning → `diagnosisPatternDefinitions` / `formulaDefinitions`;
- recommendations, rankings, confidence scores, probabilities, rationale → the reasoning
  layer / runtime modules;
- treatment guidance, decision procedures, workflow logic → the reasoning / execution layers;
- diagnosis criteria → the reasoning layer (`DiagnosisModule`);
- formulas, herbs → the execution tier (`formulaCatalog` / `prescriptionFormulaDefinitions`
  / `herbCatalog`).

## 7. Source of Truth Rules

- **The future authored markdown source is authoritative** for the relationships.
- **Authoring ownership** — authored and frozen through this content sprint under human
  editorial review.
- **Generated artifacts are projections** — any future derived form is a non-authoritative
  projection of the markdown; **no manual editing of generated outputs** (edit the markdown
  and regenerate). The markdown always wins.

## 8. Review Rules

Lightweight, human review before an association (or batch) is accepted:
- **reference correctness** — both referenced identities resolve to their catalogs;
- **duplicate prevention** — the association is not already present;
- **ownership compliance** — the entry carries only the association, nothing excluded (§6);
- **recommendation-leakage prevention** — no ranking/priority/confidence/preference wording.

Review does **NOT** verify clinical correctness, treatment quality, or reasoning quality —
those are separate concerns, not relationship authoring.

## 9. Future Compatibility

Future interfaces **attach beside the map by reference** — never inside it. Any future
metadata (weights, rationale, confidence, ranking) must live in a separate interface/layer
referencing the association or the identities; **metadata must never migrate into the map**.
Relationship ownership remains stable: the map always owns only associations.

## 10. Completion Criteria

The corpus is "complete enough to begin wiring" when — **independent of any count**:
- **every reference resolves** — both sides resolve to their catalog identities;
- **no duplicate relationships**;
- **ownership respected** — associations only, no excluded content (§6);
- **no recommendation leakage** (§3).

**No required count, no coverage target, no parity requirement.** Partial coverage remains
valid.

## 11. Sufficiency

Docs 52 (Specification) and 53 (these Authoring Rules) together are **sufficient to begin
content authoring**. The remaining decisions are authoring-time concerns, not architectural
blockers.

## Scope

Authoring rules only. No content, mappings, generators, sources, contracts, validators,
registry changes, or wiring; no change to any existing file other than the creation of this
document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
