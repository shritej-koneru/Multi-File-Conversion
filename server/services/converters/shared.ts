/**
 * Shared helpers used across conversion domain modules.
 */
import fs from "fs-extra";
import path from "path";
import { execSync, execFileSync } from "child_process";
import { PDFDocument, rgb } from "pdf-lib";
import type { ConvertedFileInfo, FileInfo } from "@shared/schema";

export type { ConvertedFileInfo, FileInfo };

/** Build the standard ConvertedFileInfo from an output written to outputPath. */
export async function makeResult(outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const stats = await fs.stat(outputPath);
  return {
    originalName: file.name,
    convertedName: path.basename(outputPath),
    size: stats.size,
    path: outputPath,
  };
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isImageFile(extension: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".avif"];
  return imageExtensions.includes(extension.toLowerCase());
}

export function isDocumentFile(extension: string): boolean {
  const docExtensions = [".pdf", ".doc", ".docx", ".txt", ".md", ".html", ".rtf"];
  return docExtensions.includes(extension.toLowerCase());
}

export function isSpreadsheetFile(extension: string): boolean {
  const spreadsheetExtensions = [".xlsx", ".xls", ".csv", ".tsv"];
  return spreadsheetExtensions.includes(extension.toLowerCase());
}

export function isAudioFile(extension: string): boolean {
  const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
  return audioExtensions.includes(extension.toLowerCase());
}

export function isVideoFile(extension: string): boolean {
  const videoExtensions = [".mp4", ".avi", ".mov", ".webm", ".mkv"];
  return videoExtensions.includes(extension.toLowerCase());
}

export function isArchiveFile(extension: string): boolean {
  const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz"];
  return archiveExtensions.includes(extension.toLowerCase());
}

export function isDataFile(extension: string): boolean {
  const dataExtensions = [".json", ".yaml", ".yml", ".toml", ".xml"];
  return dataExtensions.includes(extension.toLowerCase());
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

/**
 * Render the first page of a PDF to an image file.
 * Strategy: pdf-poppler (ships prebuilt binaries, no Ghostscript/ImageMagick
 * required — works out of the box on Windows) with pdf2pic (GraphicsMagick)
 * as fallback. Returns the path of the produced image, or null on failure.
 */
export async function rasterizePdfFirstPage(pdfPath: string, outDir: string, format: "png" | "jpeg"): Promise<string | null> {
  await fs.ensureDir(outDir);

  // 1) pdf-poppler
  try {
    const poppler = await import("pdf-poppler");
    const convert = (poppler as any).convert ?? (poppler as any).default?.convert;
    if (typeof convert === "function") {
      const prefix = `poppler-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const options = {
        format: format === "png" ? "png" : "jpeg",
        out_dir: outDir,
        out_prefix: prefix,
        page: 1,
        scale: 1600,
      };
      await convert(pdfPath, options);
      const produced = (await fs.readdir(outDir)).filter((f) => f.startsWith(prefix));
      if (produced.length > 0) {
        return path.join(outDir, produced[0]);
      }
    }
  } catch (error) {
    console.warn("pdf-poppler rendering failed:", (error as Error).message);
  }

  // 2) pdf2pic (requires GraphicsMagick + Ghostscript on PATH)
  try {
    const { fromPath } = await import("pdf2pic");
    const saveFilename = `pdf2pic-${Date.now()}`;
    const convert = fromPath(pdfPath, {
      density: 150,
      saveFilename,
      savePath: outDir,
      format: format === "png" ? "png" : "jpg",
      width: 2000,
      height: 2000,
    });
    const result = await convert(1);
    if (result?.path && (await fs.pathExists(result.path))) {
      return result.path;
    }
  } catch (error) {
    console.warn("pdf2pic rendering failed:", (error as Error).message);
  }

  return null;
}

/**
 * Extract text from a PDF with pdf-parse.
 * Two quirks handled:
 *  - The package entry point enables a debug mode when `module.parent` is
 *    unset (always true under ESM/tsx), which reads a nonexistent test file.
 *    Importing the library subpath avoids that code entirely.
 *  - The bundled pdf.js v1.10.100 rejects Node Buffers with "Invalid PDF
 *    structure"; it must receive a plain Uint8Array.
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<{ text: string; numpages: number }> {
  let pdfParse: (buf: Uint8Array, opts?: any) => any;
  try {
    const mod: any = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = mod.default ?? mod;
  } catch {
    const mod: any = await import("pdf-parse");
    pdfParse = mod.default ?? mod;
  }
  const data = await pdfParse(new Uint8Array(pdfBuffer));
  return { text: data.text || "", numpages: data.numpages || 0 };
}

/**
 * Lay plain text out on pdf-lib pages and return the PDF bytes.
 * Shared by TXT->PDF, MD->PDF and the DOCX->PDF text fallback.
 */
export async function createTextPdf(text: string): Promise<Buffer> {
  // Filter out characters that pdf-lib cannot render (WinAnsi)
  const safe = text.replace(/[^\x00-\xFF]/g, "?");

  const pdfDoc = await PDFDocument.create();

  // Set up page dimensions and margins
  const pageWidth = 612; // 8.5 inches at 72 DPI
  const pageHeight = 792; // 11 inches at 72 DPI
  const margin = 50;
  const maxWidth = pageWidth - 2 * margin;
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;

  // Split text into lines that fit the page width
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Rough estimate: average character width is fontSize * 0.5
    const estimatedWidth = testLine.length * (fontSize * 0.5);

    if (estimatedWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Create pages and draw text
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  for (const line of lines) {
    if (yPosition < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    try {
      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    } catch (drawError) {
      console.error(`Error drawing line:`, (drawError as Error).message);
      continue;
    }

    yPosition -= lineHeight;
  }

  return Buffer.from(await pdfDoc.save());
}

/** Write text as a PDF file and verify it is non-empty. */
export async function writeTextPdf(outputPath: string, text: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const pdfBytes = await createTextPdf(text);
  await fs.writeFile(outputPath, pdfBytes);

  const stats = await fs.stat(outputPath);
  if (stats.size === 0) {
    throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
  }
  return makeResult(outputPath, file);
}

// ---------------------------------------------------------------------------
// External tool detection + runners (pandoc / LibreOffice)
// ---------------------------------------------------------------------------

export function checkPandocAvailable(): boolean {
  try {
    execSync("pandoc --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function checkLibreOfficeAvailable(): boolean {
  try {
    if (process.platform === "win32") {
      // Check common Windows installation paths
      const commonPaths = [
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      ];

      for (const sofficePath of commonPaths) {
        if (fs.existsSync(sofficePath)) {
          return true;
        }
      }

      // Try PATH
      try {
        execSync("where soffice", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    } else {
      // Linux/Mac
      execSync("which soffice", { stdio: "ignore" });
      return true;
    }
  } catch {
    return false;
  }
}

/** Pandoc conversion helper */
export async function convertWithPandoc(inputPath: string, outputPath: string, outputFormat: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Build pandoc command
      const outputExt = path.extname(outputPath).toLowerCase();
      const pdfEngineFlag = outputExt === ".pdf" ? " --pdf-engine=xelatex" : "";
      const command = `pandoc "${inputPath}" -o "${outputPath}"${pdfEngineFlag}`;

      console.log(`Executing Pandoc: ${command}`);
      execSync(command, { timeout: 30000 }); // 30 second timeout

      // Verify output file was created
      if (!fs.existsSync(outputPath)) {
        reject(new Error("Pandoc conversion completed but output file not found"));
        return;
      }

      resolve();
    } catch (error) {
      reject(new Error(`Pandoc conversion failed: ${(error as Error).message}`));
    }
  });
}

/** LibreOffice conversion helper */
export async function convertWithLibreOffice(inputPath: string, outputPath: string, outputFormat: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.dirname(outputPath);
      let soffice = "soffice";

      if (process.platform === "win32") {
        // Check common Windows installation paths
        const commonPaths = [
          "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
          "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        ];

        for (const sofficePath of commonPaths) {
          if (fs.existsSync(sofficePath)) {
            soffice = `"${sofficePath}"`;
            break;
          }
        }
      }

      // LibreOffice command: --headless --convert-to pdf --outdir <dir> <file>
      const command = `${soffice} --headless --convert-to ${outputFormat} --outdir "${outputDir}" "${inputPath}"`;

      console.log(`Executing LibreOffice: ${command}`);
      execSync(command, { timeout: 60000 }); // 60 second timeout for large files

      // LibreOffice creates the file with the original name but new extension
      // We may need to rename it to match outputPath
      const expectedOutputName = path.parse(inputPath).name + "." + outputFormat;
      const expectedOutputPath = path.join(outputDir, expectedOutputName);

      if (expectedOutputPath !== outputPath && fs.existsSync(expectedOutputPath)) {
        fs.renameSync(expectedOutputPath, outputPath);
      }

      // Verify output file was created
      if (!fs.existsSync(outputPath)) {
        reject(new Error("LibreOffice conversion completed but output file not found"));
        return;
      }

      resolve();
    } catch (error) {
      reject(new Error(`LibreOffice conversion failed: ${(error as Error).message}`));
    }
  });
}

export { execFileSync };
