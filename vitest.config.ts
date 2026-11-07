import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(ROOT, "shared"),
    },
  },
  test: {
    include: ["tests/**/*.test.mjs"],
    globalSetup: ["./tests/global-server-setup.mjs"],
    // Converter paths shell out to ffmpeg / poppler / tar and can be slow.
    testTimeout: 180_000,
    hookTimeout: 60_000,
    // Each test file gets its own process so they can exec external tools
    // freely without interfering with each other's module state.
    pool: "forks",
    poolOptions: { forks: { singleFork: false } },
    // The API tests share one dev server started in globalSetup; they hit the
    // same upload session so keep file-parallelism sequential there.
    sequence: { concurrent: false },
    reporters: ["default"],
  },
});
