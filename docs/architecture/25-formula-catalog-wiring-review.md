# Formula Catalog — Wiring Architecture Review

**Formula Catalog · Wiring Sprint · Step 1 (Architecture Review).** Status:
**PROPOSED — PENDING REVIEW.** This review concerns only the *integration
architecture* by which the completed, frozen `formulaCatalog` identity layer becomes
available at runtime. It designs no implementation, creates no registry source,
loader, contract, or validation code, and changes no existing file. It is consistent
with, and subordinate to, the frozen transport and loader architecture
(`docs/architecture/11`–`16`), the frozen Knowledge Content and Formula Catalog
artifacts (`docs/architecture/13`–`17`), and the now-established wiring pattern
proven for the sibling meaning layer (`docs/architecture/22`–`24`, and the completed
`prescriptionFormulaDefinitions` runtime wiring).

## Grounding — current runtime state (verified)

- **Registry inventory** — `src/ai/knowledge/productionRegistry.ts` still binds
  `formulaCatalog` via `pending("formulaCatalog")`: `emptySource` (yields nothing)
  + `unauthoredContract` (absent → valid empty; present → refused). It is therefore
  **placeholder-bound**; today every request for it resolves to absence and any
  consumer falls back (Option B). Only `prescriptionFormulaDefinitions` has been
  upgraded to a real entry; the other six identifiers — including `formulaCatalog` —
  remain `pending(...)`.
- **Authored content** — `src/ai/knowledge/content/formula-catalog.md` (frozen, 9
  batches) holds **135 canonical formula names**, one identity per line, under the
  frozen canonicalization convention (pinyin, Title Case, syllable-separated, no
  tone marks, translation excluded). It is authored and frozen but **not connected**
  to its registry entry.
- **Loader / transport** — `ProductionKnowledgeLoader.ts` is generic and unchanged;
  `KnowledgeSource`, `KnowledgeContract`, `KnowledgeValidation`, `KnowledgeBundle`
  are unchanged. Wiring will change only what the one `formulaCatalog` entry resolves
  to — a real source and a real contract in place of the placeholders.

## 1. Purpose of Wiring

- **Why wire.** The identity layer is complete but inert: any module that requests
  `formulaCatalog` receives nothing and the prompt sees `"(none provided)"`. Wiring
  connects the authored canonical names to the existing transport seam so requested
  identities are actually supplied.
- **What wiring enables.** A module requesting `formulaCatalog` receives the real,
  validated, immutable set of canonical names — scoping which formula names are
  canonical, without carrying meaning, composition, or relationships.
- **What wiring must NOT change.** Ownership boundaries, the transport contract, the
  loader algorithm, the module Template Method, Option B semantics, or any clinical
  behaviour. Wiring changes *availability*, nothing else (see §10).

## 2. Ownership Preservation

- **Formula Catalog owns identity** — the canonical name-space, and only that.
- **Definitions own meaning; Mappings own relationships; Reasoning owns selection;
  Execution owns action** — none of these enters a catalog entry.
- **No ownership migration** — wiring moves no responsibility; it only makes the
  identity layer's existing content reachable.
- **Minimal Vocabulary preserved** — a catalog entry is exactly one canonical name
  and nothing else (no alias, translation, meaning, composition, or metadata). The
  runtime representation carries exactly that and no more.

## 3. Runtime Architecture

- **How identities become available.** Unchanged transport path: a module declares
  demand via `knowledgeRequest()`; the loader resolves that identifier through the
  registry; the resolved, validated, frozen value is placed in the knowledge bundle
  and exposed to the module (protected execution-scoped state) for injection.
- **Runtime access path.** module `knowledgeRequest` → `KnowledgeLoader.load` →
  registry lookup → source → contract validation → deep-freeze → cache → bundle →
  module consumption. Wiring only makes the source/contract non-placeholder; the
  path itself is frozen.
- **Existing consumer.** `PrescriptionModule` already requests `formulaCatalog` in
  its `knowledgeRequest()` and reads it via
  `knowledgeOrNone(this.knowledge, "formulaCatalog")`, rendering it into the
  `{{formulaCatalog}}` template slot. So wiring flips that block from
  `"(none provided)"` to the real canonical-name set with no module change.
- **Read-only expectations.** Served identities are immutable reference data; the
  module reads, never mutates.
- **Loading lifecycle.** Lazy, per-module, per-run, before the prompt is built;
  loader-owned caching; async source resolution. No lifecycle change.

## 4. Registry Architecture

- **Registry source responsibilities.** After wiring, the `formulaCatalog` entry's
  *source* must yield the authored canonical names as data the contract can validate.
  The *identifier* and its presence in the inventory are unchanged.
- **Registry boundaries.** The registry remains a generic identifier → {source,
  contract} inventory; it gains no clinical knowledge and no catalog-specific logic.
  Wiring edits one entry's source and contract, not the registry mechanism.
- **Inventory expectations.** Registry Completeness already holds (the identifier is
  inventoried). Wiring upgrades one entry from placeholder to real; it adds/removes
  no identifier.
- **Relationship to sibling entries.** `formulaCatalog` and
  `prescriptionFormulaDefinitions` are sibling entries; each resolves independently.
  The catalog is the *identity root* the definitions layer references — but that is a
  content reference reconciled by cross-content validation (§7), not a registry-level
  coupling.

## 5. Loader Architecture

- **How content enters the system.** Through the entry's source, behind the frozen
  `load()` seam. The loader stays generic and registry-derived; it gains no knowledge
  that this identifier is "the catalog."
- **Loading sequence.** Resolve request → registry lookup → load source → validate
  against the contract → freeze → cache → assemble bundle → return — exactly the
  frozen lifecycle, already proven for the definitions slice.
- **Dependency considerations.** Resolving the catalog slice requires no other slice;
  the catalog is the dependency root (it references nothing). Resolution is per-entry
  independent.
- **Failure-handling philosophy.** Registry-level inconsistency fails at
  initialization (a registry error). Absent or contract-failing content degrades to
  absence at runtime (Option B), never to unvalidated data; malformed content is
  expected to be caught before deployment. Wiring must not weaken this.

## 6. Contract Architecture

- **Entry structure.** Per the frozen Formula Catalog Specification, each entry is
  exactly one canonical name (a non-empty string). The wiring contract validates that
  shape.
- **Interface boundaries.** The contract validates *structure only* for one slice; it
  does not judge clinical correctness, does not resolve cross-slice references, and
  encodes no meaning.
- **Validation responsibilities.** The contract confirms: the slice is a collection;
  each entry is a non-empty (trimmed) canonical-name string; no duplicate names
  within the slice (unique identity). Whether it also enforces the canonicalization
  *convention* (Title Case, no tone marks, etc.) is an open question for the
  specification (§Open Questions).
- **Cross-content expectations.** The catalog has no outbound references to validate;
  it is other slices (definitions, future mappings) that must resolve *into* the
  catalog. That inbound referential integrity remains a cross-content concern owned
  elsewhere (§7), not a catalog-contract concern.

## 7. Validation Architecture

Four layers, unchanged in ownership:

- **Registry validation** — the entry is well-formed (identifier, source, contract
  present; unique). Runs at initialization.
- **Structure validation** — the per-slice contract validates each identity's shape
  (§6). Authoritative for structure.
- **Cross-content validation** — the catalog is the *target* of references, not a
  source of them, so it needs no outbound cross-content check of its own. The
  existing `prescriptionFormulaDefinitions` → `formulaCatalog` build-time check
  (already implemented and green at 135↔135) reads the authoritative catalog corpus;
  wiring the catalog at runtime does not change that check, because it operates on
  authored corpora, not the runtime bundle.
- **Runtime assumptions** — a successfully loaded slice is structurally trusted; the
  module reasons over it without re-validating structure.

## 8. Dependency Analysis

- **Relationship to other layers.** The catalog is the identity root. Definitions
  (and future mappings) reference it; it references nothing.
- **Dependency direction.** Everything → Catalog (inbound only). The catalog is a
  leaf on the outbound graph.
- **Dependency ownership.** References into the catalog are owned by the referring
  layers; the catalog is unaware of, and unaffected by, its dependents.
- **Circular-dependency prevention.** Because the catalog references nothing, it can
  participate in no cycle. Runtime resolution is per independent entry, so there is
  no runtime load-order dependency either.
- **Sequencing.** Catalog wiring is independent of the (already-completed) definitions
  wiring; neither requires the other at runtime. The one standing invariant is that
  the build-time definitions→catalog check remain satisfiable — already true at exact
  135↔135 parity.

## 9. Future Evolution

- **Future catalog batches.** Incorporated additively: new canonical names appended
  and validated, with no change to the registry entry, loader, or contract mechanism
  (the source yields more names; the contract validates them identically).
- **Downstream impact of growth.** New identities without matching definitions simply
  have no definition and resolve to absence for those identities (Option B) until
  authored; catalog growth forces no wiring change.
- **Deferred neighbouring interfaces.** Aliases, translations (the localization
  layer), and ontology attach *beside* the catalog as separate fields/layers, never
  folded into a canonical-name entry (Minimal Vocabulary).
- **Additive-only growth.** Consistent with Canonical Naming Stability and the
  catalog authoring governance: wiring never rewrites prior content; growth is by
  extension.

## 10. Wiring Boundaries (what this sprint does NOT do)

- **No meaning** — wiring supplies names; it does not define what a formula is.
- **No relationships / mappings** — no pattern→treatment or treatment→formula links.
- **No reasoning or selection** — no choosing among formulas.
- **No composition or execution** — no herbs, dosage, or prescribing.
- **No aliases or translations** — the localization layer is deferred.
- **No runtime behaviour changes beyond availability** — the only observable effect
  is that a requested catalog slice, previously absent, is now supplied; prompts,
  schemas, modules, the loader algorithm, and the transport contract are otherwise
  unchanged.

## Review Standards

This review is architectural, implementation-neutral, and consistent with every
frozen governance artifact. It proposes no new principle and reverses no prior
decision; it describes how the frozen identity layer connects to the frozen transport
architecture, reusing the pattern already proven for the meaning layer.

## Open Questions for the Specification Phase

Flagged for Step 2 (Specification), not decided here:

- **Runtime representation & entry shape.** The authored artifact is prose markdown
  with `- <Name>` bullets; the runtime source must yield structured data. Is the
  runtime shape a flat list of canonical-name **strings**, or a list of single-field
  **objects** (e.g. `{ name }`)? The definitions slice used objects; the catalog is
  simpler (identity only), and Minimal Vocabulary argues for the barest shape. This
  choice drives the contract and the bundle value shape and must be settled first.
- **Derivation strategy.** Build-time derivation (a generated artifact, as used for
  definitions) vs. load-time parsing — recommended to mirror the definitions
  Derivation A (build-time) for a consistent fail-fast, single-source-of-truth
  posture, but to be ratified in the spec.
- **Contract strictness.** Does the contract enforce only structural well-formedness
  (non-empty, unique strings), or also the canonicalization *convention* (Title Case,
  syllable separation, no tone marks)? Convention-checking risks encoding editorial
  policy into a structural contract; the spec should decide where that boundary sits.
- **Bundle value shape for prompt injection.** How the resolved catalog value is
  shaped for the module's existing `knowledgeOrNone` accessor and the
  `{{formulaCatalog}}` slot (a plain name list vs. JSON), preserving the no-change
  guarantee to the framework consumption path.
- **Shared derivation/validation utilities.** Whether the catalog reuses or parallels
  the definitions' parser/generator/cross-content scaffolding (the definitions
  cross-content validator already contains an authoritative catalog-identity parser),
  to avoid a second catalog source of truth.

## Scope

Architecture review only. No implementation, no registry source, no loader, no
contract, no validation code, and no change to any existing file.
