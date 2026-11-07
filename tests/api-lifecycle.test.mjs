/**
 * E2E API lifecycle tests against a dev server started by tests/global-server-setup.mjs.
 * Drives the real HTTP surface: upload -> convert -> poll -> download,
 * plus /api/test-convert coverage of the newly fixed converter paths.
 *
 * Ported from scripts/verify-api.mjs and scripts/verify-live-new.mjs.
 */
import fs from "fs-extra";
import path from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Set by tests/global-server-setup.mjs; workers inherit it.
const BASE = process.env.TEST_SERVER_URL || "http://localhost:5101";

describe("API lifecycle", () => {
  let up;
  let conversionId;
  let job;
  const tmp = path.resolve("uploads/_verify_e2e");

  beforeAll(async () => {
    await fs.ensureDir(tmp);
  });

  afterAll(async () => {
    try {
      await fetch(`${BASE}/api/cleanup/${up?.sessionId}`, { method: "POST" });
    } catch { /* server may already be stopping */ }
    await fs.remove(tmp);
  });

  it("GET /health returns healthy", async () => {
    const health = await (await fetch(`${BASE}/health`)).json();
    expect(health.status).toBe("healthy");
  });

  it("POST /api/upload stores files with UUID-prefixed names", async () => {
    const noteTxt = "E2E lifecycle line 1 & <tag>\nline 2";
    const csvContent = 'id,name,city\n1,"Doe, John",NYC\n2,Jane,LA\n';
    fs.writeFileSync(path.join(tmp, "note.txt"), noteTxt);
    fs.writeFileSync(path.join(tmp, "people.csv"), csvContent);

    const fd = new FormData();
    fd.append("files", new Blob([noteTxt], { type: "text/plain" }), "note.txt");
    fd.append("files", new Blob([csvContent], { type: "text/csv" }), "people.csv");
    const upRes = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
    up = await upRes.json();
    expect(upRes.ok).toBe(true);
    expect(typeof up.sessionId).toBe("string");
    expect(up.sessionId.length).toBeGreaterThan(10);
    expect(up.files).toHaveLength(2);
    for (const f of up.files) {
      expect(f.savedPath).toBeTruthy();
      expect(fs.existsSync(f.savedPath)).toBe(true);
      expect(path.basename(f.savedPath).endsWith(f.name)).toBe(true);
      expect(path.basename(f.savedPath)).not.toBe(f.name); // UUID-prefixed
    }
  });

  it("POST /api/convert -> poll -> download round-trips escaped HTML", async () => {
    const convRes = await fetch(`${BASE}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: up.sessionId,
        targetFormat: "html",
        files: up.files.filter((f) => f.extension === ".txt").map((f) => ({ name: f.name, size: f.size, type: f.type, extension: f.extension, savedPath: f.savedPath })),
      }),
    });
    const res2 = await convRes.json();
    conversionId = res2.conversionId;
    expect(convRes.ok).toBe(true);
    expect(conversionId).toBeTruthy();

    let status = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 400));
      job = await (await fetch(`${BASE}/api/conversion/${conversionId}`)).json();
      status = job.status;
      if (status === "completed" || status === "failed") break;
    }
    expect(status).toBe("completed");
    expect(job.convertedFiles).toHaveLength(1);
    expect(job.downloadUrl).toBe(`/api/download/${conversionId}/note.html`);

    const dl = await fetch(`${BASE}${job.downloadUrl}`);
    expect(dl.status).toBe(200);
    const html = await dl.text();
    expect(html).toContain("&lt;tag&gt;");
    expect(html).toContain("line 2");
  });

  it("download for an in-progress conversion 404s", async () => {
    const conv2 = await (
      await fetch(`${BASE}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: up.sessionId,
          targetFormat: "pdf",
          files: up.files.filter((f) => f.extension === ".txt").map((f) => ({ name: f.name, size: f.size, type: f.type, extension: f.extension, savedPath: f.savedPath })),
        }),
      })
    ).json();
    const early = await fetch(`${BASE}/api/download/${conv2.conversionId}/note.html`);
    expect(early.status).toBe(404);
  });

  it("convert WITHOUT savedPath succeeds via findUploadedFile fallback", async () => {
    const noteTxt = "E2E lifecycle line 1 & <tag>\nline 2";
    const conv3 = await (
      await fetch(`${BASE}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: up.sessionId,
          targetFormat: "docx",
          files: [{ name: "note.txt", size: noteTxt.length, type: "text/plain", extension: ".txt" }],
        }),
      })
    ).json();
    let s3 = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const j3 = await (await fetch(`${BASE}/api/conversion/${conv3.conversionId}`)).json();
      s3 = j3.status;
      if (s3 === "completed" || s3 === "failed") break;
    }
    expect(s3).toBe("completed");
  });

  describe("path traversal protections", () => {
    it("download traversal attempt rejected", async () => {
      const trav1 = await fetch(`${BASE}/api/download/${conversionId}/..%2f..%2f..%2fpackage.json`);
      expect([400, 404]).toContain(trav1.status);
    });

    it("test-convert ../ traversal rejected with 400", async () => {
      const trav2 = await fetch(`${BASE}/api/test-convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testFilePath: "../../package.json", targetFormat: "txt" }),
      });
      expect(trav2.status).toBe(400);
    });

    it("test-convert absolute path rejected with 400", async () => {
      const trav3 = await fetch(`${BASE}/api/test-convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testFilePath: "/etc/passwd", targetFormat: "txt" }),
      });
      expect(trav3.status).toBe(400);
    });

    it("test-convert accepts legitimate public/ path", async () => {
      const trav4 = await fetch(`${BASE}/api/test-convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testFilePath: "test-files/images/sample.png", targetFormat: "bmp" }),
      });
      const trav4j = await trav4.json();
      expect(trav4.status).toBe(200);
      expect(trav4j).toBeTruthy();
    });
  });

  it("multi-format conversion completes and downloads a ZIP", async () => {
    const conv4 = await (
      await fetch(`${BASE}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: up.sessionId,
          targetFormats: ["pdf", "docx", "html"],
          files: up.files.filter((f) => f.extension === ".txt").map((f) => ({ name: f.name, size: f.size, type: f.type, extension: f.extension, savedPath: f.savedPath })),
        }),
      })
    ).json();
    let j4 = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 400));
      j4 = await (await fetch(`${BASE}/api/conversion/${conv4.conversionId}`)).json();
      if (j4.status === "completed" || j4.status === "failed") break;
    }
    expect(j4.status).toBe("completed");
    expect(j4.convertedFiles).toHaveLength(3);
    expect(j4.downloadUrl.endsWith("converted_files.zip")).toBe(true);
    const zipRes = await fetch(`${BASE}${j4.downloadUrl}`);
    const zipBuf = Buffer.from(await zipRes.arrayBuffer());
    expect(zipRes.status).toBe(200);
    expect(zipBuf.slice(0, 2).toString()).toBe("PK");
  });

  it("POST /api/cleanup/:sessionId returns 200", async () => {
    const cl = await fetch(`${BASE}/api/cleanup/${up.sessionId}`, { method: "POST" });
    expect(cl.status).toBe(200);
  });
});

/**
 * Live checks of the newly fixed converter paths through /api/test-convert.
 */

// Fixture discovery happens at module top level so the it() loop below sees them.
const liveCases = [
  ["test-files/documents/sample.pdf", "jpg", (b) => b[0] === 0xff && b[1] === 0xd8],
  ["test-files/documents/sample.pdf", "png", (b) => b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG"],
  ["test-files/documents/sample.pdf", "txt", (b) => b.length > 50],
  ["test-files/images/sample.png", "tar", (b) => b[0] === 0x1f && b[1] === 0x8b],
];
if (fs.existsSync("public/test-files/spreadsheets")) {
  const sheets = (await fs.readdir("public/test-files/spreadsheets")).filter((f) => f.endsWith(".xlsx"));
  if (sheets.length) liveCases.push([`test-files/spreadsheets/${sheets[0]}`, "csv", (b) => b.length > 5]);
}
if (fs.existsSync("public/test-files/audio")) {
  const audio = (await fs.readdir("public/test-files/audio")).filter((f) => [".wav", ".mp3"].includes(f.slice(-4)));
  if (audio.length) liveCases.push([`test-files/audio/${audio[0]}`, "m4a", (b) => b.slice(4, 8).toString() === "ftyp" || b.length > 1000]);
}
// Each case hits its own conversionId end-to-end and writes to a distinct
// output name next to the fixture, so they can run concurrently.
describe.concurrent("test-convert of newly fixed paths", () => {
  async function testConvert(testFilePath, targetFormat) {
    const res = await fetch(`${BASE}/api/test-convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testFilePath, targetFormat }),
    });
    if (!res.ok) throw new Error(`start failed HTTP ${res.status}: ${(await res.text()).slice(0, 80)}`);
    const { conversionId } = await res.json();
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const job = await (await fetch(`${BASE}/api/conversion/${conversionId}`)).json();
      if (job.status === "completed") return job;
      if (job.status === "failed") throw new Error("conversion failed");
    }
    throw new Error("timeout");
  }

  async function downloadSteps(file, target, check) {
    const job = await testConvert(file, target);
    const dl = job.convertedFiles?.[0];
    if (!dl) throw new Error("no converted file entry");
    const dlRes = await fetch(`${BASE}${job.downloadUrl || `/api/download/${job.id}/${dl.convertedName}`}`);
    const buf = Buffer.from(await dlRes.arrayBuffer());
    expect(dlRes.status).toBe(200);
    expect(check(buf)).toBe(true);
    return `${path.basename(file)} -> ${target} (${dl.convertedName}, ${buf.length}B)`;
  }

  for (const [file, target, check] of liveCases) {
    it.concurrent(`${file} -> ${target} through the live API`, async () => {
      await downloadSteps(file, target, check);
    }, 120_000);
  }
});
