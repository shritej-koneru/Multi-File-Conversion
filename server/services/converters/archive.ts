/**
 * Archive conversions: ZIP (via archiver) and TAR (via the system tar binary,
 * with the Windows bsdtar --force-local quirk handled).
 */
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { execFileSync } from "child_process";
import { makeResult, type ConvertedFileInfo, type FileInfo } from "./shared";

async function convertToZip(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      try {
        resolve(await makeResult(outputPath, file));
      } catch (err) {
        reject(err);
      }
    });

    output.on("error", reject);
    archive.on("error", reject);
    archive.on("warning", (err) => {
      // Ignore ENOENT stat warnings; fail on anything else
      if ((err as any).code !== "ENOENT") reject(err);
    });
    archive.pipe(output);
    archive.file(inputPath, { name: file.name });
    archive.finalize();
  });
}

async function convertToTar(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  try {
    // Use system tar. On Windows, bsdtar interprets "E:\..." as a remote host
    // unless --force-local is passed; the flag is unsupported on GNU tar, hence
    // the platform split. execFileSync avoids cmd.exe quoting issues with paths
    // containing spaces.
    const args = [
      "--force-local",
      "-czf",
      outputPath,
      "-C",
      path.dirname(inputPath),
      path.basename(inputPath),
    ];
    if (process.platform !== "win32") {
      args.shift(); // GNU tar has no --force-local
    }
    execFileSync("tar", args, { timeout: 60000 });

    return makeResult(outputPath, file);
  } catch (error) {
    throw new Error(`Failed to create TAR archive: ${(error as Error).message}`);
  }
}

export const archiveConversions = {
  zip: convertToZip,
  tar: convertToTar,
};
