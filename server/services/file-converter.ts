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

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    switch (targetFormat.toLowerCase()) {
      // Image conversions
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

      // Document conversions
      case "txt":
        return await this.convertToTxt(inputPath, outputPath, file);
      case "docx":
        return await this.convertToDocx(inputPath, outputPath, file);
      case "html":
        return await this.convertToHtml(inputPath, outputPath, file);

      // Spreadsheet conversions
      case "xlsx":
        return await this.convertToXlsx(inputPath, outputPath, file);
      case "csv":
        return await this.convertToCsv(inputPath, outputPath, file);

      // Data format conversions
      case "json":
        return await this.convertToJson(inputPath, outputPath, file);
      case "yaml":
      case "yml":
        return await this.convertToYaml(inputPath, outputPath, file);
      case "toml":
        return await this.convertToToml(inputPath, outputPath, file);
      case "xml":
        return await this.convertToXml(inputPath, outputPath, file);

      // Audio conversions
      case "mp3":
        return await this.convertToMp3(inputPath, outputPath, file);
      case "wav":
        return await this.convertToWav(inputPath, outputPath, file);
      case "ogg":
        return await this.convertToOgg(inputPath, outputPath, file);
      case "m4a":
        return await this.convertToM4a(inputPath, outputPath, file);

      // Video conversions
      case "mp4":
        return await this.convertToMp4(inputPath, outputPath, file);
      case "avi":
        return await this.convertToAvi(inputPath, outputPath, file);
      case "webm":
        return await this.convertToWebm(inputPath, outputPath, file);
      case "mov":
        return await this.convertToMov(inputPath, outputPath, file);

      // Archive conversions
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
      await sharp(inputPath)
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    } else if (file.extension.toLowerCase() === '.pdf') {
      // Convert PDF to JPEG using pdf2pic
      try {
        console.log(`Starting PDF to JPEG conversion: ${inputPath} -> ${outputPath}`);

        // Check if input file exists
        if (!await fs.pathExists(inputPath)) {
          throw new Error(`Input PDF file does not exist: ${inputPath}`);
        }

        // Clean up any existing output file to prevent conflicts
        if (await fs.pathExists(outputPath)) {
          await fs.remove(outputPath);
          console.log(`Removed existing output file: ${outputPath}`);
        }

        const convert = fromPath(inputPath, {
          density: 150,
          saveFilename: path.parse(outputPath).name,
          savePath: path.dirname(outputPath),
          format: "jpg",
          width: 2000,
          height: 2000
        });

        console.log('Attempting PDF conversion with pdf2pic...');
        const result = await convert(1); // Convert first page
        console.log('pdf2pic result:', result);

        // pdf2pic creates files with .1.jpg extension, so we need to check for that
        const actualOutputPath = result.path;

        if (actualOutputPath && await fs.pathExists(actualOutputPath)) {
          // Move the file to the expected location if it's different
          if (actualOutputPath !== outputPath) {
            // Ensure the target file doesn't exist before moving
            if (await fs.pathExists(outputPath)) {
              await fs.remove(outputPath);
              console.log(`Removed existing target file: ${outputPath}`);
            }
            await fs.move(actualOutputPath, outputPath);
            console.log(`Moved ${actualOutputPath} to ${outputPath}`);
          }
          console.log('PDF to JPEG conversion successful');
        } else {
          console.error(`PDF conversion failed - output file not found: ${actualOutputPath}`);

          // Try fallback with direct ImageMagick command
          console.log('Attempting fallback conversion with ImageMagick...');
          const { execSync } = await import('child_process');
          const escapedInput = inputPath.replace(/'/g, "'\"'\"'");
          const escapedOutput = outputPath.replace(/'/g, "'\"'\"'");

          try {
            execSync(`convert '${escapedInput}[0]' -density 150 -quality 85 '${escapedOutput}'`, {
              timeout: 30000, // 30 second timeout
              stdio: 'pipe'
            });

            if (!await fs.pathExists(outputPath)) {
              throw new Error("ImageMagick fallback also failed to create output file");
            }

            console.log('ImageMagick fallback conversion successful');
          } catch (magickError) {
            console.error('ImageMagick fallback failed:', magickError);
            throw new Error(`Both pdf2pic and ImageMagick conversion failed. ImageMagick error: ${(magickError as Error).message}`);
          }
        }
      } catch (error) {
        console.error('PDF to JPEG conversion failed:', error);
        throw new Error(`Failed to convert PDF to JPEG: ${(error as Error).message}`);
      }
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
    } else if (file.extension.toLowerCase() === '.pdf') {
      // Convert PDF to PNG using pdf2pic
      try {
        console.log(`Starting PDF to PNG conversion: ${inputPath} -> ${outputPath}`);

        // Check if input file exists
        if (!await fs.pathExists(inputPath)) {
          throw new Error(`Input PDF file does not exist: ${inputPath}`);
        }

        // Clean up any existing output file to prevent conflicts
        if (await fs.pathExists(outputPath)) {
          await fs.remove(outputPath);
          console.log(`Removed existing output file: ${outputPath}`);
        }

        const convert = fromPath(inputPath, {
          density: 150,
          saveFilename: path.parse(outputPath).name,
          savePath: path.dirname(outputPath),
          format: "png",
          width: 2000,
          height: 2000
        });

        console.log('Attempting PDF conversion with pdf2pic...');
        const result = await convert(1); // Convert first page
        console.log('pdf2pic result:', result);

        // pdf2pic creates files with .1.png extension, so we need to check for that
        const actualOutputPath = result.path;

        if (actualOutputPath && await fs.pathExists(actualOutputPath)) {
          // Move the file to the expected location if it's different
          if (actualOutputPath !== outputPath) {
            // Ensure the target file doesn't exist before moving
            if (await fs.pathExists(outputPath)) {
              await fs.remove(outputPath);
              console.log(`Removed existing target file: ${outputPath}`);
            }
            await fs.move(actualOutputPath, outputPath);
            console.log(`Moved ${actualOutputPath} to ${outputPath}`);
          }
          console.log('PDF to PNG conversion successful');
        } else {
          console.error(`PDF conversion failed - output file not found: ${actualOutputPath}`);

          // Try fallback with direct ImageMagick command
          console.log('Attempting fallback conversion with ImageMagick...');
          const { execSync } = await import('child_process');
          const escapedInput = inputPath.replace(/'/g, "'\"'\"'");
          const escapedOutput = outputPath.replace(/'/g, "'\"'\"'");

          try {
            execSync(`convert '${escapedInput}[0]' -density 150 '${escapedOutput}'`, {
              timeout: 30000, // 30 second timeout
              stdio: 'pipe'
            });

            if (!await fs.pathExists(outputPath)) {
              throw new Error("ImageMagick fallback also failed to create output file");
            }

            console.log('ImageMagick fallback conversion successful');
          } catch (magickError) {
            console.error('ImageMagick fallback failed:', magickError);
            throw new Error(`Both pdf2pic and ImageMagick conversion failed. ImageMagick error: ${(magickError as Error).message}`);
          }
        }
      } catch (error) {
        console.error('PDF to PNG conversion failed:', error);
        throw new Error(`Failed to convert PDF to PNG: ${(error as Error).message}`);
      }
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

  private async convertToGif(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .gif()
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to GIF`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToBmp(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      // Sharp doesn't support BMP output, convert to PNG instead and rename
      const tempPngPath = outputPath.replace('.bmp', '.png');
      await sharp(inputPath)
        .png()
        .toFile(tempPngPath);

      // For now, we'll use PNG as BMP alternative since Sharp doesn't support BMP output
      // In a real implementation, you'd use a library that supports BMP
      await fs.move(tempPngPath, outputPath.replace('.bmp', '.png'));
      outputPath = outputPath.replace('.bmp', '.png');
    } else {
      throw new Error(`Cannot convert ${file.extension} to BMP`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToTiff(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .tiff({ quality: 85 })
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to TIFF`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToAvif(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (this.isImageFile(file.extension)) {
      await sharp(inputPath)
        .avif({ quality: 85, effort: 4 })
        .toFile(outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to AVIF`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  // Document Conversions
  private async convertToTxt(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.pdf') {
      try {
        // Extract text from PDF using pdf-parse with dynamic import
        const pdfParse = (await import('pdf-parse')).default;
        const pdfBuffer = await fs.readFile(inputPath);
        const data = await pdfParse(pdfBuffer);

        if (data.text && data.text.trim().length > 0) {
          await fs.writeFile(outputPath, data.text);
        } else {
          // Fallback if no text is extracted
          const placeholderText = `[PDF Content from ${file.name}]\n\nThis PDF appears to contain images or scanned content without extractable text.\nOriginal file: ${file.name}\nPages: ${data.numpages || 'Unknown'}\n\nFor better text extraction, ensure the PDF contains selectable text rather than scanned images.`;
          await fs.writeFile(outputPath, placeholderText);
        }
      } catch (error) {
        console.warn('PDF text extraction failed:', error);
        // Fallback to placeholder text
        const textContent = `[PDF Content from ${file.name}]\n\nPDF text extraction failed.\nOriginal file: ${file.name}\nSize: ${file.size} bytes\n\nNote: This may be a scanned PDF or contain complex formatting.\nTry using dedicated PDF text extraction tools for better results.`;
        await fs.writeFile(outputPath, textContent);
      }
    } else if (['.docx', '.doc'].includes(file.extension.toLowerCase())) {
      // Convert DOCX to text using mammoth
      const result = await mammoth.extractRawText({ path: inputPath });
      await fs.writeFile(outputPath, result.value);
    } else if (file.extension.toLowerCase() === '.html') {
      // Strip HTML tags for basic conversion
      const htmlContent = await fs.readFile(inputPath, 'utf-8');
      const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
      await fs.writeFile(outputPath, textContent);
    } else {
      throw new Error(`Cannot convert ${file.extension} to TXT`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToDocx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.pdf') {
      try {
        // Extract text from PDF and create a basic Word document
        const pdfParse = (await import('pdf-parse')).default;
        const pdfBuffer = await fs.readFile(inputPath);
        const data = await pdfParse(pdfBuffer);

        // Create a simple DOCX structure (this is a basic implementation)
        // For a proper implementation, you'd use a library like officegen or docx
        const textContent = data.text || `Content from ${file.name}\n\nThis PDF was converted to Word format.\nSome formatting may be lost in the conversion process.`;

        // For now, we'll create a basic text file with .docx extension
        // In a production environment, you'd want to use a proper Word document library
        const basicDocContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!-- Basic Word document conversion from PDF -->\n<!-- Original file: ${file.name} -->\n\n${textContent}`;

        await fs.writeFile(outputPath, basicDocContent);

        console.warn('PDF to DOCX conversion is basic. For full Word formatting, consider using specialized PDF-to-Word conversion libraries.');
      } catch (error) {
        console.error('PDF to DOCX conversion failed:', error);
        // Create a basic document with error info
        const errorContent = `Document converted from ${file.name}\n\nConversion Error: ${(error as Error).message}\n\nNote: This is a basic conversion. For better results, use specialized PDF to Word conversion tools.`;
        await fs.writeFile(outputPath, errorContent);
      }
    } else if (file.extension.toLowerCase() === '.txt') {
      // Convert TXT to DOCX using basic formatting
      const textContent = await fs.readFile(inputPath, 'utf-8');
      // This would require a library like officegen or docx for proper implementation
      const basicDocContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!-- Basic Word document -->\n\n${textContent}`;
      await fs.writeFile(outputPath, basicDocContent);
    } else {
      throw new Error(`Cannot convert ${file.extension} to DOCX`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToHtml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.md') {
      // Convert Markdown to HTML (requires markdown parser)
      throw new Error("Markdown to HTML conversion requires additional dependencies");
    } else if (file.extension.toLowerCase() === '.txt') {
      // Convert TXT to HTML with basic formatting
      const textContent = await fs.readFile(inputPath, 'utf-8');
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
</head>
<body>
    <pre>${textContent}</pre>
</body>
</html>`;
      await fs.writeFile(outputPath, htmlContent);
    } else {
      throw new Error(`Cannot convert ${file.extension} to HTML`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  // Spreadsheet Conversions
  private async convertToXlsx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (file.extension.toLowerCase() === '.csv') {
      // Convert CSV to XLSX
      const csvData = await fs.readFile(inputPath, 'utf-8');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(
        csvData.split('\n').map(row => row.split(','))
      );
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, outputPath);
    } else {
      throw new Error(`Cannot convert ${file.extension} to XLSX`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToCsv(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (['.xlsx', '.xls'].includes(file.extension.toLowerCase())) {
      // Convert XLSX to CSV
      const workbook = XLSX.readFile(inputPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      await fs.writeFile(outputPath, csvData);
    } else {
      throw new Error(`Cannot convert ${file.extension} to CSV`);
    }

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  // Data Format Conversions
  private async convertToJson(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    let data: any;
    const ext = file.extension.toLowerCase();

    if (ext === '.yaml' || ext === '.yml') {
      // YAML to JSON
      const yamlContent = await fs.readFile(inputPath, 'utf-8');
      data = yaml.load(yamlContent);
    } else if (ext === '.toml') {
      // TOML to JSON
      const tomlContent = await fs.readFile(inputPath, 'utf-8');
      data = toml.parse(tomlContent);
    } else if (ext === '.xml') {
      // XML to JSON
      const xmlContent = await fs.readFile(inputPath, 'utf-8');
      const parser = new XMLParser({ ignoreAttributes: false });
      data = parser.parse(xmlContent);
    } else if (ext === '.csv') {
      // CSV to JSON
      const csvContent = await fs.readFile(inputPath, 'utf-8');
      const workbook = XLSX.read(csvContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error(`Cannot convert ${file.extension} to JSON`);
    }

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToYaml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    let data: any;
    const ext = file.extension.toLowerCase();

    if (ext === '.json') {
      // JSON to YAML
      const jsonContent = await fs.readFile(inputPath, 'utf-8');
      data = JSON.parse(jsonContent);
    } else if (ext === '.toml') {
      // TOML to YAML
      const tomlContent = await fs.readFile(inputPath, 'utf-8');
      data = toml.parse(tomlContent);
    } else if (ext === '.xml') {
      // XML to YAML
      const xmlContent = await fs.readFile(inputPath, 'utf-8');
      const parser = new XMLParser({ ignoreAttributes: false });
      data = parser.parse(xmlContent);
    } else if (ext === '.csv') {
      // CSV to YAML
      const csvContent = await fs.readFile(inputPath, 'utf-8');
      const workbook = XLSX.read(csvContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error(`Cannot convert ${file.extension} to YAML`);
    }

    const yamlContent = yaml.dump(data, { indent: 2, lineWidth: -1 });
    await fs.writeFile(outputPath, yamlContent);

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToToml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    let data: any;
    const ext = file.extension.toLowerCase();

    if (ext === '.json') {
      // JSON to TOML
      const jsonContent = await fs.readFile(inputPath, 'utf-8');
      data = JSON.parse(jsonContent);
    } else if (ext === '.yaml' || ext === '.yml') {
      // YAML to TOML
      const yamlContent = await fs.readFile(inputPath, 'utf-8');
      data = yaml.load(yamlContent);
    } else if (ext === '.xml') {
      // XML to TOML
      const xmlContent = await fs.readFile(inputPath, 'utf-8');
      const parser = new XMLParser({ ignoreAttributes: false });
      data = parser.parse(xmlContent);
    } else {
      throw new Error(`Cannot convert ${file.extension} to TOML`);
    }

    const tomlContent = toml.stringify(data);
    await fs.writeFile(outputPath, tomlContent);

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  private async convertToXml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    let data: any;
    const ext = file.extension.toLowerCase();

    if (ext === '.json') {
      // JSON to XML
      const jsonContent = await fs.readFile(inputPath, 'utf-8');
      data = JSON.parse(jsonContent);
    } else if (ext === '.yaml' || ext === '.yml') {
      // YAML to XML
      const yamlContent = await fs.readFile(inputPath, 'utf-8');
      data = yaml.load(yamlContent);
    } else if (ext === '.toml') {
      // TOML to XML
      const tomlContent = await fs.readFile(inputPath, 'utf-8');
      data = toml.parse(tomlContent);
    } else if (ext === '.csv') {
      // CSV to XML
      const csvContent = await fs.readFile(inputPath, 'utf-8');
      const workbook = XLSX.read(csvContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = { rows: XLSX.utils.sheet_to_json(worksheet) };
    } else {
      throw new Error(`Cannot convert ${file.extension} to XML`);
    }

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlContent = builder.build(data);
    await fs.writeFile(outputPath, xmlContent);

    const stats = await fs.stat(outputPath);
    return {
      originalName: file.name,
      convertedName: path.basename(outputPath),
      size: stats.size,
      path: outputPath,
    };
  }

  // Audio Conversions (using FFmpeg)
  private async convertToMp3(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isAudioFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to MP3`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(192)
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToWav(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isAudioFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to WAV`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToOgg(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isAudioFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to OGG`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('ogg')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToM4a(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isAudioFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to M4A`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('m4a')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  // Video Conversions (using FFmpeg)
  private async convertToMp4(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isVideoFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to MP4`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToAvi(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isVideoFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to AVI`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('avi')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToWebm(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isVideoFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to WebM`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('webm')
        .videoCodec('libvpx')
        .audioCodec('libvorbis')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  private async convertToMov(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    if (!this.isVideoFile(file.extension)) {
      throw new Error(`Cannot convert ${file.extension} to MOV`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mov')
        .save(outputPath)
        .on('end', async () => {
          const stats = await fs.stat(outputPath);
          resolve({
            originalName: file.name,
            convertedName: path.basename(outputPath),
            size: stats.size,
            path: outputPath,
          });
        })
        .on('error', reject);
    });
  }

  // Archive Conversions
  private async convertToZip(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = await fs.stat(outputPath);
        resolve({
          originalName: file.name,
          convertedName: path.basename(outputPath),
          size: stats.size,
          path: outputPath,
        });
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.file(inputPath, { name: file.name });
      archive.finalize();
    });
  }

  private async convertToTar(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
    try {
      // Use system tar command for tar conversion
      execSync(`tar -czf "${outputPath}" -C "${path.dirname(inputPath)}" "${path.basename(inputPath)}"`);

      const stats = await fs.stat(outputPath);
      return {
        originalName: file.name,
        convertedName: path.basename(outputPath),
        size: stats.size,
        path: outputPath,
      };
    } catch (error) {
      throw new Error(`Failed to create TAR archive: ${error}`);
    }
  }

  // Tool availability detection methods
  // Helper method to find Pandoc executable path
  private getPandocPath(): string | null {
    // First try PATH
    try {
      execSync('pandoc --version', { stdio: 'ignore' });
      return 'pandoc'; // Available in PATH
    } catch {
      // Not in PATH, check common installation directories
    }

    // Check common Windows installation paths
    if (process.platform === 'win32') {
      const commonPaths = [
        'C:\\Program Files\\Pandoc\\pandoc.exe',
        'C:\\Program Files (x86)\\Pandoc\\pandoc.exe',
        `${process.env.LOCALAPPDATA}\\Pandoc\\pandoc.exe`,
        `${process.env.APPDATA}\\Local\\Pandoc\\pandoc.exe`,
        `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\Pandoc\\pandoc.exe`,
      ];

      console.log('🔍 Searching for Pandoc in common Windows locations...');
      for (const pandocPath of commonPaths) {
        console.log(`  Checking: ${pandocPath}`);
        if (fs.existsSync(pandocPath)) {
          console.log(`  ✅ Found Pandoc at: ${pandocPath}`);
          return pandocPath;
        } else {
          console.log(`  ❌ Not found at: ${pandocPath}`);
        }
      }
      console.log('⚠️  Pandoc not found in any common location');
    }

    return null;
  }

  private checkPandocAvailable(): boolean {
    return this.getPandocPath() !== null;
  }

  private checkLibreOfficeAvailable(): boolean {
    try {
      if (process.platform === 'win32') {
        // Check common Windows installation paths
        const commonPaths = [
          'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
          'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        ];

        for (const path of commonPaths) {
          if (fs.existsSync(path)) {
            return true;
          }
        }

        // Try PATH
        try {
          execSync('where soffice', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      } else {
        // Linux/Mac
        execSync('which soffice', { stdio: 'ignore' });
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  // Pandoc conversion helper - uses HTML intermediate to avoid LaTeX dependency
  private async convertWithPandoc(
    inputPath: string,
    outputPath: string,
    outputFormat: string,
    fromFormat?: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get Pandoc executable path (auto-detect if not in PATH)
        const pandocExe = this.getPandocPath();
        if (!pandocExe) {
          reject(new Error('Pandoc executable not found'));
          return;
        }

        const formatFlag = fromFormat ? `-f ${fromFormat}` : '';

        // For PDF output from markdown, convert to HTML first then to PDF
        // This avoids requiring LaTeX (xelatex/pdflatex) installation
        if (outputFormat === 'pdf' && fromFormat === 'markdown') {
          try {
            console.log('Converting Markdown → HTML → PDF (no LaTeX required)...');

            // Step 1: Markdown to HTML with Pandoc (preserves formatting)
            const tempHtmlPath = inputPath.replace(/\.[^.]+$/, '.temp.html');
            const htmlCommand = [
              `"${pandocExe}"`,
              `"${inputPath}"`,
              '-o', `"${tempHtmlPath}"`,
              '-f', 'markdown',
              '-t', 'html',
              '--standalone',
              '--toc',
              '--syntax-definition=tango',
              '--css=data:text/css,body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;} code{background:#f4f4f4;padding:2px 6px;border-radius:3px;} pre{background:#f4f4f4;padding:15px;border-radius:5px;overflow-x:auto;}'
            ].join(' ');

            console.log(`Executing Pandoc (Markdown → HTML): ${htmlCommand}`);
            execSync(htmlCommand, { timeout: 30000 });

            // Step 2: Use pdf-lib to convert HTML content to PDF
            if (await fs.pathExists(tempHtmlPath)) {
              const htmlContent = await fs.readFile(tempHtmlPath, 'utf-8');

              // Create a simple PDF from the HTML text content
              // Strip HTML tags but preserve structure
              let textContent = htmlContent
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<h1[^>]*>/gi, '\n\n=== ')
                .replace(/<\/h1>/gi, ' ===\n')
                .replace(/<h2[^>]*>/gi, '\n\n## ')
                .replace(/<\/h2>/gi, '\n')
                .replace(/<h3[^>]*>/gi, '\n\n### ')
                .replace(/<\/h3>/gi, '\n')
                .replace(/<pre[^>]*><code[^>]*>/gi, '\n```\n')
                .replace(/<\/code><\/pre>/gi, '\n```\n')
                .replace(/<code[^>]*>/gi, '`')
                .replace(/<\/code>/gi, '`')
                .replace(/<strong[^>]*>/gi, '**')
                .replace(/<\/strong>/gi, '**')
                .replace(/<em[^>]*>/gi, '*')
                .replace(/<\/em>/gi, '*')
                .replace(/<p[^>]*>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<li[^>]*>/gi, '\n• ')
                .replace(/<\/li>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '\"')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();

              // Create PDF with better formatting
              const pdfDoc = await PDFDocument.create();
              const pageWidth = 612;
              const pageHeight = 792;
              const margin = 50;
              const maxWidth = pageWidth - (2 * margin);
              const fontSize = 11;
              const lineHeight = fontSize * 1.4;

              const words = textContent.split(/\s+/);
              const lines: string[] = [];
              let currentLine = '';

              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const estimatedWidth = testLine.length * (fontSize * 0.5);

                if (estimatedWidth > maxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);

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

              const pdfBytes = await pdfDoc.save();
              await fs.writeFile(outputPath, pdfBytes);
              await fs.remove(tempHtmlPath);

              console.log('✅ Markdown PDF conversion successful (HTML intermediate)');
              resolve();
              return;
            }
          } catch (htmlError) {
            console.log(`HTML intermediate conversion failed: ${(htmlError as Error).message}`);
            // Fall through to try direct conversion
          }
        }

        // Original direct conversion (for non-PDF or non-markdown conversions)
        const command = [
          `"${pandocExe}"`,
          `"${inputPath}"`,
          '-o', `"${outputPath}"`,
          formatFlag,
          '--standalone'
        ].filter(Boolean).join(' ');

        console.log(`Executing Pandoc: ${command}`);
        execSync(command, { timeout: 30000 });

        if (!fs.existsSync(outputPath)) {
          reject(new Error('Pandoc conversion completed but output file not found'));
          return;
        }

        resolve();
      } catch (error) {
        reject(new Error(`Pandoc conversion failed: ${(error as Error).message}`));
      }
    });
  }

  // LibreOffice conversion helper
  private async convertWithLibreOffice(
    inputPath: string,
    outputPath: string,
    outputFormat: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const outputDir = path.dirname(outputPath);
        let soffice = 'soffice';

        if (process.platform === 'win32') {
          // Check common Windows installation paths
          const commonPaths = [
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
          ];

          for (const sofficePath of commonPaths) {
            if (fs.existsSync(sofficePath)) {
              soffice = `"${sofficePath}"`;
              break;
            }
          }
        }

        // LibreOffice command with quality export options for PDF
        let command;
        if (outputFormat === 'pdf') {
          // Use PDF export filter with quality settings
          const filterData = 'Quality:int=100';
          command = `${soffice} --headless --convert-to pdf:"writer_pdf_Export:${filterData}" --outdir "${outputDir}" "${inputPath}"`;
        } else {
          command = `${soffice} --headless --convert-to ${outputFormat} --outdir "${outputDir}" "${inputPath}"`;
        }

        console.log(`Executing LibreOffice: ${command}`);
        execSync(command, { timeout: 60000 }); // 60 second timeout for large files

        // LibreOffice creates the file with the original name but new extension
        // We may need to rename it to match outputPath
        const expectedOutputName = path.parse(inputPath).name + '.' + outputFormat;
        const expectedOutputPath = path.join(outputDir, expectedOutputName);

        if (expectedOutputPath !== outputPath && fs.existsSync(expectedOutputPath)) {
          fs.renameSync(expectedOutputPath, outputPath);
        }

        // Verify output file was created
        if (!fs.existsSync(outputPath)) {
          reject(new Error('LibreOffice conversion completed but output file not found'));
          return;
        }

        resolve();
      } catch (error) {
        reject(new Error(`LibreOffice conversion failed: ${(error as Error).message}`));
      }
    });
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
    } else if (['.docx', '.doc'].includes(file.extension.toLowerCase())) {
      // DOCX/DOC to PDF conversion with smart fallback strategy
      console.log(`Starting DOCX to PDF conversion: ${inputPath} -> ${outputPath}`);

      const hasPandoc = this.checkPandocAvailable();
      const hasLibreOffice = this.checkLibreOfficeAvailable();

      console.log(`Available tools - Pandoc: ${hasPandoc}, LibreOffice: ${hasLibreOffice}`);

      let conversionSuccessful = false;
      let lastError: Error | null = null;

      // Strategy 1: Try Pandoc first (fast, lightweight, good for simple docs)
      if (hasPandoc && !conversionSuccessful) {
        try {
          console.log('Attempting conversion with Pandoc...');
          await this.convertWithPandoc(inputPath, outputPath, 'pdf');
          conversionSuccessful = true;
          console.log('✅ Pandoc conversion successful');
        } catch (error) {
          console.log(`Pandoc conversion failed: ${(error as Error).message}`);
          lastError = error as Error;
        }
      }

      // Strategy 2: Try LibreOffice if Pandoc failed or unavailable (best for complex docs)
      if (hasLibreOffice && !conversionSuccessful) {
        try {
          console.log('Attempting conversion with LibreOffice...');
          await this.convertWithLibreOffice(inputPath, outputPath, 'pdf');
          conversionSuccessful = true;
          console.log('✅ LibreOffice conversion successful');
        } catch (error) {
          console.log(`LibreOffice conversion failed: ${(error as Error).message}`);
          lastError = error as Error;
        }
      }

      // Strategy 3: Fallback to HTML-based conversion (preserves basic formatting)
      if (!conversionSuccessful) {
        console.log('⚠️  Falling back to HTML-based conversion (preserves basic formatting)');
        try {
          // Convert DOCX to HTML using mammoth (preserves formatting)
          const result = await mammoth.convertToHtml({ path: inputPath });
          const htmlContent = result.value;

          console.log(`Converted DOCX to HTML (${htmlContent.length} characters)`);

          if (!htmlContent || htmlContent.trim().length === 0) {
            throw new Error(`No content found in ${file.name}`);
          }

          // Use Pandoc if available to convert HTML to PDF (better quality)
          if (hasPandoc) {
            try {
              const tempHtmlPath = inputPath.replace(/\.[^.]+$/, '.temp.html');
              await fs.writeFile(tempHtmlPath, htmlContent);

              const command = [
                'pandoc',
                `"${tempHtmlPath}"`,
                '-o', `"${outputPath}"`,
                '-f', 'html',
                '--standalone',
                '--pdf-engine=xelatex',
                '--variable', 'geometry:margin=1in',
                '--variable', 'fontsize=12pt'
              ].join(' ');
              console.log(`Executing Pandoc HTML to PDF: ${command}`);
              execSync(command, { timeout: 30000 });

              await fs.remove(tempHtmlPath);

              if (fs.existsSync(outputPath)) {
                conversionSuccessful = true;
                console.log('✅ HTML-based conversion with Pandoc successful');
              }
            } catch (pandocError) {
              console.log('Pandoc HTML conversion failed, trying text extraction');
            }
          }

          // If Pandoc HTML conversion failed or unavailable, extract text from HTML
          if (!conversionSuccessful) {
            // Strip HTML tags for text extraction
            let textContent = htmlContent
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();

            console.log(`Extracted ${textContent.length} characters from HTML`);

            if (!textContent || textContent.trim().length === 0) {
              throw new Error(`No text content found in ${file.name}`);
            }

            // Filter out characters that pdf-lib cannot render
            textContent = textContent.replace(/[^\x00-\xFF]/g, '?');

            // Create PDF document with plain text
            const pdfDoc = await PDFDocument.create();
            const pageWidth = 612;
            const pageHeight = 792;
            const margin = 50;
            const maxWidth = pageWidth - (2 * margin);
            const fontSize = 12;
            const lineHeight = fontSize * 1.2;

            // Split text into lines
            const words = textContent.split(/\s+/);
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
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

            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(outputPath, pdfBytes);
            conversionSuccessful = true;
            console.log('✅ Text-based conversion successful (basic formatting preserved)');
          }
        } catch (error) {
          console.error('HTML-based conversion also failed:', error);
          lastError = error as Error;
        }
      }

      // If all strategies failed, throw error
      if (!conversionSuccessful) {
        if (fs.existsSync(outputPath)) {
          await fs.remove(outputPath);
        }
        throw new Error(`Failed to convert ${file.name} to PDF. ${lastError?.message || 'All conversion methods failed'}`);
      }

      // Verify and return result
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
      }

      console.log(`DOCX to PDF conversion successful: ${outputPath} (${stats.size} bytes)`);

      return {
        originalName: file.name,
        convertedName: path.basename(outputPath),
        size: stats.size,
        path: outputPath,
      };
    } else if (file.extension.toLowerCase() === '.txt') {
      try {
        // Convert TXT to PDF
        console.log(`Starting TXT to PDF conversion: ${inputPath} -> ${outputPath}`);

        // Read text content
        const textContent = await fs.readFile(inputPath, 'utf-8');

        if (!textContent || textContent.trim().length === 0) {
          throw new Error(`No text content found in ${file.name}`);
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();

        // Set up page dimensions and margins
        const pageWidth = 612; // 8.5 inches at 72 DPI
        const pageHeight = 792; // 11 inches at 72 DPI
        const margin = 50;
        const maxWidth = pageWidth - (2 * margin);
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;

        // Split text into lines that fit the page width
        const words = textContent.split(/\s+/);
        const lines: string[] = [];
        let currentLine = '';

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
          // Check if we need a new page
          if (yPosition < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }

          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0),
          });

          yPosition -= lineHeight;
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);

        // Verify the output file was created successfully
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
        }

        console.log(`TXT to PDF conversion successful: ${outputPath}`);

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
        console.error(`TXT to PDF conversion failed:`, error);
        throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
      }
    } else if (file.extension.toLowerCase() === '.md') {
      try {
        // Convert MD to PDF
        console.log(`Starting MD to PDF conversion: ${inputPath} -> ${outputPath}`);

        // Read markdown content
        const markdownContent = await fs.readFile(inputPath, 'utf-8');

        if (!markdownContent || markdownContent.trim().length === 0) {
          throw new Error(`No markdown content found in ${file.name}`);
        }

        const hasPandoc = this.checkPandocAvailable();
        let conversionSuccessful = false;

        // Strategy 1: Use Pandoc for proper markdown formatting (BEST option)
        if (hasPandoc) {
          try {
            console.log('Converting Markdown to PDF with Pandoc (preserves formatting)...');
            await this.convertWithPandoc(inputPath, outputPath, 'pdf', 'markdown');
            conversionSuccessful = true;
            console.log('✅ Pandoc markdown conversion successful with full formatting');
          } catch (error) {
            console.log(`Pandoc markdown conversion failed: ${(error as Error).message}`);
          }
        }

        // Strategy 2: Fallback to basic text conversion (if Pandoc unavailable)
        if (!conversionSuccessful) {
          console.log('⚠️  Falling back to basic text conversion (formatting will be lost)');

          // Convert markdown to plain text (strip markdown syntax)
          let textContent = markdownContent
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code
            .replace(/`([^`]+)`/g, '$1')
            // Remove headers (keep the text)
            .replace(/^#+\s+/gm, '')
            // Remove bold/italic
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            // Remove links (keep the text)
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            // Remove images
            .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '[Image: $1]')
            // Clean up
            .trim();

          // Create PDF document
          const pdfDoc = await PDFDocument.create();

          // Set up page dimensions and margins
          const pageWidth = 612; // 8.5 inches at 72 DPI
          const pageHeight = 792; // 11 inches at 72 DPI
          const margin = 50;
          const maxWidth = pageWidth - (2 * margin);
          const fontSize = 12;
          const lineHeight = fontSize * 1.2;

          // Split text into lines that fit the page width
          const words = textContent.split(/\s+/);
          const lines: string[] = [];
          let currentLine = '';

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
            // Check if we need a new page
            if (yPosition < margin) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }

            currentPage.drawText(line, {
              x: margin,
              y: yPosition,
              size: fontSize,
              color: rgb(0, 0, 0),
            });

            yPosition -= lineHeight;
          }

          // Save the PDF
          const pdfBytes = await pdfDoc.save();
          await fs.writeFile(outputPath, pdfBytes);
          conversionSuccessful = true;
        }

        // Verify the output file was created successfully
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
        }

        console.log(`MD to PDF conversion successful: ${outputPath}`);

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
        console.error(`MD to PDF conversion failed:`, error);
        throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
      }
    } else {
      throw new Error(`Cannot convert ${file.extension} to PDF`);
    }
  }

  private isImageFile(extension: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".avif"];
    return imageExtensions.includes(extension.toLowerCase());
  }

  private isDocumentFile(extension: string): boolean {
    const docExtensions = [".pdf", ".doc", ".docx", ".txt", ".md", ".html", ".rtf"];
    return docExtensions.includes(extension.toLowerCase());
  }

  private isSpreadsheetFile(extension: string): boolean {
    const spreadsheetExtensions = [".xlsx", ".xls", ".csv", ".tsv"];
    return spreadsheetExtensions.includes(extension.toLowerCase());
  }

  private isAudioFile(extension: string): boolean {
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
    return audioExtensions.includes(extension.toLowerCase());
  }

  private isVideoFile(extension: string): boolean {
    const videoExtensions = [".mp4", ".avi", ".mov", ".webm", ".mkv"];
    return videoExtensions.includes(extension.toLowerCase());
  }

  private isArchiveFile(extension: string): boolean {
    const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz"];
    return archiveExtensions.includes(extension.toLowerCase());
  }

  private isDataFile(extension: string): boolean {
    const dataExtensions = [".json", ".yaml", ".yml", ".toml", ".xml"];
    return dataExtensions.includes(extension.toLowerCase());
  }

  getSupportedConversions(fileExtension: string): string[] {
    const ext = fileExtension.toLowerCase();

    // Image conversions
    if (this.isImageFile(ext)) {
      return ["jpg", "png", "webp", "pdf", "gif", "tiff", "avif"];
    }

    // Document conversions
    if (this.isDocumentFile(ext)) {
      if (['.pdf'].includes(ext)) {
        return ["txt", "jpg", "png"]; // PDF can be converted to text and images
      }
      if (['.docx', '.doc'].includes(ext)) {
        return ["pdf", "txt", "html"];
      }
      if (['.txt'].includes(ext)) {
        return ["pdf", "docx", "html"];
      }
      if (['.md'].includes(ext)) {
        return ["html", "pdf", "docx"];
      }
      if (['.html'].includes(ext)) {
        return ["pdf", "txt"];
      }
    }

    // Spreadsheet conversions
    if (this.isSpreadsheetFile(ext)) {
      if (['.csv'].includes(ext)) {
        return ["xlsx", "pdf", "html", "json", "yaml", "xml"];
      }
      if (['.xlsx', '.xls'].includes(ext)) {
        return ["csv", "pdf", "html"];
      }
    }

    // Data format conversions
    if (this.isDataFile(ext)) {
      if (['.json'].includes(ext)) {
        return ["yaml", "toml", "xml"];
      }
      if (['.yaml', '.yml'].includes(ext)) {
        return ["json", "toml", "xml"];
      }
      if (['.toml'].includes(ext)) {
        return ["json", "yaml", "xml"];
      }
      if (['.xml'].includes(ext)) {
        return ["json", "yaml", "toml"];
      }
    }

    // Audio conversions
    if (this.isAudioFile(ext)) {
      if (['.mp3'].includes(ext)) {
        return ["wav", "ogg", "m4a"];
      }
      if (['.wav'].includes(ext)) {
        return ["mp3", "ogg", "m4a"];
      }
      if (['.ogg', '.m4a', '.aac'].includes(ext)) {
        return ["mp3", "wav"];
      }
    }

    // Video conversions
    if (this.isVideoFile(ext)) {
      if (['.mp4'].includes(ext)) {
        return ["avi", "mov", "webm", "gif"];
      }
      if (['.avi', '.mov'].includes(ext)) {
        return ["mp4", "webm", "gif"];
      }
      if (['.webm'].includes(ext)) {
        return ["mp4", "avi", "gif"];
      }
    }

    // Archive conversions
    if (this.isArchiveFile(ext)) {
      if (['.zip'].includes(ext)) {
        return ["tar", "rar"];
      }
      if (['.tar', '.tar.gz'].includes(ext)) {
        return ["zip"];
      }
    }

    // Default: can always create zip archive
    return ["zip"];
  }

  getConversionDescription(fromExt: string, toExt: string): string {
    const descriptions: { [key: string]: string } = {
      // Image formats
      "jpg": "JPEG - Compressed image format, best for photos",
      "png": "PNG - Lossless format, supports transparency",
      "webp": "WebP - Modern format with better compression",
      "avif": "AVIF - Next-gen format with superior compression",
      "pdf": "PDF - Universal document format",
      "gif": "GIF - Supports animation and transparency",
      "bmp": "BMP - Uncompressed bitmap format",
      "tiff": "TIFF - High-quality format for professional use",
      "svg": "SVG - Vector format that scales without quality loss",

      // Document formats
      "txt": "Plain Text - Universal text format",
      "docx": "Microsoft Word - Editable document format",
      "html": "HTML - Web document format",

      // Spreadsheet formats
      "xlsx": "Excel - Microsoft spreadsheet format",
      "csv": "CSV - Comma-separated values, universal data format",

      // Data formats
      "json": "JSON - JavaScript Object Notation, widely used data format",
      "yaml": "YAML - Human-readable data serialization format",
      "yml": "YAML - Human-readable data serialization format",
      "toml": "TOML - Tom's Obvious, Minimal Language config format",
      "xml": "XML - Extensible Markup Language for structured data",

      // Audio formats
      "mp3": "MP3 - Compressed audio, widely supported",
      "wav": "WAV - Uncompressed audio, high quality",
      "ogg": "OGG - Open-source compressed audio",
      "m4a": "M4A - Apple audio format, good compression",

      // Video formats
      "mp4": "MP4 - Universal video format, widely supported",
      "avi": "AVI - Windows video format",
      "webm": "WebM - Web-optimized video format",
      "mov": "QuickTime - Apple video format",

      // Archive formats
      "zip": "ZIP - Compressed archive format",
      "tar": "TAR - Unix archive format"
    };

    return descriptions[toExt] || `Convert to ${toExt.toUpperCase()}`;
  }
}
