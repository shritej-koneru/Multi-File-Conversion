import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { ConvertedFileInfo, FileInfo } from "@shared/schema";
import { PDFDocument, rgb } from "pdf-lib";

export class FileConverter {
  async convertFiles(
    files: FileInfo[],
    targetFormat: string,
    sessionId: string,
    onProgress: (progress: number) => void
  ): Promise<ConvertedFileInfo[]> {
    const convertedFiles: ConvertedFileInfo[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.floor((i / total) * 100);
      onProgress(progress);

      try {
        const converted = await this.convertSingleFile(file, targetFormat, sessionId);
        if (converted) {
          convertedFiles.push(converted);
        }
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        // Continue with other files
      }
    }

    onProgress(100);
    return convertedFiles;
  }

  private async convertSingleFile(
    file: FileInfo,
    targetFormat: string,
    sessionId: string
  ): Promise<ConvertedFileInfo | null> {
    const inputPath = file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.parse(file.name).name;
    const outputName = `${baseName}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputName);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    switch (targetFormat.toLowerCase()) {
      case "jpg":
      case "jpeg":
        return await this.convertToJpeg(inputPath, outputPath, file);
      
      case "png":
        return await this.convertToPng(inputPath, outputPath, file);
      
      case "webp":
        return await this.convertToWebp(inputPath, outputPath, file);
      
      case "pdf":
        return await this.convertToPdf(inputPath, outputPath, file);
      
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  private async convertToJpeg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to JPEG`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToPng(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .png()
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to PNG`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToWebp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to WebP`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToPdf(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      // Convert image to PDF
      const imageBuffer = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.create();
      
      let image;
      if (file.extension === ".jpg" || file.extension === ".jpeg") {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else if (file.extension === ".png") {
        image = await pdfDoc.embedPng(imageBuffer);
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
    } else {
      throw new Error(`Cannot convert ${file.extension} to PDF`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private isImageFile(extension: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
    return imageExtensions.includes(extension.toLowerCase());
  }
}
