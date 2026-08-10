# Prescription Formula Definitions — Wiring Specification

**Prescription Formula Definitions · Wiring Sprint · Step 2 (Specification).**
Status: **PROPOSED — PENDING REVIEW.** This document is the formal specification for
wiring the `prescriptionFormulaDefinitions` interface into the knowledge system: it
resolves the architectural questions raised in the Step 1 Wiring Architecture Review
and defines the responsibilities, guarantees, failure behavior, and growth behavior
of each participating seam. It is **implementation-neutral** — it specifies *what*
each part must guarantee, not *how* — and creates no implementation, contract,
loader, or registry source. It conforms to, and is subordinate to, the frozen
Wiring Architecture Review (`docs/architecture/22`), the frozen interface artifacts
(`docs/architecture/18`–`21`), and the frozen transport/loader/registry
architecture (`docs/architecture/11`–`16`). It changes no existing file.

Starting state (unchanged from Step 1): the `prescriptionFormulaDefinitions`
identifier is already present in the production registry inventory, bound to a
placeholder source (yields nothing) and a placeholder contract; every request today
resolves to absence and the consuming module falls back (Option B). The authored
content — 135 definitions at 1:1 parity with the Formula Catalog — is frozen but
unconnected. This specification governs the act of replacing that one entry's
placeholder source and contract with a real source and a real validation contract.

---

## Part A — Resolved Architectural Questions

### 1. Runtime Representation

**Question (from Step 1).** The authored artifact is human-readable prose markdown;
the runtime source must yield structured data the contract can validate. How is the
runtime representation produced, without creating a second source of truth for
meaning?

**Resolution.**

- **The authored artifact remains the single source of truth for meaning.** The
  frozen `prescription-formula-definitions.md` corpus is authoritative; wiring
  introduces no competing corpus and no hand-maintained duplicate of the meanings.
- **The runtime representation is a derived structured form, not a re-authored one.**
  The runtime source yields a set of Definition entries *derived from* the
  authoritative artifact. Whether the derivation is performed ahead of runtime
  (a build/compile step producing a structured artifact) or at load time (parsing
  the authoritative artifact) is an implementation choice deferred to the
  Implementation Plan; **either way the meanings must originate solely from the
  authoritative artifact.**
- **Derivation is lossless and non-interpretive.** The derived form carries exactly
  the two conceptual fields per entry — *referenced canonical formula* and
  *objective explanation* — and nothing more. Derivation may not add meaning,
  reorder ownership, infer relationships, or synthesize content the artifact does
  not state.
- **Derivation happens before consumption.** Consistent with the frozen loader
  posture, structured data is resolved/derived before the module consumes it; the
  module never parses prose.

**Requirement RR-1.** There shall be exactly one authoritative meaning corpus (the
frozen artifact). **RR-2.** Any runtime representation shall be a faithful,
lossless, non-interpretive derivation of that corpus. **RR-3.** The derived form
shall contain only the two conceptual fields per entry.

### 2. Runtime Bundle Shape

**Question (from Step 1).** How is the resolved definitions value shaped in the
knowledge bundle so the consuming module can inject it as reference context (given
the module consumes it through its existing graceful-fallback accessor)?

**Resolution.**

- **The bundle value stays opaque to the framework.** Per the frozen transport
  contract, the value at `bundle["prescriptionFormulaDefinitions"]` is
  transport-opaque; the loader, registry, and transport types attach no clinical
  shape to it. This specification constrains its shape only as seen by the
  *consuming module*, which owns interpretation.
- **The value is a self-contained collection of definition entries** — the full
  resolved definitions slice, each entry pairing a referenced canonical formula with
  its objective explanation. It is a complete reference block, not a single entry
  and not a pre-formatted prompt string.
- **Prompt-shaping is the module's responsibility, not the source's.** The source
  yields structured data; the consuming module renders it into prompt reference
  context. The source shall not emit prompt formatting, and the framework shall not
  format on the module's behalf.
- **Compatibility with the existing accessor is required.** The module consumes the
  slice through its existing graceful-fallback accessor
  (`knowledgeOrNone(this.knowledge, "prescriptionFormulaDefinitions")`), which
  substitutes `"(none provided)"` on absence and otherwise yields the value (string
  as-is, non-string serialized). The wired value shall be consumable through that
  accessor **without changing the accessor or the module's Template Method** — i.e.
  wiring must not require altering the framework-side consumption path. If the
  chosen value shape needs module-side rendering beyond the current accessor, that
  rendering is a module concern for the Implementation Plan and must remain additive
  and Option-B-preserving.

**Requirement RB-1.** The bundle value shall be a complete, self-contained
definitions collection, transport-opaque, owned interpretively by the module.
**RB-2.** The source shall emit data, never prompt formatting. **RB-3.** The value
shall remain consumable via the existing graceful-fallback accessor without changing
the framework consumption path or Option B semantics.

### 3. Catalog Dependency Model

**Question (from Step 1).** Should definitions runtime-wiring be sequenced with, or
independent of, Formula Catalog wiring, given the build-time reference check binds
them but runtime resolution is per-entry independent?

**Resolution.**

- **Runtime independence.** At runtime the `prescriptionFormulaDefinitions` entry
  resolves independently of `formulaCatalog`. Serving definitions does not require
  the catalog slice to be wired or loaded; there is no runtime load-order
  dependency and no runtime cross-entry coupling.
- **Build-time referential dependency.** The definitions layer references catalog
  identities (one-way: definitions → catalog). Referential integrity — every
  referenced canonical formula exists in the Formula Catalog — is a **build-time
  cross-content** guarantee that reads the *authoritative authored artifacts* of
  both slices. It does not depend on either slice being wired at runtime, because it
  operates on the authored corpora, not on the runtime bundle.
- **Sequencing conclusion.** Definitions wiring **may proceed independently of, and
  need not be sequenced after, Formula Catalog runtime wiring.** The one obligation
  wiring adds is that the build-time cross-content reference check be *satisfiable* —
  which it already is, since both authored corpora exist and are frozen at verified
  1:1 parity (135 ↔ 135).
- **No new coupling introduced.** Wiring shall not create any runtime dependency
  from definitions to the catalog, and shall not make the catalog aware of
  definitions. The dependency remains one-way and, at runtime, absent.

**Requirement CD-1.** Definitions shall resolve independently at runtime.
**CD-2.** Referential integrity shall be enforced at build time against the authored
corpora, one-way (definitions → catalog). **CD-3.** Wiring shall introduce no
runtime catalog dependency and no reverse (catalog → definitions) dependency.

---

## Part B — Responsibilities

Each seam has one clear responsibility; none absorbs another's.

### 4. Source Responsibilities

The registry entry's **source** shall:

- **S-1** yield the resolved `prescriptionFormulaDefinitions` slice as structured
  data derived losslessly from the single authoritative artifact (RR-1..RR-3);
- **S-2** yield exactly the two conceptual fields per entry — referenced canonical
  formula and objective explanation — and nothing else (Minimal Definition);
- **S-3** emit data only, never prompt formatting or module-specific rendering (RB-2);
- **S-4** be free of clinical logic, selection, mapping, and interpretation — it
  transports meaning, it does not reason about it;
- **S-5** be resolvable asynchronously behind the frozen `load()` seam, and produce
  a value the contract can validate;
- **S-6** on inability to produce valid content, yield absence rather than partial
  or unvalidated data (feeding Option B, per §11).

The source shall **not** author, alter, or supplement meaning; it is a transport of
the authored corpus, not an owner of it.

### 5. Contract Responsibilities

The per-slice **validation contract** shall:

- **C-1** validate *structure only*, for this one slice in isolation (no cross-slice
  resolution, no clinical judgment);
- **C-2** confirm each entry references a non-empty canonical formula and carries a
  non-empty objective explanation;
- **C-3** confirm no duplicate definitions of the same referenced formula within the
  slice;
- **C-4** confirm each entry carries only the two permitted fields (Minimal
  Definition — reject accreted fields such as dosage, composition, aliases,
  metadata, citations, recommendations);
- **C-5** be deterministic and side-effect-free — the same input yields the same
  verdict, and validation never mutates the content;
- **C-6** express a pass/fail structural verdict the loader can act on; it does not
  repair, normalize, or transform content.

The contract shall **not** confirm that a referenced formula exists in the catalog
(that is cross-content, §7), and shall **not** judge clinical correctness (that is
Clinical Evaluation, §7).

### 6. Registry Responsibilities

The **registry** shall:

- **G-1** continue to inventory the `prescriptionFormulaDefinitions` identifier
  (Registry Completeness already holds); wiring adds and removes no identifier;
- **G-2** bind that one entry to a real source (§4) and a real contract (§5),
  replacing the placeholders, and change nothing else;
- **G-3** remain a generic identifier → {source, contract} inventory with no clinical
  knowledge and no definition-specific branching;
- **G-4** keep the entry a sibling of `formulaCatalog` and every other entry —
  independently resolvable, with no registry-level coupling between entries;
- **G-5** remain internally consistent (unique identifier; source and contract both
  present and well-formed) so registry validation (§7) passes at initialization.

### 7. Validation Responsibilities

Validation remains four layers with unchanged ownership (frozen Specification §6);
wiring makes each layer *real* for this slice without merging them:

- **V-1 Registry validation** — the entry is well-formed (identifier present, source
  present, contract present, no duplicate). Runs at initialization; a violation is a
  registry error, not a runtime fallback.
- **V-2 Structure validation** — the contract (§5) validates each entry's shape.
  Authoritative for structure.
- **V-3 Cross-content validation** — a build-time check that every referenced
  canonical formula resolves to a Formula Catalog identity, reading the authored
  corpora (one-way, §3). Not a runtime step; not a single-slice contract concern.
- **V-4 Clinical Evaluation** — semantic correctness of the meanings; owned by no
  runtime component; never a contract concern.

**V-5** These layers shall never be conflated: structure (contract), referential
integrity (cross-content), and meaning (Clinical Evaluation) stay separate.

### 8. Loader Responsibilities

The **loader** shall:

- **L-1** resolve `prescriptionFormulaDefinitions` through the registry using the
  frozen, generic lifecycle — resolve request → registry lookup → load source →
  validate against contract → freeze → cache → assemble bundle → return;
- **L-2** remain domain-agnostic: it gains no knowledge that this identifier is
  "definitions" and applies the same lifecycle it applies to every entry;
- **L-3** validate the resolved slice against the entry's contract before exposing
  it, and expose only validated content;
- **L-4** deep-freeze the resolved value so the served slice is immutable;
- **L-5** cache per its existing policy; caching introduces no cross-run mutation;
- **L-6** on absent or contract-failing content, resolve the identifier to absence
  (§11), never to unvalidated data, and never fail an otherwise-valid clinical run
  on account of this slice.

The loader lifecycle itself is frozen; wiring changes only *what the entry
resolves to*, not the algorithm.

---

## Part C — Guarantees

### 9. Runtime Guarantees

- **RG-1 Availability.** Once wired, a module requesting
  `prescriptionFormulaDefinitions` receives the real, validated, immutable slice
  instead of absence — the sole intended observable change.
- **RG-2 Immutability.** The served slice is deep-frozen; consumers read, never
  mutate.
- **RG-3 Validated-or-absent.** A module never receives structurally invalid
  content; it receives either a contract-valid slice or absence.
- **RG-4 Determinism.** For a fixed authored corpus and registry, resolution yields
  the same slice across runs.
- **RG-5 No behavioral change beyond availability.** Prompts, schemas, modules, the
  loader algorithm, the transport contract, and Option B semantics are otherwise
  unchanged (Wiring Boundaries, doc 22 §10).

### 10. Dependency Guarantees

- **DG-1** Runtime resolution of definitions is independent of the catalog slice
  (CD-1).
- **DG-2** Referential integrity is guaranteed at build time, one-way
  (definitions → catalog), against the authored corpora (CD-2).
- **DG-3** No cycle exists and none is introduced: the catalog neither references
  nor is aware of definitions (CD-3).
- **DG-4** Wiring order is unconstrained relative to catalog runtime wiring, subject
  only to the build-time reference check being satisfiable (already satisfied at
  135 ↔ 135 parity).

### 11. Failure Behavior

- **FB-1 Registry inconsistency** (missing/duplicate identifier, missing source or
  contract) fails at initialization as a registry error — surfaced, not silently
  tolerated.
- **FB-2 Absent content** (source yields nothing) resolves the identifier to
  absence; the module injects `"(none provided)"` (Option B). Not a runtime failure.
- **FB-3 Contract-failing content** resolves to absence at runtime rather than
  serving unvalidated data (RG-3); such content is expected to be caught before
  deployment (V-2, and V-3 at build time).
- **FB-4 Cross-content failure** (a referenced formula absent from the catalog) is a
  **build-time** failure surfaced before deployment; it does not degrade at runtime,
  because integrity is a pre-runtime guarantee.
- **FB-5 No clinical-run failure from this slice.** In no case does absence or
  invalidity of this slice fail an otherwise-valid clinical run; Option B absorbs
  it. Clinical behaviour under absence is identical to today's behaviour.

### 12. Future Growth Behavior

- **FG-1 Additive definition growth.** New definition content is incorporated by
  extending the authoritative corpus (and its derived form); the registry entry,
  loader, and contract *mechanism* are unchanged — the source yields more entries,
  the contract validates them identically.
- **FG-2 Catalog growth.** New catalog identities without matching definitions
  simply resolve to absence for those identities (Option B); no wiring change is
  forced. Restoring parity is future definition authoring, not a wiring change.
- **FG-3 Additive fields/interfaces.** Citations, provenance, historical notes, and
  metadata attach *beside* the entry as new fields/layers/interfaces (frozen
  Specification §8); they never fold into the objective explanation and never expand
  the v1 two-field entry.
- **FG-4 Append-only history.** Wiring never rewrites approved content; growth is by
  extension, consistent with Authoring Independence and Batch Closure.
- **FG-5 Stable mechanism.** None of the above requires a change to the framework,
  loader, registry mechanism, transport contract, or Option B.

---

## 13. Invariants (must hold before and after wiring)

- **INV-1 Single source of truth for meaning** — the authored corpus (RR-1).
- **INV-2 Ownership preserved** — catalog owns identity, definitions own meaning; no
  migration, no duplication.
- **INV-3 Framework unchanged** — transport contract, loader algorithm, module
  Template Method, and Option B are not modified; wiring is additive and confined to
  one registry entry's source and contract.
- **INV-4 One-way dependency** — definitions → catalog only; no runtime coupling.
- **INV-5 Validated-or-absent** — no unvalidated content ever reaches a module.
- **INV-6 Immutability** — served content is deep-frozen.
- **INV-7 Domain-agnostic transport** — no clinical vocabulary enters the framework,
  registry mechanism, or loader.

## 14. Sufficiency Review

**The frozen Runtime, Knowledge Framework, Production Loader, Registry, Knowledge
Content Architecture, Formula Catalog, and the frozen Definition interface artifacts
fully support this wiring specification. No architectural limitation; the
Implementation Plan may proceed.** The only new elements are (a) a real source
deriving structured data from the authoritative corpus, (b) a real per-slice
validation contract, and (c) activation of the build-time cross-content reference
check — all Knowledge-Layer concerns for later steps, each additive, none requiring
a change to the framework, loader, registry mechanism, transport contract, or
Option B.

## Scope

Specification only. No implementation, no contract, no loader, no registry source,
no content change, and no change to any existing file. Resolves the Step 1
architectural questions and defines wiring responsibilities, guarantees, failure
behavior, and growth behavior at a conceptual level; defers all *how* to Step 3
(Implementation Plan).
