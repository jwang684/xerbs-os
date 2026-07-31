# API Reference (Sprint 1)

All application endpoints are Next.js Route Handlers under `/api`. This documents
the endpoints as implemented in Sprint 1.

## Conventions

- **Auth**: every application endpoint requires a valid Better Auth session
  cookie. The caller must be a member of an organization; requests are always
  scoped to that organization.
- **Active organization**: resolved from the user's membership. If the user
  belongs to multiple organizations, send an `x-organization-id` header;
  otherwise the single membership is used.
- **Authorization**: reads are allowed for any member; writes
  (POST/PATCH/DELETE) require role `owner`, `admin`, or `practitioner` (`staff`
  is read-only).
- **Single resource** responses are `{ "data": <object> }`.
- **Collections** are `{ "items": [...], "total": <number> }`.
- **Errors** are `{ "error": { "code": string, "message": string, "details"?: unknown } }`.

### Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | `bad_request` — malformed request / precondition not met |
| 401 | `unauthorized` — no valid session |
| 403 | `forbidden` — not a member, or role not permitted |
| 404 | `not_found` |
| 409 | `conflict` — resource already exists |
| 422 | `validation_error` — Zod validation failed (`details` holds issues) |
| 500 | `internal_error` |

## Authentication (Better Auth)

Provided by Better Auth at `/api/auth/*`. Key endpoints:

- `POST /api/auth/sign-up/email` — `{ name, email, password }`
- `POST /api/auth/sign-in/email` — `{ email, password }` (sets session cookie)
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `GET /api/auth/ok` — health check

## Patients

| Method | Path | Body / Query | Success |
|---|---|---|---|
| POST | `/api/patients` | `{ fullName, dateOfBirth?, sex?, email?, phone? }` | 201 `{ data: Patient }` |
| GET | `/api/patients` | `?q=&limit=&offset=` | 200 `{ items: Patient[], total }` |
| GET | `/api/patients/:id` | — | 200 `{ data: Patient }` |
| PATCH | `/api/patients/:id` | partial patient fields | 200 `{ data: Patient }` |
| DELETE | `/api/patients/:id` | — | 200 `{ data: Patient }` (soft delete: sets `deletedAt`) |

- `q` searches `fullName` and `email` (case-insensitive). `limit` 1–100
  (default 20), `offset` ≥ 0.
- Soft-deleted patients are excluded from all reads.

## Visits

A visit belongs to exactly one patient.

| Method | Path | Body / Query | Success |
|---|---|---|---|
| POST | `/api/visits` | `{ patientId, providerId?, status?, chiefComplaint?, visitDate?, notes? }` | 201 `{ data: Visit }` |
| GET | `/api/visits` | `?patientId=&status=&limit=&offset=` | 200 `{ items: Visit[], total }` |
| GET | `/api/visits/:id` | — | 200 `{ data: Visit }` |
| PATCH | `/api/visits/:id` | `{ status?, providerId?, chiefComplaint?, visitDate?, notes? }` | 200 `{ data: Visit }` |

- `status` ∈ `open` | `completed` | `cancelled` (accepted case-insensitively).
- `patientId` is immutable after creation. `providerId` must be a member of the
  same organization. No delete in Sprint 1.

## Questionnaire

Exactly one questionnaire per visit; content is generic JSON validated against a
versioned definition (`schemaVersion`).

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/visits/:id/questionnaire` | — | 200 `{ data: Questionnaire }` (404 if none) |
| POST | `/api/visits/:id/questionnaire` | `{ schemaVersion?, answers }` | 201 `{ data }` (409 if one exists) |
| PATCH | `/api/visits/:id/questionnaire` | `{ schemaVersion?, answers? }` | 200 `{ data }` |

- `answers` (v1): `{ responses: [{ questionId, value }] }` where `value` is a
  string, number, boolean, string array, or null.
- Unknown `schemaVersion` → 422. No delete.

## Diagnosis

AI-generated and immutable. A visit may have many diagnoses over time; exactly
one is *active*.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/visits/:id/diagnosis` | — | 200 `{ items: Diagnosis[], total }` (newest first) |
| POST | `/api/visits/:id/diagnosis` | — | 201 `{ data: Diagnosis }` (becomes active; 400 if no questionnaire) |
| POST | `/api/visits/:id/diagnosis/:diagnosisId/activate` | — | 200 `{ data: Diagnosis }` |

- Generation consumes only the visit's questionnaire. Stored fields:
  `visitId`, `questionnaireId`, `provider`, `model`, `promptVersion`,
  `reasoning`, `structuredResult`, `rawResponse`, `confidence`, `disclaimer`,
  `isActive`, `createdAt`.
- `structuredResult`: `{ patterns: [{ name, rationale }], summary }`.

## Prescription

AI-generated and immutable; belongs to exactly one diagnosis. Generated from the
visit's **active** diagnosis.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/visits/:id/prescription` | — | 200 `{ items: Prescription[], total }` (newest first) |
| POST | `/api/visits/:id/prescription` | — | 201 `{ data: Prescription }` (400 if no active diagnosis) |

- Stored fields: `diagnosisId`, `provider`, `model`, `promptVersion`,
  `structuredResult`, `rawResponse`, `disclaimer`, `createdAt` (plus denormalized
  `visitId`, `patientId`, `organizationId`).
- `structuredResult`: `{ formulaName, herbs: [{ name, dosage }], instructions, durationDays }`.
