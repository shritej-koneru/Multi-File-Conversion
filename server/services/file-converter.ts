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
      try {
        // Convert image to PDF
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
        
        return {
          originalName: file.name,
          convertedName: path.basename(outputPath),
          size: stats.size,
          path: outputPath,
        };
      } catch (error) {
        // Clean up any partial files
        if (fs.existsSync(outputPath)) {
          await fs.remove(outputPath);
        }
        throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
      }
    } else {
      throw new Error(`Cannot convert ${file.extension} to PDF`);
    }
  }

  private isImageFile(extension: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
    return imageExtensions.includes(extension.toLowerCase());
  }
}
