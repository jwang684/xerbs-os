# 05 MVP

## 1. Purpose

This document tracks the Sprint 1 MVP of Xerbs OS — a multi-tenant, AI-first
herbal-healthcare platform — and records which phases are complete.

## 2. Tech stack (as built)

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL 16 (Docker) |
| Cache (provisioned) | Redis 7 (Docker) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (email/password) |
| Validation | Zod |
| AI | OpenAI Responses API (behind a provider interface) |
| Frontend | React client components (thin client over the REST API) |
| Tests | Vitest (integration, against real Postgres) |

## 3. Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Initialize Next.js full-stack project | ✅ Complete |
| 2 | Database layer: Docker Postgres/Redis, Drizzle, MVP schema, migration, seed | ✅ Complete |
| 3 | Authentication: Better Auth (user/session/account/verification) | ✅ Complete |
| 4 | Patient vertical slice (CRUD REST API, soft delete, search) | ✅ Complete |
| 5 | Visit vertical slice (CRUD REST API, filtering, pagination) | ✅ Complete |
| 6 | Questionnaire domain (versioned JSON, 1:1 with visit) | ✅ Complete |
| 7 | Diagnosis domain (AI-generated, immutable, provider-abstracted) | ✅ Complete |
| 8 | Active diagnosis + Prescription domain (AI-generated, immutable) | ✅ Complete |
| 9 | Frontend vertical slice (login → prescription workflow) | ✅ Complete |

## 4. Data model (MVP schema)

Multi-tenant foundation and clinical core:

- **organizations** — tenants (clinics/practices).
- **users / sessions / accounts / verifications** — Better Auth (platform logins).
- **organization_members** — a user's membership + role in an organization
  (owner, admin, practitioner, staff).
- **patients** — people receiving care (soft-deletable via `deleted_at`).
- **visits** — clinical encounters, each belonging to exactly one patient.
- **questionnaire_responses** — one questionnaire per visit (unique `visit_id`);
  generic JSON content validated against a versioned definition
  (`schema_version`).
- **diagnoses** — AI-generated, immutable diagnosis per generation; stores the
  structured result and the original LLM response, plus AI provenance. A visit
  may have multiple over time, with exactly one marked active (`is_active`,
  enforced by a partial unique index).
- **prescriptions** — AI-generated, immutable; belongs to exactly one diagnosis
  (generated from the active diagnosis's assessment); stores the structured
  prescription, raw response, and AI provenance.

Every tenant-owned row carries `organization_id`. Foreign-key columns are
indexed. Free-form clinical payloads use `jsonb`; controlled vocabularies use
Postgres enums.

## 5. Implemented capabilities

### Authentication & tenancy
- Email/password sign-up and sign-in via Better Auth.
- Requests resolve to an `AuthContext` (user + organization + role). The active
  organization is currently resolved in a single seam (`getAuthContext`);
  long-term it will come from the session, not a client header.

### Authorization
- Write operations require role `owner`, `admin`, or `practitioner`.
- `staff` is read-only.
- All data access is scoped to the caller's organization.

### Patient API
- `POST /api/patients` — create
- `GET /api/patients` — list / search (name, email) + pagination
- `GET /api/patients/:id` — read
- `PATCH /api/patients/:id` — update
- `DELETE /api/patients/:id` — soft delete (`deleted_at`)

### Visit API
- `POST /api/visits` — create (validates patient + provider belong to the org)
- `GET /api/visits` — list, filter by `patientId` / `status`, + pagination
- `GET /api/visits/:id` — read
- `PATCH /api/visits/:id` — update (patient link is immutable)
- Visit fields: `patientId`, `providerId`, `status` (open/completed/cancelled),
  `chiefComplaint`, `visitDate`, `notes`, `createdAt`, `updatedAt`.
- No delete in this phase.

### Questionnaire API (one per visit)
- `POST /api/visits/:id/questionnaire` — create (409 if one already exists)
- `GET /api/visits/:id/questionnaire` — read
- `PATCH /api/visits/:id/questionnaire` — update
- Content is generic JSON validated against a versioned definition registry
  (`schemaVersion`); new versions are added in code with no schema change.
  Validation is version-safe: content is always checked against its declared
  version, and unknown versions are rejected.
- No delete in this phase.

### Diagnosis API (AI-generated, immutable, one per generation)
- `POST /api/visits/:id/diagnosis` — generate a diagnosis from the visit's
  questionnaire (write roles). Returns the stored record.
- `GET /api/visits/:id/diagnosis` — list the visit's diagnoses (newest first).
- Immutable: no update or delete.
- Fields: `visitId`, `questionnaireId`, `provider`, `model`, `promptVersion`,
  `reasoning`, `structuredResult`, `rawResponse`, `confidence`, `disclaimer`,
  `createdAt`.

### AI provider abstraction
- The service depends only on a `DiagnosisProvider` interface; the OpenAI
  Responses API implementation is the sole file importing the OpenAI SDK.
- `AI_PROVIDER` selects the provider (`openai` | `fake`); future providers
  (Anthropic, Azure OpenAI, local) implement the same interface with no
  service-layer changes.
- The diagnosis service consumes only the Questionnaire; it does not prescribe.

### Active diagnosis
- A visit keeps its full immutable diagnosis history; exactly one is active.
- Creating a diagnosis makes it active (deactivating the prior) atomically.
- `POST /api/visits/:id/diagnosis/:diagnosisId/activate` re-activates a
  historical diagnosis (write roles). Clinical content stays immutable; only
  the active marker changes.

### Prescription API (AI-generated, immutable, from the active diagnosis)
- `POST /api/visits/:id/prescription` — generate a prescription from the visit's
  **active diagnosis** (write roles); 400 if there is no active diagnosis.
- `GET /api/visits/:id/prescription` — list prescriptions (newest first).
- Immutable: no update or delete. Belongs to exactly one diagnosis.
- Fields: `diagnosisId`, `provider`, `model`, `promptVersion`,
  `structuredResult`, `rawResponse`, `disclaimer`, `createdAt`.
- Its AI lives in a **separate** provider layer (`src/server/prescriptions/ai`)
  that takes only the structured assessment; the diagnosis AI layer knows
  nothing about prescriptions, and vice versa.

### Frontend (thin client)
- Pages: `/login`, `/patients` (list + search + create), `/patients/[id]`
  (detail + visits + create visit), `/visits/[id]` (hub + status), and the
  workflow steps `/visits/[id]/questionnaire`, `/diagnosis`, `/prescription`.
- Proven end-to-end: **login → patient → visit → questionnaire → diagnosis →
  prescription**.
- Thin client: pages call the REST API only; no business logic or validation is
  duplicated client-side. All rules and validation stay in the backend. Focus is
  auth, navigation, data loading, forms, error handling, and loading states —
  not UI polish.
- Auth is cookie-based (Better Auth); authenticated routes redirect to `/login`
  when there is no session. Org scoping is inferred from the user's membership.
- There is no self-service sign-up page (Login only); provider accounts are
  provisioned out-of-band.

## 6. Out of scope for Sprint 1

AI beyond diagnosis and prescription; self-service sign-up; UI polish; health
memory; outcomes; daily checks; RAG/embeddings; inventory; billing; scheduling;
CRM; and analytics.

## 7. Quality gates

Each phase passes: lint, typecheck, production build, integration tests, and
HTTP endpoint verification before being committed.
