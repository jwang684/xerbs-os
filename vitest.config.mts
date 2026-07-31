import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Integration tests run against the local Docker Postgres; load its credentials.
config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests share one database, so run test files serially to keep
    // per-suite data isolation simple and deterministic.
    fileParallelism: false,
    include: ["src/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
