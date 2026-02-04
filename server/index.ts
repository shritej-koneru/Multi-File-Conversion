import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs-extra";
import path from "path";

// Simple logging function
function log(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
}

// Production static file serving
function serveStaticFiles(app: express.Express): void {
  const staticPath = path.join(process.cwd(), "dist/public");
  if (fs.existsSync(staticPath)) {
    // Serve static assets
    app.use(express.static(staticPath));
    log(`serving static files from ${staticPath}`);
    
    // Serve index.html for all non-API and non-health routes (SPA fallback)
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api") && req.path !== "/health") {
        res.sendFile(path.join(staticPath, "index.html"));
      }
    });
  } else {
    log(`WARNING: Static files directory not found: ${staticPath}`);
    // Fallback for missing static files
    app.get("/", (req, res) => {
      res.json({ 
        error: "Frontend not built", 
        message: "Run 'npm run build' to build the frontend",
        staticPath: staticPath,
        exists: fs.existsSync(staticPath)
      });
    });
  }
}

async function cleanupUploadsOnStartup(): Promise<void> {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    
    if (await fs.pathExists(uploadsDir)) {
      // Remove all contents of uploads directory
      await fs.emptyDir(uploadsDir);
      log("🧹 Cleaned up uploads folder on server startup");
    } else {
      // Create uploads directory if it doesn't exist
      await fs.ensureDir(uploadsDir);
      log("📁 Created uploads directory");
    }
  } catch (error) {
    console.error("❌ Failed to cleanup uploads on startup:", error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Clean up uploads folder on server startup
  await cleanupUploadsOnStartup();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup development or production serving
  if (app.get("env") === "development") {
    // Only import dev-server in development to avoid bundling vite in production
    const { setupDevelopmentServer } = await import("./dev-server");
    await setupDevelopmentServer(app, server);
  } else {
    // In production, serve static files directly
    serveStaticFiles(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
