export function getFileIcon(extension: string): string {
  const iconMap: { [key: string]: string } = {
    // Images
    ".jpg": "🖼️",
    ".jpeg": "🖼️", 
    ".png": "🖼️",
    ".gif": "🎞️", // Different icon for animated format
    ".webp": "🖼️",
    ".bmp": "🖼️",
    ".tiff": "🖼️",
    ".tif": "🖼️",
    ".svg": "🎨", // Vector graphics icon
    
    // Documents
    ".pdf": "📄",
    ".doc": "📝",
    ".docx": "📝",
    ".ppt": "📊",
    ".pptx": "📊",
    ".txt": "📄",
    ".rtf": "📄",
    ".md": "📝", // Markdown
    ".html": "🌐", // Web document
    
    // Spreadsheets
    ".xls": "📊",
    ".xlsx": "📊",
    ".csv": "📊",
    ".ods": "📊",
    ".tsv": "📊",
    
    // Audio
    ".mp3": "🎵",
    ".wav": "🎵",
    ".ogg": "🎵",
    ".m4a": "🎵",
    ".aac": "🎵",
    
    // Video
    ".mp4": "🎬",
    ".avi": "🎬",
    ".mov": "🎬",
    ".wmv": "🎬",
    ".webm": "🎬",
    ".mkv": "🎬",
    
    // Archives
    ".zip": "📦",
    ".rar": "📦",
    ".7z": "📦",
    ".tar": "📦",
    ".gz": "📦",
  };
  
  return iconMap[extension.toLowerCase()] || "📁";
}

export function getFileTypeCategory(extension: string): string {
  const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg"];
  const documentTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".rtf", ".md", ".html"];
  const spreadsheetTypes = [".xls", ".xlsx", ".csv", ".ods", ".tsv"];
  const audioTypes = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
  const videoTypes = [".mp4", ".avi", ".mov", ".wmv", ".webm", ".mkv"];
  const archiveTypes = [".zip", ".rar", ".7z", ".tar", ".gz"];
  
  const ext = extension.toLowerCase();
  
  if (imageTypes.includes(ext)) return "image";
  if (documentTypes.includes(ext)) return "document";
  if (spreadsheetTypes.includes(ext)) return "spreadsheet";
  if (audioTypes.includes(ext)) return "audio";
  if (videoTypes.includes(ext)) return "video";
  if (archiveTypes.includes(ext)) return "archive";
  
  return "other";
}

export function getAvailableConversions(files: Array<{ extension: string }>): string[] {
  const extensions = files.map(f => f.extension.toLowerCase());
  const categories = extensions.map(ext => getFileTypeCategory(ext));
  const uniqueCategories = Array.from(new Set(categories));
  
  // If all files are the same category, provide category-specific options
  if (uniqueCategories.length === 1) {
    const category = uniqueCategories[0];
    
    switch (category) {
      case "image":
        return ["jpg", "png", "webp", "pdf", "gif", "tiff"];
      case "document":
        return ["pdf", "txt", "html", "docx"];
      case "spreadsheet":
        return ["xlsx", "csv", "pdf", "html"];
      case "audio":
        return ["mp3", "wav", "ogg", "m4a"];
      case "video":
        return ["mp4", "avi", "webm", "mov", "gif"];
      case "archive":
        return ["zip", "tar"];
    }
  }
  
  // Mixed file types - provide universal formats
  const mixedFormats = ["zip"]; // Always offer zip for batch downloads
  
  // Add PDF if any images or documents exist
  if (categories.some(cat => ["image", "document"].includes(cat))) {
    mixedFormats.unshift("pdf");
  }
  
  // Add common image formats if any images exist
  if (categories.includes("image")) {
    mixedFormats.unshift("jpg", "png");
  }
  
  return Array.from(new Set(mixedFormats)); // Remove duplicates
}

export function getConversionDescription(targetFormat: string): string {
  const descriptions: { [key: string]: string } = {
    // Image formats
    "jpg": "JPEG - Best for photos, smaller file size",
    "png": "PNG - Lossless, supports transparency",
    "webp": "WebP - Modern format, 25-50% smaller than JPEG",
    "gif": "GIF - Supports animation, limited colors",
    "tiff": "TIFF - High quality, used in professional printing",
    "bmp": "BMP - Uncompressed, large file size",
    "pdf": "PDF - Universal document format, great for sharing",
    
    // Document formats
    "txt": "Plain Text - Universal, readable on any device",
    "docx": "Word Document - Editable Microsoft Word format",
    "html": "HTML - Web document, viewable in browsers",
    
    // Spreadsheet formats
    "xlsx": "Excel - Microsoft Excel format with formulas",
    "csv": "CSV - Universal data format, works everywhere",
    
    // Audio formats
    "mp3": "MP3 - Compressed audio, universally supported",
    "wav": "WAV - Uncompressed audio, highest quality",
    "ogg": "OGG - Open-source format, good compression",
    "m4a": "M4A - Apple format, excellent quality/size ratio",
    
    // Video formats
    "mp4": "MP4 - Universal video format, plays anywhere",
    "avi": "AVI - Windows format, good compatibility",
    "webm": "WebM - Web-optimized, smaller file sizes",
    "mov": "QuickTime - Apple format, high quality",
    
    // Archive formats
    "zip": "ZIP - Compressed archive of all files",
    "tar": "TAR - Unix archive format, preserves permissions"
  };
  
  return descriptions[targetFormat] || `Convert to ${targetFormat.toUpperCase()}`;
}

export function getOptimalFormat(sourceFormat: string, useCase: "web" | "print" | "archive" | "general"): string[] {
  const source = sourceFormat.toLowerCase();
  
  switch (useCase) {
    case "web":
      if ([".png", ".gif"].includes(source)) return ["webp", "png"];
      return ["webp", "jpg"];
    
    case "print":
      return ["pdf", "tiff", "png"];
    
    case "archive":
      return ["png", "tiff"];
    
    case "general":
    default:
      return ["jpg", "png", "pdf"];
  }
}
