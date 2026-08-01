import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "../db";
import * as schema from "../db/schema";
import { organizationMembers } from "../db/schema";
import { ac, roles } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  // Our tenancy tables (organizations/members/invitations) use uuid primary
  // keys. Generate uuids for every model so ids fit those columns; the auth
  // tables store them as text.
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Default the active organization to the user's first membership so a
        // freshly signed-in user always has an organization scope.
        before: async (session) => {
          const [membership] = await db
            .select({ organizationId: organizationMembers.organizationId })
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, session.userId))
            .limit(1);
          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles,
      creatorRole: "owner",
      // Map the plugin's models onto our existing tables. The Drizzle adapter
      // resolves modelName against the schema EXPORT KEY (not the SQL table
      // name), so these are the drizzle export names.
      schema: {
        organization: { modelName: "organizations" },
        member: { modelName: "organizationMembers" },
        invitation: { modelName: "invitations" },
      },
    }),
    // nextCookies must be the LAST plugin so it can set cookies on the response.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
