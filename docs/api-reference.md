# API Reference (Sprint 1)

All application endpoints are Next.js Route Handlers under `/api`. This documents
the endpoints as implemented in Sprint 1.

## Conventions

- **Auth**: every application endpoint requires a valid Better Auth session
  cookie. The caller must be a member of an organization; requests are always
  scoped to that organization.
- **Active organization**: resolved solely from the session
  (`session.activeOrganizationId`, managed by the Better Auth organization
  plugin). It defaults to the user's first membership on sign-in and is changed
  via `POST /api/auth/organization/set-active`. There is no organization header.
  Organization/membership/invitation management is provided by the plugin under
  `/api/auth/organization/*` (create, list, set-active, invite-member,
  accept-invitation, list-members, update-member-role, remove-member, …).
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

## Providers

Provider profiles: one per organization member (unique org + member).

| Method | Path | Body / Query | Success |
|---|---|---|---|
| POST | `/api/providers` | `{ userId, title?, specialty?, licenseNumber?, npi?, avatarUrl?, signatureUrl?, bio?, workingHours?, isActive? }` | 201 `{ data: Provider }` |
| GET | `/api/providers` | `?isActive=&limit=&offset=` | 200 `{ items: Provider[], total }` |
| GET | `/api/providers/:id` | — | 200 `{ data: Provider }` |
| PATCH | `/api/providers/:id` | provider fields (no `userId`) | 200 `{ data: Provider }` |

- **Authorization**: create → owner/admin only; update → owner/admin (any) or
  practitioner (own profile only); read/list → any member (staff included).
- The target `userId` must be a member of the caller's organization (else 400).
  A duplicate profile for a member is 409.
- `npi` is 10 digits; `avatarUrl`/`signatureUrl` are URLs; `workingHours` is
  `{ [day]: [{ start: "HH:MM", end: "HH:MM" }] }`. No delete — use `isActive`.

## Appointments

Appointments between a patient and a provider (provider profile).

| Method | Path | Body / Query | Success |
|---|---|---|---|
| POST | `/api/appointments` | `{ patientId, providerId, startTime, endTime, status?, notes? }` | 201 `{ data: Appointment }` |
| GET | `/api/appointments` | `?providerId=&patientId=&from=&to=&limit=&offset=` | 200 `{ items, total }` (by startTime) |
| GET | `/api/appointments/:id` | — | 200 `{ data: Appointment }` |
| PATCH | `/api/appointments/:id` | `{ startTime?, endTime?, status?, notes? }` | 200 `{ data: Appointment }` |
| DELETE | `/api/appointments/:id` | — | 200 `{ data: Appointment }` (hard delete) |
| POST | `/api/appointments/:id/check-in` | — | 201 `{ data: { appointment, visit } }` |

### Calendar

`GET /api/appointments/calendar?view=day|week|month&date=YYYY-MM-DD&providerId=`
returns the appointments in the window, grouped by day:

```
{ view, from, to, groups: [ { date: "YYYY-MM-DD", appointments: [...] } ] }
```

- `view` + `date` (UTC anchor) determine the window: day = that day; week =
  Monday-start week containing the date; month = the calendar month.
- Optional `providerId` filter; practitioners are restricted to their own
  appointments. Ranges and grouping are UTC.

### Check-in

`POST /api/appointments/:id/check-in` transitions a **scheduled** appointment to
`checked_in` and creates the linked visit — atomically, exactly once:

- Only `scheduled` appointments can be checked in (else 409); a second check-in
  is rejected (409).
- The created visit carries `appointmentId` (unique — one visit per
  appointment), the appointment's `patientId`, and `status = open`; it then
  follows the normal visit clinical workflow.
- **Authorization**: owner/admin/staff, or the practitioner assigned to the
  appointment.

- `status` ∈ `scheduled | checked_in | completed | cancelled | no_show`.
- **Validation**: `endTime` > `startTime`; `patientId`/`providerId` must belong
  to the caller's organization (else 400); no overlapping non-cancelled
  appointment for the same provider (else 409).
- **Authorization**: owner/admin full CRUD; staff create/read/update but **not
  delete**; practitioner CRUD only for appointments assigned to their own
  provider profile (and their list is restricted to those).
- `from`/`to` filter by `startTime` (inclusive). Patient/provider assignment is
  immutable on update.

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
