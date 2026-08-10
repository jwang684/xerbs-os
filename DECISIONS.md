# DECISIONS.md

# Xerbs OS Architecture Decisions

This document records the major architectural decisions of Xerbs OS.

These decisions are considered stable.

They should not be changed without strong implementation evidence.

---

# ADR-001

## Clinical AI is Knowledge-Driven

Status

Accepted

Decision

Medical knowledge is stored inside the Knowledge Base.

AI modules load knowledge dynamically.

Reason

Medical knowledge changes over time.

Architecture should remain stable while knowledge evolves.

Consequences

Medical knowledge must never be hardcoded inside:

- modules
- prompts
- providers

Knowledge can evolve independently from the AI framework.

---

# ADR-002

## Framework Freeze

Status

Accepted

Decision

The AI Framework is considered stable.

Framework modifications require implementation-driven justification.

Reason

Continuous framework redesign slows clinical development.

Clinical capability is the primary objective.

Consequences

New AI capabilities must use the existing framework whenever possible.

Architecture changes require explicit review.

---

# ADR-003

## Clinical-First Development

Status

Accepted

Decision

Development focuses on clinical intelligence before infrastructure improvements.

Priority

Clinical Capability

↓

Knowledge

↓

Prompt Quality

↓

Framework

Reason

Clinical capability creates user value.

Framework exists to support clinical capability.

Consequences

Framework work is minimized.

Clinical modules become the primary development target.

---

# ADR-004

## Schema-First Design

Status

Accepted

Decision

Every AI capability begins with its output schema.

Development order:

Clinical Specification

↓

Schema

↓

Knowledge

↓

Prompt

↓

Module

↓

Tests

↓

Pipeline Integration

Reason

Schemas define runtime contracts.

Modules implement schemas.

Consequences

Modules never define runtime contracts.

Schemas remain stable.

---

# ADR-005

## Runtime Pipeline

Status

Accepted

Decision

The AI pipeline executes sequentially.

Patient Input

↓

Assessment

↓

Summary

↓

Diagnosis

↓

Formula

↓

Prescription

↓

Follow-up

Reason

Clinical reasoning naturally progresses through these stages.

Consequences

Modules only consume previous outputs.

Modules never execute out of order.

---

# ADR-006

## Evidence Flow

Status

Accepted

Decision

Clinical evidence only flows forward.

Reason

Earlier modules own raw patient information.

Later modules consume structured results.

Consequences

Assessment is the single owner of raw clinical findings.

Downstream modules never reinterpret raw patient input.

---

# ADR-007

## Single Responsibility

Status

Accepted

Decision

Each AI module owns exactly one clinical responsibility.

Assessment

Organize findings

Summary

Highlight findings

Diagnosis

Interpret findings

Formula

Select treatment

Prescription

Generate prescription

Follow-up

Generate follow-up plan

Reason

Avoid overlapping responsibilities.

Consequences

Modules remain independent.

Responsibilities remain explicit.

---

# ADR-008

## Clinical Safety

Status

Accepted

Decision

Clinical confidence is evidence-driven.

Reasoning alone never increases confidence.

Reason

Clinical safety takes priority over AI creativity.

Consequences

Confidence can remain unchanged.

Confidence can decrease.

Confidence only increases with additional evidence.

---

# ADR-009

## Provider Independence

Status

Accepted

Decision

Business logic never depends on an LLM provider.

Reason

Providers evolve quickly.

Clinical logic should remain stable.

Consequences

Only:

src/ai/providers/

may contain provider-specific implementations.

---

# ADR-010

## Prompt Independence

Status

Accepted

Decision

Prompt templates are data.

Reason

Prompts evolve independently from runtime logic.

Consequences

Prompt templates never contain:

- business logic
- medical knowledge
- provider-specific behavior

---

# ADR-011

## Knowledge Separation

Status

Accepted

Decision

Knowledge and prompts remain independent.

Reason

The same knowledge may support multiple prompts.

The same prompt structure may load different knowledge.

Consequences

Knowledge Loader injects knowledge into prompts dynamically.

---

# ADR-012

## AI Engine Responsibilities

Status

Accepted

Decision

The AI Engine owns:

- pipeline execution
- provider selection
- prompt construction
- knowledge loading
- schema validation
- retry handling
- execution logging

Reason

Modules should remain lightweight.

Consequences

Modules never duplicate engine behavior.

---

# ADR-013

## Immutable Runtime

Status

Accepted

Decision

Completed module outputs are immutable.

Reason

Clinical reasoning must remain reproducible.

Consequences

Modules never modify previous results.

Every module appends only its own result.

---

# ADR-014

## Documentation Reflects Implementation

Status

Accepted

Decision

Documentation describes implementation.

Implementation should not change solely to match documentation.

Reason

Documentation must remain truthful.

Consequences

Implementation remains the source of truth.

---

# ADR-015

## Clinical Capability is the Product

Status

Accepted

Decision

The value of Xerbs OS comes from clinical intelligence.

Framework quality enables development.

Clinical capability creates user value.

Reason

Users benefit from accurate clinical reasoning, not infrastructure alone.

Consequences

Future development prioritizes:

- Knowledge Base
- Clinical Modules
- Clinical Reasoning
- Safety
- Explainability

Framework maintenance remains secondary.

---

# Decision Process

A new Architecture Decision Record should only be created when:

- an architectural decision becomes stable
- changing it would affect future development
- the decision influences multiple modules

Minor implementation details should not become ADRs.

---

# Modification Policy

Changing an accepted decision requires:

1. implementation evidence
2. technical justification
3. architectural impact analysis
4. migration strategy

Architecture decisions should evolve slowly.

Clinical intelligence should evolve continuously.
