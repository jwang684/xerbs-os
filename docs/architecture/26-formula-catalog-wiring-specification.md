# Formula Catalog — Wiring Specification

**Formula Catalog · Wiring Sprint · Step 2 (Specification).** Status:
**PROPOSED — PENDING REVIEW.** This is the formal specification for wiring the
completed, frozen `formulaCatalog` identity layer into the knowledge system: it
resolves the architectural questions raised in the Formula Catalog Wiring Review
(`docs/architecture/25`) and defines the responsibilities, guarantees, failure
behavior, and growth behavior of each participating seam. It is
**implementation-neutral** — it specifies *what* each part must guarantee, not *how*
— and creates no implementation, contract, loader, or registry source. It conforms
to, and is subordinate to, the frozen transport/loader/registry architecture
(`docs/architecture/11`–`16`), the frozen Formula Catalog content artifacts
(`docs/architecture/13`–`17`), the Wiring Review (`25`), and the established wiring
pattern already proven end-to-end for the sibling meaning layer
(`docs/architecture/22`–`24`; `prescriptionFormulaDefinitions` runtime wiring
complete and serving 135 validated entries). It changes no existing file.

Starting state (verified, unchanged from Review §Grounding): the `formulaCatalog`
identifier is present in the production registry inventory, bound to a placeholder
source (`emptySource`) and placeholder contract (`unauthoredContract`); every request
today resolves to absence and the consumer falls back (Option B). The authored
corpus `formula-catalog.md` (135 canonical names, frozen, at verified 135↔135 parity
with the definitions collection) is unconnected. `PrescriptionModule` already requests
`formulaCatalog` and renders `{{formulaCatalog}}`. This specification governs
replacing that one entry's placeholder source and contract with a real source and a
real validation contract — availability work only, not content authoring.

---

## A. Specification Summary

Wiring makes the frozen canonical-name set reachable at runtime through the existing
frozen seams, changing only what the single `formulaCatalog` registry entry resolves
to. The identity layer stays identity-only (Minimal Vocabulary); the runtime shape is
the barest faithful projection of the authored names; the loader, transport,
Template Method, and Option B are untouched. Because a consumer already requests and
renders the slice, the sole observable effect is that `{{formulaCatalog}}` flips from
`"(none provided)"` to the real canonical-name set.

---

## B. Resolved Architectural Decisions

### 1. Runtime Representation

- **Authoritative source of truth** — the frozen `formula-catalog.md`. It remains the
  single source of truth for identity; wiring introduces no competing or
  hand-maintained duplicate name-space.
- **Runtime representation** — a **flat, ordered collection of canonical-name
  strings**, derived losslessly from the authored corpus in source order.
- **Derivation requirements** — the runtime form is a **lossless, non-interpretive
  derivation** of the authored names: it adds no names, drops none, reorders none,
  and normalizes/rewrites none. Derivation happens before consumption (a module never
  parses prose).
- **Ownership requirements** — the derived form carries exactly the canonical names
  and nothing else; it owns identity, references nothing, and holds no meaning,
  alias, translation, or metadata.

**Decision: flat string array (`readonly string[]`), not object entries.** Justified
by:
- **Identity Ownership** — a catalog entry *is* a canonical name; the name is the
  whole datum. There is no second field for an object to carry.
- **Minimal Vocabulary Principle** — the entry must be exactly one canonical name and
  nothing else. Wrapping each name in an object (e.g. `{ name }`) introduces a field
  slot that both implies room for accretion (alias, translation, meaning) and departs
  from "the entry is the name." A bare string is the minimal faithful shape.
- **Single Source of Truth** — a string list is the most direct lossless projection
  of the authored `- <Name>` lines; nothing is invented to fill an object.

This deliberately differs from `prescriptionFormulaDefinitions`, whose entries carry
two conceptual fields (formula + explanation) and therefore required objects. The
catalog is identity-only, so its minimal shape is a string.

**Requirements.** **CR-1** one authoritative name corpus (the frozen markdown).
**CR-2** the runtime form is a faithful, lossless, non-interpretive derivation of it.
**CR-3** the runtime form is a flat array of canonical-name strings, in source order,
with no additional structure.

### 2. Runtime Bundle Shape

- **Value supplied by the source** — the flat `readonly string[]` of canonical names
  (or absence on inability to produce valid content). Data only; never prompt
  formatting.
- **Value delivered by the loader** — the same collection, structurally validated and
  **deep-frozen**, placed at `bundle["formulaCatalog"]`; transport-opaque (the loader
  attaches no catalog-specific shape to it).
- **Value exposed to modules** — the frozen collection, read through the module's
  existing `knowledgeOrNone(this.knowledge, "formulaCatalog")` accessor. Because the
  value is a non-string array, the accessor serializes it (`JSON.stringify`) into the
  `{{formulaCatalog}}` slot — exactly the current behavior for a supplied slice.

**Preservation.** **CB-1** transport opacity — no clinical shape enters the
framework/registry/loader. **CB-2** the existing `knowledgeOrNone` behavior is
unchanged and consumes the value without modification. **CB-3** the existing
`{{formulaCatalog}}` template rendering path is unchanged. **CB-4 no module changes**
— `knowledgeRequest()`, `variables()`, the accessor, and the template stay exactly as
they are; wiring only changes what the accessor receives.

### 3. Contract Scope

**The contract validates structure only, for the catalog slice in isolation.** It
confirms:
- **array structure** — the slice is a collection (CV-cat-1);
- **non-empty names** — each entry is a non-empty (trimmed) string (CV-cat-2);
- **duplicate identities** — no duplicate canonical names within the slice; identity
  is unique (CV-cat-3).

**It does NOT validate:**
- **naming conventions** — Title Case, pinyin, syllable separation, absence of tone
  marks;
- **editorial policy** — house style, ordering, batching;
- **terminology rules** — canonicalization correctness, romanization scheme.

**Rationale.** These are **authoring/editorial standards**, owned by the Formula
Catalog authoring governance and by human/editorial review — not structural facts a
runtime contract can or should adjudicate. Encoding convention-checking into the
structural contract would (a) turn a structure gate into an editorial-policy engine,
(b) couple runtime validation to mutable style decisions, and (c) risk rejecting a
legitimately authored, frozen name over a style regex. Structure (contract),
editorial correctness (authoring review), and referential integrity (cross-content)
must stay separate. The contract is deterministic, side-effect-free, performs no
repair, and returns the validated value unchanged on success.

### 4. Dependency Model

- **Catalog dependencies** — **none.** The catalog is the identity root; it references
  no other slice and carries no outbound references.
- **Does catalog depend on definitions?** **No.**
- **Do definitions depend on catalog?** **Yes** — definitions reference catalog names
  (a content reference), reconciled by the existing build-time
  `prescriptionFormulaDefinitions` → `formulaCatalog` cross-content check.
- **Runtime dependencies** — none; the `formulaCatalog` entry resolves independently
  of every other entry (per-identifier resolution). No runtime load-order requirement
  exists between catalog and definitions.
- **Build-time dependencies** — the definitions→catalog cross-content check reads the
  authoritative catalog corpus; it operates on authored corpora, not the runtime
  bundle, so it is unaffected by whether the catalog is wired at runtime.

**Dependency direction:** *everything → Catalog* (inbound only). The catalog is an
outbound leaf; no cycle is possible, and catalog wiring needs **no outbound
cross-content check of its own**.

**Requirements.** **CD-1** the catalog resolves independently at runtime with no
cross-entry coupling. **CD-2** the one-way direction (dependents → catalog) is
preserved; the catalog gains no awareness of its dependents. **CD-3** wiring
introduces no runtime dependency and no reverse dependency.

---

## C. Responsibility Matrix

### 1. Source
- **Owns** — supplying the resolved `formulaCatalog` slice as structured data derived
  losslessly from the authoritative corpus.
- **Must guarantee** — yields exactly the flat array of canonical-name strings, in
  source order (CR-3); data only, never prompt formatting; resolvable behind the
  frozen `load()` seam; yields absence rather than partial/unvalidated data on
  inability.
- **Must not** — author, alter, supplement, reorder, deduplicate, normalize, format,
  or interpret names; read or reference any other slice.

### 2. Contract
- **Owns** — authoritative structural validation of the catalog slice.
- **Must guarantee** — array + non-empty-string + uniqueness checks (§B.3);
  deterministic, side-effect-free; returns the validated value unchanged on success;
  a pass/fail verdict the loader can act on.
- **Must not** — check naming convention/editorial policy/terminology; resolve
  cross-slice references; judge clinical/semantic correctness; repair, dedupe,
  normalize, or transform content.

### 3. Registry
- **Owns** — the identifier → {source, contract} binding for `formulaCatalog`.
- **Must guarantee** — the identifier stays inventoried (Registry Completeness); the
  one entry is upgraded to a real source + real contract, replacing the placeholders,
  and nothing else changes; the entry stays a sibling, independently resolvable; the
  entry is well-formed so registry validation passes at initialization.
- **Must not** — change the registry mechanism/API; add or remove identifiers; gain
  catalog-specific branching or clinical knowledge.

### 4. Validation
- **Owns** — the four unchanged layers, made real for this slice: **registry
  validation** (entry well-formed, at init); **structure validation** (the contract,
  §B.3); **cross-content** (the catalog is the *target* of the existing
  definitions→catalog build-time check; it introduces no outbound check of its own);
  **runtime trust** (a loaded slice is structurally trusted).
- **Must guarantee** — the layers stay separate and unmerged; derivation fidelity
  (the runtime form equals a fresh derivation of the authored corpus — a build-time
  no-drift guarantee) is verified before deployment.
- **Must not** — merge structure with editorial/terminology or with referential
  integrity; perform clinical evaluation (human-owned).

### 5. Loader
- **Owns** — resolving `formulaCatalog` through the registry using the frozen generic
  lifecycle: resolve → registry lookup → source → validate → freeze → cache →
  assemble → return.
- **Must guarantee** — it stays domain-agnostic (no knowledge this identifier is "the
  catalog"); validates via the entry's contract before exposing; deep-freezes the
  served value; caches per existing policy; degrades absent/invalid content to
  absence (Option B), never serving unvalidated data.
- **Must not** — change its algorithm; branch on the identifier; require a loader edit
  to serve this slice (Registry Evolution Principle — a loader change would signal
  domain leakage and is an architectural failure).

---

## D. Runtime and Dependency Guarantees

### Runtime Guarantees
- **RG-1 Availability** — once wired, a module requesting `formulaCatalog` receives
  the real, validated, immutable canonical-name set instead of absence — the sole
  intended observable change (`{{formulaCatalog}}` flips from `"(none provided)"`).
- **RG-2 Immutability** — the served slice is deep-frozen; consumers read, never
  mutate.
- **RG-3 Validated-or-absent** — a module never receives structurally invalid content;
  it receives either a contract-valid slice or absence.
- **RG-4 Determinism** — for a fixed authored corpus and registry, resolution yields
  the same slice across runs.
- **RG-5 No behavioral change beyond availability** — prompts, schemas, modules, the
  loader algorithm, the transport contract, and Option B are otherwise unchanged.

### Validation Guarantees
- **VG-1** Structure is authoritatively validated by the contract (array, non-empty
  strings, unique names).
- **VG-2** Derivation fidelity (no-drift vs. the authored corpus) is guaranteed at
  build time.
- **VG-3** The existing definitions→catalog referential check remains satisfiable and
  unchanged (135↔135), reading authored corpora.

### Failure Behavior
- **FB-1 Registry inconsistency** (missing/duplicate identifier, missing source or
  contract) fails at initialization as a registry error — surfaced, not tolerated.
- **FB-2 Absent content** resolves the identifier to absence; the module injects
  `"(none provided)"` (Option B). Not a runtime failure.
- **FB-3 Contract-failing content** resolves to absence at runtime rather than serving
  unvalidated data (RG-3); such content is expected to be caught before deployment
  (structure + no-drift at build time).
- **FB-4 No clinical-run failure from this slice** — absence or invalidity never fails
  an otherwise-valid run; behaviour under absence is identical to today's.

### Future Growth
- **FG-1 Additive catalog growth** — new canonical names are incorporated by extending
  the authoritative corpus (and its derived form); the registry entry, loader, and
  contract *mechanism* are unchanged (the source yields more names; the contract
  validates them identically).
- **FG-2 Downstream growth** — new identities without definitions simply resolve to
  absence for those identities (Option B) until authored; catalog growth forces no
  wiring change.
- **FG-3 Deferred neighbours** — aliases, translations (localization), ontology attach
  *beside* the catalog as new fields/layers/interfaces, never folded into a
  canonical-name entry (Minimal Vocabulary).
- **FG-4 Append-only history & immutability** — wiring never rewrites approved names;
  growth is by extension; served content is immutable; Canonical Naming Stability is
  preserved.

---

## E. Invariants (must hold before and after wiring)

- **INV-1 Single source of truth for identity** — the authored `formula-catalog.md`.
- **INV-2 Ownership preserved** — catalog owns identity; definitions own meaning;
  mappings own relationships; reasoning owns selection; execution owns action. No
  migration.
- **INV-3 Minimal Vocabulary** — a catalog entry is exactly one canonical name;
  nothing else enters it (no alias, translation, meaning, composition, classification,
  mapping, relationship, reasoning, recommendation, or metadata).
- **INV-4 Framework unchanged** — transport contract, loader algorithm, module
  Template Method, and Option B are not modified; wiring is additive and confined to
  one registry entry's source and contract.
- **INV-5 One-way dependency** — dependents → catalog only; the catalog references
  nothing and gains no awareness of dependents; no runtime coupling; no cycle.
- **INV-6 Validated-or-absent** — no unvalidated content ever reaches a module.
- **INV-7 Immutability** — served content is deep-frozen.
- **INV-8 Domain-agnostic transport** — no clinical vocabulary enters the framework,
  registry mechanism, or loader.
- **INV-9 No module changes** — the existing consumer's request, variables, accessor,
  and template are untouched.

---

## F. Sufficiency Assessment

**The specification is sufficient to proceed to Step 3 (Implementation Plan).** Every
open question from the Wiring Review is resolved: runtime representation (flat string
array, justified by Identity Ownership / Minimal Vocabulary / Single Source of Truth);
bundle shape (opaque frozen `string[]`, consumed by the unchanged `knowledgeOrNone` /
`{{formulaCatalog}}` path with no module change); contract scope (structure only —
array, non-empty, unique — explicitly excluding naming convention and editorial
policy, with rationale); and the dependency model (one-way dependents → catalog, no
runtime coupling, no outbound cross-content check). The frozen Runtime, Framework,
Loader, Registry, and Content architecture fully support this wiring; the only new
elements are a real source deriving a string list from the authoritative corpus and a
real structural contract — both Knowledge-Layer concerns for later steps, each
additive, none requiring a change to the framework, loader, registry mechanism,
transport contract, or Option B. The precedent implementation for the sibling meaning
layer further de-risks the plan. No architectural blockers remain.

## Scope

Specification only. No implementation, no source, no contract, no loader, no
validation code, no tests, no content change, and no change to any existing file or
registry entry. Resolves the Wiring Review's open questions and defines wiring
responsibilities, guarantees, failure behavior, and growth behavior at a conceptual
level; defers all *how* to Step 3 (Implementation Plan).
