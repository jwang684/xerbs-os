import { ForbiddenError } from "../http/errors";

export type MemberRole = "owner" | "admin" | "practitioner" | "staff";

/**
 * The resolved identity + tenant for a request: which user, which organization
 * they are acting within, and their role there. Produced by `getAuthContext`.
 */
export interface AuthContext {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: MemberRole;
}

// Roles permitted to mutate records. Staff are read-only.
const WRITE_ROLES: ReadonlySet<MemberRole> = new Set([
  "owner",
  "admin",
  "practitioner",
]);

export function canWrite(role: MemberRole): boolean {
  return WRITE_ROLES.has(role);
}

/** Throws ForbiddenError unless the caller's role may modify records. */
export function assertCanWrite(ctx: AuthContext): void {
  if (!canWrite(ctx.role)) {
    throw new ForbiddenError("Your role does not permit modifying patient records");
  }
}

export function isOwnerOrAdmin(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}

/** Throws ForbiddenError unless the caller is an organization owner or admin. */
export function assertOwnerOrAdmin(ctx: AuthContext): void {
  if (!isOwnerOrAdmin(ctx.role)) {
    throw new ForbiddenError("Requires owner or admin role");
  }
}
