# Prescription Formula Definitions — Wiring Implementation Plan

**Prescription Formula Definitions · Wiring Sprint · Step 3 (Implementation Plan).**
Status: **PROPOSED — PENDING REVIEW.** This document translates the approved Wiring
Architecture Review (`docs/architecture/22`) and Wiring Specification
(`docs/architecture/23`) into a concrete implementation *sequence*. It is
**planning only**: it implements nothing, creates no source, contract, loader, or
validation code, modifies no existing file, and does not commit. It conforms to the
frozen interface artifacts (`docs/architecture/18`–`21`) and the frozen
transport/loader/registry architecture (`docs/architecture/11`–`16`).

### Grounding (verified against the current codebase)

- **Registry mechanism** — `src/ai/knowledge/KnowledgeRegistry.ts` defines
  `KnowledgeSource = () => unknown | Promise<unknown>`,
  `KnowledgeContract = (raw) => KnowledgeValidation`,
  `KnowledgeRegistryEntry = { identifier, source, contract }`, and
  `validateRegistry(...)`.
- **Inventory** — `src/ai/knowledge/productionRegistry.ts` currently binds
  `prescriptionFormulaDefinitions` via `pending(...)` to `emptySource`
  (`() => undefined`) and `unauthoredContract` (absent → valid empty; present →
  refused). One line: `pending("prescriptionFormulaDefinitions")`.
- **Loader** — `src/ai/knowledge/ProductionKnowledgeLoader.ts` is fully generic:
  resolve → registry lookup → `source()` → `contract(raw)` → `deepFreeze` → cache →
  assemble → `Object.freeze(bundle)`. It contains no identifier branching.
- **Content** — `src/ai/knowledge/content/prescription-formula-definitions.md`
  (135 definitions) and `.../formula-catalog.md` (135 identities), frozen, at
  verified 135↔135 parity, unwired.
- **Consumption** — the requesting module reads its slice via
  `knowledgeOrNone(this.knowledge, "prescriptionFormulaDefinitions")`
  (`src/ai/modules/knowledgeFallback.ts`), substituting `"(none provided)"` on
  absence (Fallback Option B).

> **Terminology note.** This plan discusses two *derivation* strategies the Step 3
> requirements call "Option A / Option B". To avoid collision with the frozen
> **Fallback Option B** (graceful absence), derivation choices are labelled
> **Derivation A (build-time)** and **Derivation B (load-time)** below; "Option B"
> unqualified always means the fallback.

---

## 1. Wiring Goal — exact completion state

At the end of wiring, all of the following hold and nothing else changes:

- **Registry entry active** — the `prescriptionFormulaDefinitions` entry binds a
  real source and a real contract (no longer `emptySource`/`unauthoredContract`).
- **Source active** — resolving the identifier yields the structured definitions
  slice derived losslessly from the authoritative artifact.
- **Contract active** — a real per-slice structural contract validates each entry
  (two fields; no duplicates; nothing accreted).
- **Validation active** — registry validation, structure validation, and the
  build-time cross-content reference check are all real for this slice.
- **Runtime retrievable** — a module requesting the identifier receives the real,
  validated, immutable slice through the unchanged loader/transport path.
- **Fallback Option B preserved** — absence or invalidity still degrades to
  `"(none provided)"`; no clinical run fails on account of this slice.
- **Everything else unchanged** — framework types, loader algorithm, module Template
  Method, transport contract, and all other registry entries are untouched.

## 2. Runtime Representation Strategy

Per Wiring Specification Part A §1:

- **Authoritative source** — the frozen `prescription-formula-definitions.md`
  corpus. It remains the *single source of truth for meaning* (INV-1); wiring
  introduces no competing or hand-maintained duplicate corpus.
- **Runtime representation** — a structured collection of Definition entries, each
  carrying exactly two fields (referenced canonical formula + objective
  explanation), consumable by the contract and the module.
- **Transformation boundary** — a single, deterministic, lossless, non-interpretive
  derivation from prose corpus → structured data. This boundary is the only new
  "logic"; it adds no meaning, infers nothing, and owns no clinical decision.

### Derivation A — build-time derivation

A deterministic generator reads the authoritative markdown and emits a structured
data artifact (checked-in generated file or build output). The registry source
imports/loads that structured artifact; no prose is parsed at runtime.

- **Pros** — errors (malformed entry, parity/reference break) surface **at build**,
  not as silent runtime absence; no runtime parsing cost or fragility; the served
  value is trivially contract-validatable; drift is preventable by a build gate that
  regenerates and diffs.
- **Cons** — introduces a *derived* artifact that must be regenerated when content
  changes; requires a guard to prevent stale generated output.

### Derivation B — load-time derivation

The registry source parses the authoritative markdown at load time and returns the
structured collection; the loader caches the validated result for the process.

- **Pros** — no generated second artifact; the markdown is read directly, so
  single-source-of-truth is maximally literal.
- **Cons** — parsing fragility becomes a **runtime** concern; a parse failure
  degrades silently to Fallback Option B (absence), which would *hide a real
  authoring/wiring defect* behind graceful fallback; parser lives on the runtime
  path.

### Recommendation — **Derivation A (build-time)**

Recommended because it best satisfies the specification's fail-fast posture
(FB-3/FB-4: invalid or reference-breaking content must be "caught before
deployment"). Build-time derivation *is* that catch: structural and cross-content
errors fail the build instead of collapsing into runtime absence, where a genuine
defect would masquerade as ordinary Option-B fallback. It keeps parsing off the
clinical runtime path, and it preserves single-source-of-truth (RR-1/RR-2) because
the derived artifact is **generated deterministically from the authoritative
markdown, never hand-authored** — with a build-time regenerate-and-verify guard to
prevent drift. Derivation B remains architecturally valid and Option-B-safe; it is
the fallback choice if a build-time generation step is later deemed undesirable. The
two are not mutually exclusive long-term (a source could parse at build and cache),
so this decision is reversible without touching the framework.

## 3. Registry Source Plan

- **Responsibilities** — yield the resolved `prescriptionFormulaDefinitions` slice
  as structured data derived losslessly from the authoritative corpus (S-1); exactly
  two fields per entry (S-2); data only, never prompt formatting (S-3); no clinical
  logic/selection/mapping/interpretation (S-4); resolvable behind the `load()` seam
  (S-5); yield absence rather than partial/unvalidated data on failure (S-6).
- **Inputs** — the authoritative artifact (via the Derivation-A generated structured
  form). No network, no clinical parameters, no request context.
- **Outputs** — one value conforming to the `KnowledgeSource` type
  (`() => unknown | Promise<unknown>`): the complete definitions collection (or
  `undefined` on inability to produce valid content).
- **Boundaries** — transports meaning; does not author, alter, supplement, format,
  or reason about it; unaware of the catalog slice at runtime.
- **Artifact to create** — a source module exporting a `KnowledgeSource`, e.g.
  `src/ai/knowledge/content/sources/prescriptionFormulaDefinitionsSource.ts`, plus
  (under Derivation A) the deterministic generator and its generated structured
  artifact, e.g. `.../content/generated/prescription-formula-definitions.generated.ts`
  (or `.json`). Exact paths/names are an implementation detail for the first
  implementation step.

## 4. Contract Plan

- **Responsibilities** — validate *structure only*, one slice in isolation (C-1);
  each entry references a non-empty canonical formula and carries a non-empty
  explanation (C-2); no duplicate definitions of the same referenced formula (C-3);
  each entry carries only the two permitted fields (C-4, Minimal Definition);
  deterministic and side-effect-free (C-5); pass/fail verdict only — no repair or
  transform (C-6).
- **Boundaries** — does **not** confirm catalog existence of a reference (that is
  cross-content, §5), and does **not** judge clinical correctness (Clinical
  Evaluation).
- **Structure validation scope** — shape and field-presence of the definitions
  collection and its entries; returns `KnowledgeValidation`
  (`{valid:true,value}` | `{valid:false,issues}`).
- **Ownership boundaries** — the contract owns structural truth for this slice only;
  it owns no identity, no relationships, no meaning-correctness.
- **Artifact to create** — a contract module exporting a `KnowledgeContract`, e.g.
  `src/ai/knowledge/contracts/prescriptionFormulaDefinitionsContract.ts`.

## 5. Validation Plan — where each responsibility belongs

- **Registry validation** — `validateRegistry(...)` in `KnowledgeRegistry.ts`
  (already implemented, unchanged): entry well-formed, unique identifier, source and
  contract present. Runs at loader construction; violations throw
  `KnowledgeRegistryError` at initialization (FB-1). *No new work; it begins
  covering a real entry automatically once upgraded.*
- **Structure validation** — the new per-slice contract (§4), invoked by the loader
  via `entry.contract(raw)`. Authoritative for structure (V-2).
- **Cross-content validation** — a **build-time** check that every referenced
  canonical formula exists in the Formula Catalog, reading the two authoritative
  corpora (one-way, definitions → catalog). Not a runtime step; not inside the
  single-slice contract (V-3). Artifact to create: a build/test-time checker, e.g.
  `src/ai/knowledge/content/checks/prescriptionFormulaDefinitionsReferences.check.ts`
  (or a test under the existing test layer).
- **Runtime assumptions** — a successfully loaded slice is structurally trusted; the
  module reads it without re-validating (V-4/RG-3). Clinical Evaluation remains
  human-owned and outside all runtime components (V-5 separation preserved).

## 6. Registry Integration Plan

- **How the placeholder is upgraded** — in `productionRegistry.ts`, replace the
  single `pending("prescriptionFormulaDefinitions")` element with an explicit entry
  binding the real source (§3) and real contract (§4). All other entries remain
  `pending(...)`.
- **What changes** — exactly one array element in one file; imports for the new
  source and contract modules.
- **What remains unchanged** — the `pending` helper, `emptySource`,
  `unauthoredContract`, every other entry, the registry mechanism
  (`KnowledgeRegistry.ts`), the loader, the transport types, and bootstrap wiring.
- **Preserves** — registry architecture (generic identifier → {source, contract});
  transport architecture (opaque identifier/value); loader architecture (generic,
  registry-derived). No identifier added or removed; Registry Completeness intact.

## 7. Loader Impact Analysis

**Conclusion: no loader work is required; existing loader behavior is sufficient.**

Justification: `ProductionKnowledgeLoader` already performs the entire lifecycle
generically — it calls `entry.source()`, validates with `entry.contract(raw)`,
`deepFreeze`s the validated value, caches it, and assembles a frozen bundle, with
absence handling for unresolved/malformed slices (Option B). It has no
identifier-specific branching. Upgrading the registry entry changes *what the entry
resolves to*, which the loader already handles by design (Registry Evolution
Principle: "to serve a new interface, add a registry entry, a contract, and content;
this loader never changes"). Any loader change would be a red flag that the wiring
had leaked domain specifics into the generic mechanism.

## 8. Runtime Access Plan

- **Runtime retrieval path** — module `knowledgeRequest()` includes
  `prescriptionFormulaDefinitions` → `KnowledgeLoader.load(request)` → `resolve` →
  registry lookup → `source()` → `contract(raw)` → `deepFreeze` → cache →
  `bundle["prescriptionFormulaDefinitions"] = value` → `Object.freeze(bundle)`.
- **Module access path** — `execute` populates `this.knowledge` before `variables()`;
  the module reads the slice via
  `knowledgeOrNone(this.knowledge, "prescriptionFormulaDefinitions")` and renders it
  into prompt reference context (module owns prompt-shaping, RB-2).
- **Fallback behavior** — unchanged. When the slice is present, `knowledgeOrNone`
  yields it (string as-is, else serialized); when absent, it yields
  `"(none provided)"`. This must remain consumable **without changing the accessor or
  the module Template Method** (RB-3); any richer module-side rendering is additive
  and Option-B-preserving.
- **Consistency** — the only observable change is availability (RG-1/RG-5): the slice
  that previously resolved to absence now resolves to real content; behaviour under
  absence is identical to today.

## 9. Dependency Plan

- **Catalog dependency handling** — one-way (definitions → catalog), enforced at
  **build time** against the authoritative corpora (§5 cross-content). No runtime
  read of the catalog slice is introduced.
- **Validation dependency handling** — structure (contract, per-slice) and
  referential integrity (cross-content, build-time) stay separate and never merge
  (V-5); Clinical Evaluation stays human-owned.
- **Runtime dependency handling** — the definitions entry resolves independently of
  every other entry (loader resolves per identifier); no cross-entry coupling.
- **Confirmations** — **one-way dependency** (definitions → catalog) ✔;
  **no runtime coupling** (catalog need not be wired/loaded for definitions to
  resolve) ✔; **no circular dependency** (catalog never references definitions) ✔.
  Sequencing is therefore unconstrained (DG-4): definitions wiring may proceed
  before, after, or independently of Formula Catalog wiring, given parity already
  makes the build-time check satisfiable.

## 10. Implementation Sequence (recommended order)

1. **Step 1 — Derivation + structured form.** Implement the deterministic generator
   and produce the generated structured artifact from the authoritative markdown
   (Derivation A). Include the regenerate-and-verify guard that fails on drift.
2. **Step 2 — Source.** Implement the `KnowledgeSource` that yields the structured
   collection (data only; absence on failure).
3. **Step 3 — Contract.** Implement the per-slice `KnowledgeContract` (two fields;
   no duplicates; nothing accreted; structure only).
4. **Step 4 — Unit-validate source + contract in isolation.** Tests: valid corpus
   passes; malformed/duplicate/accreted entries fail; absence yields the empty-valid
   outcome. (No registry change yet.)
5. **Step 5 — Cross-content check.** Implement the build-time reference check
   (every referenced formula ∈ catalog; expect 135↔135). Runs green against current
   corpora.
6. **Step 6 — Registry upgrade.** Replace the one `pending(...)` element with the
   real `{ identifier, source, contract }` entry; add imports. Nothing else in the
   file changes.
7. **Step 7 — Runtime retrieval test.** Prove a module request for the identifier
   returns the real, validated, immutable slice; prove `knowledgeOrNone` surfaces it;
   prove absence still yields `"(none provided)"` (Option B) when the source is made
   to yield nothing.
8. **Step 8 — Full verification.** Run all gates (typecheck, lint, tests, build);
   confirm parity, immutability, and that no other registry entry or framework file
   changed.

Each step is independently reviewable and frozen/committed per the standing
step-gated workflow, in this order, with review between steps as directed.

## 11. Completion Criteria (objective)

- **Source exists** and yields the structured slice from the authoritative corpus.
- **Contract exists** and enforces the two-field structure (rejects
  malformed/duplicate/accreted entries).
- **Cross-content check exists** and passes at 135↔135.
- **Registry upgraded** — exactly one entry changed from placeholder to real; all
  others unchanged; `validateRegistry` passes.
- **Validation passes** — registry, structure, and cross-content all green.
- **Runtime retrieval succeeds** — a requesting module receives the real, validated,
  immutable slice via the unchanged loader/transport path.
- **Fallback Option B preserved** — induced absence yields `"(none provided)"`; no
  clinical run fails from this slice.
- **Parity preserved** — 135 definitions ↔ 135 catalog identities, unchanged.
- **All gates pass** — typecheck, lint, tests, build.
- **No collateral change** — framework types, loader algorithm, module Template
  Method, transport contract, and all other registry entries untouched.

## 12. Risk Assessment

| Risk | Description | Mitigation |
|---|---|---|
| **Implementation — silent absence hides a defect** | A parse/derivation failure degrades to Fallback Option B, masking a real authoring/wiring bug. | Derivation A: fail at build (regenerate-and-verify guard + cross-content check), so defects surface pre-deployment (FB-3/FB-4). |
| **Implementation — derived-artifact drift** | Generated structured form goes stale vs. the markdown. | Build gate regenerates and diffs; mismatch fails the build. Single-source-of-truth remains the markdown. |
| **Ownership — meaning duplicated/altered in derivation** | Derivation adds/edits meaning, creating a second source of truth. | Derivation is lossless, non-interpretive, two-field-only (RR-2/RR-3, S-1/S-2); reviewed against the authoritative corpus; no hand-authoring of the derived form. |
| **Ownership — source or contract absorbs another layer's job** | Source formats prompts, or contract checks catalog existence / clinical correctness. | Enforce boundaries: source emits data only (S-3); contract is structure-only (C-1), no cross-slice, no clinical judgment; cross-content stays build-time (V-3). |
| **Dependency — runtime coupling to catalog** | Definitions source reads the catalog slice at runtime, creating coupling/ordering. | Referential integrity is build-time only against authored corpora; source has no catalog input (CD-1/CD-3, DG-1..3). |
| **Dependency — circularity** | A reverse catalog → definitions reference is introduced. | One-way by construction; catalog remains unaware of definitions; verified by the reference check. |
| **Validation — layers merged** | Structure, referential integrity, and meaning conflated in one place. | Keep four layers separate (V-1..V-5): registry (init), contract (structure), cross-content (build), Clinical Evaluation (human). |
| **Validation — unvalidated content served** | Loader serves raw content bypassing the contract. | Existing loader already validates before exposing and degrades malformed to absence; contract is mandatory per entry (RG-3). |
| **Process — collateral edits / history rewrite** | Upgrade sweeps in unrelated changes or rewrites frozen content. | Single-file targeted registry edit; append-only; verify staged file count before any commit; frozen corpora untouched (INV-3, append-only). |

## Review Standards

This plan is implementation-neutral where possible (it names candidate artifacts and
paths as *examples*, defers exact shapes to implementation), preserves ownership and
single-source-of-truth, preserves Fallback Option B, preserves append-only history,
and preserves every frozen architectural decision. It proposes no new principle and
reverses no prior decision.

## Scope

Implementation plan only. No implementation, no source, no contract, no loader, no
validation code, no content change, and no change to any existing file. Defines the
sequence, artifacts-to-create, guarantees, completion criteria, and risks for the
subsequent implementation steps; the first implementation artifact awaits review.
