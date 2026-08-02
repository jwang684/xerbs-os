# AI Engine

## Overview

The AI Engine is the intelligence layer of Xerbs OS.

Its responsibility is to transform structured patient data into structured clinical outputs.

The AI Engine itself does not contain medical knowledge.

All medical knowledge is loaded dynamically from the Knowledge Base at runtime.

The Engine is independent of any specific AI provider and communicates only through structured data.

---

# Architecture Principles

The AI Engine follows these core principles.

- Every AI module has a single responsibility.
- AI modules are independent and composable.
- Modules exchange structured data only.
- Medical knowledge is separated from prompts.
- Prompts are separated from business logic.
- AI providers are replaceable.
- Every output follows a predefined schema.
- Medical knowledge never lives inside application code.

---

# AI Pipeline

The AI workflow is executed sequentially.

```
Patient Input
      │
      ▼
Assessment
      │
      ▼
Clinical Summary
      │
      ▼
Diagnosis
      │
      ▼
Formula Recommendation
      │
      ▼
Prescription
      │
      ▼
Follow-up Plan
```

Each module consumes the structured output produced by the previous module.

No module may skip the pipeline.

---

# Directory Structure

```
src/ai/

engine/
modules/
providers/
prompts/
schemas/
types/
```

Medical knowledge is stored separately under

```
ai/knowledge/
```

---

# Engine

The Engine coordinates the complete AI workflow.

Responsibilities

- Execute the AI pipeline
- Build AI Context
- Load Knowledge Base
- Load Prompt Templates
- Build prompts
- Select AI provider
- Execute AI requests
- Validate structured outputs
- Handle retries
- Log execution
- Return structured results

The Engine is the only component allowed to communicate with AI providers.

---

# AI Context

Before executing any module, the Engine builds a structured AI Context.

The context may include

- Patient demographics
- Visit information
- Questionnaire results
- Tongue analysis
- Clinical history
- Active diagnoses
- Active prescriptions
- Laboratory results
- Previous follow-up notes

Modules never query application data directly.

They receive everything through AI Context.

---

# Modules

Every module performs exactly one responsibility.

## Assessment

Transforms questionnaires and patient information into structured clinical findings.

Output

- Structured findings
- Abnormal observations
- Missing information

---

## Clinical Summary

Produces a concise structured summary of the patient's condition.

Output

- Chief complaint
- Clinical highlights
- Relevant findings

---

## Diagnosis

Performs syndrome differentiation.

Output

- Syndrome
- Confidence
- Supporting evidence

---

## Formula Recommendation

Selects the most appropriate herbal formula.

Output

- Formula
- Modification suggestions
- Clinical rationale

---

## Prescription

Generates the final prescription.

Output

- Herbs
- Dosage
- Administration
- Warnings

---

## Follow-up

Produces follow-up recommendations.

Output

- Follow-up interval
- Monitoring items
- Lifestyle advice
- Reassessment recommendations

---

# Module Contract

Every AI module must

- Accept structured input only
- Return structured output only
- Never call another module directly
- Never access the database
- Never mutate application state
- Never communicate with AI providers
- Never contain hardcoded medical knowledge

Modules communicate only through the Engine.

---

# Providers

Providers communicate with external AI services.

Examples

- OpenAI
- Anthropic
- Google Gemini
- DeepSeek
- Azure OpenAI
- Local Models

Providers are responsible only for

- Sending requests
- Receiving responses
- Error handling
- Authentication

Providers never contain

- Business logic
- Medical knowledge
- Prompt construction

---

# Knowledge Base

Medical knowledge is external to the AI Engine.

The Engine loads only the knowledge required for the current module.

The Knowledge Base includes

- Intake Questionnaires
- Symptoms
- Tongue Diagnosis
- Syndrome Patterns
- Treatment Principles
- Formula Library
- Herbs
- Contraindications
- Clinical Rules

Knowledge is versioned independently from application code.

---

# Prompt Templates

Prompt Templates define AI instructions only.

Prompt Templates never contain

- Medical knowledge
- Business rules
- Clinical guidelines

Medical knowledge is injected dynamically from the Knowledge Base during execution.

---

# Schemas

Every module exposes its own input and output schema.

Schemas

- are versioned
- are provider-independent
- validate every AI response
- remain backward compatible whenever possible

Every provider must return data conforming to the schema.

---

# Future Modules

The Engine is designed to support additional capabilities without architectural changes.

Future modules may include

- Tongue Image Analysis
- Laboratory Analysis
- Face Diagnosis
- Voice Analysis
- Wearable Data Analysis
- Medical Imaging
- Risk Prediction
- Prognosis Prediction

New modules plug into the existing Engine.

No existing module should require modification.

---

# Development Rules

When implementing a new AI capability

1. Define schemas.
2. Create the module.
3. Register the module.
4. Create prompt templates.
5. Connect knowledge loaders.
6. Add validation.
7. Add tests.

Never bypass the Engine.

Never bypass schemas.

Never hardcode medical knowledge.

---

# Design Philosophy

The AI Engine is deterministic.

Medical knowledge belongs to the Knowledge Base.

Reasoning belongs to the AI provider.

Business logic belongs to the application.

Presentation belongs to the frontend.

These responsibilities must never overlap.
