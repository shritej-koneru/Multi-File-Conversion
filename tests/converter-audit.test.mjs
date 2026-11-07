/**
 * Audit of remaining converter paths — ported from scripts/verify-audit.mjs.
 * Asserts on real output bytes.
 */
import fs from "fs-extra";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";
import sharp from "sharp";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { converter, FileInfoOf, convertOne } from "./helpers/converter.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.resolve(ROOT, "uploads", "_audit");

beforeAll(async () => {
  await fs.ensureDir(TMP);

  // fixtures: PNG, pdf-lib-generated PDF, real-world PDF
  const pngBuf = await sharp({ create: { width: 40, height: 30, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
  await fs.writeFile(path.join(TMP, "img.png"), pngBuf);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  pdfDoc.addPage([400, 300]).drawText("Audit probe text", { x: 30, y: 150, size: 16, font });
  await fs.writeFile(path.join(TMP, "doc.pdf"), await pdfDoc.save());

  // small real media via ffmpeg
  execSync(`ffmpeg -y -v error -f lavfi -i "sine=frequency=440:duration=1" "${path.join(TMP, "tone.wav")}"`);
  execSync(
    `ffmpeg -y -v error -f lavfi -i "testsrc=duration=1:size=160x120:rate=10" -f lavfi -i "sine=frequency=330:duration=1" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac "${path.join(TMP, "clip.mp4")}"`
  );
});

afterAll(async () => {
  // Windows can keep handles on freshly-written media briefly (EBUSY); retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fs.remove(TMP);
      return;
    } catch (e) {
      if (attempt === 4) {
        console.warn(`[cleanup] could not remove ${TMP}: ${e.message}`);
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
});

const pngPath = path.join(TMP, "img.png");
const pdfPath = path.join(TMP, "doc.pdf");
const realPdfPath = path.resolve(ROOT, "public/test-files/documents/sample.pdf");
const wavPath = path.join(TMP, "tone.wav");
const vidPath = path.join(TMP, "clip.mp4");

describe("PDF rasterization (pdf2pic is broken without GraphicsMagick)", () => {
  it("PDF -> JPG produces a real JPEG", async () => {
    const r = await convertOne(FileInfoOf("doc.pdf", ".pdf", "application/pdf", 0, pdfPath), "jpg");
    const buf = await fs.readFile(r.path);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
  });

  it("PDF -> PNG produces a real PNG", async () => {
    const r = await convertOne(FileInfoOf("doc.pdf", ".pdf", "application/pdf", 0, pdfPath), "png");
    const buf = await fs.readFile(r.path);
    expect(buf[0]).toBe(0x89);
    expect(buf.toString("latin1", 1, 4)).toBe("PNG");
  });
});

describe("PDF text extraction (pdf-parse buffer bug)", () => {
  it("PDF -> TXT extracts real text (pdf-lib generated)", async () => {
    const r = await convertOne(FileInfoOf("doc.pdf", ".pdf", "application/pdf", 0, pdfPath), "txt");
    const text = await fs.readFile(r.path, "utf-8");
    expect(text).toContain("Audit probe text");
  });

  it("PDF -> TXT works on a real-world PDF", async () => {
    const r = await convertOne(FileInfoOf("sample.pdf", ".pdf", "application/pdf", 0, realPdfPath), "txt");
    const text = await fs.readFile(r.path, "utf-8");
    expect(text.includes("calibre") || text.includes("DOCX")).toBe(true);
  });

  it("PDF -> DOCX round-trips text through mammoth", async () => {
    const r = await convertOne(FileInfoOf("doc.pdf", ".pdf", "application/pdf", 0, pdfPath), "docx");
    const mammoth = (await import("mammoth")).default;
    const extracted = (await mammoth.extractRawText({ path: r.path })).value;
    expect(extracted).toContain("Audit probe text");
  });
});

describe("DOCX -> PDF (fallback chain, no pandoc/LibreOffice here)", () => {
  it("falls back to a text-based PDF", async () => {
    const r = await convertOne(
      FileInfoOf(
        "sample.docx",
        ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        0,
        path.resolve(ROOT, "public/test-files/documents/sample.docx")
      ),
      "pdf"
    );
    const buf = await fs.readFile(r.path);
    expect(buf.slice(0, 4).toString()).toBe("%PDF");
  });
});

// ffmpeg spawns dominate per-test cost; run the media groups concurrently.
// Fixture safety: every concurrent test only READS the shared tone.wav/clip.mp4
// fixtures and writes to a distinct output name (tone.mp3/ogg/m4a,
// clip.avi/webm/mov/gif), so there are no write collisions. The FileConverter
// facade holds no mutable per-conversion state, so concurrent calls are safe.
describe.concurrent("audio conversions (ffmpeg)", () => {
  for (const target of ["mp3", "ogg", "m4a"]) {
    it.concurrent(`WAV -> ${target} produces real output`, async () => {
      const r = await convertOne(FileInfoOf("tone.wav", ".wav", "audio/wav", 0, wavPath), target);
      const buf = await fs.readFile(r.path);
      const sig = buf.slice(0, 4).toString("latin1");
      if (target === "mp3") {
        expect(buf[0] === 0xff || sig.startsWith("ID3")).toBe(true);
      } else if (target === "ogg") {
        expect(sig.startsWith("OggS")).toBe(true);
      } else {
        expect(buf.slice(4, 8).toString("latin1")).toBe("ftyp");
      }
    });
  }
});

describe.concurrent("video conversions (ffmpeg)", () => {
  for (const target of ["avi", "webm", "mov"]) {
    it.concurrent(`MP4 -> ${target} produces real output`, async () => {
      const r = await convertOne(FileInfoOf("clip.mp4", ".mp4", "video/mp4", 0, vidPath), target);
      const buf = await fs.readFile(r.path);
      const sig = buf.slice(0, 12).toString("latin1");
      if (target === "avi") {
        expect(sig.startsWith("RIFF")).toBe(true);
      } else if (target === "webm") {
        expect(sig[0]).toBe("\x1A");
        expect(sig[1]).toBe("\x45");
      } else {
        expect(buf.slice(4, 8).toString("latin1")).toBe("ftyp");
      }
    });
  }

  it.concurrent("MP4 -> GIF produces real output", async () => {
    const r = await convertOne(FileInfoOf("clip.mp4", ".mp4", "video/mp4", 0, vidPath), "gif");
    const buf = await fs.readFile(r.path);
    expect(buf.slice(0, 3).toString()).toBe("GIF");
  });
});

describe("archives", () => {
  it("PNG -> ZIP produces a real zip", async () => {
    const r = await convertOne(FileInfoOf("img.png", ".png", "image/png", 0, pngPath), "zip");
    const buf = await fs.readFile(r.path);
    expect(buf.slice(0, 2).toString()).toBe("PK");
  });

  it("PNG -> TAR produces a valid gzip tar with ustar header (Windows bsdtar)", async () => {
    const r = await convertOne(FileInfoOf("img.png", ".png", "image/png", 0, pngPath), "tar");
    const buf = await fs.readFile(r.path);
    // converter uses tar -czf => gzip-compressed tar (1f 8b); gunzip and verify ustar header
    const tarBytes = zlib.gunzipSync(buf);
    expect(buf[0]).toBe(0x1f);
    expect(buf[1]).toBe(0x8b);
    expect(tarBytes.toString("latin1", 257, 262)).toBe("ustar");
  });
});

describe("image round-trips (sharp)", () => {
  for (const target of ["jpg", "webp", "gif", "tiff"]) {
    it(`PNG -> ${target} preserves dimensions`, async () => {
      const r = await convertOne(FileInfoOf("img.png", ".png", "image/png", 0, pngPath), target);
      // read as buffer: sharp() on a path can hold a Windows file handle (EBUSY in cleanup)
      const meta = await sharp(await fs.readFile(r.path)).metadata();
      expect(meta.width).toBe(40);
      expect(meta.height).toBe(30);
    });
  }
});

describe("XLSX -> CSV", () => {
  it("extracts correct content", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["h1", "h2"], ["v1", "v2"]]), "S1");
    const xlsPath = path.join(TMP, "sheet.xlsx");
    XLSX.writeFile(wb, xlsPath);
    const r = await convertOne(FileInfoOf("sheet.xlsx", ".xlsx", "", 0, xlsPath), "csv");
    const csv = await fs.readFile(r.path, "utf-8");
    expect(csv).toContain("h1,h2");
    expect(csv).toContain("v1,v2");
  });
});

describe("HTML -> TXT", () => {
  it("strips tags", async () => {
    const htmlPath = path.join(TMP, "page.html");
    await fs.writeFile(htmlPath, "<html><body><h1>Hello</h1><p>World</p></body></html>");
    const r = await convertOne(FileInfoOf("page.html", ".html", "text/html", 0, htmlPath), "txt");
    const text = await fs.readFile(r.path, "utf-8");
    expect(text).toContain("Hello");
    expect(text).toContain("World");
  });
});

describe("data format conversions (json/yaml/toml/xml)", () => {
  const dataDir = path.join(TMP, "data");

  beforeAll(async () => {
    await fs.ensureDir(dataDir);
    // NB: outputs are written next to inputs as <basename>.<target>, so fixture
    // names must not collide with any conversion output name in this dir.
    await fs.writeFile(
      path.join(dataDir, "src-a.json"),
      JSON.stringify({ name: "audit", version: 2, nested: { ok: true, tags: ["a", "b"] } }, null, 2)
    );
    await fs.writeFile(
      path.join(dataDir, "src-b.yaml"),
      "name: audit\nversion: 2\nnested:\n  ok: true\n  tags:\n    - a\n    - b\n"
    );
    await fs.writeFile(
      path.join(dataDir, "src-c.toml"),
      'name = "audit"\nversion = 2\n[nested]\nok = true\ntags = ["a", "b"]\n'
    );
    await fs.writeFile(
      path.join(dataDir, "src-d.xml"),
      `<?xml version="1.0"?><root><name>audit</name><version>2</version><nested><ok>true</ok><tags>a</tags><tags>b</tags></nested></root>`
    );
  });

  const fi = (n) => FileInfoOf(n, path.extname(n), "", 0, path.join(dataDir, n));

  it("JSON -> YAML", async () => {
    const r = await convertOne(fi("src-a.json"), "yaml");
    const y = await fs.readFile(r.path, "utf-8");
    expect(y).toContain("name: audit");
    expect(y).toContain("version: 2");
  });

  it("JSON -> TOML", async () => {
    const r = await convertOne(fi("src-a.json"), "toml");
    const t = await fs.readFile(r.path, "utf-8");
    expect(t).toContain('name = "audit"');
    expect(t).toContain("version = 2");
  });

  it("JSON -> XML", async () => {
    const r = await convertOne(fi("src-a.json"), "xml");
    const x = await fs.readFile(r.path, "utf-8");
    expect(x).toContain("<name>audit</name>");
    expect(x).toContain("<version>2</version>");
  });

  it("YAML -> JSON round-trip", async () => {
    const r = await convertOne(fi("src-b.yaml"), "json");
    const j = JSON.parse(await fs.readFile(r.path, "utf-8"));
    expect(j.name).toBe("audit");
    expect(j.nested.ok).toBe(true);
    expect(j.nested.tags).toHaveLength(2);
  });

  it("TOML -> JSON round-trip", async () => {
    const r = await convertOne(fi("src-c.toml"), "json");
    const j = JSON.parse(await fs.readFile(r.path, "utf-8"));
    expect(j.name).toBe("audit");
    expect(j.version).toBe(2);
  });

  it("XML -> JSON round-trip", async () => {
    const r = await convertOne(fi("src-d.xml"), "json");
    const j = JSON.parse(await fs.readFile(r.path, "utf-8"));
    expect(j.root?.name).toBe("audit");
    expect(j.root?.version).toBe(2);
  });

  it("TOML -> YAML", async () => {
    const r = await convertOne(fi("src-c.toml"), "yaml");
    const y = await fs.readFile(r.path, "utf-8");
    expect(y).toContain("name: audit");
  });
});
