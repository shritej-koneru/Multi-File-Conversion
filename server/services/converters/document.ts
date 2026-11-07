/**
 * Document conversions: TXT, DOCX, HTML and the document branches of PDF
 * (DOCX/DOC -> PDF with pandoc/LibreOffice/text fallbacks, TXT/MD -> PDF).
 */
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import mammoth from "mammoth";
import {
  makeResult,
  extractPdfText,
  writeTextPdf,
  checkPandocAvailable,
  checkLibreOfficeAvailable,
  convertWithPandoc,
  convertWithLibreOffice,
  type ConvertedFileInfo,
  type FileInfo,
} from "./shared";

async function convertToTxt(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (file.extension.toLowerCase() === ".pdf") {
    try {
      // Extract text from PDF (handles pdf-parse ESM debug bug + Buffer rejection)
      const pdfBuffer = await fs.readFile(inputPath);
      const data = await extractPdfText(pdfBuffer);

      if (data.text && data.text.trim().length > 0) {
        await fs.writeFile(outputPath, data.text);
      } else {
        // Fallback if no text is extracted
        const placeholderText = `[PDF Content from ${file.name}]\n\nThis PDF appears to contain images or scanned content without extractable text.\nOriginal file: ${file.name}\nPages: ${data.numpages || "Unknown"}\n\nFor better text extraction, ensure the PDF contains selectable text rather than scanned images.`;
        await fs.writeFile(outputPath, placeholderText);
      }
    } catch (error) {
      console.warn("PDF text extraction failed:", error);
      // Fallback to placeholder text
      const textContent = `[PDF Content from ${file.name}]\n\nPDF text extraction failed.\nOriginal file: ${file.name}\nSize: ${file.size} bytes\n\nNote: This may be a scanned PDF or contain complex formatting.\nTry using dedicated PDF text extraction tools for better results.`;
      await fs.writeFile(outputPath, textContent);
    }
  } else if ([".docx", ".doc"].includes(file.extension.toLowerCase())) {
    // Convert DOCX to text using mammoth
    const result = await mammoth.extractRawText({ path: inputPath });
    await fs.writeFile(outputPath, result.value);
  } else if (file.extension.toLowerCase() === ".html") {
    // Strip HTML tags for basic conversion
    const htmlContent = await fs.readFile(inputPath, "utf-8");
    const textContent = htmlContent.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
    await fs.writeFile(outputPath, textContent);
  } else {
    throw new Error(`Cannot convert ${file.extension} to TXT`);
  }

  return makeResult(outputPath, file);
}

async function convertToDocx(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  let textContent = "";

  if (file.extension.toLowerCase() === ".pdf") {
    try {
      const pdfBuffer = await fs.readFile(inputPath);
      const data = await extractPdfText(pdfBuffer);
      textContent = data.text || `Content from ${file.name}\n\nThis PDF was converted to Word format.\nSome formatting may be lost in the conversion process.`;
    } catch (error) {
      console.error("PDF text extraction failed:", error);
      textContent = `Document converted from ${file.name}\n\nPDF text extraction failed. Original size: ${file.size} bytes.`;
    }
  } else if (file.extension.toLowerCase() === ".txt") {
    textContent = await fs.readFile(inputPath, "utf-8");
  } else {
    throw new Error(`Cannot convert ${file.extension} to DOCX`);
  }

  // Escape XML special characters
  const escapeXml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  // Build paragraphs from text lines
  const paragraphs = textContent
    .split("\n")
    .map((line) => {
      const escaped = escapeXml(line);
      return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
    })
    .join("");

  // Create valid .docx structure (ZIP with OOXML content)
  const { default: archiver } = await import("archiver");
  const output = fs.createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 0 } });

  return new Promise((resolve, reject) => {
    output.on("close", async () => {
      try {
        const stats = await fs.stat(outputPath);
        resolve({
          originalName: file.name,
          convertedName: path.basename(outputPath),
          size: stats.size,
          path: outputPath,
        });
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

    // [Content_Types].xml
    archive.append(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\r\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\r\n  <Default Extension="xml" ContentType="application/xml"/>\r\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\r\n</Types>`,
      { name: "[Content_Types].xml" }
    );

    // _rels/.rels
    archive.append(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\r\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\r\n</Relationships>`,
      { name: "_rels/.rels" }
    );

    // word/_rels/document.xml.rels
    archive.append(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\r\n</Relationships>`,
      { name: "word/_rels/document.xml.rels" }
    );

    // word/document.xml
    archive.append(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"\r\n            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\r\n  <w:body>\r\n    ${paragraphs}\r\n    <w:sectPr>\r\n      <w:pgSz w:w="12240" w:h="15840"/>\r\n      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>\r\n    </w:sectPr>\r\n  </w:body>\r\n</w:document>`,
      { name: "word/document.xml" }
    );

    archive.finalize();
  });
}

async function convertToHtml(inputPath: string, outputPath: string, file: FileInfo): Promise<ConvertedFileInfo> {
  if (file.extension.toLowerCase() === ".md") {
    // Convert Markdown to HTML with basic inline parsing
    const mdContent = await fs.readFile(inputPath, "utf-8");
    const lines = mdContent.split("\n");
    let html = "";
    let inCodeBlock = false;
    let listType: string | null = null;

    // Escape HTML entities BEFORE applying inline markdown so user content
    // can never inject raw markup (consistent with TXT->HTML escaping)
    const escapeHtml = (text: string) =>
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          html += "</code></pre>\n";
          inCodeBlock = false;
        } else {
          html += "<pre><code>";
          inCodeBlock = true;
        }
        continue;
      }
      if (inCodeBlock) {
        html += line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\n";
        continue;
      }

      let processed = escapeHtml(line);
      // Inline formatting
      processed = processed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      processed = processed.replace(/\*(.+?)\*/g, "<em>$1</em>");
      processed = processed.replace(/`(.+?)`/g, "<code>$1</code>");
      processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

      if (/^### (.+)/.test(processed)) {
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += `<h3>${processed.replace(/^### (.+)/, "$1")}</h3>\n`;
      } else if (/^## (.+)/.test(processed)) {
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += `<h2>${processed.replace(/^## (.+)/, "$1")}</h2>\n`;
      } else if (/^# (.+)/.test(processed)) {
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += `<h1>${processed.replace(/^# (.+)/, "$1")}</h1>\n`;
      } else if (/^- (.+)/.test(processed)) {
        if (!listType) {
          html += "<ul>\n";
          listType = "ul";
        }
        html += `  <li>${processed.replace(/^- (.+)/, "$1")}</li>\n`;
      } else if (/^\d+\. (.+)/.test(processed)) {
        if (!listType) {
          html += "<ol>\n";
          listType = "ol";
        }
        html += `  <li>${processed.replace(/^\d+\. (.+)/, "$1")}</li>\n`;
      } else if (processed.trim() === "") {
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += "\n";
      } else {
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += `<p>${processed}</p>\n`;
      }
    }
    if (listType) html += `</${listType}>\n`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(file.name)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
      pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
      code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
      pre code { background: none; padding: 0; }
      a { color: #0366d6; }
      blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
    await fs.writeFile(outputPath, htmlContent);
  } else if (file.extension.toLowerCase() === ".txt") {
    // Convert TXT to HTML with basic formatting
    const textContent = await fs.readFile(inputPath, "utf-8");
    // Escape HTML entities to prevent XSS
    const escaped = textContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name.replace(/</g, "&lt;")}</title>
</head>
<body>
    <pre>${escaped}</pre>
</body>
</html>`;
    await fs.writeFile(outputPath, htmlContent);
  } else if ([".docx", ".doc"].includes(file.extension.toLowerCase())) {
    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ path: inputPath });
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name.replace(/</g, "&lt;")}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    </style>
</head>
<body>
    ${result.value}
</body>
</html>`;
    await fs.writeFile(outputPath, htmlContent);

    // Log any conversion messages/warnings
    if (result.messages && result.messages.length > 0) {
      console.log("DOCX to HTML conversion messages:", result.messages);
    }
  } else {
    throw new Error(`Cannot convert ${file.extension} to HTML`);
  }

  return makeResult(outputPath, file);
}

/**
 * Document branches of PDF conversion.
 * Image sources are delegated to the image module; DOCX/DOC runs the
 * pandoc -> LibreOffice -> text fallback chain; TXT/MD render as text PDFs.
 */
async function convertToPdf(
  inputPath: string,
  outputPath: string,
  file: FileInfo,
  convertImageToPdf: (inputPath: string, outputPath: string, file: FileInfo) => Promise<ConvertedFileInfo>
): Promise<ConvertedFileInfo> {
  const { isImageFile } = await import("./shared");

  if (isImageFile(file.extension)) {
    return convertImageToPdf(inputPath, outputPath, file);
  }

  if ([".docx", ".doc"].includes(file.extension.toLowerCase())) {
    // DOCX/DOC to PDF conversion with smart fallback strategy
    console.log(`Starting DOCX to PDF conversion: ${inputPath} -> ${outputPath}`);

    const hasPandoc = checkPandocAvailable();
    const hasLibreOffice = checkLibreOfficeAvailable();

    console.log(`Available tools - Pandoc: ${hasPandoc}, LibreOffice: ${hasLibreOffice}`);

    let conversionSuccessful = false;
    let lastError: Error | null = null;

    // Strategy 1: Try Pandoc first (fast, lightweight, good for simple docs)
    if (hasPandoc && !conversionSuccessful) {
      try {
        console.log("Attempting conversion with Pandoc...");
        await convertWithPandoc(inputPath, outputPath, "pdf");
        conversionSuccessful = true;
        console.log("✅ Pandoc conversion successful");
      } catch (error) {
        console.log(`Pandoc conversion failed: ${(error as Error).message}`);
        lastError = error as Error;
      }
    }

    // Strategy 2: Try LibreOffice if Pandoc failed or unavailable (best for complex docs)
    if (hasLibreOffice && !conversionSuccessful) {
      try {
        console.log("Attempting conversion with LibreOffice...");
        await convertWithLibreOffice(inputPath, outputPath, "pdf");
        conversionSuccessful = true;
        console.log("✅ LibreOffice conversion successful");
      } catch (error) {
        console.log(`LibreOffice conversion failed: ${(error as Error).message}`);
        lastError = error as Error;
      }
    }

    // Strategy 3: Fallback to HTML-based conversion (preserves basic formatting)
    if (!conversionSuccessful) {
      console.log("⚠️  Falling back to HTML-based conversion (preserves basic formatting)");
      try {
        // Convert DOCX to HTML using mammoth (preserves formatting)
        const result = await mammoth.convertToHtml({ path: inputPath });
        const htmlContent = result.value;

        console.log(`Converted DOCX to HTML (${htmlContent.length} characters)`);

        if (!htmlContent || htmlContent.trim().length === 0) {
          throw new Error(`No content found in ${file.name}`);
        }

        // Use Pandoc if available to convert HTML to PDF (better quality)
        if (hasPandoc) {
          try {
            const tempHtmlPath = inputPath.replace(/\.[^.]+$/, ".temp.html");
            await fs.writeFile(tempHtmlPath, htmlContent);

            const command = `pandoc "${tempHtmlPath}" -o "${outputPath}" -f html -t pdf`;
            console.log(`Executing Pandoc HTML to PDF: ${command}`);
            execSync(command, { timeout: 30000 });

            await fs.remove(tempHtmlPath);

            if (fs.existsSync(outputPath)) {
              conversionSuccessful = true;
              console.log("✅ HTML-based conversion with Pandoc successful");
            }
          } catch (pandocError) {
            console.log("Pandoc HTML conversion failed, trying text extraction");
          }
        }

        // If Pandoc HTML conversion failed or unavailable, extract text from HTML
        if (!conversionSuccessful) {
          // Strip HTML tags for text extraction
          let textContent = htmlContent
            .replace(/<style[^>]*>.*?<\/style>/gis, "")
            .replace(/<script[^>]*>.*?<\/script>/gis, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();

          console.log(`Extracted ${textContent.length} characters from HTML`);

          if (!textContent || textContent.trim().length === 0) {
            throw new Error(`No text content found in ${file.name}`);
          }

          await writeTextPdf(outputPath, textContent, file);
          conversionSuccessful = true;
          console.log("✅ Text-based conversion successful (basic formatting preserved)");
        }
      } catch (error) {
        console.error("HTML-based conversion also failed:", error);
        lastError = error as Error;
      }
    }

    // If all strategies failed, throw error
    if (!conversionSuccessful) {
      if (fs.existsSync(outputPath)) {
        await fs.remove(outputPath);
      }
      throw new Error(`Failed to convert ${file.name} to PDF. ${lastError?.message || "All conversion methods failed"}`);
    }

    // Verify and return result
    const stats = await fs.stat(outputPath);
    if (stats.size === 0) {
      throw new Error(`PDF conversion resulted in empty file for ${file.name}`);
    }

    console.log(`DOCX to PDF conversion successful: ${outputPath} (${stats.size} bytes)`);

    return makeResult(outputPath, file);
  }

  if (file.extension.toLowerCase() === ".txt") {
    // Convert TXT to PDF
    try {
      console.log(`Starting TXT to PDF conversion: ${inputPath} -> ${outputPath}`);

      // Read text content
      const textContent = await fs.readFile(inputPath, "utf-8");

      if (!textContent || textContent.trim().length === 0) {
        throw new Error(`No text content found in ${file.name}`);
      }

      const result = await writeTextPdf(outputPath, textContent, file);
      console.log(`TXT to PDF conversion successful: ${outputPath}`);
      return result;
    } catch (error) {
      // Clean up any partial files
      if (fs.existsSync(outputPath)) {
        await fs.remove(outputPath);
      }
      console.error(`TXT to PDF conversion failed:`, error);
      throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
    }
  }

  if (file.extension.toLowerCase() === ".md") {
    // Convert MD to PDF
    try {
      console.log(`Starting MD to PDF conversion: ${inputPath} -> ${outputPath}`);

      // Read markdown content
      const markdownContent = await fs.readFile(inputPath, "utf-8");

      if (!markdownContent || markdownContent.trim().length === 0) {
        throw new Error(`No markdown content found in ${file.name}`);
      }

      // For now, convert markdown to plain text (strip markdown syntax)
      // In the future, this could use a markdown-to-PDF library for better formatting
      const textContent = markdownContent
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, "")
        // Remove inline code
        .replace(/`([^`]+)`/g, "$1")
        // Remove headers (keep the text)
        .replace(/^#+\s+/gm, "")
        // Remove bold/italic
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        // Remove links (keep the text)
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        // Remove images
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "[Image: $1]")
        // Clean up
        .trim();

      const result = await writeTextPdf(outputPath, textContent, file);
      console.log(`MD to PDF conversion successful: ${outputPath}`);
      return result;
    } catch (error) {
      // Clean up any partial files
      if (fs.existsSync(outputPath)) {
        await fs.remove(outputPath);
      }
      console.error(`MD to PDF conversion failed:`, error);
      throw new Error(`Failed to convert ${file.name} to PDF: ${(error as Error).message}`);
    }
  }

  throw new Error(`Cannot convert ${file.extension} to PDF`);
}

export const documentConversions = {
  txt: convertToTxt,
  docx: convertToDocx,
  html: convertToHtml,
  pdf: convertToPdf,
};
