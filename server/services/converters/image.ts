/**
 * Image conversions: sharp-based raster formats, the manual BMP encoder,
 * PDF rasterization (PDF -> JPG/PNG) and image -> PDF.
 */
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { makeResult, rasterizePdfFirstPage, type ConvertedFileInfo, type FileInfo } from "./shared";

/** Generic sharp-based image transcode. */
async function convertImageWithSharp(
  inputPath: string,
  outputPath: string,
  file: FileInfo,
  transform: (pipeline: sharp.Sharp) => sharp.Sharp
): Promise<ConvertedFileInfo> {
  if (![".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".avif"].includes(file.extension.toLowerCase())) {
    throw new Error(`Cannot convert ${file.extension} to ${path.extname(outputPath).toUpperCase()}`);
  }
  await transform(sharp(inputPath)).toFile(outputPath);
  return makeResult(outputPath, file);
}

async function convertToJpeg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg", "avif"].includes(file.extension.toLowerCase().replace(".", ""))) {
    await sharp(inputPath).jpeg({ quality: 85 }).toFile(outputPath);
  } else if (file.extension.toLowerCase() === ".pdf") {
    // Convert PDF to JPEG. pdf2pic needs GraphicsMagick (often absent); use
    // pdf-poppler, which ships prebuilt binaries, with pdf2pic as a fallback.
    try {
      console.log(`Starting PDF to JPEG conversion: ${inputPath} -> ${outputPath}`);

      if (!(await fs.pathExists(inputPath))) {
        throw new Error(`Input PDF file does not exist: ${inputPath}`);
      }

      if (await fs.pathExists(outputPath)) {
        await fs.remove(outputPath);
      }

      const rendered = await rasterizePdfFirstPage(inputPath, path.dirname(outputPath), "jpeg");

      if (rendered && rendered !== outputPath) {
        await fs.move(rendered, outputPath, { overwrite: true });
      }

      if (!(await fs.pathExists(outputPath))) {
        throw new Error("PDF rendering produced no output file");
      }
      console.log("PDF to JPEG conversion successful");
    } catch (error) {
      console.error("PDF to JPEG conversion failed:", error);
      throw new Error(`Failed to convert PDF to JPEG: ${(error as Error).message}`);
    }
  } else {
    throw new Error(`Cannot convert ${file.extension} to JPEG`);
  }

  return makeResult(outputPath, file);
}

async function convertToPng(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg", "avif"].includes(file.extension.toLowerCase().replace(".", ""))) {
    await sharp(inputPath).png().toFile(outputPath);
  } else if (file.extension.toLowerCase() === ".pdf") {
    // Convert PDF to PNG. Same strategy as JPEG: pdf-poppler first (no
    // GraphicsMagick needed), pdf2pic as fallback.
    try {
      console.log(`Starting PDF to PNG conversion: ${inputPath} -> ${outputPath}`);

      if (!(await fs.pathExists(inputPath))) {
        throw new Error(`Input PDF file does not exist: ${inputPath}`);
      }

      if (await fs.pathExists(outputPath)) {
        await fs.remove(outputPath);
      }

      const rendered = await rasterizePdfFirstPage(inputPath, path.dirname(outputPath), "png");

      if (rendered && rendered !== outputPath) {
        await fs.move(rendered, outputPath, { overwrite: true });
      }

      if (!(await fs.pathExists(outputPath))) {
        throw new Error("PDF rendering produced no output file");
      }
      console.log("PDF to PNG conversion successful");
    } catch (error) {
      console.error("PDF to PNG conversion failed:", error);
      throw new Error(`Failed to convert PDF to PNG: ${(error as Error).message}`);
    }
  } else {
    throw new Error(`Cannot convert ${file.extension} to PNG`);
  }

  return makeResult(outputPath, file);
}

async function convertToWebp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  return convertImageWithSharp(inputPath, outputPath, file, (p) => p.webp({ quality: 85 }));
}

async function convertToTiff(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  return convertImageWithSharp(inputPath, outputPath, file, (p) => p.tiff({ quality: 85 }));
}

async function convertToAvif(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  return convertImageWithSharp(inputPath, outputPath, file, (p) => p.avif({ quality: 85, effort: 4 }));
}

async function convertToGifFromImage(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  return convertImageWithSharp(inputPath, outputPath, file, (p) => p.gif());
}

async function convertToBmp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (!["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg", "avif"].includes(file.extension.toLowerCase().replace(".", ""))) {
    throw new Error(`Cannot convert ${file.extension} to BMP`);
  }

  // Sharp doesn't support BMP output directly, so convert to raw and write BMP manually.
  // flatten() removes alpha by compositing on white (the standard convention for BMP, which
  // has no alpha channel) and normalizes grayscale/palette input, guaranteeing exactly 3
  // interleaved RGB channels in the raw buffer regardless of source.
  const { data: raw, info } = await sharp(inputPath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  if (!width || !height) {
    throw new Error("Could not read image dimensions for BMP conversion");
  }
  if (info.channels < 3 || raw.length < width * height * 3) {
    throw new Error(`Unexpected raw pixel data for BMP conversion (${info.channels} channels, ${raw.length} bytes)`);
  }

  // Write BMP file manually: 14-byte file header + 40-byte DIB header + pixel data
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const bmpBuffer = Buffer.alloc(fileSize);

  // File header (14 bytes)
  bmpBuffer.write("BM", 0);
  bmpBuffer.writeUInt32LE(fileSize, 2);
  bmpBuffer.writeUInt32LE(54, 10); // offset to pixel data

  // DIB header (BITMAPINFOHEADER, 40 bytes)
  bmpBuffer.writeUInt32LE(40, 14);
  bmpBuffer.writeInt32LE(width, 18);
  bmpBuffer.writeInt32LE(-height, 22); // negative = top-down
  bmpBuffer.writeUInt16LE(1, 26); // planes
  bmpBuffer.writeUInt16LE(24, 28); // bits per pixel
  bmpBuffer.writeUInt32LE(0, 30); // compression: BI_RGB
  bmpBuffer.writeUInt32LE(pixelDataSize, 34);

  // Write pixel data (RGB -> BGR order), row by row
  for (let y = 0; y < height; y++) {
    const dstRowStart = 54 + y * rowSize;
    const srcRowStart = y * width * 3;
    for (let x = 0; x < width; x++) {
      const srcIdx = srcRowStart + x * 3;
      const dstIdx = dstRowStart + x * 3;
      bmpBuffer[dstIdx] = raw[srcIdx + 2]; // B
      bmpBuffer[dstIdx + 1] = raw[srcIdx + 1]; // G
      bmpBuffer[dstIdx + 2] = raw[srcIdx]; // R
    }
  }

  await fs.writeFile(outputPath, bmpBuffer);
  return makeResult(outputPath, file);
}

/** Image -> PDF (pdf-lib embedding with sharp re-processing fallbacks). */
async function convertImageToPdf(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  try {
    const imageBuffer = await fs.readFile(inputPath);

    // Validate image file before attempting conversion
    if (imageBuffer.length === 0) {
      throw new Error(`Empty or invalid image file: ${file.name}`);
    }

    const pdfDoc = await PDFDocument.create();

    let image;
    if (file.extension === ".jpg" || file.extension === ".jpeg") {
      try {
        image = await pdfDoc.embedJpg(imageBuffer);
      } catch (jpgError) {
        // Try converting to PNG first if JPG embedding fails
        console.warn(`Direct JPEG embedding failed for ${file.name}, trying conversion to PNG:`, jpgError);
        const pngBuffer = await sharp(inputPath).png().toBuffer();
        image = await pdfDoc.embedPng(pngBuffer);
      }
    } else if (file.extension === ".png") {
      try {
        image = await pdfDoc.embedPng(imageBuffer);
      } catch (pngError) {
        // Re-process with Sharp if PNG embedding fails
        console.warn(`Direct PNG embedding failed for ${file.name}, trying re-processing:`, pngError);
        const pngBuffer = await sharp(inputPath).png().toBuffer();
        image = await pdfDoc.embedPng(pngBuffer);
      }
    } else {
      // Convert other formats to PNG first, then embed
      const pngBuffer = await sharp(inputPath).png().toBuffer();
      image = await pdfDoc.embedPng(pngBuffer);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    // Verify the output file was created successfully
    const stats = await fs.stat(outputPath);
    if (stats.size === 0) {
      throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
    }

    return makeResult(outputPath, file);
  } catch (error) {
    // Clean up any partial files
    if (fs.existsSync(outputPath)) {
      await fs.remove(outputPath);
    }
    throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
  }
}

export const imageConversions = {
  jpg: convertToJpeg,
  jpeg: convertToJpeg,
  png: convertToPng,
  webp: convertToWebp,
  bmp: convertToBmp,
  tiff: convertToTiff,
  tif: convertToTiff,
  avif: convertToAvif,
  /** Internal: image -> GIF (the video->GIF path lives in media.ts). */
  gifFromImage: convertToGifFromImage,
  /** PDF -> JPG / PDF -> PNG handled inside convertToJpeg / convertToPng. */
  convertImageToPdf,
};
