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
- **diagnoses, prescriptions** — schema present; CRUD not yet implemented
  (later phases).

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

## 6. Out of scope for Sprint 1

Diagnosis and Prescription CRUD; AI functionality; health
memory; outcomes; daily checks; RAG/embeddings; inventory; billing; scheduling;
CRM; analytics; and the patient/visit frontend UI.

## 7. Quality gates

Each phase passes: lint, typecheck, production build, integration tests, and
HTTP endpoint verification before being committed.
