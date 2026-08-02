# AI Framework

## Overview

The AI Framework is the intelligence infrastructure of Xerbs OS.

It coordinates every AI module while remaining independent of medical knowledge,
business logic, and AI providers.

The framework transforms structured clinical data into structured clinical outputs
through a configurable, modular pipeline.

Medical knowledge is never hardcoded inside the framework.

---

# Architecture

```
                           Patient Portal
                                  │
                                  ▼
                             Visit Record
                                  │
                                  ▼
 ┌────────────────────────────────────────────────────┐
 │                AI Context Builder                  │
 └────────────────────────────────────────────────────┘
                                  │
                                  ▼
                             AIContext
                                  │
                                  ▼
 ┌────────────────────────────────────────────────────┐
 │                    AI Engine                       │
 └────────────────────────────────────────────────────┘
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 ▼
 Knowledge Loader     Prompt Builder   Provider Registry
          │                 │                 │
          ▼                 ▼                 ▼
   Knowledge Base       Prompt Template   AI Provider
                                              │
                                              ▼
                                       LLM Response
                                              │
                                              ▼
                                     Schema Validation
                                              │
                                              ▼
                                       Module Result
                                              │
                                              ▼
                                        Next Module
```

---

# Runtime Flow

The framework executes AI modules in a fixed order.

```
Patient Visit
      │
      ▼
Assessment Module
      │
      ▼
Summary Module
      │
      ▼
Diagnosis Module
      │
      ▼
Formula Module
      │
      ▼
Prescription Module
      │
      ▼
Follow-up Module
      │
      ▼
Persist Results
```

Every module consumes the output of the previous module.

No module communicates directly with another module.

---

# Core Components

## AI Engine

The AI Engine is the central coordinator.

Responsibilities

- Execute the AI pipeline
- Load medical knowledge
- Build prompts
- Select AI providers
- Validate structured outputs
- Handle retries
- Log execution
- Return structured results

The Engine never contains medical knowledge.

---

## AI Context Builder

The Context Builder converts application data into a standardized AIContext.

Sources may include

- Patient
- Visit
- Questionnaire
- Tongue Images
- Medical History
- Laboratory Results
- Previous Diagnoses
- Previous Prescriptions

Every module receives the same AIContext.

---

## AI Modules

Each AI module performs exactly one clinical task.

Examples

- AssessmentModule
- SummaryModule
- DiagnosisModule
- FormulaModule
- PrescriptionModule
- FollowUpModule

Rules

- One responsibility
- Independent
- Stateless
- Structured input only
- Structured output only

Modules never call each other directly.

---

## Knowledge Loader

The Knowledge Loader retrieves reusable medical knowledge from the Knowledge Base.

Examples

- Questionnaires
- Symptoms
- Tongue Diagnosis
- Patterns
- Treatments
- Formula Library
- Herbs
- Contraindications
- Clinical Rules

The AI Engine loads knowledge only when required.

Knowledge never depends on AI providers.

---

## Prompt Builder

The Prompt Builder assembles provider-ready prompts.

Responsibilities

- Load prompt templates
- Inject AIContext
- Inject medical knowledge
- Produce provider-ready prompts

Prompt templates never contain hardcoded medical knowledge.

---

## Provider Registry

The Provider Registry selects the AI provider.

Supported through a common interface.

Examples

- OpenAI
- Anthropic
- Gemini
- DeepSeek

Additional providers can be added without changing the framework.

---

## Schema Validation

Every AI response must match predefined schemas before being accepted.

Examples

- AssessmentSchema
- SummarySchema
- DiagnosisSchema
- FormulaSchema
- PrescriptionSchema
- FollowUpSchema

Invalid responses are rejected before reaching business logic.

---

# Data Flow

```
Application
      │
      ▼
AIContext
      │
      ▼
AI Engine
      │
      ▼
Prompt Builder
      │
      ▼
Knowledge Loader
      │
      ▼
Provider Registry
      │
      ▼
LLM
      │
      ▼
Schema Validation
      │
      ▼
Structured Result
```

Business services consume only validated structured outputs.

---

# Dependency Rules

Allowed dependencies

```
AI Engine
├── Modules
├── Prompt Builder
├── Knowledge Loader
├── Provider Registry
└── Schemas
```

Forbidden dependencies

- Modules → Providers
- Modules → Database
- Modules → HTTP APIs
- Providers → Knowledge
- Knowledge → Providers
- Schemas → Business Logic
- Prompt Templates → Medical Knowledge

---

# Design Principles

## Separation of Responsibilities

Each component has one responsibility.

---

## Knowledge Driven

Medical knowledge is external.

The framework loads knowledge dynamically.

---

## Provider Independent

Switching AI providers does not affect business logic.

---

## Schema First

Every module communicates through versioned schemas.

---

## Modular

Modules can be added or removed independently.

---

## Stateless

Modules never maintain runtime state.

---

## Testable

Each module can be tested independently.

---

# Non-Goals

The AI Framework does NOT

- Store patient records
- Access the database directly
- Implement authentication
- Execute business workflows
- Replace clinicians
- Manage HTTP requests
- Perform billing
- Render UI

These responsibilities belong to other parts of Xerbs OS.

---

# Future Extensions

The framework is designed to support additional modules without architectural changes.

Examples

- Tongue Image Analysis
- Face Diagnosis
- Voice Diagnosis
- Laboratory Interpretation
- Wearable Device Analysis
- Medical Imaging
- Risk Prediction
- Personalized Health Coaching
- Nutrition Recommendation
- Lifestyle Recommendation

New modules plug into the AI Engine through the same module interface.

---

# Development Rules

When implementing a new AI capability

1. Define the schema.
2. Implement the module.
3. Register the module.
4. Build prompt templates.
5. Connect knowledge loaders.
6. Add provider support.
7. Add validation.
8. Write tests.

Never bypass the AI Engine.

Never hardcode medical knowledge.

Never call providers directly from business services.

---

# Architecture Goals

The AI Framework is designed to be

- Modular
- Knowledge-driven
- Provider-independent
- Schema-first
- Stateless
- Testable
- Extensible
- Maintainable
- Production-ready
