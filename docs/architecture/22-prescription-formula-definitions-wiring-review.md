# Prescription Formula Definitions — Wiring Architecture Review

**Prescription Formula Definitions · Wiring Sprint · Step 1 (Architecture
Review).** Status: **PROPOSED — PENDING REVIEW.** This review concerns only the
*integration architecture* by which the completed, frozen `prescriptionFormulaDefinitions`
meaning layer becomes available at runtime. It designs no implementation, creates
no registry source, loader, contract, or validation code, and changes no existing
file. It is consistent with, and subordinate to, the frozen transport and loader
architecture (`docs/architecture/11`–`16`) and the frozen interface artifacts
(Architecture Review `321edd4`, Specification `31bb843`, Authoring Plan `23a6821`,
Definition Batches 1–9, Completion Audit `56debd3`).

Starting state: the `prescriptionFormulaDefinitions` identifier is **already
present** in the production registry inventory (Registry Completeness), bound to a
**placeholder source** (yields nothing) and a **placeholder contract**, so today
every request resolves to absence and the consuming module falls back
(Option B). The authored content — 135 definitions at 1:1 parity with the Formula
Catalog — exists and is frozen, but is **not yet connected** to that registry
entry. Wiring is the act of replacing the placeholder source and contract with a
real source and a real validation contract, so the meaning layer actually reaches
the runtime.

## 1. Purpose of Wiring

- **Why wire.** The meaning layer is complete but inert: the module requests it,
  the loader returns nothing, and the prompt receives `"(none provided)"`. Wiring
  connects the authored definitions to the existing transport seam so requested
  definitions are actually supplied.
- **What wiring enables.** A module that requests `prescriptionFormulaDefinitions`
  receives the real, validated, immutable definition content instead of absence —
  grounding its reasoning in curated meaning rather than the model's own knowledge.
- **What wiring must NOT change.** Ownership boundaries, the transport contract,
  the loader algorithm, the module Template Method, Option B semantics, or any
  clinical behaviour. Wiring changes *availability*, nothing else (see §10).

## 2. Ownership Preservation

- **Formula Catalog continues to own identity** (canonical names).
- **Prescription Formula Definitions continue to own meaning** (intrinsic
  therapeutic identity), referencing catalog names, never restating them.
- **No ownership migration** — wiring moves no responsibility between layers; it
  only makes the definitions layer's existing content reachable.
- **No duplication of responsibility** — the definitions source yields meaning; it
  does not become a second name-space, a mapping, or a selection authority.

## 3. Runtime Architecture

- **How definitions become available.** Unchanged transport path: the module
  declares demand via `knowledgeRequest()`; the loader resolves that identifier
  through the registry; the resolved, validated, frozen value is placed in the
  knowledge bundle and exposed to the module (as protected execution-scoped state)
  for injection into its prompt.
- **Runtime access path.** module `knowledgeRequest` → `KnowledgeLoader.load` →
  registry lookup → source → contract validation → deep-freeze → cache → bundle →
  module consumption. Wiring only makes the source/contract non-placeholder; the
  path itself is frozen.
- **Read-only expectations.** Served definitions are immutable reference data; the
  module reads, never mutates. This preserves the Immutable Result posture.
- **Loading lifecycle.** Lazy, per-module, per-run, before the prompt is built;
  loader-owned caching; async source resolution. No lifecycle change.

## 4. Registry Architecture

- **Registry source responsibilities.** The `prescriptionFormulaDefinitions`
  registry entry's *source* must, after wiring, yield the authored definition
  content as data the contract can validate. The *identifier* and its presence in
  the inventory are unchanged.
- **Registry boundaries.** The registry remains a generic identifier → {source,
  contract} inventory; it gains no clinical knowledge and no definition-specific
  logic. Wiring edits one entry's source and contract, not the registry mechanism.
- **Inventory expectations.** Registry Completeness already holds (the identifier
  is inventoried). Wiring does not add or remove identifiers; it upgrades one
  entry from placeholder to real.
- **Relationship to the existing catalog registry entry.** `formulaCatalog` and
  `prescriptionFormulaDefinitions` are **sibling entries** in the same inventory.
  Wiring one does not require wiring the other at runtime (each entry resolves
  independently); their relationship is a *content* reference (definitions cite
  catalog names), reconciled by cross-content validation (§7), not a registry-level
  coupling.

## 5. Loader Architecture

- **How definition content enters the system.** Through the entry's source, behind
  the frozen `load()` seam. The loader stays generic and registry-derived; it gains
  no knowledge that this identifier is "definitions."
- **Loading sequence.** Resolve request → registry lookup → load source →
  validate against the contract → freeze → cache → assemble bundle → return —
  exactly the frozen lifecycle.
- **Dependency considerations.** Resolving the definitions slice does not require
  resolving the catalog slice at runtime; the two resolve independently. The
  definitions↔catalog relationship is enforced at build time (§8), not by a runtime
  load-order dependency.
- **Failure-handling philosophy.** Registry-level inconsistency fails at
  initialization (a registry error). Content that is absent or fails its contract
  degrades to absence at runtime (Option B) rather than failing a clinical run;
  malformed content is expected to be caught before deployment. Wiring must not
  weaken this: invalid definition content resolves to absent, never to unvalidated
  data.

## 6. Contract Architecture

- **Definition entry structure.** Per the frozen Specification, each entry is
  exactly *referenced canonical formula* + *objective explanation*. The wiring
  contract validates that shape.
- **Interface boundaries.** The contract validates *structure only* for one slice;
  it does not judge clinical correctness, does not resolve cross-slice references,
  and encodes no reasoning.
- **Validation responsibilities.** The contract confirms: each entry references a
  (non-empty) canonical formula and carries a non-empty objective explanation; no
  duplicate definitions of the same referenced formula within the slice; the entry
  carries only those two fields (Minimal Definition).
- **Cross-content expectations.** Confirming that a referenced formula exists in the
  Formula Catalog is a *cross-content* concern spanning two slices — outside a
  single-slice contract (see §7).

## 7. Validation Architecture

Four layers, unchanged in ownership:

- **Registry validation** — the entry is well-formed (identifier present, source
  present, contract present; no duplicate identifier). Runs at initialization.
- **Structure validation** — the per-slice contract validates each definition's
  shape (§6). Authoritative for structure.
- **Cross-content validation** — a build-time check that every referenced canonical
  formula resolves to a Formula Catalog identity (135↔135 parity is the current
  verified state). This reads the authored catalog and definition artifacts; it is
  not a runtime step and does not depend on either slice being wired at runtime.
- **Runtime assumptions** — a successfully loaded slice is structurally trusted;
  the module reasons over it without re-validating structure.

## 8. Dependency Analysis

- **Relationship to Formula Catalog.** Definitions *reference* catalog identities;
  meaning depends on identity.
- **Dependency direction.** Definitions → Catalog (one-way). The Catalog references
  nothing.
- **Dependency ownership.** The reference is owned by the definitions layer (it
  cites catalog names); the catalog is unaware of, and unaffected by, definitions.
- **Circular-dependency prevention.** Because the arrow is one-way and the catalog
  never references definitions, no cycle is possible. Runtime resolution is per
  independent entry, so there is no runtime load-order cycle either; the only
  definitions→catalog coupling is the build-time reference check.

## 9. Future Evolution

- **Future definition batches.** Incorporated additively: new definition content
  appended and validated, with no change to the registry entry, loader, or
  contract mechanism (the source yields more entries; the contract validates them
  the same way).
- **Future catalog growth.** Expanding the catalog would create new identities that
  require matching future definition batches to restore parity; until authored,
  those identities simply have no definition and resolve to absence (Option B). No
  wiring change is forced by catalog growth.
- **Additive-only growth.** Consistent with Authoring Independence and Batch
  Closure: wiring never rewrites prior content; growth is by extension.

## 10. Wiring Boundaries (what this sprint does NOT do)

- **No reasoning layer** — wiring supplies meaning; it does not interpret or decide.
- **No clinical selection** — no choosing among formulas.
- **No recommendations** — none introduced anywhere.
- **No mappings** — no pattern→treatment or treatment→formula associations.
- **No execution logic** — no dosage, composition, administration, or prescribing.
- **No runtime behaviour changes beyond availability** — the only observable effect
  is that a requested definitions slice, previously absent, is now supplied;
  prompts, schemas, modules, the loader algorithm, and the transport contract are
  otherwise unchanged.

## Review Standards

This review is architectural, implementation-neutral, and non-normative where
possible, and is consistent with every frozen governance artifact. It proposes no
new principle and changes no existing decision; it describes how the frozen meaning
layer connects to the frozen transport architecture.

## Open Questions for Step 2 (Specification)

Flagged for the specification step, not decided here:

- **Runtime representation of the authored content.** The authored artifact is
  human-readable prose; the runtime source must yield structured data the contract
  can validate. Step 2 should decide how the runtime representation is produced
  (e.g. derived/compiled from the authored artifact vs. maintained as a parallel
  data form), preserving the frozen "resolution/derivation happens before runtime"
  posture and single-source-of-truth for meaning.
- **Bundle value shape for prompt injection.** How the resolved definitions value
  is shaped for the module to inject as reference context (the module consumes it
  via its existing graceful-fallback accessor).
- **Whether definitions runtime wiring should be sequenced with, or independent of,
  Formula Catalog wiring** — given the build-time reference check already binds
  them and runtime resolution is per-entry independent.

## Scope

Architecture review only. No implementation, no registry source, no loader, no
contract, no validation code, and no change to any existing file.
