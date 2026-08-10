# Xerbs OS

> An AI-native Clinical Operating System for Integrative Medicine.

Xerbs OS is an open clinical platform that combines Electronic Health Records (EHR), AI Clinical Reasoning, Knowledge Management, and Workflow Automation into a unified operating system for modern healthcare.

The long-term vision is to build an explainable, evidence-driven AI clinical engine that assists healthcare professionals while remaining deterministic, auditable, and clinically safe.

---

# Current Status

Current Version

**v0.1.1 — Clinical Understanding**

Current Phase

✅ Clinical Understanding

Current AI Capability

Assessment → Summary

---

# Current AI Pipeline

```
Patient Input
        │
        ▼
Assessment
        │
        ▼
Summary
        │
        ▼
Diagnosis (Coming Soon)
        │
        ▼
Formula (Coming Soon)
        │
        ▼
Prescription (Coming Soon)
        │
        ▼
Follow-up AI (Future)
```

---

# AI Engine

The AI Engine is built as a deterministic multi-stage pipeline.

Every module owns exactly one clinical responsibility.

| Module | Status | Responsibility |
|---------|--------|----------------|
| Assessment | ✅ | Organize all raw clinical information |
| Summary | ✅ | Organize & highlight important findings |
| Diagnosis | 🚧 | Clinical reasoning & syndrome differentiation |
| Formula | 📅 | Treatment strategy & formula selection |
| Prescription | 📅 | Prescription generation |
| Follow-up | 📅 | Longitudinal patient management |

---

# Clinical Runtime Principles

The runtime follows several deterministic safety rules.

## Clinical Safety Principle

Clinical confidence is **evidence-driven**, never reasoning-driven.

Reasoning may improve interpretation.

Reasoning must **never** increase confidence without additional clinical evidence.

---

## Runtime Rules

- Evidence Flow Rule

- Clinical Layer Rule

- Immutable Result Rule

- Confidence Propagation Rule

These rules guarantee:

- deterministic execution

- traceable evidence

- reproducible outputs

- auditable AI reasoning

---

# Completed Features

## AI Framework

- Modular AI Engine

- Provider-independent architecture

- Prompt Template System

- Schema-first validation

- Knowledge Loader

- Runtime Configuration

- OpenAI Provider

- Bootstrap Pipeline

---

## Clinical Modules

### Assessment

✅ Structured clinical assessment

✅ Evidence extraction

✅ Confidence scoring

✅ Red flag identification

✅ Missing information detection

---

### Summary

✅ Clinical summarization

✅ Finding prioritization

✅ Evidence preservation

✅ Missing information propagation

✅ Runtime safety guards

---

# Architecture

```
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
```

Each module

- owns one responsibility

- produces one structured result

- never modifies previous modules

- only reads upstream outputs

---

# Technology Stack

Frontend

- Next.js 16
- React 19
- TypeScript

Backend

- Better Auth
- tRPC
- Drizzle ORM
- PostgreSQL

AI

- OpenAI Responses API
- Modular AI Engine
- Zod
- Prompt Templates
- Runtime Contract

Infrastructure

- Docker
- GitHub Actions
- Vitest

---

# Documentation

## Architecture

```
docs/architecture/
```

System architecture

Backend

Frontend

Platform

AI Runtime

---

## AI Design

```
ai/
```

Engine

Assessment

Summary

Diagnosis

Formula

Knowledge

Roadmap

---

## Clinical Specifications

```
docs/clinical/
```

Assessment Specification

Summary Specification

Knowledge Design

Runtime Contract

---

# Development Workflow

Every clinical module follows the same workflow.

1. Clinical Specification

2. Schema

3. Knowledge

4. Prompt

5. Module

6. Tests

7. Pipeline Integration

Framework changes are only allowed when a real implementation exposes a concrete limitation.

Clinical capability is always prioritized over framework expansion.

---

# Roadmap

## Phase 1 — Clinical Understanding

✅ Assessment

✅ Summary

---

## Phase 2 — Clinical Reasoning

🚧 Diagnosis

Differential reasoning

Pattern differentiation

Diagnostic confidence

---

## Phase 3 — Clinical Treatment

📅 Formula

📅 Prescription

---

## Phase 4 — Marketplace

Clinical knowledge packages

AI plugins

External integrations

---

## Phase 5 — Follow-up AI

Longitudinal patient monitoring

Outcome tracking

Adaptive follow-up

---

## Phase 6 — Continuous Learning

Evaluation

Prompt optimization

Knowledge updates

Benchmarking

---

# Repository Structure

```
src/
    ai/
        engine/
        modules/
        prompts/
        providers/
        schemas/
        knowledge/
        types/

docs/
    architecture/
    clinical/
    api/

public/

drizzle/
```

---

# Contributing

Please read

```
CONTRIBUTING.md
```

before submitting pull requests.

The repository follows strict architectural and clinical governance rules.

---

# Decisions

Architectural decisions are documented in

```
DECISIONS.md
```

Every major design decision should be recorded before implementation.

---

# Releases

Release notes are available under

```
docs/releases/
```

Current Release

**v0.1.1 — Clinical Understanding**

---

# License

MIT License

---

# Vision

Build an explainable, evidence-based AI Clinical Operating System that assists clinicians while preserving transparency, traceability, and clinical safety.

**Clinical AI should augment medical professionals—not replace them.**
