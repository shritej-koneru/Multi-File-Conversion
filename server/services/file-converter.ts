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
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg"];
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

  getSupportedConversions(fileExtension: string): string[] {
    const ext = fileExtension.toLowerCase();
    
    // Image conversions
    if (this.isImageFile(ext)) {
      return ["jpg", "png", "webp", "pdf", "gif", "tiff"];
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
        return ["xlsx", "pdf", "html"];
      }
      if (['.xlsx', '.xls'].includes(ext)) {
        return ["csv", "pdf", "html"];
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
