# AI Development Rules

## AI First

The AI Engine is developed before any AI feature.

Every new AI capability must first be documented under `/docs/ai`.

Implementation always follows documentation.

---

## Separation of Concerns

Knowledge is never stored in prompts.

Prompts are never mixed with application code.

Knowledge, prompts, and implementation are independent modules.

---

## Reusability

The AI Engine is shared by:

- Assessment
- Summary
- Diagnosis
- Formula Generation
- Follow-up

Do not duplicate logic between modules.

---

## Documentation

Before implementing:

1. Update docs/ai
2. Define workflow
3. Define inputs/outputs
4. Implement code

Never implement AI logic before documentation exists.

---

## Architecture

The AI Engine must remain domain-driven.

Every stage produces structured output.

Assessment
    ↓
Summary
    ↓
Diagnosis
    ↓
Formula
    ↓
Follow-up

Every stage consumes the previous stage's output.

Never skip stages.

---

## Long-term Goal

Build one reusable AI Engine.

Products are built on top of the Engine.

Never build AI features directly inside products.
