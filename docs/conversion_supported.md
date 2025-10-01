# Supported Conversions 🔄## Currently Supported Conversions



Complete matrix of all supported file formats and conversion possibilities.### Image Formats ✅

| From         | To                  | Use Case                                      | Status    |

## 🖼️ Image Conversions|--------------|---------------------|-----------------------------------------------|-----------|  

| .png, .jpg   | .pdf                | Compile scanned pages                         | ✅ Active |

### Supported Formats| .jpg, .jpeg  | .png, .webp, .gif, .tiff | Image format conversion              | ✅ Active |

**Input**: JPG, JPEG, PNG, GIF, WebP, BMP, TIFF, TIF, SVG  | .png         | .jpg, .webp, .gif, .tiff | Image format conversion              | ✅ Active |

**Output**: JPG, PNG, WebP, GIF, BMP, TIFF, PDF| .webp        | .jpg, .png, .gif, .tiff  | Compatibility with older browsers    | ✅ Active |

| .bmp, .tiff  | .jpg, .png, .webp, .gif  | Modern format conversion             | ✅ Active |

### Conversion Matrix| .gif         | .jpg, .png, .webp, .tiff | Static image extraction              | ✅ Active |

| From | To | Quality | Notes |

|------|----|---------|----- |### Document Formats ✅

| JPG/JPEG | PNG, WebP, GIF, BMP, TIFF, PDF | High | Lossless conversion available || From         | To                  | Use Case                                      | Status    |

| PNG | JPG, WebP, GIF, BMP, TIFF, PDF | High | Transparency preserved where supported ||--------------|---------------------|-----------------------------------------------|-----------|  

| GIF | JPG, PNG, WebP, BMP, TIFF, PDF | Medium | Animation lost in conversion || .docx        | .txt, .html         | Text extraction, web format                  | ✅ Active |

| WebP | JPG, PNG, GIF, BMP, TIFF, PDF | High | Modern format with excellent compression || .txt         | .html, .pdf*        | Web format, document creation                 | ✅ Active |

| BMP | JPG, PNG, WebP, GIF, TIFF, PDF | High | Uncompressed to compressed formats || .html        | .txt                | Text extraction                               | ✅ Active |

| TIFF | JPG, PNG, WebP, GIF, BMP, PDF | High | Professional quality maintained |

| SVG | JPG, PNG, WebP, GIF, BMP, TIFF, PDF | High | Vector to raster conversion |### Spreadsheet Formats ✅  

| From         | To                  | Use Case                                      | Status    |

### Image → PDF Features|--------------|---------------------|-----------------------------------------------|-----------|  

- **Multi-page PDFs**: Multiple images combined into single PDF| .csv         | .xlsx               | Excel compatibility                           | ✅ Active |

- **Quality preservation**: High DPI output (150-300 DPI)| .xlsx, .xls  | .csv                | Data analysis, universal format               | ✅ Active |

- **Size optimization**: Automatic compression while maintaining quality

- **Batch processing**: Convert multiple images to individual PDFs or combined PDF### Audio Formats ✅

| From         | To                  | Use Case                                      | Status    |

---|--------------|---------------------|-----------------------------------------------|-----------|  

| .wav         | .mp3, .ogg, .m4a    | Compression for storage/sharing               | ✅ Active |

## 📄 Document Conversions| .mp3         | .wav, .ogg, .m4a    | Quality improvement, format compatibility     | ✅ Active |

| .ogg, .m4a   | .mp3, .wav          | Universal compatibility                       | ✅ Active |

### PDF Processing

| From | To | Quality | Features |### Video Formats ✅

|------|----|---------|----- || From         | To                  | Use Case                                      | Status    |

| PDF | JPG, PNG | High | Page-by-page conversion, 150 DPI default ||--------------|---------------------|-----------------------------------------------|-----------|  

| PDF | TXT | Good | Text extraction with fallback for scanned PDFs || .mp4         | .avi, .webm, .mov   | Platform compatibility                        | ✅ Active |

| Images | PDF | High | Single or multi-page PDF creation || .avi, .mov   | .mp4, .webm         | Modern format, web compatibility              | ✅ Active |

| .webm        | .mp4, .avi          | Universal compatibility                       | ✅ Active |

### Microsoft Office

| From | To | Quality | Notes |### Archive Formats ✅

|------|----|---------|----- || From         | To                  | Use Case                                      | Status    |

| DOCX, DOC | PDF | Good | Formatting preserved where possible ||--------------|---------------------|-----------------------------------------------|-----------|  

| DOCX, DOC | TXT | Medium | Plain text extraction || Any file     | .zip                | Compressed archive creation                   | ✅ Active |

| DOCX, DOC | HTML | Good | Web-compatible output || .zip         | .tar                | Unix compatibility                            | ✅ Active |



### Text Formats## Planned Future Conversions

| From | To | Quality | Notes |

|------|----|---------|----- || From         | To                  | Use Case                                      | Status    |

| TXT | PDF | Good | Basic formatting applied ||--------------|---------------------|-----------------------------------------------|-----------|  

| TXT | DOCX | Good | Structured document creation || .pdf         | .docx, .txt         | Editing or reusing document content           | 🚧 Planned |

| TXT | HTML | Good | Web markup added || .pptx        | .pdf                | Sharing lecture slides                        | 🚧 Planned |

| HTML | TXT | Medium | Tag stripping, content extraction || .md          | .html, .pdf         | Markdown to web/print                         | 🚧 Planned |

| HTML | PDF | Good | Web page to document || .epub        | .pdf                | Device compatibility                          | 🚧 Planned |

| .svg         | .png, .pdf          | Raster conversion                             | 🚧 Planned |

---

## Technical Notes

## 📊 Spreadsheet Conversions

### Image Processing

### Excel & CSV- **Quality Settings**: JPEG/WebP at 85% quality, TIFF at 85% quality

| From | To | Quality | Features |- **Supported Input**: All major image formats including SVG (as input only)

|------|----|---------|----- |- **PDF Creation**: Multi-image to single PDF document

| XLSX, XLS | CSV | High | Data preservation, first sheet exported |- **Metadata**: Preserved where possible during conversion

| CSV | XLSX | High | Structured spreadsheet creation |

| XLSX, XLS | PDF | Good | Formatted output with grid lines |### Audio/Video Processing  

| CSV | PDF | Good | Tabular format with headers |- **Engine**: FFmpeg for all audio/video conversions

| XLSX, XLS | HTML | Good | Web table format |- **Quality**: Maintains reasonable quality while optimizing file size

- **Codecs**: Uses standard codecs for maximum compatibility

---- **Bitrates**: Audio at 192kbps for MP3, lossless for WAV



## 🎵 Audio Conversions### Document Processing

- **Text Extraction**: Uses Mammoth.js for DOCX processing  

*Requires FFmpeg (auto-installed in Docker)*- **HTML Generation**: Clean HTML output with basic styling

- **Encoding**: UTF-8 for all text operations

### Supported Formats- **Limitations**: Complex formatting may not be preserved

**Input**: MP3, WAV, OGG, M4A, AAC  

**Output**: MP3, WAV, OGG, M4A### Performance

- **Processing Time**: Varies by file size and conversion complexity

### Conversion Matrix- **Memory Usage**: Optimized for server environments

| From | To | Quality | Bitrate | Notes |- **Concurrent Processing**: Supports multiple simultaneous conversions

|------|----|---------|---------|----- |- **File Size Limits**: 50MB per file, 10 files per session
| MP3 | WAV, OGG, M4A | High | 192kbps default | Compressed to uncompressed |
| WAV | MP3, OGG, M4A | High | 192kbps | Uncompressed to compressed |
| OGG | MP3, WAV, M4A | High | 192kbps | Open source format |
| M4A | MP3, WAV, OGG | High | 192kbps | Apple format support |
| AAC | MP3, WAV, OGG | High | 192kbps | Advanced audio coding |

---

## 🎬 Video Conversions

*Requires FFmpeg (auto-installed in Docker)*

### Supported Formats
**Input**: MP4, AVI, MOV, WebM, MKV  
**Output**: MP4, AVI, MOV, WebM

### Conversion Matrix
| From | To | Quality | Codec | Notes |
|------|----|---------|---------|----- |
| MP4 | AVI, MOV, WebM | High | H.264/AAC | Universal compatibility |
| AVI | MP4, MOV, WebM | High | H.264/AAC | Legacy format conversion |
| MOV | MP4, AVI, WebM | High | H.264/AAC | Apple format support |
| WebM | MP4, AVI, MOV | High | VP8/Vorbis | Web-optimized format |
| MKV | MP4, AVI, MOV, WebM | High | H.264/AAC | Container conversion |

---

## 📦 Archive Conversions

### Supported Operations
| From | To | Features |
|------|----|----- |
| Any file | ZIP | Single file compression |
| Any file | TAR | Unix-style archive |
| Multiple files | ZIP | Batch archiving |
| Multiple files | TAR.GZ | Compressed tar archive |

---

## 🚀 Conversion Features

### Quality Options
- **High Quality**: Lossless where possible, optimized compression
- **Web Optimized**: Balanced size/quality for web use  
- **Print Ready**: High DPI output for professional printing
- **Archive**: Maximum compression for storage

### Batch Processing
- **Multiple Input Formats**: Mix different file types in one conversion
- **Multiple Output Formats**: Convert one file to multiple formats simultaneously
- **Progress Tracking**: Real-time conversion progress updates
- **Error Handling**: Individual file failures don't stop batch processing

### Advanced Features
- **Metadata Preservation**: EXIF data, document properties where supported
- **Custom Sizing**: Image dimension control
- **Quality Control**: Compression level adjustment
- **Format Detection**: Automatic input format recognition

---

## ⚠️ Limitations

### File Size
- **Maximum**: 50MB per file
- **Recommended**: Under 10MB for faster processing
- **Batch**: Up to 10 files per upload

### Format Specific
- **GIF Animation**: Lost during conversion to static formats
- **PDF Forms**: Interactive elements not preserved
- **Video Quality**: Dependent on input quality and codec support
- **Font Embedding**: May affect document appearance

### Dependencies
- **Audio/Video**: Requires FFmpeg (included in Docker)
- **PDF Processing**: Requires Poppler utils (included in Docker)
- **Image Processing**: Requires GraphicsMagick/ImageMagick (included in Docker)

---

## 🔍 Format Detection

The service automatically detects file types based on:
1. **File Extension**: Primary detection method
2. **MIME Type**: Secondary validation  
3. **File Headers**: Magic number verification
4. **Content Analysis**: Format-specific validation

### Supported MIME Types
```
Images: image/jpeg, image/png, image/gif, image/webp, image/bmp, image/tiff
Documents: application/pdf, application/msword, text/plain, text/html
Spreadsheets: application/vnd.ms-excel, text/csv
Audio: audio/mpeg, audio/wav, audio/ogg
Video: video/mp4, video/x-msvideo, video/quicktime
Archives: application/zip, application/x-tar
```

---

## 📈 Performance Guidelines

### Recommended File Sizes
- **Images**: 1-10MB for optimal processing speed
- **Documents**: 1-25MB for complex PDFs
- **Audio**: 5-50MB depending on length/quality
- **Video**: 10-50MB for reasonable processing times

### Processing Times (Approximate)
- **Image Conversion**: 1-5 seconds
- **PDF to Images**: 2-10 seconds per page
- **Audio Conversion**: 10-30 seconds
- **Video Conversion**: 30 seconds - 5 minutes
- **Document Processing**: 5-15 seconds

*Times vary based on file size, complexity, and server resources*