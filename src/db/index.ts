import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// A single postgres.js client is reused across the app. In Next.js dev the
// module is re-evaluated on hot reload, so we cache the client on globalThis
// to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  __xerbsPgClient?: ReturnType<typeof postgres>;
};

const client = globalForDb.__xerbsPgClient ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") {
  globalForDb.__xerbsPgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
