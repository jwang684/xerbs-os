# Knowledge Framework — Integration Record

**Knowledge Layer Sprint · Step 4 (Knowledge Integration).** Status: **Approved
and frozen (2026-08-05).** This document records the outcome of wiring the generalized
knowledge transport (`docs/architecture/11-knowledge-framework.md`;
`11-knowledge-framework-implementation.md`) into the three knowledge-consuming
modules. It adds no new architecture and changes no decision; it documents two
architectural properties of the integration.

Step 4 had each of Diagnosis, Formula, and Prescription declare its knowledge
demand via `knowledgeRequest()` and consume the transported bundle through
protected module state (`this.knowledge`) with a module-tier graceful fallback.
The Template Method API (`variables(context)`) is unchanged, Option B is
unchanged, and observable behaviour is identical (all knowledge absent →
`"(none provided)"`).

## Execution Scope of Protected Module State

`BaseModule` stores the knowledge bundle loaded for the current run in protected
module state (`protected knowledge?: KnowledgeBundle`), populated by `execute`
before `variables()` runs. This section documents why that is correct today and
records the one assumption it rests on.

**Protected module state is intentionally ephemeral.** `this.knowledge` exists
only to expose transport data during a single module execution; it must never be
treated as persistent module state. It is written at the start of each `execute`,
read within that same execution's `variables()`, and carries no meaning between
executions — it is not configuration, not a cache, and not durable state a module
may rely on across runs. Treating it as persistent would reintroduce exactly the
cross-execution coupling the sequential-execution assumption below is meant to
keep out.

- **Per-execution state.** `this.knowledge` holds knowledge for *one* execution.
  `execute` assigns it immediately after loading and before building the prompt,
  so `variables()` always reads the bundle belonging to the run in progress.
- **Correct because execution is sequential.** `AIEngine.run` executes registered
  modules one at a time (`for … of`, awaiting each), and a given module's
  `execute` runs to completion — assign `this.knowledge`, build prompt, call the
  provider, validate, `finalize` — before any other module runs. Within a run
  there is no interleaving, so the stored bundle cannot be observed by another
  module or overwritten mid-execution.
- **Module instances are effectively execution-scoped under the current runtime.**
  Although a module instance is registered once, the current runtime uses it for
  a single in-flight execution at a time. Each run reassigns `this.knowledge`
  before `variables()`, so no stale value from a previous run can leak into a
  later one.
- **Shared instances are not intended for concurrent `execute()` calls.** The
  design assumes one active execution per module instance. Driving the *same*
  registered instance from two overlapping `execute()` calls (e.g. two concurrent
  `run()` invocations sharing the engine's modules) is outside the current
  contract.
- **If concurrent execution is ever introduced**, execution isolation must be
  added — for example per-run module instances, or an execution-scoped carrier
  for the bundle — so that concurrent runs never share `this.knowledge`. The
  transport contract and the Template Method API would not need to change; only
  the ownership of per-run state would.
- **This is a future architectural consideration, not a current limitation
  requiring implementation.** Under today's sequential runtime the protected-state
  approach is correct and race-free. The note exists so a future maintainer who
  introduces concurrency knows exactly which assumption to revisit — and does not
  mistake today's correct design for a latent bug.

## Knowledge Fallback Philosophy (`knowledgeFallback.ts`)

`knowledgeOrNone()` lives in `src/ai/modules/knowledgeFallback.ts`, in the module
tier — deliberately not in the framework. This placement is architectural, not
incidental.

- **It is intentionally a module-tier helper**, shared by the modules that consume
  knowledge. It expresses how a *consumer* copes with absent knowledge.
- **It is not part of the framework.** `BaseModule`, `AIEngine`, `KnowledgeLoader`,
  `KnowledgeRequest`, and `KnowledgeBundle` do not reference it and never will.
- **Fallback behaviour belongs to modules, not `BaseModule`.** The decision to
  substitute `"(none provided)"` when a slice is absent is a consumer policy; the
  framework does not make it.
- **Different modules remain free to consume the same knowledge differently.** A
  helper is a convenience, not a mandate. Another module could format, filter, or
  present a slice its own way; nothing in the framework forces a single fallback
  representation.
- **The framework only transports knowledge.** It moves opaque identifiers to the
  loader and opaque values back; it hands the bundle to the module and stops.
- **The framework never performs fallback.** An absent identifier is simply absent
  from the bundle (Option B). The framework inserts no default, no placeholder,
  and no `"(none provided)"` — that string exists only in the module tier.
- **This preserves the domain-agnostic transport architecture.** Because fallback
  (and any interpretation of a slice) lives with the consumer, the framework stays
  blind to what knowledge means and how its absence should read. Keeping
  `knowledgeOrNone` out of the framework is what keeps the framework a pure
  transport.

## Scope

Documentation record only. No code, framework, `BaseModule`/`AIEngine`/`AIContext`,
loader, module-logic, schema, prompt, or test change. The Step 4 implementation is
unchanged and remains as approved.
