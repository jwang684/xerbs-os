import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "./permissions";

// In the browser the client infers its base URL from the current origin, so no
// configuration is required for same-origin usage.
export const authClient = createAuthClient({
  plugins: [organizationClient({ ac, roles })],
});

export const {
  signIn,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
} = authClient;
