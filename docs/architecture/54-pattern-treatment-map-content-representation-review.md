# Pattern Treatment Map — Content Representation Review

**Pattern Treatment Map · Content Representation Review.** Status: **PROPOSED — PENDING
REVIEW.** A read-only review whose **only** purpose is to choose the *authored content
representation shape* for `patternTreatmentMap` — the architecture's first relationship-layer
corpus. It authors no content, no mappings, and designs no implementation. It grounds in the
settled decisions of the Architecture Review (`docs/architecture/51`), Specification (`52`),
and Authoring Rules (`53`), and does **not** reopen Option A, ownership, the dependency
model, many-to-many semantics, or the cross-content model.

## 1. Problem Statement

Every prior knowledge corpus was a **single-identity-per-line** artifact: catalogs are flat
`- <Name>` lists; definition layers are two-field `- **<Name>** — <text>` lines (one
referenced identity + its meaning). `patternTreatmentMap` is different: it is the first
corpus whose every record references **two** identities — a pattern (LHS) and a treatment
principle (RHS) — in a **many-to-many** relationship. There is no precedent for how to
author such a corpus in markdown. This review selects that representation.

## 2. Requirements Derived From Docs 51–53

- **R1 Two-sided references.** Each record links a `diagnosisPatternCatalog` identity to a
  `formulaDefinitionCatalog` identity; references only, identities never restated (52 §B,
  53 §2).
- **R2 Relationship-only, no metadata.** No rationale, ranking, confidence, priority, or
  recommendation may appear in a record (51 §2, 52 §D, 53 §3).
- **R3 Many-to-many.** One pattern → many principles; one principle → many patterns; no
  cardinality restriction (52 §C/§D, 53 §4).
- **R4 Duplicate prevention.** The same pattern↔principle association must be authorable at
  most once, and duplicates must be detectable (53 §5).
- **R5 Single source of truth + lossless derivation.** One authoritative markdown; any
  generated form derives losslessly and no-drift (52 §F).
- **R6 Two-sided cross-content integrity.** Every pattern ∈ `diagnosisPatternCatalog` and
  every principle ∈ `formulaDefinitionCatalog` (52 §H).
- **R7 Authoring ergonomics + readability + maintainability** (53 §1).
- **R8 Precedent value.** The shape should generalize to the next relationship layer,
  `treatmentFormulaMap` (principle → formula), which is structurally identical.

## 3. Candidate Representation A — Flat Pair (one association per line)

Each line is a single pattern→principle association (abstract form):
`- **<Pattern Identity>** — <Principle Identity>`

- **Readability:** moderate — a long flat list; a pattern with several principles recurs on
  several lines (its name repeated).
- **Authoring ergonomics:** simple to append; but authoring all associations for one pattern
  means repeating the pattern name N times.
- **Duplicate prevention:** easy and exact — a duplicate is a duplicate line
  (`sort | uniq -d` on the pair).
- **Derivation simplicity:** high — reuse the existing two-field bullet parser almost
  verbatim (bold LHS, separator, RHS), remapped to `{ pattern, principle }`. Each line → one
  record.
- **Validator simplicity:** high — the derived record set is a flat list of `{pattern,
  principle}` pairs; the two cross-content checks scan the two columns directly.
- **Precedent value:** high — nearly identical to the frozen `- **X** — Y` definition format
  and its parser; `treatmentFormulaMap` reuses it unchanged.

## 4. Candidate Representation B — Grouped Relationships (one pattern, many principles)

Each pattern heads a small group listing its associated principles (abstract form):
a pattern label followed by an indented/enumerated list of principle identities.

- **Readability:** high — all associations for a pattern are visually grouped.
- **Authoring ergonomics:** convenient per-pattern; but editing a principle shared across
  patterns means visiting many groups.
- **Duplicate prevention:** harder — duplicates can hide *within* a group (same principle
  listed twice under one pattern) and *across* groups (a pattern accidentally appearing
  twice as a heading); requires structure-aware scanning, not a line dedupe.
- **Derivation simplicity:** lower — needs a small stateful parser (track "current pattern",
  attach following principle lines), a genuinely new parsing rule (no reuse).
- **Validator simplicity:** medium — after flattening groups → pairs the checks are the same,
  but the flatten step is extra logic.
- **Precedent value:** medium — introduces a bespoke grouped format and parser that
  `treatmentFormulaMap` would also need; more machinery to carry forward.

## 5. Candidate Representation C — Tabular (Markdown table)

A two/three-column markdown table (Pattern | Principle) per row.

- **Readability:** high in rendered form; noisy in raw markdown (pipes, header/separator
  rows).
- **Authoring ergonomics:** moderate — column alignment friction; each row is still a pair
  (like A) so a multi-principle pattern repeats.
- **Duplicate prevention:** moderate — row-level dedupe possible but must strip table
  formatting first.
- **Derivation simplicity:** lower — requires a table parser (skip header + `---` separator,
  split on `|`, trim cells), a new parsing rule not shared with any existing corpus.
- **Validator simplicity:** medium — same as A once parsed, plus table-parsing overhead.
- **Precedent value:** low/medium — diverges from the established `- ` bullet corpora; a new
  format class in the content directory.

## 6. Derivation Implications

- **A** reuses the existing two-field bullet parser (the same logic already reused by
  `formulaDefinitions` / `diagnosisPatternDefinitions`), with a trivial field remap to
  `{ pattern, principle }`. One line → one record; lossless and deterministic by
  construction.
- **B** requires a **new stateful grouped parser** (context: current pattern) — the first
  parser in the project that is not a pure line-independent map.
- **C** requires a **new table parser** (header/separator handling, cell splitting).

Only A preserves the project's "each line is an independent record, parsed by the shared
bullet parser" property, which underpins the no-drift guarantee's simplicity.

## 7. Runtime Shape Implications

Regardless of authored shape, the runtime/derived shape should be the minimal Option-A
record. **A** yields the derived shape directly: `readonly { pattern: string; principle:
string }[]` — a flat pair list, one record per association, order-preserving. **B** and **C**
must *flatten* to this same shape, so they add an authoring-form↔runtime-form transformation
step that A avoids. (The exact runtime field names are a wiring-step detail; all three
converge on the same flat pair set — A just gets there without a flatten.)

## 8. Cross-Content Validation Implications

The two-sided check (R6) operates on the flat pair set: collect the distinct LHS values →
verify ∈ `diagnosisPatternCatalog`; collect distinct RHS values → verify ∈
`formulaDefinitionCatalog`; report orphan patterns and orphan principles. **A** presents this
set natively. **B/C** present it only after flattening. Duplicate detection (R4) is a pure
line/pair dedupe under **A**; under **B** it must additionally catch intra-group and
cross-group duplication (more logic, more failure modes).

## 9. Future `treatmentFormulaMap` Reuse Analysis

`treatmentFormulaMap` (treatment principle → named formula) is **structurally identical** to
`patternTreatmentMap`: a two-sided, many-to-many relationship referencing two identity roots
(`formulaDefinitionCatalog` → `formulaCatalog`). Whatever representation is chosen here sets
the precedent for it. **A** lets both maps reuse one bullet-pair format, one shared parser,
and one cross-content validator shape — maximal symmetry and minimal new machinery. **B/C**
would require their bespoke parser/format to be carried forward to a second relationship
layer, doubling the non-reused surface.

## 10. Recommendation

**Adopt Candidate A — Flat Pair (one pattern→principle association per line), reusing the
established two-field bullet format and shared parser.**

Justification against the evaluation axes:
- **Readability:** adequate (a plain associations list); B is prettier grouped, but that
  gain does not outweigh A's other advantages.
- **Authoring ergonomics:** simple append-only authoring; the only cost (repeating a pattern
  name across its associations) is minor and is exactly what makes duplicate detection and
  derivation trivial.
- **Duplicate prevention:** best — exact line/pair dedupe (R4).
- **Derivation simplicity:** best — reuses the existing shared bullet parser with a field
  remap; preserves "one line → one independent record" and the no-drift guarantee (R5).
- **Validator simplicity:** best — the two-sided cross-content check reads the two columns of
  a flat pair set directly (R6).
- **Precedent value:** best — consistent with every existing `- ` corpus and reusable
  verbatim by `treatmentFormulaMap` (R8).

A satisfies all requirements R1–R8 with the least new machinery and the strongest symmetry
with both the existing corpora and the next relationship layer. B trades a readability gain
for a bespoke stateful parser and weaker duplicate detection; C adds a table parser and
diverges from the corpus conventions — neither is justified for v1.

**Open (authoring-rules/spec-detail, not reopened here):** the exact separator/label
convention for a pair line and the derived record's field names — minor conventions to fix
when authoring begins; they do not change this representation choice.

## Scope

Content-representation review only. No content authored, no mappings, no generators, sources,
contracts, validators, registry changes, or wiring; no change to any existing file other than
the creation of this document.

STOP. Representation review complete. Recommendation: Candidate A (flat pair). No content
authored. Nothing committed. Awaiting review.
