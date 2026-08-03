# AI Development Rules

## Framework Freeze

The AI Framework is considered stable.

Do not redesign the framework.

Do not introduce new abstractions.

Do not modify engine architecture.

Framework changes are permitted only when a real implementation exposes an architectural limitation.

Every framework modification must include:

- the limitation
- why existing architecture cannot solve it
- why the change is necessary
- impact analysis

Implementation drives architecture.

Architecture does not drive implementation.

---

## Clinical-First Development

Development priority is:

Clinical Capability

>

Knowledge

>

Prompt Quality

>

Framework

The objective of every sprint is to improve clinical capability.

---

## Module Development Order

Every AI module must be developed in the following order.

1. Clinical Specification
2. Result Schema
3. Knowledge Structure
4. Prompt
5. Module
6. Tests
7. Pipeline Integration

Do not implement modules before their schema exists.

---

## Runtime Rules

Every module must follow the Runtime Contract.

Including

- Evidence Flow Rule
- Clinical Layer Rule
- Immutable Result Rule
- Confidence Propagation Rule
- Clinical Safety Principle

These rules are mandatory.

---

## Single Responsibility

Each module owns exactly one responsibility.

Assessment

↓

Facts

Summary

↓

Clinical Highlights

Diagnosis

↓

Clinical Interpretation

Formula

↓

Treatment Decision

Prescription

↓

Execution

Responsibilities must never overlap.

---

## Knowledge First

Medical knowledge belongs in the Knowledge Base.

Never hardcode

- symptoms
- herbs
- formulas
- contraindications
- clinical rules

inside prompts or modules.

---

## Provider Independence

Business logic must never depend on

- OpenAI
- Anthropic
- Gemini
- DeepSeek

Providers are implementation details.

---

## Schema First

Every AI output must be validated before entering business logic.

Invalid outputs are rejected.

---

## Clinical Safety

Confidence is evidence-driven.

Reasoning alone must never increase confidence.

Clinical safety takes priority over model creativity.

---

## Testing

Every module requires

- unit tests
- schema validation tests
- prompt loading tests
- provider-independent tests
- pipeline integration tests

No module is complete without tests.

---

## Success Criteria

Every merged AI module should increase clinical capability without requiring framework redesign.
