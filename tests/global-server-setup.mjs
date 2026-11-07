/**
 * Global vitest setup for integration tests.
 *
 * Spawns the real dev server (tsx server/index.ts) on a dedicated port so the
 * HTTP-lifecycle tests (tests/api-*.test.mjs) exercise the actual server
 * surface. Unit tests (tests/*.test.mjs) don't need it but the setup is cheap
 * and shared.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEST_PORT = Number(process.env.TEST_SERVER_PORT || 5101);
const BASE_URL = `http://localhost:${TEST_PORT}`;

const child = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: "development", PORT: String(TEST_PORT) },
  stdio: ["ignore", "pipe", "pipe"],
  detached: false,
});

let serverLog = "";
child.stdout.on("data", (d) => { serverLog += d; });
child.stderr.on("data", (d) => { serverLog += d; });

async function waitForHealth(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (typeof fetch === "function") {
      try {
        const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
        if (res.ok) return;
      } catch {
        // not up yet
      }
    }
    if (child.exitCode !== null) {
      throw new Error(`Test server exited early (code ${child.exitCode}). Last log:\n${serverLog.slice(-2000)}`);
    }
    await sleep(300);
  }
  throw new Error(`Test server did not become healthy on ${BASE_URL} within ${timeoutMs}ms. Last log:\n${serverLog.slice(-2000)}`);
}

// Make the URL available to test files: forked workers inherit this env var.
process.env.TEST_SERVER_URL = BASE_URL;

export async function setup() {
  await waitForHealth();
  console.log(`[test setup] dev server healthy at ${BASE_URL}`);
}

export async function teardown() {
  // The tsx loader runs the server in-process, so killing the spawned node
  // kills the server. On Windows also kill the whole tree defensively.
  if (child.exitCode === null && child.pid) {
    try {
      const { execFile } = await import("node:child_process");
      if (process.platform === "win32") {
        execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], { cwd: ROOT });
      } else {
        child.kill("SIGTERM");
      }
      // give it a moment, then SIGKILL fallback on non-Windows
      await sleep(1500);
      if (child.exitCode === null && process.platform !== "win32") child.kill("SIGKILL");
    } catch {
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
    }
  }
  if (serverLog.toLowerCase().includes("unhandled") || serverLog.toLowerCase().includes("eaddrinuse")) {
    console.warn(`[test teardown] possible server issue:\n${serverLog.slice(-1500)}`);
  }
}
