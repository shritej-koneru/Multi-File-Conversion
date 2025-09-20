import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversions = pgTable("conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  originalFiles: json("original_files").$type<FileInfo[]>().notNull(),
  convertedFiles: json("converted_files").$type<ConvertedFileInfo[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  targetFormat: text("target_format").notNull(),
  progress: integer("progress").default(0),
  downloadUrl: text("download_url"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  extension: string;
  path: string;
}

export interface ConvertedFileInfo {
  originalName: string;
  convertedName: string;
  size: number;
  path: string;
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversionSchema = createInsertSchema(conversions).pick({
  sessionId: true,
  originalFiles: true,
  targetFormat: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversion = typeof conversions.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
