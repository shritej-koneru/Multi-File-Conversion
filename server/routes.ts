import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversionSchema, type FileInfo } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { FileConverter } from "./services/file-converter";
import { cleanupExpiredFiles, cleanupSession } from "./services/cleanup";
import archiver from "archiver";

// Extend Express Request to include sessionID
declare module 'express-serve-static-core' {
  interface Request {
    sessionID?: string;
  }
}

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
fs.ensureDirSync(uploadDir);

const storage_multer = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const sessionDir = path.join(uploadDir, req.sessionID || "default");
    fs.ensureDirSync(sessionDir);
    cb(null, sessionDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Sanitize filename to prevent path traversal
    const sanitizedOriginalName = path.basename(file.originalname);
    const uniqueName = `${randomUUID()}-${sanitizedOriginalName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Comprehensive file validation for all supported formats
    const allowedTypes = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|pdf|docx|doc|pptx|ppt|txt|md|html|csv|xlsx|xls|tsv|mp4|mp3|wav|ogg|m4a|aac|avi|mov|webm|mkv|zip|rar|tar|gz|7z)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${path.extname(file.originalname)}`));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const fileConverter = new FileConverter();

  // Setup session for tracking uploads
  app.use((req, res, next) => {
    if (!req.sessionID) {
      req.sessionID = randomUUID();
    }
    next();
  });

  // Upload files endpoint
  app.post("/api/upload", upload.array("files", 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const sessionId = req.sessionID || randomUUID();
      const fileInfos: FileInfo[] = req.files.map((file) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        path: file.path,
      }));

      res.json({
        sessionId,
        files: fileInfos.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          extension: f.extension,
          savedPath: f.path, // Include actual saved path for conversion
        })),
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get available conversion formats
  app.get("/api/formats/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get uploaded files for this session
      const sessionDir = path.join(uploadDir, sessionId);
      if (!fs.existsSync(sessionDir)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(sessionDir).filter(file => !file.startsWith('.'));
      const fileExtensions = files.map(file => path.extname(file).toLowerCase());
      const fileConverter = new FileConverter();
      
      // Get all possible conversion formats based on uploaded files
      const allFormats = new Set<string>();
      fileExtensions.forEach(ext => {
        const supportedFormats = fileConverter.getSupportedConversions(ext);
        supportedFormats.forEach(format => allFormats.add(format));
      });
      
      // Create format descriptions
      const availableFormats: Array<{id: string, name: string, description: string, icon: string}> = [];
      
      Array.from(allFormats).forEach(format => {
        const formatInfo = getFormatInfo(format);
        if (formatInfo) {
          availableFormats.push(formatInfo);
        }
      });
      
      // Sort formats by category and popularity
      availableFormats.sort((a, b) => {
        const order = ['pdf', 'jpg', 'png', 'webp', 'mp4', 'mp3', 'docx', 'xlsx', 'html', 'zip'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      });

      res.json(availableFormats);
    } catch (error) {
      console.error("Formats error:", error);
      res.status(500).json({ message: "Failed to get formats" });
    }
  });

  function getFormatInfo(format: string): {id: string, name: string, description: string, icon: string} | null {
    const formatMap: { [key: string]: {name: string, description: string, icon: string} } = {
      // Image formats
      "jpg": { name: "JPEG", description: "Best for photos, smaller file size", icon: "fas fa-file-image" },
      "png": { name: "PNG", description: "Lossless, supports transparency", icon: "fas fa-file-image" },
      "webp": { name: "WebP", description: "Modern format, 25-50% smaller", icon: "fas fa-file-image" },
      "gif": { name: "GIF", description: "Supports animation, limited colors", icon: "fas fa-file-image" },
      "tiff": { name: "TIFF", description: "High quality, professional printing", icon: "fas fa-file-image" },
      "bmp": { name: "BMP", description: "Uncompressed bitmap format", icon: "fas fa-file-image" },
      "pdf": { name: "PDF", description: "Universal document format", icon: "fas fa-file-pdf" },
      
      // Document formats
      "txt": { name: "Plain Text", description: "Universal text format", icon: "fas fa-file-alt" },
      "docx": { name: "Word Document", description: "Microsoft Word format", icon: "fas fa-file-word" },
      "html": { name: "HTML", description: "Web document format", icon: "fas fa-code" },
      
      // Spreadsheet formats
      "xlsx": { name: "Excel", description: "Microsoft Excel format", icon: "fas fa-file-excel" },
      "csv": { name: "CSV", description: "Comma-separated values", icon: "fas fa-table" },
      
      // Audio formats
      "mp3": { name: "MP3", description: "Compressed audio, widely supported", icon: "fas fa-file-audio" },
      "wav": { name: "WAV", description: "Uncompressed audio, high quality", icon: "fas fa-file-audio" },
      "ogg": { name: "OGG", description: "Open-source compressed audio", icon: "fas fa-file-audio" },
      "m4a": { name: "M4A", description: "Apple audio format", icon: "fas fa-file-audio" },
      
      // Video formats
      "mp4": { name: "MP4", description: "Universal video format", icon: "fas fa-file-video" },
      "avi": { name: "AVI", description: "Windows video format", icon: "fas fa-file-video" },
      "webm": { name: "WebM", description: "Web-optimized video", icon: "fas fa-file-video" },
      "mov": { name: "QuickTime", description: "Apple video format", icon: "fas fa-file-video" },
      
      // Archive formats
      "zip": { name: "ZIP Archive", description: "Compressed archive", icon: "fas fa-file-archive" },
      "tar": { name: "TAR Archive", description: "Unix archive format", icon: "fas fa-file-archive" }
    };
    
    const info = formatMap[format];
    return info ? { id: format, ...info } : null;
  }

  // Start conversion
  app.post("/api/convert", async (req, res) => {
    try {
      const { sessionId, targetFormat, targetFormats, files } = req.body;
      
      if (!sessionId || (!targetFormat && !targetFormats) || !files || !Array.isArray(files)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Handle both single format (targetFormat) and multiple formats (targetFormats)
      const formats = targetFormats && Array.isArray(targetFormats) && targetFormats.length > 0 
        ? targetFormats 
        : [targetFormat];

      const fileInfos: FileInfo[] = files.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        extension: file.extension,
        path: file.savedPath || path.join(uploadDir, sessionId, file.name),
      }));

      const conversion = await storage.createConversion({
        sessionId,
        originalFiles: fileInfos,
        targetFormat: formats.join(','), // Store multiple formats as comma-separated
      });

      // Start conversion in background
      setImmediate(async () => {
        try {
          await storage.updateConversionStatus(conversion.id, "processing", 0);
          
          let convertedFiles: any[];
          
          if (formats.length === 1) {
            // Single format conversion
            convertedFiles = await fileConverter.convertFiles(
              fileInfos,
              formats[0],
              sessionId,
              (progress) => {
                storage.updateConversionStatus(conversion.id, "processing", progress);
              }
            );
          } else {
            // Multiple format conversion
            convertedFiles = await fileConverter.convertFilesToMultipleFormats(
              fileInfos,
              formats,
              sessionId,
              (progress) => {
                storage.updateConversionStatus(conversion.id, "processing", progress);
              }
            );
          }

          // Verify all files were converted successfully
          if (convertedFiles.length === 0) {
            throw new Error("No files were successfully converted");
          }

          let downloadUrl = "";
          if (convertedFiles.length === 1) {
            downloadUrl = `/api/download/${conversion.id}/${convertedFiles[0].convertedName}`;
          } else {
            // Create ZIP file for multiple outputs
            const zipPath = path.join(uploadDir, sessionId, "converted_files.zip");
            await createZipFile(convertedFiles, zipPath);
            downloadUrl = `/api/download/${conversion.id}/converted_files.zip`;
          }

          await storage.updateConversionFiles(conversion.id, convertedFiles, downloadUrl);
          await storage.updateConversionStatus(conversion.id, "completed", 100);
        } catch (error) {
          console.error("Conversion error:", error);
          await storage.updateConversionStatus(conversion.id, "failed", 0);
        }
      });

      res.json({ conversionId: conversion.id });
    } catch (error) {
      console.error("Convert error:", error);
      res.status(500).json({ message: "Conversion failed" });
    }
  });

  // Get conversion status
  app.get("/api/conversion/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversion = await storage.getConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ message: "Conversion not found" });
      }

      res.json({
        id: conversion.id,
        status: conversion.status,
        progress: conversion.progress,
        downloadUrl: conversion.downloadUrl,
        convertedFiles: conversion.convertedFiles,
      });
    } catch (error) {
      console.error("Status error:", error);
      res.status(500).json({ message: "Failed to get status" });
    }
  });

  // Download converted files
  app.get("/api/download/:conversionId/:filename", async (req, res) => {
    try {
      const { conversionId, filename } = req.params;
      const conversion = await storage.getConversion(conversionId);
      
      if (!conversion || conversion.status !== "completed") {
        return res.status(404).json({ message: "File not found" });
      }

      const filePath = path.join(uploadDir, conversion.sessionId, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(filePath, filename);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  // Manual cleanup endpoint for session
  app.post("/api/cleanup/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await cleanupSession(sessionId, storage);
      res.json({ message: "Session cleaned up successfully" });
    } catch (error) {
      console.error("Manual cleanup error:", error);
      res.status(500).json({ message: "Cleanup failed" });
    }
  });

  // Manual cleanup endpoint for all expired files
  app.post("/api/cleanup", async (req, res) => {
    try {
      await cleanupExpiredFiles(storage);
      res.json({ message: "Cleanup completed successfully" });
    } catch (error) {
      console.error("Manual cleanup error:", error);
      res.status(500).json({ message: "Cleanup failed" });
    }
  });

  // Start cleanup job - run every 15 minutes
  setInterval(async () => {
    await cleanupExpiredFiles(storage);
  }, 15 * 60 * 1000); // Run every 15 minutes
  
  // Run initial cleanup on startup
  setTimeout(async () => {
    await cleanupExpiredFiles(storage);
  }, 5000); // Run after 5 seconds

  const httpServer = createServer(app);
  return httpServer;
}

async function createZipFile(files: any[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.convertedName });
      }
    });

    archive.finalize();
  });
}
