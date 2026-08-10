# AI Engine

## Overview

The Engine is the execution coordinator of the Xerbs AI system.

It does not perform medical reasoning.

It orchestrates the complete AI workflow.

---

# Responsibilities

The Engine is responsible for

- Building AI Context
- Loading Knowledge Base
- Loading Prompt Templates
- Selecting AI Provider
- Executing AI Modules
- Validating Outputs
- Logging Executions
- Handling Retries
- Returning Structured Results

---

# Execution Flow

The Engine executes modules sequentially.

```
Assessment
      ↓
Clinical Summary
      ↓
Diagnosis
      ↓
Formula Recommendation
      ↓
Prescription
      ↓
Follow-up
```

No module may call another module directly.

The Engine coordinates every step.

---

# AI Context

Before executing any module, the Engine builds a structured AI Context.

Example

```
Patient
Visit
Questionnaire
Tongue
History
Diagnosis
Prescription
Lab Results
```

Modules receive the Context as input.

They never query the database directly.

---

# Knowledge Loading

The Engine determines which knowledge is required.

Example

Assessment

↓

Questionnaires

Symptoms

Diagnosis

↓

Patterns

Tongue

Clinical Rules

Formula

↓

Formula Library

Herbs

Treatment Principles

The entire Knowledge Base is never loaded at once.

---

# Prompt Building

The Engine combines

Prompt Template

+

Knowledge

+

AI Context

↓

Final Prompt

Prompt Templates never contain medical knowledge.

---

# Provider Selection

The Engine selects the provider.

Examples

- OpenAI
- Anthropic
- Gemini
- DeepSeek
- Azure OpenAI
- Local Models

Providers are interchangeable.

---

# Validation

Every AI response must

- match schema
- pass validation
- include confidence
- include version

Invalid outputs are rejected.

---

# Logging

The Engine records

- execution time
- provider
- model
- retries
- tokens
- failures
- validation errors

Medical data should never be logged unless explicitly permitted.

---

# Design Rules

The Engine

- never contains medical knowledge
- never contains business logic
- never renders UI
- never accesses the frontend
