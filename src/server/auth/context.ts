import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ForbiddenError, UnauthorizedError } from "../http/errors";
import type { AuthContext, MemberRole } from "./authz";

/**
 * Resolves the authenticated user and the organization they are acting within.
 *
 * The active organization comes solely from the authenticated session
 * (`session.activeOrganizationId`, managed by the Better Auth organization
 * plugin). It is set to the user's first membership on sign-in and changed via
 * the plugin's set-active endpoint. There is no client-provided header.
 *
 * Membership is still verified here, so a session's active organization can only
 * resolve to an org the user actually belongs to (tenant isolation).
 *
 * - 401 if there is no valid session.
 * - 403 if the session has no active organization, or the user is not a member
 *   of it.
 */
export async function getAuthContext(req: Request): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    throw new ForbiddenError("No active organization for this session");
  }

  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, session.user.id),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("Not a member of the active organization");
  }

  return {
    userId: session.user.id,
    organizationId,
    membershipId: membership.id,
    role: membership.role as MemberRole,
  };
}
