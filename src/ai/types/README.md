# AI Types

## Overview

Types define shared interfaces used throughout the AI system.

Types never contain business logic.

---

# Examples

AIContext

DiagnosisResult

FormulaResult

AssessmentResult

ProviderResult

KnowledgeLoader

PromptTemplate

---

# Principles

Types

- are reusable
- are framework-independent
- are implementation-independent

---

# Usage

Types are shared by

Engine

Modules

Providers

Schemas

Application

---

# Rules

Types should never

- access database
- perform computation
- contain business logic
