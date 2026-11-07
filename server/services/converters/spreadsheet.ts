/**
 * Spreadsheet conversions: CSV <-> XLSX (via the xlsx package).
 */
import fs from "fs-extra";
import * as XLSX from "xlsx";
import { makeResult, type ConvertedFileInfo, type FileInfo } from "./shared";

async function convertToXlsx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (file.extension.toLowerCase() === ".csv") {
    // Convert CSV to XLSX using XLSX's built-in CSV parser (handles quotes, commas, newlines)
    const csvData = await fs.readFile(inputPath, "utf-8");
    const workbook = XLSX.read(csvData, { type: "string", raw: true });
    XLSX.writeFile(workbook, outputPath);
  } else {
    throw new Error(`Cannot convert ${file.extension} to XLSX`);
  }

  return makeResult(outputPath, file);
}

async function convertToCsv(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if ([".xlsx", ".xls"].includes(file.extension.toLowerCase())) {
    // Convert XLSX to CSV. Read from a Buffer with XLSX.read: the CJS
    // package's fs-dependent readFile helper can be missing when the module
    // is loaded through ESM interop (e.g. under tsx), while XLSX.read works.
    const workbook = XLSX.read(await fs.readFile(inputPath), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    await fs.writeFile(outputPath, csvData);
  } else {
    throw new Error(`Cannot convert ${file.extension} to CSV`);
  }

  return makeResult(outputPath, file);
}

export const spreadsheetConversions = {
  xlsx: convertToXlsx,
  csv: convertToCsv,
};
