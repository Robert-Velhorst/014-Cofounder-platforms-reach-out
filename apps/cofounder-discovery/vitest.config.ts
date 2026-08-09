import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // Database suites share one intentionally small local MySQL service. Running
    // files serially prevents connection storms and makes fixture cleanup reliable.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
