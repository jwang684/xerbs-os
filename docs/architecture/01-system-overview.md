# 04 System Architecture

## 1. Goals

The architecture of Xerbs OS is designed to achieve the following goals:

- AI-first clinical workflow
- Modular service architecture
- Long-term Health Memory
- Explainable AI recommendations
- High scalability
- Secure medical data handling
- Fast response time (<10 seconds)

---

# 2. High-Level Architecture

```
                        Users
                          │
                          ▼
                  Vue Frontend (Web)
                          │
                          ▼
                  FastAPI Backend API
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  Diagnosis Engine   Formula Engine     Care Engine
        │                 │                  │
        └─────────────────┼──────────────────┘
                          ▼
                  Health Memory Service
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
   PostgreSQL         Redis Cache       Vector Database
                          │
                          ▼
                    LLM & AI Services
```

---

# 3. Backend Architecture

The backend follows a modular service-oriented architecture.

## Core Services

- Authentication
- User Service
- Diagnosis Service
- Formula Service
- Treatment Service
- Health Memory Service
- Notification Service

Each service owns its own business logic while sharing the same domain model.

---

# 4. AI Architecture

The AI layer is divided into specialized agents.

```
                AI Layer
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
Diagnosis AI    Formula AI     Safety AI
                    │
                    ▼
             Health Memory AI
                    │
                    ▼
              Knowledge Retrieval
```

### Diagnosis AI

Responsible for:

- Symptom analysis
- Tongue analysis
- Pattern identification

### Formula AI

Responsible for:

- Herbal recommendations
- Formula generation
- Formula adjustment

### Safety AI

Responsible for:

- Drug interaction checks
- Contraindication detection
- Risk analysis

### Health Memory AI

Responsible for:

- Long-term personalization
- Historical reasoning
- Continuous learning

---

# 5. Data Layer

The platform stores different types of information.

## PostgreSQL

Stores:

- Users
- Health Profiles
- Assessments
- Treatments
- Outcomes

## Redis

Stores:

- Session cache
- Temporary AI context
- Frequently accessed data

## Vector Database

Stores:

- Herbal knowledge embeddings
- Clinical literature
- Formula knowledge
- Retrieval context

---

# 6. Frontend Architecture

The frontend is built using Vue.

```
App
│
├── Dashboard
├── Diagnose
├── Formula
├── Care
├── Herbs
└── Profile
```

Shared components include:

- Navigation
- Charts
- Timeline
- AI Chat
- Health Cards

---

# 7. External Services

Xerbs integrates with:

- OpenAI
- Qwen
- Email Service
- Object Storage
- Authentication Provider
- Analytics

Future integrations:

- Pharmacy APIs
- Wearables
- Laboratory Systems
- Insurance Providers

---

# 8. Deployment Architecture

```
Internet
     │
     ▼
 Load Balancer
     │
     ▼
 FastAPI Servers
     │
     ▼
 PostgreSQL
 Redis
 Vector Database
```

Static assets are served separately by the frontend hosting service.

---

# 9. Security

Security principles include:

- HTTPS everywhere
- JWT authentication
- Role-based authorization
- Encrypted medical data
- Secure file uploads
- Audit logging
- API rate limiting

---

# 10. Scalability

The architecture supports future growth through:

- Horizontal API scaling
- AI service isolation
- Independent background workers
- Distributed caching
- Modular AI agents
- Cloud-native deployment

---

# Architecture Principles

Xerbs OS follows these architectural principles:

- Modular design
- Domain-driven architecture
- AI-first workflows
- Explainable AI
- Long-term health management
- Clinical safety before automation
