/**
 * FileConverter facade.
 *
 * The conversion logic lives in small per-domain modules under
 * server/services/converters/: shared, image, document, spreadsheet, data,
 * media and archive. This file keeps the public API stable:
 *
 *  - convertFiles(files, targetFormat, sessionId, onProgress)
 *  - convertFilesToMultipleFormats(files, targetFormats, sessionId, onProgress)
 *  - getSupportedConversions(fileExtension)
 *  - getConversionDescription(fromExt, toExt)
 */
import fs from "fs-extra";
import path from "path";
import { imageConversions } from "./converters/image";
import { documentConversions } from "./converters/document";
import { spreadsheetConversions } from "./converters/spreadsheet";
import { dataConversions } from "./converters/data";
import { mediaConversions } from "./converters/media";
import { archiveConversions } from "./converters/archive";
import {
  isImageFile,
  isDocumentFile,
  isSpreadsheetFile,
  isAudioFile,
  isVideoFile,
  isArchiveFile,
  isDataFile,
  type ConvertedFileInfo,
  type FileInfo,
} from "./converters/shared";

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

  // New method to handle multiple target formats
  async convertFilesToMultipleFormats(
    files: FileInfo[],
    targetFormats: string[],
    sessionId: string,
    onProgress: (progress: number) => void
  ): Promise<ConvertedFileInfo[]> {
    const convertedFiles: ConvertedFileInfo[] = [];
    const totalOperations = files.length * targetFormats.length;
    let completedOperations = 0;

    for (const file of files) {
      for (const format of targetFormats) {
        try {
          // Check if this file can be converted to this format
          const supportedFormats = this.getSupportedConversions(file.extension);
          if (supportedFormats.includes(format)) {
            const converted = await this.convertSingleFile(file, format, sessionId);
            if (converted) {
              convertedFiles.push(converted);
            }
          }
        } catch (error) {
          console.error(`Failed to convert ${file.name} to ${format}:`, error);
        }

        completedOperations++;
        const progress = Math.floor((completedOperations / totalOperations) * 100);
        onProgress(progress);
      }
    }

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
    void sessionId;

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    switch (targetFormat.toLowerCase()) {
      // Image conversions
      case "jpg":
      case "jpeg":
        return await imageConversions.jpeg(inputPath, outputPath, file);
      case "png":
        return await imageConversions.png(inputPath, outputPath, file);
      case "webp":
        return await imageConversions.webp(inputPath, outputPath, file);
      case "gif":
        if (isVideoFile(file.extension)) {
          return await mediaConversions.gif(inputPath, outputPath, file, imageConversions.gifFromImage);
        }
        return await imageConversions.gifFromImage(inputPath, outputPath, file);
      case "bmp":
        return await imageConversions.bmp(inputPath, outputPath, file);
      case "tiff":
      case "tif":
        return await imageConversions.tiff(inputPath, outputPath, file);
      case "avif":
        return await imageConversions.avif(inputPath, outputPath, file);
      case "pdf":
        return await documentConversions.pdf(inputPath, outputPath, file, imageConversions.convertImageToPdf);

      // Document conversions
      case "txt":
        return await documentConversions.txt(inputPath, outputPath, file);
      case "docx":
        return await documentConversions.docx(inputPath, outputPath, file);
      case "html":
        return await documentConversions.html(inputPath, outputPath, file);

      // Spreadsheet conversions
      case "xlsx":
        return await spreadsheetConversions.xlsx(inputPath, outputPath, file);
      case "csv":
        return await spreadsheetConversions.csv(inputPath, outputPath, file);

      // Data format conversions
      case "json":
        return await dataConversions.json(inputPath, outputPath, file);
      case "yaml":
      case "yml":
        return await dataConversions.yaml(inputPath, outputPath, file);
      case "toml":
        return await dataConversions.toml(inputPath, outputPath, file);
      case "xml":
        return await dataConversions.xml(inputPath, outputPath, file);

      // Audio conversions
      case "mp3":
        return await mediaConversions.mp3(inputPath, outputPath, file);
      case "wav":
        return await mediaConversions.wav(inputPath, outputPath, file);
      case "ogg":
        return await mediaConversions.ogg(inputPath, outputPath, file);
      case "m4a":
        return await mediaConversions.m4a(inputPath, outputPath, file);

      // Video conversions
      case "mp4":
        return await mediaConversions.mp4(inputPath, outputPath, file);
      case "avi":
        return await mediaConversions.avi(inputPath, outputPath, file);
      case "webm":
        return await mediaConversions.webm(inputPath, outputPath, file);
      case "mov":
        return await mediaConversions.mov(inputPath, outputPath, file);

      // Archive conversions
      case "zip":
        return await archiveConversions.zip(inputPath, outputPath, file);
      case "tar":
        return await archiveConversions.tar(inputPath, outputPath, file);

      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  getSupportedConversions(fileExtension: string): string[] {
    const ext = fileExtension.toLowerCase();

    // Image conversions
    if (isImageFile(ext)) {
      return ["jpg", "png", "webp", "pdf", "gif", "tiff", "avif", "bmp"];
    }

    // Document conversions
    if (isDocumentFile(ext)) {
      if ([".pdf"].includes(ext)) {
        return ["txt", "jpg", "png"]; // PDF can be converted to text and images
      }
      if ([".docx", ".doc"].includes(ext)) {
        return ["pdf", "txt", "html"];
      }
      if ([".txt"].includes(ext)) {
        return ["pdf", "docx", "html"];
      }
      if ([".md"].includes(ext)) {
        return ["html", "pdf", "docx"];
      }
      if ([".html"].includes(ext)) {
        return ["pdf", "txt"];
      }
    }

    // Spreadsheet conversions
    if (isSpreadsheetFile(ext)) {
      if ([".csv"].includes(ext)) {
        return ["xlsx", "pdf", "html", "json", "yaml", "xml"];
      }
      if ([".xlsx", ".xls"].includes(ext)) {
        return ["csv", "pdf", "html"];
      }
    }

    // Data format conversions
    if (isDataFile(ext)) {
      if ([".json"].includes(ext)) {
        return ["yaml", "toml", "xml"];
      }
      if ([".yaml", ".yml"].includes(ext)) {
        return ["json", "toml", "xml"];
      }
      if ([".toml"].includes(ext)) {
        return ["json", "yaml", "xml"];
      }
      if ([".xml"].includes(ext)) {
        return ["json", "yaml", "toml"];
      }
    }

    // Audio conversions
    if (isAudioFile(ext)) {
      if ([".mp3"].includes(ext)) {
        return ["wav", "ogg", "m4a"];
      }
      if ([".wav"].includes(ext)) {
        return ["mp3", "ogg", "m4a"];
      }
      if ([".ogg", ".m4a", ".aac"].includes(ext)) {
        return ["mp3", "wav"];
      }
    }

    // Video conversions
    if (isVideoFile(ext)) {
      if ([".mp4"].includes(ext)) {
        return ["avi", "mov", "webm", "gif"];
      }
      if ([".avi", ".mov"].includes(ext)) {
        return ["mp4", "webm", "gif"];
      }
      if ([".webm"].includes(ext)) {
        return ["mp4", "avi", "gif"];
      }
    }

    // Archive conversions
    if (isArchiveFile(ext)) {
      if ([".zip"].includes(ext)) {
        return ["tar"];
      }
      if ([".tar", ".tar.gz"].includes(ext)) {
        return ["zip"];
      }
    }

    // Default: can always create zip archive
    return ["zip"];
  }

  getConversionDescription(fromExt: string, toExt: string): string {
    const descriptions: { [key: string]: string } = {
      // Image formats
      jpg: "JPEG - Compressed image format, best for photos",
      png: "PNG - Lossless format, supports transparency",
      webp: "WebP - Modern format with better compression",
      avif: "AVIF - Next-gen format with superior compression",
      pdf: "PDF - Universal document format",
      gif: "GIF - Supports animation and transparency",
      bmp: "BMP - Uncompressed bitmap format",
      tiff: "TIFF - High-quality format for professional use",
      svg: "SVG - Vector format that scales without quality loss",

      // Document formats
      txt: "Plain Text - Universal text format",
      docx: "Microsoft Word - Editable document format",
      html: "HTML - Web document format",

      // Spreadsheet formats
      xlsx: "Excel - Microsoft spreadsheet format",
      csv: "CSV - Comma-separated values, universal data format",

      // Data formats
      json: "JSON - JavaScript Object Notation, widely used data format",
      yaml: "YAML - Human-readable data serialization format",
      yml: "YAML - Human-readable data serialization format",
      toml: "TOML - Tom's Obvious, Minimal Language config format",
      xml: "XML - Extensible Markup Language for structured data",

      // Audio formats
      mp3: "MP3 - Compressed audio, widely supported",
      wav: "WAV - Uncompressed audio, high quality",
      ogg: "OGG - Open-source compressed audio",
      m4a: "M4A - Apple audio format, good compression",

      // Video formats
      mp4: "MP4 - Universal video format, widely supported",
      avi: "AVI - Windows video format",
      webm: "WebM - Web-optimized video format",
      mov: "QuickTime - Apple video format",

      // Archive formats
      zip: "ZIP - Compressed archive format",
      tar: "TAR - Unix archive format",
    };
    void fromExt;

    return descriptions[toExt] || `Convert to ${toExt.toUpperCase()}`;
  }
}
