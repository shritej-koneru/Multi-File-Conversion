/**
 * Data format conversions: JSON / YAML / TOML / XML (plus CSV as an input
 * parsed through the xlsx reader).
 */
import fs from "fs-extra";
import yaml from "js-yaml";
import toml from "@iarna/toml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as XLSX from "xlsx";
import { makeResult, type ConvertedFileInfo, type FileInfo } from "./shared";

/** Parse any supported data-format input into a JS value. */
async function parseDataFile(inputPath: string, file: FileInfo): Promise<any> {
  const ext = file.extension.toLowerCase();

  if (ext === ".json") {
    const jsonContent = await fs.readFile(inputPath, "utf-8");
    return JSON.parse(jsonContent);
  }

  if (ext === ".yaml" || ext === ".yml") {
    const yamlContent = await fs.readFile(inputPath, "utf-8");
    return yaml.load(yamlContent);
  }

  if (ext === ".toml") {
    const tomlContent = await fs.readFile(inputPath, "utf-8");
    return toml.parse(tomlContent);
  }

  if (ext === ".xml") {
    const xmlContent = await fs.readFile(inputPath, "utf-8");
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xmlContent);
  }

  if (ext === ".csv") {
    const csvContent = await fs.readFile(inputPath, "utf-8");
    const workbook = XLSX.read(csvContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  throw new Error(`Cannot parse ${file.extension}`);
}

async function convertToJson(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const ext = file.extension.toLowerCase();
  const accepted = [".json", ".yaml", ".yml", ".toml", ".xml", ".csv"];
  if (!accepted.includes(ext)) {
    throw new Error(`Cannot convert ${file.extension} to JSON`);
  }

  let data: any;
  if (ext === ".csv") {
    const csvContent = await fs.readFile(inputPath, "utf-8");
    const workbook = XLSX.read(csvContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet);
  } else {
    data = await parseDataFile(inputPath, file);
  }

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  return makeResult(outputPath, file);
}

async function convertToYaml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const ext = file.extension.toLowerCase();
  const accepted = [".json", ".yaml", ".yml", ".toml", ".xml", ".csv"];
  if (!accepted.includes(ext)) {
    throw new Error(`Cannot convert ${file.extension} to YAML`);
  }

  let data: any;
  if (ext === ".csv") {
    const csvContent = await fs.readFile(inputPath, "utf-8");
    const workbook = XLSX.read(csvContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet);
  } else {
    data = await parseDataFile(inputPath, file);
  }

  const yamlContent = yaml.dump(data, { indent: 2, lineWidth: -1 });
  await fs.writeFile(outputPath, yamlContent);
  return makeResult(outputPath, file);
}

async function convertToToml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const ext = file.extension.toLowerCase();
  const accepted = [".json", ".yaml", ".yml", ".toml", ".xml"];
  if (!accepted.includes(ext)) {
    throw new Error(`Cannot convert ${file.extension} to TOML`);
  }

  const data = await parseDataFile(inputPath, file);

  const tomlContent = toml.stringify(data);
  await fs.writeFile(outputPath, tomlContent);
  return makeResult(outputPath, file);
}

async function convertToXml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  const ext = file.extension.toLowerCase();
  const accepted = [".json", ".yaml", ".yml", ".toml", ".xml", ".csv"];
  if (!accepted.includes(ext)) {
    throw new Error(`Cannot convert ${file.extension} to XML`);
  }

  let data: any;
  if (ext === ".csv") {
    const csvContent = await fs.readFile(inputPath, "utf-8");
    const workbook = XLSX.read(csvContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = { rows: XLSX.utils.sheet_to_json(worksheet) };
  } else {
    data = await parseDataFile(inputPath, file);
  }

  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  const xmlContent = builder.build(data);
  await fs.writeFile(outputPath, xmlContent);
  return makeResult(outputPath, file);
}

export const dataConversions = {
  json: convertToJson,
  yaml: convertToYaml,
  yml: convertToYaml,
  toml: convertToToml,
  xml: convertToXml,
};
