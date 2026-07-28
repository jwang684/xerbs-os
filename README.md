# Xerbs OS

> **The AI Operating System for Personalized Herbal Healthcare**

Xerbs OS is an AI-powered healthcare platform that combines Traditional herbal intelligence, and modern AI to deliver personalized diagnosis, treatment planning, and long-term health management.

Unlike traditional symptom checkers or one-time AI consultations, Xerbs is designed around the entire treatment journey—from assessment and herbal formula generation to continuous care and Health Memory.

---

# Vision

Build the world's leading AI-powered operating system for personalized herbal healthcare.

---

# Why Xerbs?

Healthcare today is fragmented.

Patients often receive isolated diagnoses, disconnected treatment plans, and little long-term follow-up.

Traditional AI assistants typically stop after answering a question.

Xerbs transforms AI from a consultation tool into a continuous healthcare operating system.

The platform continuously learns from each treatment cycle, helping users better understand their health while improving recommendations over time.

---

# Core Features

| Feature | Status |
|----------|:------:|
| 🤖 AI Diagnosis | ✅ |
| 👅 Tongue Analysis | 🚧 |
| 🌿 Personalized Herbal Formula | 🚧 |
| 🧠 Health Memory | 🚧 |
| 📈 Treatment Tracking | 🚧 |
| 📚 Herbal Knowledge Graph | 🚧 |
| 🛡 Safety Analysis | 🚧 |
| 🤝 AI Health Coach | Planned |

---

# System Overview

```text
                     User
                       │
                       ▼
               AI Diagnosis Engine
                       │
                       ▼
           Personalized Formula Engine
                       │
                       ▼
             Treatment Recommendation
                       │
                       ▼
                Daily Care Engine
                       │
                       ▼
                  Health Memory
                       │
                       ▼
          Continuous AI Optimization
```

---

# High-Level Architecture

```text
                     Users
                        │
                        ▼
               Vue 3 Frontend
                        │
                        ▼
                 FastAPI Backend
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
 Diagnosis Engine  Formula Engine  Care Engine
        │               │               │
        └───────────────┼───────────────┘
                        ▼
               Health Memory Service
                        │
                        ▼
                  PostgreSQL Database
                        │
                        ▼
                 AI Providers / RAG
```

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Vue 3 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Database | PostgreSQL |
| Cache | Redis |
| ORM | SQLAlchemy |
| Migration | Alembic |
| AI Models | OpenAI / Qwen |
| Knowledge | RAG |
| Deployment | Docker |

---

# Documentation

## Product

- 📄 01 Vision
- 📄 02 Product Specification
- 📄 03 Domain Model

## Architecture

- 📄 04 System Architecture
- 📄 05 Database Design
- 📄 06 Backend Architecture
- 📄 07 Frontend Architecture
- 📄 08 AI Architecture
- 📄 09 API Design
- 📄 11 Security
- 📄 12 Deployment

## Planning

- 📄 10 Roadmap

---

# Repository Structure

```text
xerbs-os/

├── docs/
│   ├── README.md
│   ├── 01-vision.md
│   ├── 02-product.md
│   ├── 03-domain-model.md
│   ├── 04-system-architecture.md
│   ├── 05-database.md
│   ├── 06-backend-architecture.md
│   ├── 07-frontend-architecture.md
│   ├── 08-ai-architecture.md
│   ├── 09-api.md
│   ├── 10-roadmap.md
│   ├── 11-security.md
│   ├── 12-deployment.md
│   ├── adr/
│   ├── diagrams/
│   └── assets/
│
├── backend/
├── frontend/
├── infra/
├── tests/
└── README.md
```

---

# Development Status

| Module | Status |
|---------|:------:|
| Product Design | ✅ |
| System Architecture | ✅ |
| Database Design | ✅ |
| Backend Design | ✅ |
| Frontend Design | ✅ |
| AI Architecture | ✅ |
| API Design | 🚧 |
| Security | 🚧 |
| Deployment | 🚧 |
| Backend Development | ⏳ |
| Frontend Development | ⏳ |
| AI Engine | ⏳ |

---

# Roadmap

## Phase 1 — Foundation

- Product Design
- Architecture Design
- Database Design

## Phase 2 — Core Platform

- AI Diagnosis
- Formula Engine
- Health Memory
- REST API

## Phase 3 — Intelligent Care

- AI Health Coach
- Treatment Tracking
- Formula Optimization
- Knowledge Graph

## Phase 4 — Ecosystem

- Clinic Platform
- Mobile App
- Public API
- Multi-language Support

---

# Design Principles

- AI-first but clinically grounded
- Personalized healthcare rather than generic recommendations
- Continuous treatment instead of one-time diagnosis
- Explainable AI decisions
- Long-term Health Memory
- Modular architecture
- Security and privacy by design

---

# License

This project is currently under active development.

A public open-source license will be announced when the project reaches its first public release.

---

# Contributing

Contributions are welcome in the future.

Please refer to the project documentation before submitting issues or pull requests.

---

# Project Status

🚧 Xerbs OS is currently in active architecture and core platform development.

The project documentation is being completed before implementation begins to ensure a scalable, maintainable, and production-ready architecture.
