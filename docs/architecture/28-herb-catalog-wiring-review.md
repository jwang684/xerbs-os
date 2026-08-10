# Herb Catalog — Wiring Architecture Review

**Herb Catalog · Wiring Sprint · Step 1 (Architecture Review).** Status:
**PROPOSED — PENDING REVIEW.** This review concerns the *integration architecture* by
which a completed `herbCatalog` identity layer would become available at runtime. It
designs no implementation, creates no registry source, loader, contract, or
validation code, authors no content, and changes no existing file. It is consistent
with, and subordinate to, the frozen transport/loader/registry architecture
(`docs/architecture/11`–`16`) and the two completed sibling wiring efforts
(`prescriptionFormulaDefinitions`, `docs/architecture/22`–`24`; `formulaCatalog`,
`docs/architecture/25`–`27`).

## Grounded Starting State (verified against the codebase)

- **Registry** — `src/ai/knowledge/productionRegistry.ts` binds `herbCatalog` via
  `pending("herbCatalog")` (line 67): `emptySource` (yields nothing) +
  `unauthoredContract`. It is **placeholder-bound**; today every request resolves to
  absence → Option B → `"(none provided)"`. `prescriptionFormulaDefinitions` and
  `formulaCatalog` are already upgraded to real entries; the other five identifiers —
  including `herbCatalog` — remain `pending(...)`.
- **Authoritative corpus — DOES NOT EXIST.** The content directory contains only
  `formula-catalog.md` and `prescription-formula-definitions.md`. There is **no
  `herb-catalog.md`** and no authored herb content anywhere in the repository. This is
  the decisive difference from the two completed wiring sprints, each of which began
  from a frozen, audited 135-entry corpus.
- **Existing consumer** — `PrescriptionModule.knowledgeRequest()` already includes
  `herbCatalog: true` (line 57) and reads it via
  `knowledgeOrNone(this.knowledge, "herbCatalog")` (line 81).
- **Existing template slot** — `prescription.md` already renders `{{herbCatalog}}`
  (line 76), labelled "Herb name vocabulary (optional reference) … Vocabulary only —
  no herb properties, no composition. If empty, rely on your own knowledge."
- **Loader / transport** — `ProductionKnowledgeLoader.ts` is generic and unchanged;
  the transport types are unchanged.

**Consequence:** the *consumption* seam is fully in place (request + accessor +
template slot), but the *content* prerequisite is absent. Unlike the formula catalog,
herb-catalog wiring is **not** "strictly availability work" today — there is nothing
authored to make available.

## 1. Purpose of Wiring

- **Why `herbCatalog` is currently inert.** Two independent reasons: (a) its registry
  entry is placeholder-bound, and (b) — more fundamentally — **no authored corpus
  exists** for it to serve. Even if the entry were upgraded, there would be nothing to
  yield. A module requesting it receives `"(none provided)"`.
- **What wiring would enable.** Once an authoritative herb-name corpus exists and is
  wired, a module requesting `herbCatalog` would receive the real, validated,
  immutable set of canonical herb names — scoping which herb names are canonical,
  without carrying properties, composition, or relationships. The prescription
  template's `{{herbCatalog}}` block would flip from `"(none provided)"` to the real
  vocabulary with no module change.
- **What wiring must NOT change.** Ownership boundaries, the transport contract, the
  loader algorithm, the module Template Method, Option B semantics, or any clinical
  behaviour. Wiring changes *availability*, nothing else (see §10).

## 2. Ownership Analysis

- **What `herbCatalog` owns** — **herb identity**: the canonical name-space of herbs,
  and only that. It is a Vocabulary interface, the herb-side analogue of
  `formulaCatalog`.
- **What it does NOT own:**
  - **meaning** — herb properties, functions, nature/flavour, channels entered
    (a future herb-definitions interface, analogous to `prescriptionFormulaDefinitions`
    for formulas);
  - **relationships** — which herbs compose which formula (a mapping/execution
    concern, never the catalog);
  - **selection / reasoning / recommendation / execution** — dosage, composition,
    substitution (runtime reasoning and execution layers).
- **Identity vs. meaning vs. relationship interaction with the completed siblings:**
  - `formulaCatalog` owns **formula** identity; `herbCatalog` owns **herb** identity —
    two parallel, independent Vocabulary roots.
  - `prescriptionFormulaDefinitions` owns **formula** meaning (referencing formula
    identity). A future herb-definitions interface would own **herb** meaning
    (referencing herb identity).
  - The composition link "a formula contains these herbs" is a **relationship** owned
    by neither catalog — it belongs to a future mapping/execution layer. Wiring the
    herb catalog must introduce none of this; it stays identity-only (Minimal
    Vocabulary).

## 3. Runtime Architecture

Assuming a completed corpus, `herbCatalog` would enter the runtime along the frozen,
already-proven path — identical in shape to `formulaCatalog`:

```
registry (real herbCatalog entry)
  → source            (yields the derived canonical herb-name collection)
  → contract          (structural validation → value)
  → loader            (resolve → validate → deep-freeze → cache → assemble)
  → bundle["herbCatalog"]   (immutable)
  → module            (knowledgeOrNone(this.knowledge, "herbCatalog"))
  → template          ({{herbCatalog}})
```

No new runtime seam is required; every stage already exists and is exercised by the
two wired siblings. Wiring would only make the one entry resolve to real content.

## 4. Registry Architecture

- **Current placeholder state** — `pending("herbCatalog")`, one array element among
  seven; Registry Completeness already holds (the identifier is inventoried).
- **Expected registry evolution pattern** — the same additive, single-entry upgrade
  proven twice: add imports for a real source + contract, and replace the one
  `pending("herbCatalog")` element with an explicit `{ identifier, source, contract }`
  entry; all other entries unchanged; registry mechanism/API untouched (Registry
  Evolution Principle). No design is proposed here.

## 5. Loader Architecture

**`ProductionKnowledgeLoader` requires no change.** Justification: the loader is fully
generic — `resolve → registry lookup → source() → contract(raw) → deepFreeze → cache
→ assemble → freeze(bundle)` — with no identifier branching. It already serves two
real slices with zero loader edits. Serving `herbCatalog` would change only *what the
entry resolves to*, which the loader handles by design. A loader edit would leak
domain specifics into the generic mechanism and would be an architectural failure
(Registry Evolution Principle).

## 6. Contract Architecture

Structural validation would likely be responsible (by analogy to `formulaCatalog`, and
subject to the specification) for confirming the slice is a **collection of non-empty,
unique canonical herb-name strings** — structure only. It would **not** judge naming
convention/editorial policy, herb meaning/properties, or cross-slice references. No
rules are defined here; that is Step 2 (Specification). This section only locates the
responsibility, not its content.

## 7. Validation Architecture

The four layers would reside exactly as for the siblings, kept separate:

- **Registry validation** — the entry is well-formed (identifier, source, contract
  present; unique). At initialization. (Already implemented; unchanged.)
- **Structure validation** — the per-slice contract validates each herb name's shape.
- **Cross-content validation** — the catalog is an identity **root**: it has no
  outbound references to validate. It would be the *target* of any future check (e.g.
  a herb-definitions→herbCatalog or a formula-composition→herbCatalog reference
  check), which would read authoritative corpora at build time and is out of scope
  here. No such dependent corpus exists yet.
- **Runtime trust** — a loaded slice is structurally trusted; herb-name correctness
  remains human/editorial review.

## 8. Dependency Analysis

- **Outbound dependencies** — **none.** The herb catalog references nothing; it is an
  identity root (like `formulaCatalog`).
- **Inbound dependencies** — future consumers reference herb identities: a future
  herb-definitions interface, a future formula-composition mapping, and the execution
  layer (herb names in a prescription). Today, `PrescriptionModule` requests it as
  optional vocabulary.
- **Possible cycles** — none possible: an entity that references nothing cannot be in
  a cycle.
- **Runtime coupling** — none; per-identifier resolution makes `herbCatalog` resolve
  independently of every other entry, including `formulaCatalog` and
  `prescriptionFormulaDefinitions`.
- **Comparison** — architecturally identical to `formulaCatalog` (independent identity
  root, inbound-only, no outbound cross-content check). Distinct from
  `prescriptionFormulaDefinitions`, which is a *meaning* layer with an outbound
  reference into `formulaCatalog`.

## 9. Future Evolution

- **Additive growth** — future herb-name batches append to the authoritative corpus
  and validate identically; the registry entry, loader, and contract mechanism stay
  unchanged.
- **Ownership preservation** — herb meaning, composition, and relationships attach
  *beside* the catalog as separate interfaces/layers, never folded into a
  canonical-name entry (Minimal Vocabulary; the herb analogue of Canonical Naming
  Stability).
- **Compatibility with frozen architecture** — the entire effort fits the frozen
  transport/loader/registry with no framework change, reusing the pattern proven for
  `formulaCatalog`.

## 10. Wiring Boundaries

**In scope** — runtime availability of the herb-identity vocabulary only.

**Out of scope** — no reasoning; no recommendations; no formula selection; no herb
selection; no mappings; no relationships (including formula composition); no herb
meaning/properties; no prompt redesign; no module redesign; no transport redesign. The
only observable effect of eventual wiring would be that a requested `herbCatalog`
slice, previously absent, is supplied.

---

## Architectural Findings

1. **The wiring architecture is fully determined and low-risk** — it is the exact
   `formulaCatalog` pattern (independent identity root; generic loader unchanged;
   single-entry registry upgrade; structure-only contract; Option B preserved). No new
   architectural questions arise on the *wiring* itself.
2. **The consumption seam already exists** — `PrescriptionModule` requests
   `herbCatalog` and the template renders `{{herbCatalog}}`; wiring would light up that
   existing slot with no module/template change.
3. **BLOCKER: there is no authoritative herb catalog corpus.** Unlike the two
   completed sprints, `herbCatalog` has no authored, frozen content to derive from.
   Wiring presupposes a completed identity layer; that prerequisite is unmet.
4. **A content-authoring effort must precede wiring** — the herb identity layer must
   first be authored and frozen (its own content sprint: architecture review →
   specification → authoring plan → batches → completion audit, mirroring the Formula
   Catalog content sprint), establishing `herb-catalog.md` as the single source of
   truth. Only then can the derivation → source → contract → registry-upgrade wiring
   sequence run, reusing the proven pattern.
5. **Ownership stays identity-only** — herb meaning, composition, and relationships are
   explicitly out of scope and belong to future, separate interfaces.

## Open Questions (to resolve before/within specification)

- **Corpus existence & scope (blocking).** Does an authoritative herb-name corpus
  exist? (It does not today.) It must be authored and frozen first. What is its
  intended scope/size, and does it need parity with any other corpus (e.g. the herbs
  implied by the formula catalog)? Unlike formula↔definitions (135↔135), no herb
  parity target is defined.
- **Canonicalization convention.** What romanization/casing/spacing standard governs
  canonical herb names (pinyin Title Case, as for formulas, or another)? An authoring
  concern, but it shapes the eventual structural contract's boundary.
- **Entry shape.** Presumptively a flat `readonly string[]` (identity-only, Minimal
  Vocabulary), mirroring `formulaCatalog` — to be ratified in specification.
- **Derivation & parser reuse.** Whether to reuse a shared markdown-list parser (the
  catalog parser already parses `- <Name>` lines) for herb derivation, to avoid a
  second parsing source of truth.
- **Future dependents.** Whether an upcoming herb-definitions or formula-composition
  interface will impose an inbound cross-content check on `herbCatalog` (out of scope
  now, but informs naming stability).

## Sufficiency Assessment

**The wiring architecture is sufficiently understood to proceed — but the Herb Catalog
Wiring Sprint cannot advance to a *wiring* Step 2 (Specification) until the content
prerequisite is met.** The wiring pattern itself is fully settled by the
`formulaCatalog` precedent and needs no further architectural analysis. The gating
issue is **content, not architecture**: there is no authoritative `herb-catalog.md`.

Recommended path (for review, not executed here):
1. **First**, run a Herb Catalog *content* sprint to author and freeze the herb
   identity corpus (its own review → spec → authoring plan → batches → audit).
2. **Then**, run the Herb Catalog *wiring* sprint (derivation → source → contract →
   registry upgrade → runtime verification), reusing the proven pattern; a wiring
   Specification (Step 2) authored now would be sound in structure but would have no
   corpus to bind and could not be verified end-to-end.

If the intent is to proceed to a wiring Specification immediately, it should be
written explicitly conditional on the corpus being authored first, and it must not
itself author content.

## Scope

Architecture review only. No implementation, no registry source, no loader, no
contract, no validation code, no content authored, and no change to any existing file.

---

**Deliverables provided:** Grounded Starting State (above), Architectural Findings
(1–5), Open Questions, and this Sufficiency Assessment.
