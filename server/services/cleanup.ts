import fs from "fs-extra";
import path from "path";
import { IStorage } from "../storage";

export async function cleanupExpiredFiles(storage: IStorage): Promise<void> {
  try {
    const expiredConversions = await storage.getExpiredConversions();
    
    for (const conversion of expiredConversions) {
      // Delete session directory and all files
      const sessionDir = path.join(process.cwd(), "uploads", conversion.sessionId);
      
      if (fs.existsSync(sessionDir)) {
        await fs.remove(sessionDir);
        console.log(`Cleaned up expired session directory: ${conversion.sessionId}`);
      }
      
      // Remove conversion record
      await storage.deleteConversion(conversion.id);
    }
    
    if (expiredConversions.length > 0) {
      console.log(`Cleaned up ${expiredConversions.length} expired conversions`);
    }
    
    // Also clean up orphaned directories (directories without active conversions)
    await cleanupOrphanedDirectories(storage);
    
    // Clean up temporary pdf2pic files
    await cleanupTemporaryFiles();
    
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

export async function cleanupOrphanedDirectories(storage: IStorage): Promise<void> {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    
    if (!fs.existsSync(uploadsDir)) {
      return;
    }
    
    const directories = await fs.readdir(uploadsDir);
    const activeConversions = new Map();
    
    // Get all active conversions to identify which sessions are still active
    // This is a simplified approach - in a real app you'd want a more efficient query
    for (const dir of directories) {
      const sessionId = dir;
      const conversions = await storage.getConversionsBySession(sessionId);
      
      // If no conversions exist for this session, or all are expired, mark for cleanup
      const hasActiveConversions = conversions.some(conv => conv.expiresAt > new Date());
      
      if (!hasActiveConversions) {
        const sessionDir = path.join(uploadsDir, sessionId);
        const stats = await fs.stat(sessionDir).catch(() => null);
        
        if (stats && stats.isDirectory()) {
          // Delete directories older than 2 hours even if no conversion records exist
          const age = Date.now() - stats.mtime.getTime();
          const maxAge = 2 * 60 * 60 * 1000; // 2 hours
          
          if (age > maxAge) {
            await fs.remove(sessionDir);
            console.log(`Cleaned up orphaned session directory: ${sessionId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Orphaned directory cleanup error:", error);
  }
}

export async function cleanupTemporaryFiles(): Promise<void> {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    
    if (!fs.existsSync(uploadsDir)) {
      return;
    }
    
    // Find and remove temporary pdf2pic files (files with .1.jpg, .1.png extensions)
    const directories = await fs.readdir(uploadsDir);
    
    for (const dir of directories) {
      const sessionDir = path.join(uploadsDir, dir);
      const stats = await fs.stat(sessionDir).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        const files = await fs.readdir(sessionDir).catch(() => []);
        
        for (const file of files) {
          // Clean up pdf2pic temporary files
          if (file.match(/\.\d+\.(jpg|jpeg|png)$/)) {
            const filePath = path.join(sessionDir, file);
            const fileStats = await fs.stat(filePath).catch(() => null);
            
            if (fileStats) {
              // Remove temp files older than 30 minutes
              const age = Date.now() - fileStats.mtime.getTime();
              if (age > 30 * 60 * 1000) { // 30 minutes
                await fs.remove(filePath);
                console.log(`Cleaned up temporary file: ${file}`);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Temporary file cleanup error:", error);
  }
}

export async function cleanupSession(sessionId: string, storage: IStorage): Promise<void> {
  try {
    // Clean up a specific session immediately (for when user leaves)
    const sessionDir = path.join(process.cwd(), "uploads", sessionId);
    
    if (fs.existsSync(sessionDir)) {
      await fs.remove(sessionDir);
      console.log(`Immediately cleaned up session: ${sessionId}`);
    }
    
    // Remove all conversions for this session
    const conversions = await storage.getConversionsBySession(sessionId);
    for (const conversion of conversions) {
      await storage.deleteConversion(conversion.id);
    }
  } catch (error) {
    console.error(`Session cleanup error for ${sessionId}:`, error);
  }
}
