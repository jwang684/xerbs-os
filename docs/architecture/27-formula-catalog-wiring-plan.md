# Formula Catalog — Wiring Implementation Plan

**Formula Catalog · Wiring Sprint · Step 3 (Implementation Plan).** Status:
**PROPOSED — PENDING REVIEW.** This document translates the approved Formula Catalog
Wiring Review (`docs/architecture/25`) and Wiring Specification
(`docs/architecture/26`) into a concrete implementation *sequence*. It is
**planning only**: it implements nothing, creates no source, contract, validator,
generator, registry entry, test, or runtime code, modifies no existing file, and
does not commit. It conforms to the frozen transport/loader/registry architecture
(`docs/architecture/11`–`16`) and reuses the pattern already proven end-to-end for
the sibling meaning layer (`docs/architecture/22`–`24`;
`prescriptionFormulaDefinitions` runtime wiring complete).

### Grounding (verified against the current codebase)

- **Registry** — `src/ai/knowledge/productionRegistry.ts` still binds
  `formulaCatalog` via `pending("formulaCatalog")` (`emptySource` +
  `unauthoredContract`). `prescriptionFormulaDefinitions` is already a real entry;
  the other six identifiers — including `formulaCatalog` — remain `pending(...)`.
- **No real catalog artifacts exist yet** — there is no `formulaCatalog` source,
  contract, generated artifact, or derivation module.
- **Authored corpus** — `src/ai/knowledge/content/formula-catalog.md` (135 canonical
  names, frozen, `- <Name>` bullets), at verified 135↔135 parity with the definitions
  collection.
- **Loader / transport** — `ProductionKnowledgeLoader.ts` is generic
  (`resolve → source() → contract(raw) → deepFreeze → cache → assemble`), and the
  transport types are unchanged.
- **Existing consumer** — `PrescriptionModule.knowledgeRequest()` already includes
  `formulaCatalog: true` and reads it via
  `knowledgeOrNone(this.knowledge, "formulaCatalog")`, rendering `{{formulaCatalog}}`
  in `prescription.md`.
- **Reusable precedent** — the definitions cross-content validator
  (`src/ai/knowledge/validation/prescriptionFormulaDefinitionsCrossContent.ts`)
  already contains an authoritative catalog-identity parser
  (`parseFormulaCatalogIdentities` / `loadFormulaCatalogIdentities`) reading the same
  `formula-catalog.md`. Reusing it avoids a second catalog source of truth.

> **Terminology note.** "Derivation A / Derivation B" below name the two *derivation
> strategies*; they are distinct from the frozen **Fallback Option B** (graceful
> absence), which is always written "Option B" unqualified.

---

## 1. Wiring Goal — completed state

At the end of wiring, all of the following hold and nothing else changes:

- **`formulaCatalog` resolves at runtime** — the entry binds a real source and a real
  contract (no longer `emptySource`/`unauthoredContract`).
- **Canonical identities become available through the production loader** — resolving
  the identifier yields the validated, immutable canonical-name set.
- **Ownership remains identity-only** — a served entry is a bare canonical name;
  nothing else enters it (Minimal Vocabulary).
- **No module changes** — `knowledgeRequest()`, `variables()`, `knowledgeOrNone`, and
  the `{{formulaCatalog}}` template are untouched.
- **No framework changes** — transport contract, loader algorithm, and Option B
  unchanged.

**Observable runtime difference (the only one):**
- **Before** — `formulaCatalog` → absent → `{{formulaCatalog}}` renders
  `"(none provided)"` (Option B).
- **After** — `formulaCatalog` → validated, frozen canonical-name set → the real
  names render into `{{formulaCatalog}}`.

## 2. Runtime Representation Strategy

Per Wiring Specification §B.1:

- **Authoritative source** — the frozen `formula-catalog.md`. It remains the single
  source of truth for identity; wiring introduces no competing or hand-maintained
  duplicate name-space.
- **Runtime representation** — a **flat, readonly array of canonical-name strings**,
  in source order, derived losslessly and non-interpretively (no add, drop, reorder,
  or normalize).

### Derivation A — build-time derivation
A deterministic generator reads the authoritative markdown and emits a structured
data artifact (checked-in generated file). The registry source imports that artifact;
no prose is parsed at runtime.
- **Pros** — structural/fidelity errors surface at **build**, not as silent runtime
  absence; no runtime parsing cost/fragility; trivially contract-validatable; drift
  preventable by a regenerate-and-verify guard; **consistent with the definitions
  wiring** (which used Derivation A).
- **Cons** — introduces a generated artifact that must be regenerated on content
  change; needs a drift guard.

### Derivation B — load-time derivation
The source parses `formula-catalog.md` at load time and returns the string list;
the loader caches the result for the process.
- **Pros** — no generated second artifact; reads the markdown directly.
- **Cons** — parsing fragility becomes a **runtime** concern; a parse failure
  degrades silently to Option B (absence), hiding a real authoring/wiring defect;
  parser on the runtime path; **diverges from the definitions precedent**.

### Recommendation — **Derivation A (build-time)**

Recommended for the same reasons ratified for the definitions layer, and to keep the
two sibling layers consistent:
- **Fail-fast posture** — build-time derivation catches malformed content and drift
  before deployment (FB-3), instead of collapsing into runtime absence where a defect
  masquerades as ordinary Option-B fallback.
- **Single source of truth** — the generated artifact is produced deterministically
  from the authoritative markdown, never hand-authored; a regenerate-and-verify guard
  prevents drift, so the markdown stays authoritative (INV-1).
- **Consistency with definitions wiring** — same shape of pipeline (parser +
  generator + generated artifact + no-drift test), lowering cognitive and maintenance
  cost.
- **Drift protection** — a build/test-time check re-derives from the markdown and
  asserts equality with the checked-in artifact.

Derivation B remains valid and Option-B-safe as a fallback choice; the decision is
reversible without touching the framework. **Note (reuse opportunity):** a correct
catalog parser already exists in the definitions cross-content module
(`parseFormulaCatalogIdentities`); the plan reuses that parsing logic rather than
authoring a second one (§10, Step 1), preserving one catalog source of truth.

## 3. Registry Source Plan

- **Responsibilities** — supply the resolved `formulaCatalog` slice as structured data
  (a flat canonical-name string array) derived losslessly from the authoritative
  corpus. Identities only.
- **Inputs** — the authoritative catalog derivation (the Derivation-A generated
  string list). No network, no request context, no other slice.
- **Outputs** — one value conforming to the `KnowledgeSource` type
  (`() => unknown | Promise<unknown>`): the complete identity collection (or
  `undefined` on inability to produce valid content).
- **Boundaries** — no aliases, translations, meanings, classifications, mappings,
  reasoning, or validation; emits data only, never prompt formatting; unaware of any
  other slice at runtime.
- **Artifact(s) to create (later steps)** — a source module exporting a
  `KnowledgeSource`, e.g. `src/ai/knowledge/sources/formulaCatalogSource.ts`, plus
  (under Derivation A) a deterministic generator and its generated string-list
  artifact, e.g. `.../content/generated/formula-catalog.generated.ts`, using the
  shared catalog parser. Exact paths/names are an implementation detail for Step 1 of
  the sequence.

## 4. Contract Plan

- **Must validate** (structure only) — the slice is an **array**; each entry is a
  **string**; each name is **non-empty** after trimming; **no duplicate** names
  (unique identity).
- **Must not validate** — editorial conventions, naming style, Title Case, tone
  marks, meaning, cross-slice references, or parity.
- **Why** — naming convention / editorial style / terminology are authoring standards
  owned by human/editorial review, not structural facts a runtime contract can
  adjudicate; encoding them turns a structure gate into an editorial-policy engine,
  couples runtime validation to mutable style, and risks rejecting a frozen name over
  a regex. References and parity are cross-content concerns (and, for the catalog,
  inbound-only — see §9); meaning is a different interface entirely. Structure /
  editorial / referential / semantic layers stay separate.
- **Future contract artifact** — a `KnowledgeContract` module, e.g.
  `src/ai/knowledge/contracts/formulaCatalogContract.ts`, deterministic and
  side-effect-free, returning the validated value unchanged (no repair).

## 5. Validation Plan — layer ownership

- **Layer 1 — Registry validation** — `validateRegistry(...)` in
  `KnowledgeRegistry.ts` (already implemented, unchanged): entry well-formed, unique
  identifier, source + contract present. Runs at loader construction; violations throw
  at initialization. No new work; it begins covering the real entry once upgraded.
- **Layer 2 — Contract validation** — the new per-slice contract (§4), invoked by the
  loader via `entry.contract(raw)`. Authoritative for structure.
- **Layer 3 — Derivation fidelity / no-drift** — a build-time check that the generated
  artifact equals a fresh derivation of the authoritative markdown (Derivation A's
  regenerate-and-verify guard). Guarantees single-source-of-truth and catches stale
  artifacts before deployment.
- **Layer 4 — Runtime trust / human review** — a loaded slice is structurally trusted
  at runtime (no re-validation); editorial/canonicalization correctness remains
  human-owned. **The catalog introduces no outbound cross-content check of its own**
  — it is the *target* of the existing `prescriptionFormulaDefinitions` →
  `formulaCatalog` build-time check, which is unaffected by runtime wiring.

## 6. Registry Integration Plan

- **Current state** — `pending("formulaCatalog")` (one array element).
- **Future state** — an explicit entry
  `{ identifier: "formulaCatalog", source: formulaCatalogSource, contract: formulaCatalogContract }`,
  plus imports for the new source and contract.
- **Exactly one registry entry changes** — the `formulaCatalog` element; all six other
  entries remain `pending(...)`.
- **No registry mechanism changes** — the `pending` helper, `emptySource`,
  `unauthoredContract`, `KnowledgeRegistryEntry`, and `validateRegistry` are
  untouched.
- **No loader changes** (see §7).
- **Untouched explicitly** — `ProductionKnowledgeLoader.ts`, `KnowledgeRegistry.ts`,
  the transport types (`KnowledgeSource`/`Contract`/`Validation`/`Bundle`), every
  module, every prompt template, `bootstrap.ts` wiring, and the already-wired
  `prescriptionFormulaDefinitions` entry.

## 7. Loader Impact Analysis

**Conclusion: no loader work is required; existing loader behavior already supports
this slice.**

- **Why unnecessary** — `ProductionKnowledgeLoader` already performs the full
  lifecycle generically: `resolve → registry lookup → entry.source() →
  entry.contract(raw) → deepFreeze → cache → assemble → Object.freeze(bundle)`, with
  absence handling for unresolved/malformed slices (Option B). Upgrading the registry
  entry changes only *what the entry resolves to*, which the loader already handles.
- **Why generic behavior suffices** — the loader has no identifier branching; it
  treats `formulaCatalog` exactly as it treats the already-wired definitions slice.
  It was proven to serve a real slice in the definitions wiring with zero loader
  changes.
- **Why modifying it would be wrong** — the Registry Evolution Principle states that a
  new interface is served by adding a registry entry, a contract, and content — not by
  touching the loader. A loader edit would leak domain specifics into the generic
  mechanism and is an architectural failure.

## 8. Runtime Access Plan

Expected runtime flow (all seams already exist; wiring feeds them real content):

```
formula-catalog.md (authoritative)
  → derivation (build-time generated string list)
  → formulaCatalogSource()                       // yields readonly string[]
  → formulaCatalogContract(raw)                  // structural validation → value
  → registry entry (formulaCatalog)              // one upgraded binding
  → ProductionKnowledgeLoader.load({...})        // resolve → validate → freeze → cache
  → KnowledgeBundle["formulaCatalog"]            // deep-frozen string[]
  → knowledgeOrNone(this.knowledge,"formulaCatalog")  // JSON.stringify(non-string)
  → {{formulaCatalog}}                           // existing template slot
```

**Why no module changes are required** — `PrescriptionModule` already requests
`formulaCatalog`, already reads it via the unchanged `knowledgeOrNone` accessor, and
the template already renders `{{formulaCatalog}}`. Wiring only changes what the
accessor receives (real names instead of absence); the request, variables, accessor,
and template are untouched (INV-9).

## 9. Dependency Plan

- **Dependency direction** — *dependents → catalog* (inbound only). Definitions (and
  future mappings) reference catalog identities; the catalog references nothing.
- **Runtime independence** — the `formulaCatalog` entry resolves independently of
  every other entry (per-identifier resolution); no runtime load-order dependency
  between catalog and definitions.
- **No circularity** — because the catalog references nothing, it can be in no cycle;
  it is an outbound leaf.
- **Relationship to definitions wiring** — definitions may reference catalog
  identities (reconciled by the existing build-time definitions→catalog check reading
  authoritative corpora), but catalog wiring itself depends on nothing and needs no
  outbound cross-content check. Catalog wiring may proceed before, after, or
  independently of the (already-complete) definitions wiring.

## 10. Implementation Sequence (recommended order)

Each step is independently reviewable, independently freezable, and append-only
(prior steps unchanged):

1. **Step 1 — Derivation layer.** Implement the deterministic derivation producing the
   flat canonical-name string list from the authoritative markdown (Derivation A),
   reusing the existing catalog parser. Produce the generated artifact and a
   regenerate-and-verify (no-drift) guard.
2. **Step 2 — Source.** Implement the `KnowledgeSource` yielding the string list
   (data only; absence on failure).
3. **Step 3 — Contract.** Implement the structural `KnowledgeContract` (array;
   non-empty strings; uniqueness; structure only; no repair).
4. **Step 4 — Validation.** Unit-validate source + contract in isolation (valid corpus
   passes; malformed/duplicate/empty fail; absence → empty-valid). Confirm the
   existing definitions→catalog cross-content check remains green (135↔135). No
   registry change yet.
5. **Step 5 — Registry upgrade.** Replace the one `pending("formulaCatalog")` element
   with the real `{ identifier, source, contract }` entry; add imports. Nothing else
   in the file changes.
6. **Step 6 — Runtime retrieval verification.** Prove a module request for
   `formulaCatalog` returns the real, validated, immutable string list; prove
   `knowledgeOrNone` surfaces it into `{{formulaCatalog}}`; prove induced absence
   still yields `"(none provided)"` (Option B); confirm no regression in AI
   module/engine tests.
7. **Step 7 — Full gate verification.** Run all gates (typecheck, lint, tests, build);
   confirm parity, immutability, and that no other registry entry or framework file
   changed.

## 11. Completion Criteria (objective)

- **Source exists** and yields the flat canonical-name string list from the
  authoritative corpus.
- **Contract exists** and enforces array + non-empty strings + uniqueness (rejects
  malformed/duplicate/empty), with no repair.
- **Validation green** — registry validation, structure validation, and derivation
  no-drift all pass; the definitions→catalog cross-content check stays green at
  135↔135.
- **Runtime retrieval succeeds** — a requesting module receives the real, validated,
  immutable slice via the unchanged loader/transport path, and it renders into
  `{{formulaCatalog}}`.
- **Registry upgraded** — exactly one entry changed from placeholder to real; all
  others unchanged; `validateRegistry` passes.
- **Loader unchanged** — `ProductionKnowledgeLoader.ts` byte-for-byte unchanged.
- **Option B preserved** — induced absence yields `"(none provided)"`; no clinical run
  fails from this slice.
- **Build passes** and **tests pass** (typecheck, lint, vitest, `next build`).
- **No collateral change** — framework types, loader algorithm, module Template
  Method, transport contract, and all other registry entries untouched.

## 12. Risk Assessment

| Category | Risk | Consequence | Mitigation |
|---|---|---|---|
| Implementation | Parse/derivation failure degrades silently to Option B | A real authoring/wiring defect is masked as ordinary absence | Derivation A: fail at build via regenerate-and-verify + structure checks (FB-3), surfacing defects pre-deployment |
| Implementation | Generated artifact drifts from the markdown | Runtime serves stale identities | Build/test-time no-drift guard re-derives and diffs; markdown stays authoritative |
| Ownership | Derivation/source adds a field, alias, translation, or ordering change | Identity layer stops being identity-only; Minimal Vocabulary violated | Lossless, non-interpretive, string-only derivation (CR-2/CR-3); reviewed against the corpus; no hand-authoring |
| Ownership | Contract or source absorbs another layer's job (convention/reference/meaning) | Layer boundaries collapse; editorial policy encoded in runtime | Contract is structure-only (§4); references/parity stay build-time and inbound-only; meaning is a separate interface |
| Dependency | A runtime read of another slice (or reverse catalog→X reference) is introduced | Runtime coupling / possible cycle | Catalog references nothing (§9); source has no other-slice input; direction stays dependents → catalog |
| Dependency | Assuming catalog must be wired before/after definitions | Unnecessary sequencing constraint or a broken build check | Runtime resolution is per-entry independent; the build-time check reads authored corpora and is already satisfiable at 135↔135 |
| Validation | Loader serves unvalidated content | Malformed identities reach a module | Existing loader validates before exposing and degrades malformed to absence; contract mandatory per entry (RG-3) |
| Validation | Contract over-validates (style/convention) | Rejects legitimate frozen names; brittle runtime | Explicit non-responsibilities (§4); structure only |
| Process | Registry upgrade sweeps in unrelated edits or rewrites frozen content | History no longer append-only; collateral change | Single-file targeted registry edit; verify staged file count before any commit; frozen corpora untouched; append-only |
| Process | Duplicating the catalog parser | A second catalog source of truth | Reuse the existing `parseFormulaCatalogIdentities` from the definitions cross-content module |

## Constraints (maintained)

Identity Ownership, Minimal Vocabulary, Single Source of Truth, Registry Evolution
Principle, Option B, Validated-or-Absent, Immutability, and Append-only history are
all preserved. No code/schema/implementation is designed here; no runtime behavior is
changed; no aliases/translations/metadata are introduced; no framework architecture
is altered.

---

## Closing

**1. Plan summary.** Wire `formulaCatalog` by (a) deriving a flat, lossless,
source-order canonical-name **string list** from the authoritative `formula-catalog.md`
at build time (Derivation A, reusing the existing catalog parser), (b) exposing it via
a data-only `KnowledgeSource`, (c) validating it with a structure-only
`KnowledgeContract` (array + non-empty + unique; no convention/reference/meaning), and
(d) upgrading exactly one registry entry from `pending(...)` to that real
source+contract. The loader, transport, modules, and templates are untouched; the sole
observable change is `{{formulaCatalog}}` flipping from `"(none provided)"` to the real
names. Sequence: derivation → source → contract → validation → registry upgrade →
runtime verification → full gates.

**2. Open issues discovered.** None blocking. Two minor, pre-settled points to carry
into implementation: (i) reuse the existing `parseFormulaCatalogIdentities` rather than
authoring a second parser (prevents a second catalog source of truth); (ii) the
prompt currently renders the slice as a `JSON.stringify` dump via `knowledgeOrNone` —
acceptable and unchanged here (any richer rendering is a separate, out-of-scope,
module-owned concern).

**3. Sufficiency assessment.** The plan is sufficient and concrete enough to begin
Step 1 (Derivation layer) upon approval. It is fully supported by the frozen
architecture, mirrors the verified definitions precedent, resolves the specification's
decisions into an ordered, independently-reviewable sequence, and states objective
completion criteria and risks. No architectural blockers remain.

**4. Change statement.** Implementation has **not** begun. No source, contract,
validator, generator, registry entry, test, or runtime code was created or modified.
The only file added is this plan document
(`docs/architecture/27-formula-catalog-wiring-plan.md`); no other file was changed,
and nothing was committed.

## Scope

Implementation plan only. Architecture-level planning; defers all *how* to the
subsequent implementation steps, the first of which (Derivation layer) awaits review.
