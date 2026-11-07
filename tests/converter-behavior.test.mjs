/**
 * Headless converter behavior tests — ported from scripts/verify-changes.mjs.
 * Drives the real FileConverter class and asserts on actual output bytes.
 */
import fs from "fs-extra";
import path from "path";
import zlib from "zlib";
import sharp from "sharp";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { converter, FileInfoOf } from "./helpers/converter.mjs";

const TMP = path.resolve("uploads/_verify_tmp");

beforeAll(async () => {
  await fs.ensureDir(TMP);
});

afterAll(async () => {
  await fs.remove(TMP);
});

// Minimal ZIP local-header parser (entries stored with level-0 deflate/raw in our docx)
function zipEntries(buf) {
  const names = [];
  let i = 0;
  while (i < buf.length - 4) {
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const method = buf.readUInt16LE(i + 8);
      const compSize = buf.readUInt32LE(i + 18);
      const nameLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const name = buf.slice(i + 30, i + 30 + nameLen).toString();
      const dataStart = i + 30 + nameLen + extraLen;
      const raw = buf.slice(dataStart, dataStart + compSize);
      let content;
      try {
        content = method === 0 ? raw.toString() : zlib.inflateRawSync(raw).toString();
      } catch {
        content = null;
      }
      names.push([name, content]);
      i = dataStart + compSize;
    } else {
      i++;
    }
  }
  return names;
}

describe("BMP encoder (PNG -> BMP)", () => {
  it("writes a real 24-bit BMP with correct pixels", async () => {
    const png = await sharp({ create: { width: 3, height: 2, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
    const inPath = path.join(TMP, "img.png");
    await fs.writeFile(inPath, png);
    const outPath = path.join(TMP, "img.bmp");
    const res = await converter.convertFiles([FileInfoOf("img.png", ".png", "image/png", png.length, inPath)], "bmp", "s1", () => {});

    expect(res).toHaveLength(1);
    expect(res[0].convertedName).toBe("img.bmp");
    expect(res[0].size).toBeGreaterThan(0);
    expect(res[0].size).toBe((await fs.stat(outPath)).size);

    const buf = await fs.readFile(outPath);
    expect(buf[0]).toBe(0x42);
    expect(buf[1]).toBe(0x4d);
    expect(buf.readUInt32LE(2)).toBe(buf.length);
    expect(buf.readUInt16LE(26)).toBe(1); // 1 plane
    expect(buf.readUInt16LE(28)).toBe(24); // 24bpp
    expect(buf.readUInt32LE(30)).toBe(0); // uncompressed (BI_RGB)
    expect(buf.readInt32LE(22)).toBe(-2); // negative height = top-down rows
    const rowSize = Math.ceil((3 * 3) / 4) * 4; // width*3 padded to 4
    expect(buf.readUInt32LE(34)).toBe(rowSize * 2);
    expect(buf.readUInt32LE(10)).toBe(54); // pixel data offset
    // pixel checks: row 0 = red (top-down), BGR order
    expect([buf[54], buf[55], buf[56]]).toEqual([0, 0, 255]);
    const row1 = 54 + rowSize;
    expect([buf[row1], buf[row1 + 1], buf[row1 + 2]]).toEqual([0, 0, 255]);
  });

  it("produces neutral gray pixels from grayscale input (no red tint)", async () => {
    const grayPng = await sharp({ create: { width: 2, height: 2, channels: 3, background: { r: 77, g: 77, b: 77 } } }).toColourspace("b-w").png().toBuffer();
    const inPath = path.join(TMP, "gray.png");
    await fs.writeFile(inPath, grayPng);
    const outPath = path.join(TMP, "gray.bmp");
    await converter.convertFiles([FileInfoOf("gray.png", ".png", "image/png", grayPng.length, inPath)], "bmp", "s1b", () => {});
    const buf = await fs.readFile(outPath);
    const rowSize = Math.ceil((2 * 3) / 4) * 4;
    expect(buf.slice(0, 2).toString()).toBe("BM");
    expect(buf.readUInt32LE(2)).toBe(buf.length);
    let allNeutral = true;
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const i = 54 + y * rowSize + x * 3;
        const b = buf[i], g = buf[i + 1], r = buf[i + 2];
        if (!(r === 77 && g === 77 && b === 77)) allNeutral = false;
      }
    }
    expect(allNeutral).toBe(true);
  });

  it("flattens RGBA alpha over white, RGB preserved", async () => {
    const rgbaPng = await sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
    const inPath = path.join(TMP, "alpha.png");
    await fs.writeFile(inPath, rgbaPng);
    const outPath = path.join(TMP, "alpha.bmp");
    await converter.convertFiles([FileInfoOf("alpha.png", ".png", "image/png", rgbaPng.length, inPath)], "bmp", "s1c", () => {});
    const buf = await fs.readFile(outPath);
    expect(buf.readUInt32LE(2)).toBe(54 + 4); // 54-byte header + 4-byte padded pixel row
    const b = buf[54], g = buf[55], r = buf[56];
    // 50% transparent red over white composite: pink, NOT black-tinted
    expect(r).toBe(255);
    expect(Math.abs(g - 127)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 127)).toBeLessThanOrEqual(1);
  });

  it("converts a large image quickly and exactly", async () => {
    const bigPng = await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 10, g: 200, b: 30 } } }).png().toBuffer();
    const inPath = path.join(TMP, "big.png");
    await fs.writeFile(inPath, bigPng);
    const outPath = path.join(TMP, "big.bmp");
    const t0 = Date.now();
    await converter.convertFiles([FileInfoOf("big.png", ".png", "image/png", bigPng.length, inPath)], "bmp", "s1d", () => {});
    const ms = Date.now() - t0;
    const buf = await fs.readFile(outPath);
    expect(buf.length).toBe(54 + Math.ceil((1200 * 3) / 4) * 4 * 800);
    expect(ms).toBeLessThan(5000);
    const mid = 54 + 400 * Math.ceil((1200 * 3) / 4) * 4 + 600 * 3;
    expect([buf[mid], buf[mid + 1], buf[mid + 2]]).toEqual([30, 200, 10]);
  });
});

describe("TXT -> DOCX (real OOXML)", () => {
  it("produces a real ZIP that mammoth can read back, with escaping and paragraphs", async () => {
    const inPath = path.join(TMP, "note.txt");
    await fs.writeFile(inPath, "Line one & <special> \"chars\" 'here'\nLine two\n\nLine four");
    const outPath = path.join(TMP, "note.docx");
    const res = await converter.convertFiles([FileInfoOf("note.txt", ".txt", "text/plain", 45, inPath)], "docx", "s2", () => {});
    expect(res).toHaveLength(1);
    expect(res[0].convertedName).toBe("note.docx");

    const buf = await fs.readFile(outPath);
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
    const entries = Object.fromEntries(zipEntries(buf));
    expect(entries["[Content_Types].xml"]).toBeDefined();
    expect(entries["_rels/.rels"]).toBeDefined();
    expect(entries["word/document.xml"]).toBeDefined();

    const docXml = entries["word/document.xml"];
    expect(docXml).toContain("Line one &amp; &lt;special&gt; &quot;chars&quot; &apos;here&apos;");
    expect(docXml).toContain('<w:t xml:space="preserve">Line two</w:t>');
    expect((docXml.match(/<w:p>/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(docXml).toContain("http://schemas.openxmlformats.org/wordprocessingml/2006/main");

    // REAL validity check: mammoth (a proper OOXML parser) can open it and extract the text
    const extracted = await mammoth.extractRawText({ path: outPath });
    expect(extracted.value).toContain("Line one & <special> \"chars\" 'here'");
    expect(extracted.value).toContain("Line two");
    expect(extracted.value).toContain("Line four");
  });
});

describe("MD -> HTML (previously threw, now parses)", () => {
  it("renders full, escaped markup", async () => {
    const inPath = path.join(TMP, "doc.md");
    await fs.writeFile(inPath, [
      "# Title & Notes",
      "",
      "Some **bold** and *italic* and `code` text",
      "",
      "- item a",
      "- item b",
      "",
      "1. first",
      "2. second",
      "",
      "```",
      "const x = 1 < 2 && 3 > 2;",
      "```",
      "",
      "[a link](https://example.com)",
      "plain paragraph with <script>alert('md')</script> injected",
    ].join("\n"));
    const outPath = path.join(TMP, "doc.html");
    const res = await converter.convertFiles([FileInfoOf("doc.md", ".md", "text/markdown", 300, inPath)], "html", "s3", () => {});
    expect(res).toHaveLength(1);
    expect(res[0].convertedName).toBe("doc.html");
    const html = await fs.readFile(outPath, "utf-8");
    expect(html).toMatch(/<h1>Title &amp; Notes<\/h1>/);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>item a</li>");
    expect(html).toContain("<li>item b</li>");
    expect(html).toContain("</ul>");
    expect(html).toMatch(/<ol>\s*<li>first<\/li>/);
    expect(html).toMatch(/<\/ol>/);
    expect(html).not.toMatch(/<\/ul>\s*<h1>/);
    expect(html).toContain("<pre><code>const x = 1 &lt; 2 &amp;&amp; 3 &gt; 2;\n</code></pre>");
    expect(html).toContain('<a href="https://example.com">a link</a>');
    expect(html).toContain("<p>plain paragraph with &lt;script&gt;alert('md')&lt;/script&gt; injected</p>");
  });
});

describe("TXT -> HTML (XSS escaping)", () => {
  it("escapes script injection while preserving content as text", async () => {
    const inPath = path.join(TMP, "evil.txt");
    const payload = `<script>alert('xss')</script> & "quotes" <b>bold</b>`;
    await fs.writeFile(inPath, payload);
    const outPath = path.join(TMP, "evil.html");
    await converter.convertFiles([FileInfoOf("evil.txt", ".txt", "text/plain", 40, inPath)], "html", "s4", () => {});
    const html = await fs.readFile(outPath, "utf-8");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert('xss')&lt;/script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    const expectedPre = payload.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    expect(html).toContain("<pre>" + expectedPre + "</pre>");
  });
});

describe("CSV -> XLSX (quoted-field handling)", () => {
  it("keeps quoted commas and embedded newlines inside one cell", async () => {
    const inPath = path.join(TMP, "data.csv");
    await fs.writeFile(inPath, 'name,city,note\n"Doe, John","NY; USA","multi\nline quoted"\nplain,xxx,yyy');
    const outPath = path.join(TMP, "data.xlsx");
    const res = await converter.convertFiles([FileInfoOf("data.csv", ".csv", "text/csv", 80, inPath)], "xlsx", "s5", () => {});
    expect(res).toHaveLength(1);
    expect(res[0].convertedName).toBe("data.xlsx");
    const wb = XLSX.read(await fs.readFile(outPath), { type: "buffer" });
    expect(wb.SheetNames).toHaveLength(1);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    expect(rows).toHaveLength(2); // quoted newline did not split rows
    expect(rows[0].name).toBe("Doe, John");
    expect(rows[0].note).toBe("multi\nline quoted");
    expect(rows[0].city).toBe("NY; USA");
    expect(rows[1].name).toBe("plain");
  });
});

describe("TXT -> PDF (unicode handling)", () => {
  it("does not throw on non-WinAnsi characters and emits a real PDF", async () => {
    const inPath = path.join(TMP, "uni.txt");
    await fs.writeFile(inPath, "Hello café — naïve résumé 你好 world");
    const outPath = path.join(TMP, "uni.pdf");
    const res = await converter.convertFiles([FileInfoOf("uni.txt", ".txt", "text/plain", 60, inPath)], "pdf", "s6", () => {});
    expect(res).toHaveLength(1);
    expect(res[0].convertedName).toBe("uni.pdf");
    const buf = await fs.readFile(outPath);
    expect(buf.slice(0, 4).toString()).toBe("%PDF");
    expect(buf.length).toBeGreaterThan(500);
  });
});

describe("unsupported conversions (negative)", () => {
  it("convertFiles swallows per-file errors and returns [] by design", async () => {
    const inPath = path.join(TMP, "x.json");
    await fs.writeFile(inPath, "{}");
    await expect(
      converter.convertFiles([FileInfoOf("x.json", ".json", "application/json", 2, inPath)], "docx", "s7", () => {})
    ).resolves.toEqual([]);
  });
});

describe("multi-format conversion", () => {
  it("runs all three targets and produces non-empty outputs", async () => {
    const inPath = path.join(TMP, "multi.txt");
    await fs.writeFile(inPath, "multi format test");
    const res = await converter.convertFilesToMultipleFormats(
      [FileInfoOf("multi.txt", ".txt", "text/plain", 17, inPath)],
      ["html", "pdf", "docx"],
      "s8",
      () => {}
    );
    const names = res.map((r) => r.convertedName).sort();
    expect(names).toEqual(["multi.docx", "multi.html", "multi.pdf"]);
    for (const r of res) {
      expect((await fs.stat(r.path)).size).toBeGreaterThan(0);
    }
  });
});
