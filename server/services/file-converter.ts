import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { ConvertedFileInfo, FileInfo } from "@shared/schema";
import { PDFDocument, rgb } from "pdf-lib";
import ffmpeg from "fluent-ffmpeg";
import { execSync } from "child_process";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import archiver from "archiver";
import { createReadStream, createWriteStream } from "fs";
import { fromPath } from "pdf2pic";
import yaml from "js-yaml";
import toml from "@iarna/toml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { marked } from "marked"; // Required for Markdown support

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
      }
    }

    onProgress(100);
    return convertedFiles;
  }

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
      case "gif":
        return await this.convertToGif(inputPath, outputPath, file);
      case "bmp":
        return await this.convertToBmp(inputPath, outputPath, file);
      case "tiff":
      case "tif":
        return await this.convertToTiff(inputPath, outputPath, file);
      case "avif":
        return await this.convertToAvif(inputPath, outputPath, file);
      case "pdf":
        return await this.convertToPdf(inputPath, outputPath, file);
      case "txt":
        return await this.convertToTxt(inputPath, outputPath, file);
      case "docx":
        return await this.convertToDocx(inputPath, outputPath, file);
      case "html":
        return await this.convertToHtml(inputPath, outputPath, file);
      case "xlsx":
        return await this.convertToXlsx(inputPath, outputPath, file);
      case "csv":
        return await this.convertToCsv(inputPath, outputPath, file);
      case "json":
        return await this.convertToJson(inputPath, outputPath, file);
      case "yaml":
      case "yml":
        return await this.convertToYaml(inputPath, outputPath, file);
      case "toml":
        return await this.convertToToml(inputPath, outputPath, file);
      case "xml":
        return await this.convertToXml(inputPath, outputPath, file);
      case "mp3":
        return await this.convertToMp3(inputPath, outputPath, file);
      case "wav":
        return await this.convertToWav(inputPath, outputPath, file);
      case "ogg":
        return await this.convertToOgg(inputPath, outputPath, file);
      case "m4a":
        return await this.convertToM4a(inputPath, outputPath, file);
      case "mp4":
        return await this.convertToMp4(inputPath, outputPath, file);
      case "avi":
        return await this.convertToAvi(inputPath, outputPath, file);
      case "webm":
        return await this.convertToWebm(inputPath, outputPath, file);
      case "mov":
        return await this.convertToMov(inputPath, outputPath, file);
      case "zip":
        return await this.convertToZip(inputPath, outputPath, file);
      case "tar":
        return await this.convertToTar(inputPath, outputPath, file);
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  private async convertToJpeg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath).jpeg({ quality: 85 }).toFile(outputPath);
    } else if (file.extension.toLowerCase() === '.pdf') {
      try {
        const convert = fromPath(inputPath, {
          density: 150,
          saveFilename: path.parse(outputPath).name,
          savePath: path.dirname(outputPath),
          format: "jpg",
          width: 2000,
          height: 2000
        });
        const result = await convert(1);
        const actualOutputPath = result.path;
        if (actualOutputPath && await fs.pathExists(actualOutputPath)) {
          if (actualOutputPath !== outputPath) {
            await fs.move(actualOutputPath, outputPath, { overwrite: true });
          }
        } else {
          const escapedInput = inputPath.replace(/'/g, "'\"'\"'");
          const escapedOutput = outputPath.replace(/'/g, "'\"'\"'");
          execSync(`convert '${escapedInput}[0]' -density 150 -quality 85 '${escapedOutput}'`, { timeout: 30000 });
        }
      } catch (error) {
        throw new Error(`PDF to JPEG failed: ${(error as Error).message}`);
      }
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToPng(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath).png().toFile(outputPath);
    } else if (file.extension.toLowerCase() === '.pdf') {
      try {
        const convert = fromPath(inputPath, {
          density: 150,
          saveFilename: path.parse(outputPath).name,
          savePath: path.dirname(outputPath),
          format: "png",
          width: 2000,
          height: 2000
        });
        const result = await convert(1);
        if (result.path && await fs.pathExists(result.path)) {
          await fs.move(result.path, outputPath, { overwrite: true });
        } else {
          execSync(`convert '${inputPath}[0]' -density 150 '${outputPath}'`, { timeout: 30000 });
        }
      } catch (error) {
        throw new Error(`PDF to PNG failed: ${(error as Error).message}`);
      }
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToWebp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    await sharp(inputPath).webp({ quality: 85 }).toFile(outputPath);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToGif(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    await sharp(inputPath).gif().toFile(outputPath);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToBmp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    try {
      execSync(`convert '${inputPath}' '${outputPath}'`, { timeout: 20000 });
    } catch (e) {
      const tempPng = outputPath + '.png';
      await sharp(inputPath).png().toFile(tempPng);
      execSync(`convert '${tempPng}' '${outputPath}'`);
      await fs.remove(tempPng);
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToTiff(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    await sharp(inputPath).tiff({ quality: 85 }).toFile(outputPath);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToAvif(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    await sharp(inputPath).avif({ quality: 85, effort: 4 }).toFile(outputPath);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToTxt(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(await fs.readFile(inputPath));
      await fs.writeFile(outputPath, data.text || "No text extractable");
    } else if (['.docx', '.doc'].includes(file.extension.toLowerCase())) {
      const result = await mammoth.extractRawText({ path: inputPath });
      await fs.writeFile(outputPath, result.value);
    } else if (file.extension.toLowerCase() === '.html') {
      const html = await fs.readFile(inputPath, 'utf-8');
      await fs.writeFile(outputPath, html.replace(/<[^>]*>/g, ''));
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToDocx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    try {
      execSync(`pandoc '${inputPath}' -o '${outputPath}'`, { timeout: 30000 });
    } catch (e) {
      const textContent = (file.extension === '.pdf') ? 
        (await (await import('pdf-parse')).default(await fs.readFile(inputPath))).text : 
        await fs.readFile(inputPath, 'utf-8');
      await fs.writeFile(outputPath, textContent); 
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToHtml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.md') {
      const md = await fs.readFile(inputPath, 'utf-8');
      const html = `<!DOCTYPE html><html><body>${marked.parse(md)}</body></html>`;
      await fs.writeFile(outputPath, html);
    } else {
      const txt = await fs.readFile(inputPath, 'utf-8');
      await fs.writeFile(outputPath, `<html><body><pre>${txt}</pre></body></html>`);
    }
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToXlsx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const csvData = await fs.readFile(inputPath, 'utf-8');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(csvData.split('\n').map(row => row.split(',')));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, outputPath);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToCsv(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const workbook = XLSX.readFile(inputPath);
    const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    await fs.writeFile(outputPath, csvData);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToJson(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const content = await fs.readFile(inputPath, 'utf-8');
    let data;
    if (file.extension === '.yaml' || file.extension === '.yml') data = yaml.load(content);
    else if (file.extension === '.toml') data = toml.parse(content);
    else if (file.extension === '.xml') data = new XMLParser().parse(content);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToYaml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const json = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    await fs.writeFile(outputPath, yaml.dump(json));
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToToml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const json = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    await fs.writeFile(outputPath, toml.stringify(json));
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToXml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const json = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    await fs.writeFile(outputPath, new XMLBuilder().build(json));
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToMp3(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('mp3').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToWav(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('wav').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToOgg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('ogg').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToM4a(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('m4a').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToMp4(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('mp4').videoCodec('libx264').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToAvi(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('avi').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToWebm(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('webm').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToMov(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      ffmpeg(inputPath).toFormat('mov').on('end', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath })).on('error', rej).save(outputPath);
    });
  }

  private async convertToZip(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((res, rej) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip');
      output.on('close', async () => res({ originalName: file.name, convertedName: path.basename(outputPath), size: (await fs.stat(outputPath)).size, path: outputPath }));
      archive.on('error', rej);
      archive.pipe(output);
      archive.file(inputPath, { name: file.name });
      archive.finalize();
    });
  }

  private async convertToTar(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    execSync(`tar -czf "${outputPath}" -C "${path.dirname(inputPath)}" "${path.basename(inputPath)}"`);
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private async convertToPdf(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    const imageBuffer = await fs.readFile(inputPath);
    if (imageBuffer.length === 0) throw new Error("Empty image file");
    const pdfDoc = await PDFDocument.create();
    let image;
    if (file.extension.match(/\.jpe?g/i)) image = await pdfDoc.embedJpg(imageBuffer);
    else image = await pdfDoc.embedPng(await sharp(inputPath).png().toBuffer());
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    await fs.writeFile(outputPath, await pdfDoc.save());
    const stats = await fs.stat(outputPath);
    return { originalName: file.name, convertedName: path.basename(outputPath), size: stats.size, path: outputPath };
  }

  private isImageFile(ext: string) { return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".avif"].includes(ext.toLowerCase()); }
  private isAudioFile(ext: string) { return [".mp3", ".wav", ".ogg", ".m4a", ".aac"].includes(ext.toLowerCase()); }
  private isVideoFile(ext: string) { return [".mp4", ".avi", ".mov", ".webm", ".mkv"].includes(ext.toLowerCase()); }
  private isDocumentFile(ext: string) { return [".pdf", ".doc", ".docx", ".txt", ".md", ".html"].includes(ext.toLowerCase()); }
  private isSpreadsheetFile(ext: string) { return [".xlsx", ".xls", ".csv"].includes(ext.toLowerCase()); }
  private isDataFile(ext: string) { return [".json", ".yaml", ".yml", ".toml", ".xml"].includes(ext.toLowerCase()); }
  private isArchiveFile(ext: string) { return [".zip", ".tar", ".gz"].includes(ext.toLowerCase()); }

  getSupportedConversions(ext: string): string[] {
    const e = ext.toLowerCase();
    if (this.isImageFile(e)) return ["jpg", "png", "webp", "pdf", "gif", "bmp", "tiff", "avif"];
    if (e === ".pdf") return ["txt", "jpg", "png", "docx"];
    if (e === ".docx") return ["pdf", "txt", "html"];
    if (e === ".md") return ["html", "pdf"];
    if (e === ".csv") return ["xlsx", "json", "yaml", "xml"];
    if (this.isAudioFile(e)) return ["mp3", "wav", "ogg"];
    if (this.isVideoFile(e)) return ["mp4", "webm", "gif"];
    return ["zip"];
  }
}
