# Diagnosis Pattern Definitions — Authoring Rules

**Diagnosis Pattern Definitions · Content Sprint · Authoring Rules.** Status:
**PROPOSED — PENDING REVIEW.** A deliberately lightweight, practical rulebook for authoring
the diagnosis-tier meaning corpus (`diagnosis-pattern-definitions.md`), so content creation
can begin consistently. It authors no content, no definitions, and no mappings, and designs
no generator, source, contract, validator, registry change, or wiring. It is subordinate to
the frozen architecture review (`docs/architecture/46`) and specification (`47`), and
mirrors the established authoring rules (`20`, `36`, `45`); it repeats no settled
architecture — it only fixes authoring conventions. Examples below use abstract placeholders
only.

## 1. Purpose

These rules exist so the diagnosis-pattern meaning corpus is authored **consistently and
maintainably, with stable meaning ownership and duplicate prevention**. Their goal is
meaning-authoring discipline — **not clinical validation** (clinical/editorial accuracy is
human review, not the job of these rules). Their single purpose is to unblock authoring of
`diagnosis-pattern-definitions.md` with conventions that will not need to change later.

## 2. Identity Reference Rules

- **Every entry must reference a canonical identity owned by `diagnosisPatternCatalog`** — a
  pattern name the catalog already owns.
- **Meaning is attached by reference** — an entry pairs a referenced catalog identity with
  its meaning; it never introduces a new identity.
- **Identity is never duplicated** — the canonical name is owned solely by the catalog; the
  definition cites it, and a name not in the catalog is not eligible (the reference must
  resolve).

*Abstract form only (not content):* `- **<Referenced Catalog Pattern>** — <intrinsic
clinical meaning>`.

## 3. Definition Writing Rules

- **Intrinsic clinical nature only** — a definition states what the pattern intrinsically
  *is* (the disharmony/state it denotes).
- **Answers "What is this pattern?"** — never "When should it be diagnosed?", "What treatment
  follows?", or "What formula should be used?".
- **Objective** — an account of what the pattern is, not an opinion.
- **Timeless** — enduring meaning, not present-day practice or context.
- **Standalone / context-independent** — complete and meaningful with no patient, case,
  symptom, diagnostic-procedure, or treatment context present.

## 4. Prohibited Content

An entry must not contain:

- treatment principles,
- formula references,
- herb references,
- recommendations,
- rankings,
- preferred treatments,
- treatment guidance,
- pattern-treatment mappings,
- pattern-formula mappings,
- decision procedures,
- diagnostic algorithms,
- symptom checklists,
- patient-selection language,
- reasoning chains.

These are owned by other interfaces (the maps, the reasoning layer, the strategy/execution
tiers) or are out of scope entirely.

## 5. One Definition Per Identity

- **One identity, one definition.**
- **No duplicate entries** — a referenced pattern appears at most once.
- **No alternate versions** — a single canonical meaning per identity; competing or variant
  definitions of the same pattern are not authored.

## 6. Scope Rules

**Belongs:**
- the intrinsic clinical meaning of a catalogued diagnostic pattern.

**Does not belong (owned elsewhere):**
- identity ownership → `diagnosisPatternCatalog`;
- treatment principles → `formulaDefinitionCatalog` / `formulaDefinitions`;
- formulas → `formulaCatalog` / `prescriptionFormulaDefinitions`;
- herbs → `herbCatalog`;
- mappings (pattern→treatment / pattern→formula) → `patternTreatmentMap` (and the downstream
  `treatmentFormulaMap`);
- recommendations / diagnostic procedures / reasoning → the reasoning layer
  (`DiagnosisModule` at runtime);
- aliases, translations → future alias / localization layers.

## 7. Source of Truth Rules

- **Future authoritative source** — `src/ai/knowledge/content/diagnosis-pattern-definitions.md`,
  representation-neutral markdown, one entry per line (referenced pattern + meaning).
- **Authoring ownership** — authored and frozen through this content sprint under human
  editorial review.
- **Generated artifacts are projections only** — any future derived form is a
  non-authoritative projection of the markdown; **no manual editing of generated outputs**
  (edit the markdown and regenerate). The markdown always wins.

## 8. Editorial Review Gates

**Definition Neutrality** and **Context Independence** are **authoritative editorial review
gates** for this corpus. They are:
- **NOT structural validation** (the future contract),
- **NOT contract responsibilities**,
- **NOT cross-content validation responsibilities** (the build-time
  `pattern ∈ diagnosisPatternCatalog` check).

They remain **independent review layers**, applied before freeze. Consequently, a definition
may pass structural validation and cross-content validation while still **failing an
editorial review gate** (e.g. a well-formed entry whose text drifts into treatment advice or
a symptom checklist). This separation is intentional.

## 9. Future Compatibility

Future interfaces **reference identities; they must never duplicate meanings.** Meaning is
defined once, here, keyed to a catalog identity; downstream layers (maps, reasoning, future
interfaces) cite the identity and rely on this meaning without copying it. Meaning remains
owned by `diagnosisPatternDefinitions`; identity remains owned by `diagnosisPatternCatalog`.

## 10. Completion Criteria

The corpus is "complete enough to begin wiring" when — **independent of any entry count**:

- **every entry references a catalog identity** that resolves in `diagnosisPatternCatalog`;
- **every entry contains one intrinsic definition** (referenced pattern + objective meaning);
- **ownership boundaries respected** (no prohibited content, §4);
- **passes Definition Neutrality review** (§8);
- **passes Context Independence review** (§8);
- **no duplicates** (one definition per identity, §5).

**No required count, no parity requirement.** When these hold and the corpus is frozen, the
wiring lifecycle (derivation → source → contract → registry upgrade, plus the build-time
catalog cross-content check) may begin, reusing the proven pattern. Option B keeps partial
coverage valid.

## Sufficiency

These authoring rules, together with the approved specification (`docs/architecture/47`),
are sufficient to begin **content authoring** of `diagnosis-pattern-definitions.md` upon
approval. The only remaining decisions (meaning altitude specifics, parity target, batch
cadence) are authoring-time choices, not blockers.

## Scope

Authoring rules only. No diagnosis-pattern content, definitions, mappings, generators,
sources, contracts, validators, registry changes, or wiring; no change to any existing file
other than the creation of this document.

STOP. Authoring rules complete. No content authored. Nothing committed. Awaiting review.
