# Production Knowledge Loader Specification

**Knowledge Layer Sprint · Step 5 (Production Loader Specification).** Status:
**Approved and frozen (2026-08-06).** This is the architectural contract for the
production knowledge producer; changes require explicit architectural
justification.

This document specifies the **Production Knowledge Loader** as an *architecture*.
It is implementation-independent: it defines responsibilities, ownership,
lifecycle, and contracts — not mechanisms, languages, formats, or libraries. It
conforms to and depends on the frozen Knowledge Framework Specification
(`docs/architecture/11-knowledge-framework.md`) and the AI Runtime Contract
(`docs/architecture/10-ai-runtime.md`), and changes none of them.

## 1. Purpose

The Production Knowledge Loader is the **first real producer of curated
knowledge**. Until now the knowledge seam has been satisfied by a stub that
supplies nothing, so every module falls back to its own reasoning. This loader
begins to supply real, curated reference knowledge to the modules that request it.

It is a **drop-in replacement** for the stub. It lives **entirely behind the
frozen transport seam** — the single operation that resolves a knowledge request
into a knowledge bundle — and it changes nothing else. The transport contract
(request and bundle), the module lifecycle, the Template Method, and graceful
fallback (Option B) all remain exactly as frozen. From the framework's and the
modules' point of view, nothing changes except that requested knowledge may now
actually be present.

## 2. Responsibilities

The Production Knowledge Loader **owns**:

- **Locating** the source of each requested knowledge slice.
- **Resolving** opaque identifiers to their sources and validation contracts (via
  the registry — see §3).
- **Loading** the content of requested slices.
- **Validating** each loaded slice against its declared contract (see §5).
- **Immutability** — making validated knowledge unmodifiable before it leaves the
  loader (see §6).
- **Caching** validated, immutable knowledge (see §7).
- **Assembling** the requested slices into a knowledge bundle for transport.
- **Error handling** consistent with Option B — degrading to absence rather than
  supplying invalid knowledge (see §8).

The Production Knowledge Loader explicitly **does not own**:

- **The transport contract** — the shape of requests and bundles belongs to the
  framework.
- **Deciding what is requested** — demand is declared by the clinical modules.
- **Fallback presentation** — how absence reads (e.g. a placeholder) belongs to
  the modules.
- **Clinical reasoning** — it supplies reference data; it never interprets,
  diagnoses, strategizes, prescribes, or ranks.
- **Judging clinical correctness** — it guarantees that content satisfies its
  *structural* contract, never that the content is *clinically* correct; semantic
  correctness is an authoring and evaluation concern.
- **Prompt shaping** — it returns knowledge; it never composes prompts.

## 3. Registry Architecture

The **registry is the architectural center** of the production loader.

- The registry is the **single source of truth** describing every knowledge
  interface: for each opaque identifier, it declares **where the content comes
  from** and **which validation contract that content must satisfy**.
- The registry is **owned by the Knowledge Layer**, not the framework and not the
  loader mechanism. It is where an identifier's *meaning* lives — consistent with
  the frozen principle that identifiers are owned by the Knowledge Layer and are
  opaque to the framework.
- The **loader derives all loading behaviour from the registry.** Given a request,
  it consults the registry for each requested identifier and acts on what the
  registry declares. The loader itself is **intentionally generic**: it contains
  no knowledge of any particular identifier.
- **No clinical identifier ever appears inside loader logic.** The loader must be
  readable end to end without revealing a single clinical concept. If a clinical
  name would have to be written into the loader, the design is wrong.

Because behaviour is registry-derived, **adding a knowledge interface requires
only three additive changes and never a loader redesign**:

1. a **new registry entry** (identifier → source + validation contract);
2. a **new validation contract** for that identifier's content;
3. the **new knowledge content** itself.

The loader mechanism is untouched by any such addition, and the transport
framework is untouched by all of them.

### 3a. Registry Completeness Rule

The registry is not merely a lookup table; it is the **complete architectural
inventory of production knowledge**.

- **Every knowledge identifier requested by a clinical module must have exactly one
  corresponding registry entry.** A requested identifier with no entry is a defect,
  not a silent absence.
- **Every registry entry should represent a knowledge interface that one or more
  clinical modules may request.** An entry no module can ever request is dead
  inventory and should not exist.
- Consequently, **no production knowledge interface exists outside the registry.**
  If it is not in the registry, it is not production knowledge; if it is in the
  registry, it is accounted for, sourced, and given a validation contract.

This rule guarantees that **knowledge demand (what modules request) and knowledge
supply (what the loader can produce) stay synchronized as the system evolves.**
The registry is the one place where the two are reconciled, so drift between them
is detectable rather than latent — a requested-but-unregistered identifier or a
registered-but-unrequested interface is a visible inconsistency, not a quiet
fallback.

## 4. Knowledge Organization

Curated knowledge is organized by **kind**, each kind a distinct ownership concern
with a distinct contract:

- **Definitions** — canonical statements of the concepts a module may emit (for
  example, the named concepts behind a module's vocabulary). Reference only.
- **Mappings** — reference *associations* between concepts (for example, an
  association from one layer's concept to a downstream layer's candidates).
  Reference associations, **never** decision procedures or rules.
- **Vocabulary** — canonical *name-spaces*: the authoritative set of names a module
  may use. Identity only, carrying no structural internals.
- **References** — curated source material (for example, classical or modern
  literature) intended for citation or retrieval. Reserved for future use.

**Ownership model.** Each knowledge slice belongs to exactly one identifier, has
exactly one validation contract, and is authored and reviewed independently of the
loader and of every other slice. Kinds are kept separate so that a definition
never silently becomes a mapping, and a vocabulary never silently accretes
structural content. This separation is an authoring and ownership discipline; it
implies nothing about storage mechanism or format.

## 5. Validation Architecture

Validation is layered, with unambiguous ownership:

```
Framework   →   Production Loader   →   Clinical Modules
(transport)     (structure)             (behaviour)
```

- **Framework — transport only.** The framework validates nothing about content.
  It guarantees only that a bundle is a mapping of identifiers to opaque values.
- **Production Loader — structural authority.** The loader validates every loaded
  slice against the validation contract the registry names for its identifier.
  This is where a slice's opaque value acquires a trusted structure. Content that
  does not satisfy its contract is **never** admitted (see §8).
- **Clinical Modules — behavioural only.** Modules reason over knowledge; they do
  **not** re-check its structure.

**Governing principle — schema validation is authoritative.** A successfully
loaded knowledge slice is guaranteed to satisfy its structural contract. Clinical
modules may therefore **assume structure and never repeat structural validation**;
they **validate behaviour, not structure**, and reason only over knowledge that
has already been validated. This prevents responsibility drift: exactly one tier
owns structural correctness, and it is the loader.

### 5a. Registry Validation Rule

The registry is itself part of the **production validation boundary**. Before any
knowledge may be served, the registry must be **internally consistent** — a
malformed inventory can no more be trusted than malformed content.

At minimum, registry validation confirms that:

- **every registry entry references an existing knowledge source** — no entry
  points at content that cannot be obtained;
- **every registry entry references a valid validation contract** — no entry
  declares a contract that does not exist or is itself ill-formed;
- **duplicate identifiers do not exist** — an identifier appears at most once;
- **identifier ownership remains unique** — each identifier resolves to exactly one
  source and one contract, so there is never ambiguity about what a slice is.

**Governing rule — only a validated registry may participate in knowledge
loading.** Registry validation occurs **before knowledge loading begins**: if the
registry is inconsistent, no knowledge is served at all, because the inventory the
loader derives its behaviour from cannot be trusted.

This is **registry validation, not clinical validation.** It checks the structural
integrity of the inventory (sources, contracts, uniqueness) — never the clinical
correctness of any content, which remains an authoring and evaluation concern.

## 6. Immutability

- Knowledge becomes **immutable after validation** — once a slice has satisfied
  its contract, it is fixed and may never be altered.
- **Consumers never modify knowledge.** Modules read reference knowledge; they do
  not mutate it, and any attempt to would be a defect.
- Because it is immutable, **validated knowledge may be shared freely** — across
  requests, across modules, and across executions — without risk of one consumer
  affecting another. Immutability is what makes shared, cached reference knowledge
  safe, and it mirrors the Immutable Result Rule that already governs module
  outputs.

This section specifies the *property* (immutability), not the mechanism by which
it is achieved.

## 7. Loading and Caching

- **Loading lifecycle.** Knowledge is loaded in response to declared demand: when
  a module requests identifiers, the loader supplies exactly those slices. Slices
  that are not requested are not loaded.
- **Cache ownership.** Caching is owned **entirely by the loader** and is invisible
  to the framework and the modules. Whether and how knowledge is cached is a loader
  concern; consumers observe only that requested knowledge is supplied.
- **Cache lifetime.** Curated knowledge is **static reference data**. It is stable
  for the lifetime of a running system; the cache may treat it as such.
- **Refresh philosophy.** Knowledge changes take effect through **deliberate
  redeployment**, not through runtime mutation. There is no expectation of
  live in-place editing of knowledge during a run. A future capability to refresh
  or version knowledge at runtime would be an additive loader concern and would
  not affect the transport framework.

This section defines ownership only; it prescribes no loading order, cache
structure, or invalidation algorithm.

## 8. Option B

Graceful fallback is preserved unchanged; a production loader coexists with it
naturally.

- **Missing knowledge** — an identifier for which no content exists is **absent**
  from the bundle. The module falls back (Option B).
- **Unavailable knowledge** — an identifier whose source cannot be obtained is
  **absent** from the bundle. The module falls back.
- **Malformed knowledge** — content that fails its validation contract is treated
  as **absent** at runtime (and surfaced through operational visibility so it can
  be corrected); it is **never** supplied in invalid form. Malformed content is
  expected to be caught before deployment, but at runtime the loader **degrades to
  absence rather than failing a clinical run or supplying bad data**.

Two invariants are absolute:

- **The loader never fabricates knowledge.** It supplies validated content or
  nothing; it never invents, guesses, defaults, or substitutes.
- **The framework never fabricates knowledge.** It transports what exists and
  nothing more.

**Modules decide how absence is presented.** The choice of placeholder or
behaviour on absence is a module concern; neither the loader nor the framework
imposes it.

## 9. Future Extensibility

The architecture supports the following **without any change to the transport
framework**:

- **Additional knowledge interfaces** — a new identifier is a new registry entry, a
  new validation contract, and new content. The framework and the loader mechanism
  are untouched.
- **Localization** — locale is an additive dimension of the registry and content;
  identifiers remain opaque and the transport contract is unaffected.
- **Versioning** — knowledge may carry versions and the registry may resolve them;
  this is additive and invisible to the framework.
- **Graph knowledge** — a materialized portion of a graph is deliverable as an
  ordinary slice today. Rich traversal or query would be an **additive** loader
  capability, never a change to the request/bundle contract.
- **Retrieval-based knowledge** — retrieved material is deliverable as an ordinary
  slice today. Live retrieval would likewise be an **additive** loader capability,
  not a transport change.

**Framework stability is preserved.** Every one of these is either a Knowledge-
Layer addition (identifier, contract, content) or an additive loader capability
behind the existing seam. None requires the framework to change, because the
framework transports opaque identifiers and opaque values and understands neither.

## 10. Architecture Principles

1. **The framework transports knowledge; it never understands it.**
2. **The loader supplies knowledge; it never performs clinical reasoning.**
3. **The registry is the single source of truth** for every knowledge interface.
4. **The loader derives its behaviour from the registry** and is otherwise generic;
   no clinical identifier appears in loader logic.
5. **Schema validation is authoritative** — successfully loaded knowledge is
   structurally trusted; modules validate behaviour, not structure.
6. **Knowledge is immutable after validation** and may be shared safely.
7. **Knowledge supports reasoning; it never replaces reasoning.**
8. **The loader never fabricates knowledge; neither does the framework.**
9. **Clinical growth must never require framework modification** — new knowledge is
   a registry entry, a validation contract, and content, never a framework change.

### 10a. Registry Evolution Principle

**Adding a new knowledge interface never changes the Production Loader algorithm.**

A new interface requires only:

- a **registry entry** (identifier → source + validation contract);
- a **validation contract** for its content;
- **curated knowledge** content.

The Production Loader itself **remains unchanged**. It gains no branch, no special
case, and no new step; it simply resolves one more entry through the same generic
behaviour it already applies to every other.

This reinforces that **the registry — not the loader — is the point of
extensibility.** Future clinical growth is therefore **additive** (a new entry,
contract, and content) rather than **algorithmic** (a change to how the loader
works). A design in which growing clinical knowledge would require editing the
loader's behaviour is, by this principle, incorrect.

### 10b. Registry Immutability Principle

**After successful validation, the registry becomes immutable for the lifetime of
the running system.**

Knowledge loading depends upon a **stable registry**. Changing the registry's
structure during execution would invalidate the consistency the loader relies on
between:

- **identifiers**,
- **validation contracts**,
- **cached knowledge**, and
- **module requests**.

A slice cached under one contract could no longer be trusted if its registry entry
changed beneath it; a module request resolved one way could resolve differently
mid-run. Therefore **registry evolution occurs between deployments, not during
execution.** The registry is validated once at initialization (see §5a) and then
fixed.

This **complements — it does not replace —** the Knowledge Immutability principle
(§6). The two operate at different levels and together provide a stable production
knowledge environment:

- **Knowledge becomes immutable after validation** — individual slices cannot
  change once served.
- **The registry becomes immutable after successful initialization** — the
  inventory that governs which slices exist, and under which contracts, cannot
  change while the system runs.

## References

- `docs/architecture/10-ai-runtime.md` — AI Runtime Contract.
- `docs/architecture/11-knowledge-framework.md` — Knowledge Framework Specification
  (frozen transport contract this loader lives behind).
- `docs/architecture/11-knowledge-framework-implementation.md`,
  `docs/architecture/11-knowledge-framework-integration.md` — the transport
  implementation and module-integration records.

## Scope

Architecture specification only. No implementation, no code, no format or library
choices, no framework change. Defines the production loader's contract; the
Knowledge Layer supplies identifiers, validation contracts, and content behind it.
