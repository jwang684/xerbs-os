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
