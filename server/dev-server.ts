import type { Express } from "express";
import type { Server } from "http";
import { setupVite } from "./vite";

export async function setupDevelopmentServer(app: Express, server: Server): Promise<void> {
  await setupVite(app, server);
}