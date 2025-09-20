export function getFileIcon(extension: string): string {
  const iconMap: { [key: string]: string } = {
    // Images
    ".jpg": "🖼️",
    ".jpeg": "🖼️", 
    ".png": "🖼️",
    ".gif": "🖼️",
    ".webp": "🖼️",
    ".bmp": "🖼️",
    ".tiff": "🖼️",
    
    // Documents
    ".pdf": "📄",
    ".doc": "📝",
    ".docx": "📝",
    ".ppt": "📊",
    ".pptx": "📊",
    ".txt": "📄",
    ".rtf": "📄",
    
    // Spreadsheets
    ".xls": "📊",
    ".xlsx": "📊",
    ".csv": "📊",
    ".ods": "📊",
    
    // Audio
    ".mp3": "🎵",
    ".wav": "🎵",
    ".ogg": "🎵",
    ".m4a": "🎵",
    
    // Video
    ".mp4": "🎬",
    ".avi": "🎬",
    ".mov": "🎬",
    ".wmv": "🎬",
    
    // Archives
    ".zip": "📦",
    ".rar": "📦",
    ".7z": "📦",
    ".tar": "📦",
  };
  
  return iconMap[extension.toLowerCase()] || "📁";
}

export function getFileTypeCategory(extension: string): string {
  const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
  const documentTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".rtf"];
  const spreadsheetTypes = [".xls", ".xlsx", ".csv", ".ods"];
  const audioTypes = [".mp3", ".wav", ".ogg", ".m4a"];
  const videoTypes = [".mp4", ".avi", ".mov", ".wmv"];
  const archiveTypes = [".zip", ".rar", ".7z", ".tar"];
  
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
  const categories = files.map(f => getFileTypeCategory(f.extension));
  const uniqueCategories = Array.from(new Set(categories));
  
  // If all files are images, show image conversions
  if (uniqueCategories.length === 1 && uniqueCategories[0] === "image") {
    return ["jpg", "png", "webp", "pdf"];
  }
  
  // If mixed types, show common conversions
  return ["pdf", "zip"];
}
