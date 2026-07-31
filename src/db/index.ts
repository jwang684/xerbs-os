import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

// Cached on globalThis so Next.js dev hot-reload doesn't exhaust connections.
const globalForDb = globalThis as unknown as {
  __xerbsPgClient?: ReturnType<typeof postgres>;
  __xerbsDb?: Database;
};

function getClient(): ReturnType<typeof postgres> {
  if (globalForDb.__xerbsPgClient) return globalForDb.__xerbsPgClient;

  // Validate lazily — only when the database is actually used, never at import
  // or build time. This keeps `next build` working without a DATABASE_URL while
  // preserving strict runtime validation.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  }

  const client = postgres(connectionString);
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__xerbsPgClient = client;
  }
  return client;
}

function getDb(): Database {
  if (globalForDb.__xerbsDb) return globalForDb.__xerbsDb;
  const instance = drizzle(getClient(), { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__xerbsDb = instance;
  }
  return instance;
}

/**
 * The Drizzle client. A lazy proxy: the connection (and DATABASE_URL check) is
 * created on first actual use, not at import — so importing this module during
 * `next build` never requires a database or env var. Call sites use it exactly
 * like a normal Drizzle instance (`db.select()`, `db.transaction()`, …).
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };

/** Closes the underlying connection pool. Use in scripts/tests for clean exit. */
export async function closeDb(): Promise<void> {
  const client = globalForDb.__xerbsPgClient;
  if (client) {
    await client.end();
    globalForDb.__xerbsPgClient = undefined;
    globalForDb.__xerbsDb = undefined;
  }
}
