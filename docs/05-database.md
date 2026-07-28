# 05 Database Design

## 1. Purpose

This document defines the logical database design of Xerbs OS.

The database stores persistent business data that supports personalized herbal healthcare, AI reasoning, treatment management, and long-term Health Memory.

---

# 2. Design Principles

The database follows these principles:

- Domain-driven design
- Normalized data model
- Immutable clinical history
- Version-controlled formulas
- Long-term health memory
- Auditability
- AI-friendly querying

---

# 3. Database Overview

```
Users
    │
    ▼
Health Profiles
    │
    ├──────────────┐
    ▼              ▼
Assessments    Treatments
    │              │
    ▼              ▼
Patterns      Formula Versions
    │              │
    └──────┬───────┘
           ▼
     Daily Checks
           │
           ▼
        Outcomes
```

---

# 4. Core Tables

## users

Stores platform accounts.

### Purpose

Authentication and identity.

### Relationships

- One User owns one Health Profile.
- One User has many Assessments.
- One User has many Treatments.

---

## health_profiles

Stores long-term health information.

### Includes

- Constitution
- Chronic conditions
- Allergies
- Health goals
- Pattern history

---

## assessments

Stores each AI assessment.

### Includes

- Symptoms
- Tongue images
- Questionnaire
- AI reasoning
- Confidence score

---

## patterns

Stores identified TCM syndrome patterns.

### Examples

- Liver Qi Stagnation
- Damp Heat
- Yin Deficiency

---

## formulas

Stores personalized herbal formulas.

### Includes

- Formula name
- Therapeutic principle
- Herbs
- Dosage

---

## formula_versions

Stores every revision of a formula.

Each modification creates a new version.

---

## treatments

Represents active treatment plans.

Lifecycle:

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

## daily_checks

Stores daily follow-up information.

Examples:

- Sleep
- Appetite
- Mood
- Energy
- Pain
- Tongue image

---

## outcomes

Stores treatment outcomes.

Examples:

- Improved
- Stable
- Worsened
- Completed

---

# 5. Relationships

```
users
 │
 ├──────────────┐
 ▼              ▼
health_profiles assessments
 │              │
 │         patterns
 │              │
 └──────┬───────┘
        ▼
     formulas
        │
        ▼
 formula_versions
        │
        ▼
    treatments
        │
        ▼
   daily_checks
        │
        ▼
     outcomes
```

---

# 6. Versioning Strategy

The following records are immutable:

- Assessments
- Formula Versions
- Daily Checks
- Outcomes

Health Profiles are continuously updated.

---

# 7. AI Data

The database stores:

- AI reasoning
- Confidence scores
- Pattern history
- Formula history
- Treatment history

This data enables continuous personalization.

---

# 8. Storage Strategy

| Data | Storage |
|-------|---------|
| Users | PostgreSQL |
| Health Profiles | PostgreSQL |
| Assessments | PostgreSQL |
| Treatments | PostgreSQL |
| Images | Object Storage |
| Cache | Redis |
| Embeddings | Vector Database |

---

# 9. Future Extensions

Future tables may include:

- providers
- pharmacies
- prescriptions
- laboratory_results
- wearable_devices
- insurance_claims

---

# Database Principles

- Preserve historical data.
- Never overwrite clinical history.
- Support AI reasoning.
- Support explainable recommendations.
- Optimize for long-term healthcare.
