import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Organization access control for the Better Auth organization plugin. Built on
 * Better Auth's default org-management statements (organization/member/
 * invitation permissions).
 *
 * We map our four roles onto the built-in permission roles:
 *   - owner  → full org management
 *   - admin  → member/invitation management
 *   - practitioner, staff → member (no org-management permissions)
 *
 * Clinical write authorization (who may modify patients/visits/…) is enforced
 * separately in the service layer (`assertCanWrite`), not by this access control.
 *
 * Shared by the server auth config and the client (`organizationClient`).
 */
export const ac = createAccessControl({ ...defaultStatements });

export const roles = {
  owner: ownerAc,
  admin: adminAc,
  practitioner: memberAc,
  staff: memberAc,
} as const;
