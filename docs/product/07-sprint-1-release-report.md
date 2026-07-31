# Sprint 1 — Release Report (RC1)

Xerbs OS Sprint 1 delivers the complete clinical workflow —
**login → patient → visit → questionnaire → AI diagnosis → AI prescription** —
as a single Next.js application with a typed, layered backend and a thin-client
UI, verified end-to-end.

## 1. Features completed

| Phase | Feature |
|---|---|
| 1 | Next.js 16 full-stack project |
| 2 | Database layer: Docker Postgres + Redis, Drizzle ORM, MVP schema, migrations, seed |
| 3 | Authentication: Better Auth (email/password), canonical `user`/`session`/`account`/`verification` |
| 4 | Patient domain: CRUD REST API, soft delete, search + pagination, org scoping, authz |
| 5 | Visit domain: CRUD REST API, filtering, pagination |
| 6 | Questionnaire domain: one per visit, generic JSON, version-safe validation |
| 7 | Diagnosis domain: AI-generated, immutable, provider-abstracted (OpenAI Responses API) |
| 8 | Active-diagnosis concept + Prescription domain (AI-generated, immutable, from active diagnosis) |
| 9 | Frontend vertical slice proving the end-to-end workflow |

Cross-cutting: multi-tenant organization scoping on every query; role-based
authorization (write roles vs read-only `staff`); a single org-resolution seam;
two independent AI provider abstractions each with OpenAI + `fake` providers.

## 2. Database schema

PostgreSQL 16, managed by Drizzle. Nine migrations (`0000`–`0008`).

**Tenancy & auth**
- `organizations` — tenants. Unique `slug`.
- `user`, `session`, `account`, `verification` — Better Auth (canonical).
- `organization_members` — user↔org membership + role
  (`owner|admin|practitioner|staff`). Unique `(organization_id, user_id)`.

**Clinical**
- `patients` — soft-deletable (`deleted_at`); partial active index.
- `visits` — belong to one patient; `status` `open|completed|cancelled`;
  `provider_id`, `visit_date`, `notes`.
- `questionnaire_responses` — one per visit (unique `visit_id`);
  `schema_version` + generic `answers` JSON.
- `diagnoses` — immutable; `structured_result` + `raw_response` + AI provenance;
  `is_active` with a **partial unique index** `(visit_id) WHERE is_active`.
- `prescriptions` — immutable; belongs to exactly one diagnosis (`diagnosis_id`
  NOT NULL, cascade); `structured_result` + `raw_response` + AI provenance.

**Constraints & indexes**
- Foreign keys use `CASCADE` for tenant-owned data and `SET NULL` for optional
  attribution links.
- All foreign-key columns are indexed (Postgres does not auto-index them).
- Controlled vocabularies are Postgres enums; free-form clinical payloads are
  `jsonb`.

## 3. API endpoints

REST Route Handlers under `/api`. Full detail in
[api-reference.md](../api-reference.md).

- **Auth** — `/api/auth/*` (Better Auth).
- **Patients** — `POST/GET /api/patients`, `GET/PATCH/DELETE /api/patients/:id`.
- **Visits** — `POST/GET /api/visits`, `GET/PATCH /api/visits/:id`.
- **Questionnaire** — `GET/POST/PATCH /api/visits/:id/questionnaire`.
- **Diagnosis** — `GET/POST /api/visits/:id/diagnosis`,
  `POST /api/visits/:id/diagnosis/:diagnosisId/activate`.
- **Prescription** — `GET/POST /api/visits/:id/prescription`.

Conventions: single resources → `{ data }`, collections → `{ items, total }`,
errors → `{ error: { code, message, details? } }`. All endpoints require an
authenticated session and are organization-scoped; writes require a write role.

## 4. AI architecture

- Two independent provider interfaces: **DiagnosisProvider** (`src/server/ai`)
  and **PrescriptionProvider** (`src/server/prescriptions/ai`). Each has an
  OpenAI (Responses API, structured outputs via `zodTextFormat`) implementation
  and a deterministic `fake` implementation, chosen by `AI_PROVIDER`.
- Diagnosis consumes the questionnaire and returns a structured assessment;
  prescription consumes that assessment. The diagnosis AI layer has no knowledge
  of prescriptions and vice versa; the OpenAI SDK is imported only in provider
  files.
- Every AI record stores both the parsed `structuredResult` and the original
  `rawResponse`, plus provenance (`provider`, `model`, `promptVersion`) and a
  disclaimer. See [07-implemented-architecture.md](../architecture/07-implemented-architecture.md).

## 5. Quality gates (RC1)

- **Integration tests**: 42 passing (Vitest, real Postgres) across patients,
  visits, questionnaires, diagnoses, prescriptions, and both OpenAI providers
  (mocked client).
- **lint**, **typecheck**, **build**: passing.
- **End-to-end**: the full workflow verified through the browser UI.

## 6. Known limitations

- **AI not exercised live**: verification used the `fake` provider (no real
  `OPENAI_API_KEY`); the OpenAI path is unit-verified against a mocked client.
- **No self-service sign-up**: Login only; provider accounts are provisioned
  out-of-band.
- **Single-organization UX**: the client relies on the user's single membership;
  no organization switcher.
- **Redis** is provisioned but unused.
- **No pagination UI**: list endpoints paginate, but the UI does not page.
- **UI is intentionally unpolished** — it proves the workflow, not the design.

## 7. Technical debt

- **Org from header**: `x-organization-id` remains an accepted (Sprint-1)
  fallback in `getAuthContext`; the active org should ultimately derive from the
  session (e.g. Better Auth organization plugin). The seam is already isolated.
- **CSRF**: mutations rely on `SameSite=Lax` cookies; no explicit CSRF tokens or
  origin checks.
- **No rate limiting** on auth or AI generation endpoints.
- **No CHECK constraints** for value ranges (e.g. `confidence` 0–1) — enforced in
  code, not the database.
- **Aspirational docs**: earlier `docs/architecture` and `docs/product` files
  describe a different (FastAPI/Vue) design; only the Sprint 1 docs reflect the
  build.
- **Timestamp types**: domain tables use `timestamptz`; Better Auth's generated
  tables use `timestamp` (left as generated).

## 8. Recommendations for Sprint 2

1. **Session-based org selection** — adopt the Better Auth organization plugin,
   set an active organization on the session, and remove the header fallback.
2. **Wire up real OpenAI** — configure a key, add a live smoke test, and handle
   provider errors/timeouts/retries gracefully in the UI.
3. **Security hardening** — CSRF protection, rate limiting on auth + AI
   endpoints, and audit logging of clinical actions.
4. **Complete the frontend** — organization switcher, pagination/empty/error
   states, patient edit/delete, and design polish.
5. **Extend the domain** — outcomes, daily checks / follow-up, and Health Memory,
   building on the immutable-history foundation.
6. **Data integrity** — add DB-level CHECK constraints and consider soft-delete
   for clinical records.
7. **Testing** — add route-level (HTTP) and frontend component/e2e tests to the
   existing service-level suite; add CI.
