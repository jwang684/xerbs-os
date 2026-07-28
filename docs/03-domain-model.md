# 03 Domain Model

## 1. Purpose

This document defines the core business entities and relationships of Xerbs OS.

Unlike a database schema, the Domain Model describes the business concepts that make up the personalized herbal healthcare platform. These concepts serve as the foundation for database design, APIs, AI workflows, and frontend implementation.

---

# 2. Domain Overview

Xerbs models the complete herbal treatment journey rather than isolated medical consultations.

The platform is designed around continuous herbal care, allowing AI to learn from historical treatment outcomes and continuously personalize recommendations.

---

# 3. Core Business Flow

```text
User
    │
    ▼
Health Profile
    │
    ▼
Assessment
    │
    ▼
Pattern
    │
    ▼
Formula
    │
    ▼
Treatment
    │
    ▼
Daily Check
    │
    ▼
Outcome
    │
    ▼
Health Profile (Updated)
```

---

# 4. Business Entities

## 4.1 User

### Purpose

Represents a registered user of the Xerbs platform.

### Responsibilities

- Owns a Health Profile
- Starts AI Assessments
- Receives Treatment Plans
- Completes Daily Check-ins
- Reviews historical outcomes

### Relationships

```
User
├── Health Profile
├── Assessments
├── Treatments
└── Outcomes
```

---

## 4.2 Health Profile

### Purpose

Represents the user's long-term herbal health profile.

Unlike a one-time diagnosis, the Health Profile evolves continuously throughout the user's treatment journey.

### Responsibilities

- Store constitution
- Store chronic conditions
- Store health goals
- Maintain Pattern History
- Maintain Formula History
- Maintain Treatment History
- Support AI personalization

### Relationships

```
User
    │
    ▼
Health Profile
    ├── Pattern History
    ├── Formula History
    ├── Treatment History
    └── Outcome History
```

---

## 4.3 Assessment

### Purpose

Represents one clinical assessment session.

An Assessment collects health information and produces clinical findings.

### Responsibilities

- Collect symptoms
- Collect tongue images
- Collect questionnaires
- Analyze health information
- Generate candidate patterns

### Inputs

- Symptoms
- Tongue Images
- Health Questionnaire
- Existing Health Profile

### Outputs

- Pattern Candidates
- Clinical Findings
- Confidence Score

---

## 4.4 Pattern

### Purpose

Represents a Traditional Chinese Medicine syndrome pattern.

Patterns describe the patient's functional imbalance rather than a disease diagnosis.

### Examples

- Liver Qi Stagnation
- Spleen Qi Deficiency
- Yin Deficiency
- Damp Heat
- Blood Deficiency

### Responsibilities

- Explain clinical findings
- Support Formula generation
- Guide treatment planning

---

## 4.5 Formula

### Purpose

Represents an AI-generated personalized herbal treatment plan.

A Formula may evolve over time based on treatment progress.

### Responsibilities

- Recommend herbal combinations
- Explain therapeutic principles
- Recommend dosage
- Recommend treatment duration
- Generate Formula Versions

---

## 4.6 Formula Version

### Purpose

Represents one revision of a Formula.

Every formula adjustment creates a new version instead of overwriting previous recommendations.

### Responsibilities

- Preserve treatment history
- Support comparison
- Enable rollback

---

## 4.7 Treatment

### Purpose

Represents an active herbal treatment course.

Unlike an Assessment, a Treatment spans multiple days or weeks.

### Responsibilities

- Execute Formula
- Track adherence
- Monitor progress
- Collect Daily Checks

### Lifecycle

```
Created

↓

Active

↓

Adjusted

↓

Completed
```

---

## 4.8 Daily Check

### Purpose

Represents one daily follow-up during treatment.

### Typical Information

- Sleep
- Energy
- Mood
- Appetite
- Pain
- Bowel Movement
- Medication Taken
- Tongue Image
- Notes

### Responsibilities

- Monitor progress
- Detect improvement
- Detect side effects
- Update AI

---

## 4.9 Outcome

### Purpose

Represents the clinical result of a Treatment.

### Possible Outcomes

- Improved
- Stable
- No Response
- Worsened
- Treatment Completed

### Responsibilities

- Evaluate effectiveness
- Update Health Profile
- Improve future recommendations

---

# 5. Business Relationships

```
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Health Profile Assessment
 │              │
 │         Pattern
 │              │
 └──────┬───────┘
        │
        ▼
     Formula
        │
        ▼
 Formula Version
        │
        ▼
    Treatment
        │
        ▼
   Daily Check
        │
        ▼
     Outcome
        │
        ▼
 Updated Health Profile
```

---

# 6. Business Rules

## User

- One User owns exactly one Health Profile.
- One User may have many Assessments.
- One User may have many Treatments.

## Assessment

- One Assessment may generate multiple Pattern candidates.
- One Assessment may create one Treatment.

## Formula

- One Treatment has one active Formula.
- Formula adjustments create Formula Versions.

## Daily Check

- One Treatment has many Daily Checks.
- Daily Checks continuously update Treatment progress.

## Outcome

- Every completed Treatment produces one Outcome.
- Every Outcome updates the Health Profile.

---

# 7. Aggregate Roots

The following entities are Aggregate Roots within the Xerbs Domain Model.

| Aggregate | Owns |
|-----------|------|
| User | Health Profile |
| Assessment | Pattern |
| Treatment | Formula, Formula Version, Daily Check, Outcome |

---

# 8. Future Extensions

The current Domain Model is designed to support future capabilities including:

- Doctor Portal
- Pharmacy Integration
- Insurance Claims
- Wearable Devices
- Laboratory Results
- AI Health Coach
- Multi-provider Collaboration
- Family Health Management

---

# 9. Design Principles

The Domain Model follows several core principles:

- Business concepts before database tables.
- Long-term treatment rather than one-time diagnosis.
- Continuous learning through Health Memory.
- Versioned treatment history.
- Explainable AI recommendations.
- Clinical safety before automation.
