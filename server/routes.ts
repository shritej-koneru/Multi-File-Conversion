import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversionSchema, type FileInfo } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { randomUUID } from "crypto";
import { FileConverter } from "./services/file-converter";
import { cleanupExpiredFiles } from "./services/cleanup";
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
    // Basic file validation
    const allowedTypes = /\.(jpg|jpeg|png|gif|webp|pdf|docx|doc|pptx|ppt|txt|csv|xlsx|xls|mp4|mp3|wav|avi)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to delete uploaded files for a session (called when user leaves)
  app.post("/api/cleanup-session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "Missing sessionId" });
      }
      // Remove uploaded files directory for this session
      const sessionDir = path.join(uploadDir, sessionId);
      if (fs.existsSync(sessionDir)) {
        await fs.remove(sessionDir);
      }
      // Remove all conversions for this session
      const conversions = await storage.getConversionsBySession(sessionId);
      for (const conv of conversions) {
        await storage.deleteConversion(conv.id);
      }
      res.json({ message: "Session cleaned up" });
    } catch (error) {
      console.error("Cleanup session error:", error);
      res.status(500).json({ message: "Failed to cleanup session" });
    }
  });
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
      const conversions = await storage.getConversionsBySession(sessionId);
      
      // For now, return common formats based on file types
      // In a real implementation, this would analyze uploaded files
      const availableFormats = [
        { id: "pdf", name: "PDF", description: "Universal document format", icon: "fas fa-file-pdf" },
        { id: "jpg", name: "JPEG", description: "Compressed image format", icon: "fas fa-file-image" },
        { id: "png", name: "PNG", description: "Lossless image format", icon: "fas fa-file-image" },
        { id: "webp", name: "WebP", description: "Modern image format", icon: "fas fa-file-image" },
        { id: "zip", name: "ZIP Archive", description: "Compressed archive", icon: "fas fa-file-archive" },
      ];

      res.json(availableFormats);
    } catch (error) {
      console.error("Formats error:", error);
      res.status(500).json({ message: "Failed to get formats" });
    }
  });

  // Start conversion
  app.post("/api/convert", async (req, res) => {
    try {
      const { sessionId, targetFormat, files } = req.body;
      
      if (!sessionId || !targetFormat || !files || !Array.isArray(files)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const fileInfos: FileInfo[] = files.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        extension: file.extension,
        path: file.savedPath || path.join(uploadDir, sessionId, file.name), // Use actual saved path
      }));

      const conversion = await storage.createConversion({
        sessionId,
        originalFiles: fileInfos,
        targetFormat,
      });

      // Start conversion in background
      setImmediate(async () => {
        try {
          await storage.updateConversionStatus(conversion.id, "processing", 0);
          
          const convertedFiles = await fileConverter.convertFiles(
            fileInfos,
            targetFormat,
            sessionId,
            (progress) => {
              storage.updateConversionStatus(conversion.id, "processing", progress);
            }
          );

          // Verify all files were converted successfully
          if (convertedFiles.length === 0) {
            throw new Error("No files were successfully converted");
          }

          let downloadUrl = "";
          if (convertedFiles.length === 1) {
            downloadUrl = `/api/download/${conversion.id}/${convertedFiles[0].convertedName}`;
          } else {
            // Create ZIP file
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

  // Start cleanup job
  setInterval(async () => {
    await cleanupExpiredFiles(storage);
  }, 60 * 60 * 1000); // Run every hour

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
