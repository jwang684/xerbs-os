# Production Knowledge Loader — Implementation Record

**Knowledge Layer Sprint · Step 6 (Production Loader Implementation).** Status:
**proposed — pending review.** This document records the outcome of implementing
the frozen Production Knowledge Loader Specification
(`docs/architecture/12-production-knowledge-loader.md`). It adds no new
architecture and changes no decision; it captures how the specification was
realized and one clarification of the registry entry.

Step 6 introduced a generic, registry-driven production loader behind the frozen
transport seam, replacing the stub as the application default. Observable behaviour
is unchanged: with no curated content authored yet, every request resolves to
absence and modules fall back (Option B).

## Loader

The `ProductionKnowledgeLoader` is a drop-in `KnowledgeLoader` that lives entirely
behind `load(request): Promise<KnowledgeBundle>`. It is completely generic — no
clinical vocabulary, no identifier branching, no `switch`/`if (identifier)`. Its
lifecycle is exactly the specified order: resolve request → registry lookup → load
source → validate → freeze → cache → assemble → return an immutable bundle. It
owns locating, loading, validation, immutability, caching, and assembly; it never
decides what is requested, never performs fallback presentation, and never reasons
clinically.

## Registry Mechanism

The registry mechanism defines the entry shape and the Registry Validation Rule
(§5a). `validateRegistry` runs at loader construction, before any knowledge is
served: it confirms every entry has a non-empty identifier, a source, and a
contract; that no identifier is duplicated; and that ownership is unique. Any
violation fails at initialization. The validated inventory is returned as a
read-only map of frozen entries, so the registry is immutable for the loader's
lifetime.

## Production Registry

The production registry is the single source of truth (Knowledge Layer) and, per
the Registry Completeness Rule (§3a), the **complete inventory** of requestable
knowledge interfaces — independent of authored content. Every interface a module
may request has exactly one entry: `diagnosisPatternDefinitions`,
`formulaDefinitions`, `patternTreatmentMap`, `prescriptionFormulaDefinitions`,
`treatmentFormulaMap`, `formulaCatalog`, and `herbCatalog`. Each entry is complete
(identifier + source + contract) even though its curated content is still empty;
registry and content are distinct concerns, and the registry is complete now.

### Registry Entry Structure

A registry entry is a **complete knowledge interface, not merely an identifier**.
Every entry is composed of three inseparable architectural elements, and an entry
is not considered complete unless all three exist:

1. **identifier**
2. **source**
3. **validation contract**

Together these three define one complete knowledge interface. Each owns a distinct
responsibility:

- **identifier**
  - defines the transport address of the interface;
  - is owned by the Knowledge Layer;
  - is referenced by modules;
  - is interpreted by no framework component (opaque throughout the framework).
- **source**
  - supplies raw knowledge;
  - owns acquisition only;
  - never validates;
  - never reasons.
- **validation contract**
  - validates structure;
  - establishes authoritative structural correctness;
  - determines whether loaded knowledge may enter the runtime.

Separating these three responsibilities prevents future coupling between
**acquisition** (source), **transport** (identifier), and **validation**
(contract). Each may evolve independently — a source may change where content comes
from without touching the contract; a contract may tighten structure without
touching acquisition; the identifier remains a stable opaque address regardless of
either. The loader depends only on the composition of the three, never on any one
implementation.

**Architectural principle: a registry entry is a complete knowledge interface, not
merely an identifier.**

### Registry Entry Lifecycle

Beyond its static structure, a registry entry defines the **complete lifecycle**
through which knowledge safely enters the runtime. Conceptually:

```
Registry Entry
      ↓
Source Resolution
      ↓
Structural Validation
      ↓
Immutable Knowledge Slice
      ↓
Cache
      ↓
Knowledge Bundle
      ↓
Module Consumption
```

Ownership is fixed at every stage and never shifts as knowledge moves through the
lifecycle:

- **Registry Entry** — the **Registry** owns the definition of the interface
  (identifier + source + contract).
- **Source Resolution** — the **Source** owns acquisition only; it obtains raw
  content and nothing more.
- **Structural Validation** — the **Validation Contract** owns structural
  correctness; it alone decides whether loaded knowledge may enter the runtime.
- **Immutable Knowledge Slice → Cache → Knowledge Bundle** — the **Production
  Loader** owns transportation, freezing, caching, and bundle assembly.
- **Module Consumption** — the **Module** owns interpretation and presentation
  (including graceful fallback when a slice is absent).

**No stage assumes responsibilities belonging to another stage.** The source never
validates; the contract never acquires; the loader never interprets; the module
never re-validates structure. Responsibilities remain isolated from the entry's
definition all the way to consumption, so a change at one stage cannot silently
alter another.

**Governing principle: a registry entry represents not merely a static definition,
but the complete architectural lifecycle through which knowledge safely enters the
runtime.**

This lifecycle **complements** the Registry Entry Structure above. Structure
defines **what** a registry entry is (identifier + source + validation contract);
lifecycle defines **how** that entry safely reaches the runtime (resolution →
validation → immutability → caching → transport → consumption). Together they
complete the architectural definition of a production knowledge interface.

## Validation

Validation is layered with unambiguous ownership: the framework validates only
transport; the loader validates structure (authoritatively, via each entry's
contract); modules validate behaviour, never structure. A successfully loaded slice
is structurally trusted by the modules that consume it.

## Caching

The loader owns a private cache of validated, frozen slices, keyed by identifier.
Cache ownership is exclusive to the loader; the framework and modules are unaware
it exists — the transport seam is unchanged.

## Option B

Missing, unavailable, or malformed knowledge is treated as **absent** from the
bundle; the module then injects its own placeholder. Empty content (no authored
source) flows through the unchanged loader algorithm to absence rather than
fabrication: the loader never invents knowledge, and neither does the framework.

## Domain Boundary

The loader and the registry mechanism contain no clinical vocabulary. The clinical
identifier strings live only in the Knowledge-Layer inventory (the production
registry), consistent with the frozen principle that identifiers are owned by the
Knowledge Layer and are opaque to the framework and the loader.

## Scope

Implementation record only. No code, framework, `BaseModule`/`AIEngine`/`AIContext`,
module, schema, prompt, or test change beyond the Step 6 loader implementation it
documents. The implementation is unchanged and remains as approved.
