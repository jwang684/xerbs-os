# Sprint 2 — Clinic Operations & Production Readiness

## Phase 1 — Better Auth organization plugin (canonical multi-tenancy)

**Status: Complete.**

Adopted the Better Auth organization plugin as the canonical multi-tenant
solution, mapped onto the existing schema so no clinical foreign keys changed
(**Strategy A**).

### What changed
- **Plugin integration** (`src/lib/auth.ts`): the `organization()` plugin with
  `modelName` overrides mapping `organization`→`organizations`,
  `member`→`organizationMembers`, `invitation`→`invitations`. Custom access
  control (`src/lib/permissions.ts`) defines owner/admin/practitioner/staff.
  `advanced.database.generateId` returns uuids so ids fit our uuid columns.
- **Active organization in the session**: a `session.create` hook defaults the
  active org to the user's first membership; the plugin's set-active endpoint
  changes it.
- **`getAuthContext` resolves the org only from `session.activeOrganizationId`**
  and verifies membership. The `x-organization-id` header is **removed**.
- **Schema** (migration `0009`, append-only): added `organizations.logo` /
  `metadata`, changed `organization_members.role` from enum to `text`, added the
  `invitations` table, added `session.active_organization_id`.
- **Client**: `organizationClient()` with hooks; a minimal organization switcher
  in the app header (`src/components/org-switcher.tsx`).
- **Backward compatibility**: the `AuthContext` shape is unchanged, so every
  service/repository/route handler is untouched; all clinical FKs stay uuid.

### Verified
- Integration tests (46 total; new `getAuthContext` suite covers session
  resolution, missing-active-org, and cross-org rejection).
- HTTP end-to-end: sign-up → create org → set active → scoped API → second org +
  switch (isolation holds) → **`x-organization-id` ignored** → invitation
  created → creator role `owner`.
- lint, typecheck, production build pass.

### Notes
- Better Auth's organization endpoints require an `Origin` header (CSRF
  protection); browsers send it automatically.
- Roles are stored as `text`; allowed values are enforced in the application
  layer and via the plugin's access control.

## Phase 2 — Provider Management vertical slice

**Status: Complete.**

A provider-profile domain following the existing architecture (repository →
service → REST), fully tenant-scoped through `getAuthContext`.

### What changed
- **Schema** (migration `0010`, append-only): `provider_profiles`
  (`id`, `userId`, `organizationId`, `title`, `specialty`, `licenseNumber`,
  `npi`, `avatarUrl`, `signatureUrl`, `bio`, `workingHours` jsonb, `isActive`,
  `createdAt`, `updatedAt`). Unique `(organization_id, user_id)` → one profile
  per member; FK indexes.
- **Repository** (`provider.repository.ts`): org-scoped create/findById/
  findByUser/update/list + an `isMember` check.
- **Service** (`provider.service.ts`): Zod validation and authorization —
  create is owner/admin only and requires the target user to be a member;
  update is owner/admin (any) or practitioner (own only); read/list is open to
  any member (staff read-only). One-per-member enforced (409).
- **REST**: `GET/POST /api/providers`, `GET/PATCH /api/providers/[id]`. No
  delete — deactivate via `isActive`.
- **Authz helpers**: `assertOwnerOrAdmin` / `isOwnerOrAdmin` in `authz.ts`.

Out of scope (unchanged): scheduling, calendar/appointments, billing, and
management frontend pages.

### Verified
- Integration tests (57 total; 11 new): CRUD, one-per-member conflict,
  member-must-belong-to-org, the full role matrix (owner/admin any,
  practitioner own-only, staff read-only), organization isolation, validation.
- HTTP endpoint tests: 401 unauth; owner create/read/list/update; 409 duplicate;
  400 non-member; 422 validation; staff read 200 / create 403.
- lint, typecheck, production build pass.

## Phase 3 — Appointment Management vertical slice

**Status: Complete.**

Appointment scheduling (repository → service → REST), tenant-scoped, building on
the Phase 2 provider profiles (`appointment.providerId` → `provider_profiles.id`).

### What changed
- **Schema** (migration `0011`, append-only): `appointment_status` enum
  (`scheduled | checked_in | completed | cancelled | no_show`) and the
  `appointments` table (`organizationId`, `patientId`, `providerId`, `startTime`,
  `endTime`, `status`, `notes`, timestamps). Indexes on org/patient/provider and
  a `(provider_id, start_time)` index for overlap + date-range queries.
- **Repository/service/Zod**: CRUD + list with filters (provider, patient, date
  range) and pagination. Validation: `endTime` > `startTime`; patient and
  provider must belong to the org; no overlapping non-cancelled appointment for
  the same provider (cancelled/no-show free the slot).
- **REST**: `GET/POST /api/appointments`, `GET/PATCH/DELETE /api/appointments/[id]`.
- **Authorization**: owner/admin full CRUD; staff create/read/update but not
  delete; practitioner CRUD only for their own provider's appointments (their
  list is restricted accordingly).

Out of scope (unchanged): calendar UI, drag/drop, visit creation, billing,
notifications.

### Verified
- Integration tests (68 total; 11 new): create/validation (time ordering,
  overlap incl. cancelled-frees-slot), cross-entity/org checks, full authz
  matrix, list filters + practitioner restriction, organization isolation.
- HTTP endpoint tests (18): CRUD, filters (provider/patient/date range), overlap
  409, 422 time validation, 400 unknown patient, staff delete 403, owner delete.
- lint, typecheck, production build pass.

## Phase 4 — Appointment Check-in workflow

**Status: Complete.**

Checking in an appointment transactionally creates the linked visit, exactly
once: `Appointment → Check In → Visit`.

### What changed
- **Schema** (migration `0012`, append-only): `visits.appointment_id`
  (FK → appointments, `SET NULL`) with a **unique index** so an appointment maps
  to at most one visit (direct visits keep it null).
- **Repository**: `appointmentRepository.checkIn` runs a single transaction —
  flips the appointment to `checked_in` (guarded by `status = scheduled` for
  atomic duplicate prevention) and inserts the linked visit.
- **Service**: `appointmentService.checkIn` — authorization (owner/admin/staff,
  or the assigned practitioner), only-scheduled validation, duplicate rejection.
- **REST**: `POST /api/appointments/[id]/check-in` → 201 `{ data: { appointment, visit } }`.
- The visit is a normal visit (`status = open`, `patientId` from the
  appointment, `appointmentId` set); the existing clinical workflow is unchanged.

Out of scope (unchanged): calendar UI, billing, SOAP, notifications.

### Verified
- Integration tests (72 total; 4 new): check-in creates a linked visit and sets
  `checked_in`; duplicate rejected; only scheduled may check in; staff allowed,
  practitioner own-only; organization isolation.
- HTTP endpoint tests (9): check-in 201 (+ linked, reachable visit), duplicate
  409, cancelled 409, staff 201, exactly one visit per appointment.
- lint, typecheck, production build pass.

### Follow-up adjustment
Check-in now inherits the appointment's provider: it maps the appointment's
`provider_profile` to the corresponding `organization_members` record (by shared
user within the org) and sets `visit.providerId` (null if that user is no longer
a member). Rest of the workflow unchanged.

## Phase 5 — Appointment Calendar vertical slice

**Status: Complete.**

A read-only calendar over appointments (backend-first + minimal frontend). No
migration required.

### What changed
- **Backend**: `GET /api/appointments/calendar?view=day|week|month&date=&providerId=`
  returns appointments in the window grouped by day
  (`{ view, from, to, groups: [{ date, appointments }] }`). Range is computed
  from view + UTC anchor date (day; Monday-start week; calendar month). Optional
  provider filter; practitioners are restricted to their own appointments.
  Added `calendarQuerySchema`, `appointmentRepository.findInRange`, and
  `appointmentService.getCalendar`.
- **Frontend** (minimal, read-only): `/calendar` page with day/week/month views,
  prev/today/next navigation, and a provider filter; appointments link to a
  read-only `/appointments/[id]` detail page. Header nav gains Patients +
  Calendar links. Times are shown in UTC.

Out of scope (unchanged): drag-and-drop, billing, notifications, SOAP, dashboard.

### Verified
- Integration tests (78 total; 6 new): day/week/month ranges, grouping,
  provider filter, practitioner restriction, query validation.
- HTTP endpoint tests (11): day/week/month windows, grouping counts, provider
  filter, 422 invalid view, 401 unauth.
- Browser smoke: login → calendar (week view shows the appointment) → click →
  appointment detail.
- lint, typecheck, production build pass.

## Phase 6 — SOAP Notes vertical slice

**Status: Complete.**

Clinical SOAP notes, one per visit, with immutable version history and an
autosave-friendly API.

### What changed
- **Schema** (migration `0013`, append-only): `soap_notes` (one per visit —
  unique `visit_id`; S/O/A/P text, `version`) and `soap_note_revisions`
  (immutable snapshots, unique `(soap_note_id, version)`, `author_id`).
- **Repository**: `findByVisit`, transactional `create` (note + revision v1),
  transactional `update` (row-locked: bump version, update note, append
  revision), `remove`, `listRevisions`.
- **Service**: one-per-visit conflict, visit-in-org check, autosave `update`
  (partial section merge; empty patch is a no-op — no revision). Authorization
  follows the Visit rules (reads any member; writes owner/admin/practitioner;
  staff read-only) via `assertCanWrite`.
- **REST**: `GET/POST/PATCH/DELETE /api/visits/[id]/soap` and
  `GET /api/visits/[id]/soap/revisions`.

Existing AI Diagnosis is unchanged.

Out of scope (unchanged): AI-generated SOAP, billing, dashboard, notifications.

### Verified
- Integration tests (87 total; 9 new): create + one-per-visit conflict, reads
  (staff), immutable autosave versioning + no-op guard, revision history,
  Visit-authorization matrix, visit-in-org + validation, delete cascade,
  organization isolation.
- HTTP endpoint tests (21): CRUD, autosave versions, revisions (newest first),
  no-op, 401/409/422/404, staff read-only (403 on writes), delete cascade.
- lint, typecheck, production build pass.

## Phase 7 — Clinical Dashboard vertical slice

**Status: Complete.**

A read-only clinical dashboard that aggregates existing entities
(repository → service → REST + minimal frontend). **No migration** — it only
counts and lists what other domains already own; no business logic is
duplicated.

### What changed
- **Backend**: `GET /api/dashboard?date=&providerId=` returns aggregated
  `widgets` plus today's appointment list (returned directly, not wrapped).
  Widgets: today's appointments, waiting, checked-in, open visits, completed
  visits, and pending SOAP / diagnosis / prescription. Added
  `dashboard.repository.ts` (`todaysAppointments`, `countVisitsByStatus`,
  `countPending` via `NOT EXISTS`, `memberIdForUser`), `dashboard.service.ts`
  (composes the widgets + provider-scope resolution), and `dashboard.schema.ts`.
- **Scope / authorization**: owner/admin/staff see the whole organization with an
  optional `providerId` filter (unknown provider → 400); a practitioner always
  sees only their own dashboard. Appointment widgets filter by provider profile;
  visit widgets by the mapped organization member. The day window is `[00:00,
  next 00:00)` UTC around `date` (default today).
- **Frontend** (minimal, no charts): `/dashboard` page — a card grid of the eight
  widgets, a today's-appointments table (linking to the appointment detail), and
  a date + provider filter. Header nav gains a Dashboard link. Times shown in UTC.

Out of scope (unchanged): billing, notifications, analytics, reports.

### Verified
- Integration tests (97 total; 10 new): owner org-wide aggregates, appointment
  ordering, staff read parity, practitioner own-only scope, provider filter,
  provider-without-member → zero visits, unknown provider → 400, organization
  isolation, default-to-today, query validation.
- HTTP endpoint tests (17): 401 unauth, empty dashboard, seed
  patient/provider/appointment → waiting count, check-in → checked-in + open
  visit + pending SOAP/Dx/Rx, add SOAP → pending drops, provider filter,
  unknown provider 400, invalid date 422.
- lint, typecheck, production build pass.
