import { createAuthClient } from "better-auth/react";

// In the browser the client infers its base URL from the current origin, so no
// configuration is required for same-origin usage.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
