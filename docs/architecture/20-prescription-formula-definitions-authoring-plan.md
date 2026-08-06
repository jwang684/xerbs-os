# Prescription Formula Definitions Authoring Plan

**Knowledge Content Sprint · Prescription Formula Definitions · Step 3 (Authoring
Plan).** Status: **Approved and frozen (2026-08-06).** This document defines *how*
Prescription Formula Definitions will be authored — editorial workflow, review
process, standards, consistency checks, batch workflow, and growth philosophy. It
authors no definitions, contains no medical content, and implements nothing. It
conforms to the approved Architecture Review and Specification
(`docs/architecture/18`, `19`) and changes none of the frozen Runtime, Knowledge
Transport, Production Loader, Registry, Knowledge Content Architecture, or Formula
Catalog artifacts.

## 1. Authoring Objectives

The objective is to build **stable, reusable, objective, context-free** formula
definitions — a meaning layer, keyed to canonical names owned by `formulaCatalog`.

Success is measured by **semantic quality, consistency, and long-term stability**,
not by quantity. A small collection of clean, stable, internally-consistent
definitions is preferred to a large one with drift, overlap, or embedded context.

## 2. Editorial Workflow

Conceptual, order-significant; no tooling or format is implied:

```
Identify candidate
      ↓
Verify canonical formula exists in Formula Catalog
      ↓
Draft objective explanation
      ↓
Review
      ↓
Approve
      ↓
Include
```

1. **Identify candidate** — a formula proposed for definition.
2. **Verify canonical formula exists in Formula Catalog** — a definition may only
   reference a name the catalog already owns; a formula not yet catalogued is not
   eligible (the reference must resolve).
3. **Draft objective explanation** — an objective statement of what the formula is,
   context-free and policy-free.
4. **Review** — the three independent reviews (§3).
5. **Approve** — only a fully reviewed definition proceeds.
6. **Include** — the approved definition enters the collection.

The quality-over-quantity philosophy governs throughout: candidates are added
deliberately and reviewed, never in bulk.

## 3. Review Philosophy

Every definition passes three **independent** reviews, each answering a different
question; all three must pass before inclusion:

- **Structural review** — is the entry well-formed (a resolvable referenced formula
  and a non-empty explanation, and nothing beyond meaning)? Mirrors what the
  validation contract enforces mechanically.
- **Editorial review** — is the explanation objective, context-free, policy-free,
  and consistent in terminology and style with the rest of the collection? The
  human judgment the contract cannot perform.
- **Clinical review** — is the meaning clinically accurate and appropriate
  (Clinical Evaluation)? A semantic judgment distinct from structure and style.

The three are never conflated: a structurally valid, editorially clean definition
can still be clinically wrong, and vice versa.

## 4. Definition Consistency Review

Before accepting a candidate, it is reviewed against the **complete Definition
collection** for editorial consistency:

- **duplicate meanings** — the same formula is not defined twice, and two entries
  do not express the same meaning under different referenced formulas;
- **contradictory wording** — a new definition does not contradict an existing one;
- **inconsistent terminology** — shared terms are used consistently across
  definitions;
- **inconsistent writing style** — definitions read as one coherent collection;
- **definition overlap** — one definition does not silently absorb what another
  already owns.

This is **editorial consistency, not runtime validation**. Structural checks remain
the validation contract's job; cross-content *referential* integrity (referenced
formula exists in the catalog) remains the build-time cross-content check; clinical
correctness remains Clinical Evaluation. This review governs the *semantic and
stylistic coherence* of the collection, which no automated layer owns.

## 5. Minimal Definition Principle

**A Definition entry is intentionally minimal.** It exists solely to provide
*meaning*, and should resist accumulating unrelated information. Minimality is a
governing goal, not a temporary Version 1 limitation.

Future additions — **citations, provenance, references, historical notes,
metadata** — should **extend beside the Definition, not expand the Definition
itself**. They attach to the entry's referenced formula as separate fields, layers,
or interfaces; they never fold into the objective explanation.

This is the **Definition-layer counterpart of the frozen Minimal Vocabulary
Principle**: where Minimal Vocabulary keeps a Vocabulary entry to a bare canonical
name, Minimal Definition keeps a Definition entry to a referenced name plus its
meaning. Both resist accretion for the same reason — a single-purpose entry has an
unambiguous owner, a trivial contract, and nothing that can drift into another
interface's territory. **Definitions grow by extension, not accumulation.**

## 6. Authoring Independence

Approved Definition batches become **stable knowledge assets**. Future batches
**add new Definitions**; they do **not** rewrite previously approved Definitions.

The only reason to change an approved definition's *meaning* is exceptional — the
**semantic analogue of an Identity Migration**, corresponding to the Specification's
Meaning Stability. Editorial refinement of wording (without changing meaning) is
permitted; semantic change is not ordinary authoring.

## 7. Batch Closure

Each frozen Definition batch is a **closed, independently reviewable editorial
unit**. After a batch is frozen, its review, editorial decisions, and meanings are
complete. Future batches **review against** previous batches (for consistency, §4)
but **never reopen** them. History is append-only, save for the exceptional
semantic migration above.

## 8. Growth Philosophy

- **Incremental** — definitions are authored batch by batch.
- **Quality before quantity** — a clean, consistent collection over a large one.
- **Stability before expansion** — approved meanings are preserved; new definitions
  are added beside them.
- **Option B makes incomplete coverage acceptable** — a formula without a
  definition simply falls back; missing definitions never become runtime failures,
  so the collection need not be complete to be useful.

## 9. Completion Criteria (qualitative)

No numeric targets. The Definition collection is considered mature when:

- **every authored Definition is reviewed** (all three reviews passed);
- **terminology is internally consistent** across the collection;
- **meanings remain stable** (no unresolved semantic drift);
- **referenced catalog entries exist** (every definition resolves to a catalogued
  name);
- **future interfaces can depend upon them** — the meaning layer is stable enough
  for mappings and reasoning to build on.

Completeness is defined by *consistency, stability, and reference-integrity of what
has been authored*, not by size — Option B keeps partial coverage valid.

## 10. Sufficiency Review

**The frozen Runtime, Framework, Loader, Registry, Knowledge Content Architecture,
Formula Catalog, and Definition Specification fully support beginning authoring. No
limitation; authoring may proceed.** A Definition slice will sit behind the frozen
`prescriptionFormulaDefinitions` registry entry, be structurally validated by its
contract, cross-checked against `formulaCatalog` for referential integrity,
transported opaquely, and consumed with Option B. Everything defined here is
authoring governance, not architecture; nothing requires a change to the runtime,
framework, loader, registry, or validation model.

## Scope

Authoring plan only. No formula definitions, no medical content, no code, and no
change to any frozen artifact.
