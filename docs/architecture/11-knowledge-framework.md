# Knowledge Framework Specification

**Knowledge Layer Sprint · Step 2 (Framework Specification).** Status: **Approved
and frozen (2026-08-05).** This is the frozen contract for the Knowledge Layer
implementation; changes require explicit architectural justification.

This document specifies the **framework-level** contract for supplying external
knowledge to AI modules. It defines *transport*, not *content*. It conforms to and
extends the AI Runtime Contract (`docs/architecture/10-ai-runtime.md`) without
altering `BaseModule`, `AIEngine`, or `AIContext` behaviour.

It is a specification only — no implementation, no clinical vocabulary, no code
changes.

## 0. Governing principle

**The framework transports knowledge; it never understands knowledge.**

Every decision below follows from this. The framework moves opaque request
identifiers to a loader and returns opaque values to a module. It never enumerates,
names, validates, or interprets any clinical concept. Clinical vocabulary —
patterns, formulas, herbs, dosage, contraindications, ICD, and everything
future — lives in the **Knowledge Layer**, never in the framework.

## 1. Ownership

Four tiers, with strictly separated responsibilities:

| Tier | Owns | Must NOT own |
|---|---|---|
| **Framework** (`types/Knowledge`, `BaseModule`, `AIEngine`, `AIContext`) | The *transport contract* (request shape, bundle shape) and the *lifecycle* (when loading happens, how the bundle reaches the prompt). | Any clinical identifier, vocabulary, content, value type, or interpretation. |
| **Knowledge Loader** (Knowledge Layer) | *Supply*: resolving requested identifiers to values from a source (files, DB, remote); caching; immutability; the meaning of identifiers and selectors. | Reasoning, rules, execution logic; deciding *what* modules request. |
| **Knowledge Content** (Knowledge Layer) | The actual curated reference data and its value shapes/validation (e.g. what a "definition" or "catalog" contains). | Any coupling to the framework; any behaviour (it is data, never functions). |
| **Clinical Modules** | *Demand* (declaring which identifiers they need) and *presentation* (graceful fallback; reference-only discipline). | The content, the loading mechanism, storage, or caching. |

The module owns **demand**, the loader owns **supply**, the framework owns the
**contract and lifecycle** that connect them. Content and every medical type live
**behind the loader**, never in the framework and never inside a module.

## 2. KnowledgeRequest contract

A `KnowledgeRequest` is a **generic, key-addressable map of opaque identifiers to
selectors**. The framework defines the *structure* only; it never defines,
enumerates, or constrains the identifiers themselves.

- A **knowledge identifier** is an **opaque string**. The framework attaches no
  meaning to it. Whether it is `"diagnosisPatternDefinitions"` or anything else is
  known only to the module that requests it and the loader that resolves it.
- A **selector** expresses how much of that slice to load:
  - `true` — load the whole slice;
  - a list of strings — narrow to specific entries (the meaning of these
    narrowing strings is likewise opaque to the framework; the loader interprets
    them).

Illustrative shape (non-normative — communicates structure, not code to author
now):

```
// All identifiers are opaque strings. The framework enumerates NONE of them.
type KnowledgeSelector = boolean | readonly string[];
type KnowledgeRequest = Readonly<Record<string, KnowledgeSelector>>;
```

The framework MUST NOT introduce `KnowledgeKey`, `DiagnosisKey`, `FormulaKey`,
`PrescriptionKey`, or any other domain-specific key type or enum. The request is a
generic transport envelope. **The framework only transports requests; it never
understands their meaning.**

### 2a. Identifier ownership

Knowledge identifiers are **owned entirely by the Knowledge Layer** — never by the
framework. This is a direct consequence of the domain boundary (§5), stated here
because it governs how every identifier is created, resolved, and grown.

- **The Knowledge Layer defines identifiers.** Their names, their meaning, and
  their value shapes originate in the Knowledge Layer. The framework holds no
  definition of any identifier.
- **Modules reference identifiers defined by the Knowledge Layer.** A module's
  demand (`knowledgeRequest`) names identifiers that the Knowledge Layer owns; the
  module is a *consumer* of that vocabulary, not its author at the framework level.
- **The Knowledge Loader resolves identifiers.** The loader is the sole authority
  on what an identifier means and how to turn it into a value.
- **The framework transports identifiers only.** It never defines them, never
  validates them, never enumerates them, and never attaches meaning to them; it
  moves opaque strings from request to loader and opaque values back.
- **Adding a new identifier must never require framework modification.** A new
  knowledge identifier is simply a new opaque string agreed between a module and
  the loader. The transport contract is unaffected.

There is deliberately **no framework-level registry, enum, or catalogue** of
identifiers. The absence of one is the mechanism that keeps the framework blind to
clinical vocabulary and stable as that vocabulary grows.

## 3. KnowledgeBundle contract

A `KnowledgeBundle` is the loader's response: a **key-addressable map of the same
opaque identifiers to opaque values**.

Required properties:

- **Immutable / readonly.** A bundle is reference data. Once returned it MUST NOT
  be mutated by any consumer. The loader guarantees immutability (recommended:
  `readonly` types plus a deep freeze at the loader boundary). This mirrors the
  Immutable Result Rule already governing module outputs.
- **Key-addressable.** Consumers read a slice by its opaque identifier. A requested
  identifier that could not be supplied is simply **absent** — its absence is never
  an error (see §6).
- **Opaque values.** The framework types each value as opaque (`unknown`). Typed
  value shapes are **clinical types** and belong to the Knowledge Layer; a
  consuming module narrows/validates the slice it reads at the point of use (the
  same way provider output is validated), so the framework never imports a medical
  type.
- **Reference-only.** A bundle carries **data**, never behaviour — no functions, no
  decision procedures, no rules.

Illustrative shape (non-normative):

```
// Values are opaque to the framework; the Knowledge Layer owns their real shapes.
type KnowledgeBundle = Readonly<Record<string, unknown>>;
```

**The framework transports knowledge; it never interprets knowledge.**

## 4. Knowledge loading lifecycle

The existing `BaseModule` lifecycle is correct and **remains unchanged**. Only the
payload types are generic (§2, §3).

- **Who requests:** the **module**, by declaring a `KnowledgeRequest` (via its
  existing `knowledgeRequest(context)` hook). The module is the sole authority on
  which identifiers it needs.
- **Who loads:** the **Knowledge Loader**, via a single transport method
  `load(request): Promise<KnowledgeBundle>`. The loader is the sole authority on
  what identifiers and selectors *mean* and where content comes from.
- **When:** lazily, **per module, per run, before the prompt is built** — exactly
  as today (`knowledgeRequest → load → inject into prompt`). Only requested slices
  load; an empty or absent request loads nothing.
- **Who caches:** the **loader**, invisibly. Reference data is static, so
  load-once/memoize is expected (the same pattern the template loader already uses).
  Caching and any invalidation are loader/deployment concerns, never visible to
  modules or the framework contract.
- **Async:** yes. `load` returns a `Promise`; the source may be file, DB, or
  remote. The framework awaits it before building the prompt.
- **Immutability:** the returned bundle is immutable for the life of the run (§3).
  A module treats knowledge as read-only reference context and never mutates it.

No new lifecycle stage, hook, or engine responsibility is introduced. The
`AIContext.knowledge` pre-load path remains available and composes with per-module
requests.

## 5. Domain boundary

**The framework is permanently domain-agnostic.**

The framework never knows — and must never be taught — any of:

- patterns, syndromes, or diagnoses;
- treatment principles, formula families, or named formulas;
- herbs, composition, quantities, dosage, administration, or duration;
- contraindications, interactions, or safety data;
- classical or modern references;
- terminology, vocabularies, identifiers, or ontologies;
- ICD or any billing/coding concept;
- any clinical concept introduced in the future.

The framework operates **only on opaque identifiers and opaque values**. It cannot
distinguish one knowledge slice from another except by string equality of the
identifier. All clinical meaning — the identifier names, the value shapes, their
validation, their sources — belongs to the **Knowledge Layer**.

Consequence: the set of knowledge concepts can grow without bound, and the
framework contract never changes because of it. The framework changes only if the
*transport mechanism* itself must change (§7), never because clinical vocabulary
expanded.

## 6. Graceful fallback

Graceful fallback is **mandatory** and is a **consumer (module) responsibility**;
the framework merely guarantees that unavailable knowledge is a non-event.

Framework guarantee:

- A requested identifier that cannot be supplied is **absent** from the bundle. The
  loader returns a (possibly empty) bundle; it never throws for missing content and
  never fabricates a value. Absence of knowledge is never an error condition.

Module obligation, when a requested slice is absent or empty:

- the module substitutes the literal string `"(none provided)"` for the
  corresponding prompt variable;
- the module **continues execution** — it does not fail, and it does not treat
  missing knowledge as missing patient evidence, a data gap, or insufficient
  evidence;
- **reasoning continues** using the model's own knowledge;
- the **output structure never changes** — the presence or absence of external
  knowledge changes only the *quality/grounding* of reasoning, never the shape of
  the result.

This makes external knowledge strictly **optional content behind a guaranteed
interface**: the ability to consume it exists from day one; the content may be
empty indefinitely without any behavioural or structural consequence.

## 7. Extensibility

Because identifiers and values are opaque (§2, §3, §5), **new knowledge requires no
framework change**. Adding any of:

- formula composition;
- dosage guidance;
- contraindications;
- interaction knowledge;
- terminology / vocabularies / stable ids;
- classical or modern references;

requires only:

1. **new knowledge content** (curated data in the Knowledge Layer),
2. **new loader logic** (resolving the new opaque identifiers/selectors to values),
3. a **module requesting the new identifier** (demand) and presenting it with
   graceful fallback.

The `KnowledgeRequest`/`KnowledgeBundle` transport contract is **invariant** under
all such growth — new identifiers are just new strings; new value shapes are just
new opaque values validated in the Knowledge Layer.

**Different access patterns (honest boundary).** *Knowledge graphs* and
*retrieval/RAG* are query/traversal patterns, whereas `load(request): bundle` is a
fetch-by-identifier model. They fit the current contract when delivered as a
**materialized slice** (the loader resolves the relevant subgraph or top-k passages
behind an opaque identifier). Rich *query* or *semantic-retrieval* semantics would,
if ever required, be an **additive loader capability** (a new transport verb
alongside `load`) — the *only* circumstance under which the framework contract
itself would evolve, and even then by extension, never redesign. Growing clinical
vocabulary never triggers it.

## 8. Architectural principles

1. **The framework transports knowledge; it never understands knowledge.**
2. **Knowledge supports reasoning; knowledge never replaces reasoning.**
3. **Clinical vocabulary belongs to the Knowledge Layer, never to the framework.**
4. **The framework is permanently domain-agnostic** — it operates only on opaque
   identifiers and opaque values.
5. **Framework evolution occurs only when the transport contract changes, never
   when clinical vocabulary expands.**
6. **Knowledge is reference-only** — data, never rules, never execution logic.
7. **Graceful fallback is mandatory** — absent knowledge is a non-event; output
   structure never changes.
8. **Knowledge is immutable** — reference data a consumer may read but never mutate.

### 8a. Framework Stability Rule

The framework should **evolve only when knowledge *transportation* changes** — for
example, if a fundamentally new transport verb (such as query or retrieval, §7) is
ever required.

The framework must **never evolve merely because new clinical knowledge categories
are introduced.** Formula composition, dosage, contraindications, interactions,
terminology, references, graphs, and every future category are, from the
framework's perspective, just more opaque identifiers and opaque values.

Growing clinical knowledge should therefore require only:

- **new knowledge content** (curated data in the Knowledge Layer);
- **new loader logic** (resolving the new identifiers/selectors to values);
- **new Knowledge-Layer types** (the value shapes and their validation);

— and **never** a framework modification.

Because the framework is intentionally domain-agnostic — transporting opaque
identifiers and opaque values and interpreting neither — it remains **stable even
as medical knowledge expands indefinitely.** Framework churn and clinical-knowledge
growth are decoupled by design; that decoupling is the point of this contract.

## 9. Design rationale & rejected alternatives

- **Rejected: framework-level `KnowledgeKey` (or `DiagnosisKey`/`FormulaKey`/
  `PrescriptionKey`) enums/unions.** A typed key registry in the framework would be
  more discoverable, but it would encode **clinical vocabulary inside the
  framework**, directly violating the domain boundary (§5). Every new knowledge
  concept would then force a framework edit, coupling framework evolution to
  clinical growth — the exact thing principle 5 forbids. Opaque string identifiers
  give the module and loader full freedom while keeping the framework blind to
  meaning. Type-safety of identifiers, where wanted, is recovered **in the
  Knowledge Layer** (which may define its own key constants/types), not in the
  framework.
- **Rejected: typed value payloads in `KnowledgeBundle`.** Typing values would drag
  medical types into `types/Knowledge`. Instead values are opaque and narrowed at
  the point of consumption, preserving the framework's "no business/medical types"
  invariant while still giving modules type-safe access via Knowledge-Layer schemas.
- **Rejected: module-specific request types.** Per-module request interfaces would
  fragment the loader's surface and prevent identifier sharing across modules. One
  generic keyed envelope keeps a single `load` seam.
- **Rejected: framework-performed fallback.** Making the framework substitute
  `"(none provided)"` would require it to know which variables are knowledge and how
  to present them — domain awareness. Fallback stays a module responsibility; the
  framework only guarantees absence-is-not-an-error.

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract (evidence flow,
  immutable results, confidence propagation, clinical safety).
- `docs/clinical/diagnosis-knowledge.md`, `docs/clinical/formula-knowledge.md`,
  `docs/clinical/prescription-knowledge.md` — the module-level knowledge reviews
  whose declared interfaces this transport contract will carry (their identifiers
  are Knowledge-Layer concerns, opaque to the framework).

## Scope

Framework transport specification only. No clinical knowledge, no code, no
`BaseModule`/`AIEngine`/`AIContext` change, no module/schema/prompt/test change.
