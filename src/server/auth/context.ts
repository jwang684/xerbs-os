import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { auth } from "@/lib/auth";

import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../http/errors";
import type { AuthContext, MemberRole } from "./authz";

/**
 * Resolves the authenticated user and the organization they are acting within.
 *
 * This is the SINGLE seam where the active organization is chosen. Everything
 * downstream (services, repositories, route handlers) consumes the resulting
 * AuthContext and never sees how the org was determined. To move org selection
 * fully into the session later (e.g. Better Auth's organization plugin exposing
 * `session.activeOrganizationId`), change ONLY this function — the header-based
 * path below is a Sprint-1 stopgap and can be removed without touching any
 * other layer.
 *
 * - 401 if there is no valid session.
 * - 403 if the user has no organization membership (or none matching the
 *   requested organization).
 * - The target organization is taken from the `x-organization-id` header; if
 *   omitted and the user belongs to exactly one organization, that one is used.
 *   Otherwise a 400 asks the caller to disambiguate.
 */
export async function getAuthContext(req: Request): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const memberships = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id));

  if (memberships.length === 0) {
    throw new ForbiddenError("User has no organization membership");
  }

  const requestedOrg = req.headers.get("x-organization-id");
  const membership = requestedOrg
    ? memberships.find((m) => m.organizationId === requestedOrg)
    : memberships.length === 1
      ? memberships[0]
      : undefined;

  if (!membership) {
    if (requestedOrg) {
      throw new ForbiddenError("Not a member of the requested organization");
    }
    throw new BadRequestError(
      "User belongs to multiple organizations; set the x-organization-id header",
    );
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role as MemberRole,
  };
}
