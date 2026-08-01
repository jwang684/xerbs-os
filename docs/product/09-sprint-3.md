# Sprint 3 — Consumer Platform

Sprint 1 built the clinic platform; Sprint 2 hardened clinic operations. Sprint 3
begins the **consumer platform**: the first patient-facing application.

## Phase 1 — Patient Portal vertical slice

**Status: Complete.**

A **read-only** portal (plus self-service contact editing) where a patient logs
in with the existing Better Auth system and views their own medical information.
No AI assessment, orders, or shopping.

### Identity model (the key decision)

- A patient signs in as a Better Auth `user` — **no duplicate user or patient
  tables**. The link is a new nullable `patients.user_id`.
- **One user may own several patient records** (one per clinic), so `user_id` is
  intentionally **not unique** — the schema supports multi-clinic identity
  long-term.
- **Phase 1 UX stays simple**: a user normally has a single record and the portal
  operates on one **active record** at a time. When more than one exists, a
  record/clinic **selector** switches between them — records are **never
  aggregated**.
- The portal is **organization-agnostic**: unlike the clinic's `getAuthContext`
  (which requires org membership), `getPatientContext` resolves the patient
  record(s) purely from the session user. Patients are never members of an org.

### What changed

- **Schema** (migration `0014`, append-only): `patients.user_id`
  (FK → `user`, `ON DELETE SET NULL`, non-unique, indexed) and `patients.address`
  (`jsonb`). No tables added; no clinical FKs changed.
- **Backend** (repository → service → REST, following the existing architecture):
  - `getPatientContext` — resolves `{ userId, name, email, patientIds }` from the
    session; **401** without a session, **403** with no linked patient record.
  - `patient-portal.repository` — read-only aggregation over the shared tables
    scoped to a single active record (visits, SOAP, diagnoses, prescriptions,
    upcoming appointment), plus `listProfiles` (for the selector) and a
    single-record `updateContact`.
  - `patient-portal.service` — resolves the active record (validated selector,
    defaults to the sole record), composes each view, and enforces isolation.
    Business logic is not duplicated — these are reads over existing entities.
- **REST**: `GET/PATCH /api/patient/profile`, `GET /api/patient/dashboard`,
  `GET /api/patient/visits`, `GET /api/patient/visits/:id`,
  `GET /api/patient/diagnoses`, `GET /api/patient/prescriptions`.
- **Authorization / isolation**: a patient can only ever reach their own records.
  Ids are resolved from the session; an explicit `?patientId=` selector is
  validated against the caller's own set (foreign id → 404). Nothing is scoped by
  organization or by a trusted URL patient id.
- **Frontend**: a dedicated `PatientShell` (guard + patient nav, distinct from the
  clinic `AppShell`, no org switcher) with nav for Dashboard, Profile, Visits,
  Diagnoses, Prescriptions and disabled **Orders / Assessment (soon)** items.
  Pages: `/patient` (dashboard cards), `/patient/profile` (view + edit contact /
  address, with the record selector when >1), `/patient/visits` (list),
  `/patient/visits/[id]` (visit + SOAP + diagnosis + prescription),
  `/patient/diagnoses`, `/patient/prescriptions`.

### Verified

- Integration tests (108 total; 11 new): profile shape, contact/address update on
  the active record only, dashboard composition, visit list (newest first, with
  provider/clinic names), visit detail bundle, diagnosis/prescription history
  (newest = `active`), the record selector (+ foreign id → 404), cross-patient
  isolation, and validation (bad email, bad visit id).
- HTTP endpoint tests (17): 401 unauth, 403 no-record, seed → profile/visits/
  visit-detail/diagnoses/prescriptions/dashboard, PATCH contact, 404 unknown
  visit, 422 invalid id.
- Browser smoke: sign in → `/patient` dashboard (real data) → visit detail
  showing SOAP, diagnosis, and prescription.
- lint, typecheck, production build pass.

### Out of scope (unchanged)

AI assessment, shopping, orders, checkout, payments, fulfillment, notifications,
supplier integration.

### Notes / follow-ups

- **Account ↔ patient linking** (registration / claiming a record) is not in
  Phase 1; the link is established clinic-side (or via seeding). A patient
  onboarding flow is a later phase.
- **Prescription `status`** is derived (newest = `active`) pending a real
  prescription lifecycle.
- **Login routing**: `/login` still lands on the clinic app; the patient portal
  lives at `/patient`. A role-aware landing/redirect is a small follow-up.
