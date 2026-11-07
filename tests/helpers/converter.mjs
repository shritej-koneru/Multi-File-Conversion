/**
 * Shared helpers for the converter unit tests.
 */
import fs from "fs-extra";
import path from "path";
import { FileConverter } from "../../server/services/file-converter.ts";

export const converter = new FileConverter();

export function FileInfoOf(name, ext, type, size, p) {
  return { name, size: size ?? 1234, type: type ?? "application/octet-stream", extension: ext, path: p };
}

/** Convert a single file and return the first converted result (throws if none). */
export async function convertOne(file, target) {
  const res = await converter.convertFiles([file], target, "audit", () => {});
  if (!res.length) throw new Error(`no output produced for ${file.name} -> ${target}`);
  return res[0];
}

/** Aeterminate unique scratch dir under uploads/<name>; removes it on cleanup. */
export async function makeTmpDir(name) {
  const dir = path.resolve("uploads", `_${name}`);
  await fs.ensureDir(dir);
  return dir;
}

export async function removeTmpDir(dir) {
  await fs.remove(dir);
}
