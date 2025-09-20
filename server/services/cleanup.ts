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
        console.log(`Cleaned up session directory: ${conversion.sessionId}`);
      }
      
      // Remove conversion record
      await storage.deleteConversion(conversion.id);
    }
    
    if (expiredConversions.length > 0) {
      console.log(`Cleaned up ${expiredConversions.length} expired conversions`);
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}
