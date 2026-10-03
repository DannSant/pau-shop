import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    // All files share the local database, so they run one at a time.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000
  }
});
