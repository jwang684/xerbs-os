# CONTRIBUTING.md

# Xerbs OS Engineering Guide

This document defines the engineering rules for developing Xerbs OS.

Every contributor (human or AI) should follow these rules.

---

# Core Philosophy

Xerbs OS is a clinical AI system.

The primary objective is to improve clinical capability while maintaining safety, consistency, and maintainability.

Architecture exists to support clinical intelligence—not the other way around.

---

# Development Priorities

Development priorities are:

1. Clinical Capability
2. Knowledge Quality
3. Prompt Quality
4. Testing
5. Framework Maintenance

Clinical capability is always prioritized over framework expansion.

---

# Framework Freeze

The AI Framework is considered stable.

Do not redesign the framework.

Do not introduce unnecessary abstractions.

Do not modify the AI Engine unless a real implementation exposes an architectural limitation.

Framework changes are permitted only when all of the following are provided:

- the concrete limitation
- why the current architecture cannot solve it
- why the proposed change is necessary
- expected architectural impact

Implementation drives architecture.

Architecture does not drive implementation.

---

# AI Development Order

Every new AI capability must be developed in the following order.

## Step 1

Clinical Specification

Define:

- clinical purpose
- responsibility
- clinical layer
- inputs
- outputs
- forbidden responsibilities

No implementation begins before the clinical specification is complete.

---

## Step 2

Result Schema

Define:

- Zod schema
- Result type
- Validation rules
- Confidence field
- Evidence field (if applicable)

Schema defines the runtime contract.

---

## Step 3

Knowledge

Create or extend the Knowledge Base.

Medical knowledge belongs inside:

- questionnaires
- symptoms
- tongue
- patterns
- treatments
- formulas
- herbs
- contraindications
- clinical rules

Never hardcode medical knowledge inside prompts or modules.

---

## Step 4

Prompt

Create the prompt template.

Prompts should:

- consume structured context
- consume structured knowledge
- produce structured outputs

Prompts never contain embedded medical knowledge.

---

## Step 5

Module

Implement the module.

Modules should only contain orchestration logic.

Modules never contain:

- medical knowledge
- provider-specific logic
- business logic
- database access

Modules inherit from BaseModule.

---

## Step 6

Testing

Every module requires:

- unit tests
- schema validation tests
- prompt loading tests
- provider-independent tests
- pipeline tests

No module is complete without passing all tests.

---

## Step 7

Pipeline Integration

Register the module.

Update:

- bootstrap
- pipeline order
- AI configuration

Do not bypass the AI Engine.

---

# Runtime Contract

Every module must follow the Runtime Contract.

Including:

- Evidence Flow Rule
- Clinical Layer Rule
- Immutable Result Rule
- Confidence Propagation Rule
- Clinical Safety Principle

These rules are mandatory.

---

# Clinical Layers

Each module owns exactly one responsibility.

Assessment

- Organize clinical findings

Summary

- Organize and highlight findings

Diagnosis

- Interpret findings
- Determine clinical patterns

Formula

- Select treatment strategy
- Select formulas
- Select herbs

Prescription

- Produce the final prescription

Follow-up

- Produce follow-up recommendations

Responsibilities must never overlap.

---

# Evidence Flow Rule

Evidence always flows forward.

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

Each module may only consume outputs from previous modules.

Modules never reprocess raw patient data already owned by earlier modules.

---

# Clinical Safety Principle

Clinical confidence is evidence-driven.

Reasoning may improve interpretation.

Reasoning must never increase confidence without additional clinical evidence.

Examples of additional evidence include:

- tongue findings
- pulse findings
- laboratory data
- imaging
- wearable devices
- physician review
- follow-up visits
- additional questionnaires

Clinical safety always takes priority over model creativity.

---

# Confidence Propagation

Every module explicitly reports confidence.

Confidence may:

- stay the same
- decrease

Confidence must never increase without new evidence.

Every confidence change should include an explanation.

---

# Knowledge Rules

Medical knowledge belongs exclusively inside the Knowledge Base.

Never hardcode:

- symptoms
- syndromes
- herbs
- formulas
- contraindications
- clinical rules

Knowledge should remain independent of prompts.

---

# Prompt Rules

Prompt templates are data.

Prompt templates:

- consume knowledge
- consume context
- produce structured outputs

Prompt templates never contain business logic.

---

# Provider Independence

Business logic must never depend on:

- OpenAI
- Anthropic
- Gemini
- DeepSeek
- any specific LLM vendor

Providers are interchangeable.

Provider-specific implementation belongs only inside:

src/ai/providers/

---

# Schema Validation

Every AI output must pass schema validation before entering business logic.

Invalid outputs must never continue through the pipeline.

---

# AI Engine

The AI Engine is responsible for:

- pipeline execution
- prompt construction
- provider selection
- knowledge loading
- schema validation
- retry handling
- execution logging

Business modules never implement these responsibilities.

---

# Single Responsibility

Each module performs exactly one clinical task.

Modules never call other modules directly.

Modules communicate only through:

AIContext

and

AIEngine

---

# Testing Standards

Every new module must pass:

- lint
- typecheck
- unit tests
- integration tests
- production build

No feature is considered complete without passing all quality gates.

---

# Documentation

Every new AI capability should include:

- Clinical Specification
- Runtime Schema
- Knowledge Documentation
- Prompt Template
- Tests

Documentation should accurately reflect implementation.

Implementation should not be modified solely to match documentation.

---

# Success Criteria

A completed AI module should:

- improve clinical capability
- preserve runtime safety
- remain provider-independent
- remain knowledge-driven
- require no framework redesign

Clinical intelligence grows.

The framework remains stable.
