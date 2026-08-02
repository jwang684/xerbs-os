# AI Engine

## Overview

The AI Engine is the intelligence layer of Xerbs OS.

Its responsibility is to transform structured patient data into structured clinical outputs.

The AI Engine does not contain medical knowledge.

Medical knowledge is loaded dynamically from the Knowledge Base.

---

## Principles

- AI modules are independent.
- Every module has a single responsibility.
- All modules exchange structured data only.
- Knowledge is separated from prompts.
- Prompts are separated from business logic.
- AI providers are replaceable.
- Every output follows a predefined schema.

---

## Pipeline

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

Every module consumes the output of the previous module.

---

## Directory Structure

```
src/ai/

engine/
modules/
providers/
prompts/
knowledge/
schema/
types/
```

---

## Engine

The Engine coordinates every AI module.

Responsibilities:

- Execute the pipeline.
- Load knowledge.
- Build prompts.
- Select AI provider.
- Validate outputs.
- Return structured results.

---

## Modules

Assessment

Collect structured findings.

Summary

Generate concise clinical summary.

Diagnosis

Generate syndrome differentiation.

Formula

Generate herbal formula.

Prescription

Generate structured prescription.

Follow-up

Generate follow-up recommendations.

Each module only performs one task.

---

## Providers

Providers communicate with LLMs.

Examples

- OpenAI
- Anthropic
- Gemini
- DeepSeek

Providers never contain business logic.

---

## Knowledge

Knowledge is external to the AI Engine.

The Engine loads knowledge when required.

Knowledge includes

- Questionnaires
- Symptoms
- Tongue
- Patterns
- Treatments
- Herbs
- Formula Library
- Contraindications
- Clinical Rules

---

## Prompts

Prompts are generated dynamically.

Prompt templates never contain medical knowledge directly.

Medical knowledge is injected from the Knowledge Base.

---

## Schemas

Every module returns structured outputs.

Schemas are versioned.

Providers must conform to the same schema.

---

## Future Modules

Future capabilities may include

- Tongue Image Analysis
- Face Diagnosis
- Laboratory Analysis
- Wearable Data
- Voice Analysis
- Risk Prediction

These modules plug into the Engine without changing the architecture.
