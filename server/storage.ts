import { type User, type InsertUser, type Conversion, type InsertConversion, type FileInfo, type ConvertedFileInfo } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversion(id: string): Promise<Conversion | undefined>;
  getConversionsBySession(sessionId: string): Promise<Conversion[]>;
  updateConversionStatus(id: string, status: string, progress?: number): Promise<void>;
  updateConversionFiles(id: string, convertedFiles: ConvertedFileInfo[], downloadUrl?: string): Promise<void>;
  getExpiredConversions(): Promise<Conversion[]>;
  deleteConversion(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversions: Map<string, Conversion>;

  constructor() {
    this.users = new Map();
    this.conversions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = randomUUID();
    const conversion: Conversion = {
      id,
      sessionId: insertConversion.sessionId,
      originalFiles: insertConversion.originalFiles,
      targetFormat: insertConversion.targetFormat,
      convertedFiles: [],
      status: "pending",
      progress: 0,
      downloadUrl: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdAt: new Date(),
    };
    this.conversions.set(id, conversion);
    return conversion;
  }

  async getConversion(id: string): Promise<Conversion | undefined> {
    return this.conversions.get(id);
  }

  async getConversionsBySession(sessionId: string): Promise<Conversion[]> {
    return Array.from(this.conversions.values()).filter(
      (conversion) => conversion.sessionId === sessionId
    );
  }

  async updateConversionStatus(id: string, status: string, progress?: number): Promise<void> {
    const conversion = this.conversions.get(id);
    if (conversion) {
      conversion.status = status;
      if (progress !== undefined) {
        conversion.progress = progress;
      }
      this.conversions.set(id, conversion);
    }
  }

  async updateConversionFiles(id: string, convertedFiles: ConvertedFileInfo[], downloadUrl?: string): Promise<void> {
    const conversion = this.conversions.get(id);
    if (conversion) {
      conversion.convertedFiles = convertedFiles;
      if (downloadUrl) {
        conversion.downloadUrl = downloadUrl;
      }
      this.conversions.set(id, conversion);
    }
  }

  async getExpiredConversions(): Promise<Conversion[]> {
    const now = new Date();
    return Array.from(this.conversions.values()).filter(
      (conversion) => conversion.expiresAt <= now
    );
  }

  async deleteConversion(id: string): Promise<void> {
    this.conversions.delete(id);
  }
}

export const storage = new MemStorage();
