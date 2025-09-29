## Currently Supported Conversions

### Image Formats ✅
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .png, .jpg   | .pdf                | Compile scanned pages                         | ✅ Active |
| .jpg, .jpeg  | .png, .webp, .gif, .tiff | Image format conversion              | ✅ Active |
| .png         | .jpg, .webp, .gif, .tiff | Image format conversion              | ✅ Active |
| .webp        | .jpg, .png, .gif, .tiff  | Compatibility with older browsers    | ✅ Active |
| .bmp, .tiff  | .jpg, .png, .webp, .gif  | Modern format conversion             | ✅ Active |
| .gif         | .jpg, .png, .webp, .tiff | Static image extraction              | ✅ Active |

### Document Formats ✅
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .docx        | .txt, .html         | Text extraction, web format                  | ✅ Active |
| .txt         | .html, .pdf*        | Web format, document creation                 | ✅ Active |
| .html        | .txt                | Text extraction                               | ✅ Active |

### Spreadsheet Formats ✅  
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .csv         | .xlsx               | Excel compatibility                           | ✅ Active |
| .xlsx, .xls  | .csv                | Data analysis, universal format               | ✅ Active |

### Audio Formats ✅
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .wav         | .mp3, .ogg, .m4a    | Compression for storage/sharing               | ✅ Active |
| .mp3         | .wav, .ogg, .m4a    | Quality improvement, format compatibility     | ✅ Active |
| .ogg, .m4a   | .mp3, .wav          | Universal compatibility                       | ✅ Active |

### Video Formats ✅
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .mp4         | .avi, .webm, .mov   | Platform compatibility                        | ✅ Active |
| .avi, .mov   | .mp4, .webm         | Modern format, web compatibility              | ✅ Active |
| .webm        | .mp4, .avi          | Universal compatibility                       | ✅ Active |

### Archive Formats ✅
| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| Any file     | .zip                | Compressed archive creation                   | ✅ Active |
| .zip         | .tar                | Unix compatibility                            | ✅ Active |

## Planned Future Conversions

| From         | To                  | Use Case                                      | Status    |
|--------------|---------------------|-----------------------------------------------|-----------|  
| .pdf         | .docx, .txt         | Editing or reusing document content           | 🚧 Planned |
| .pptx        | .pdf                | Sharing lecture slides                        | 🚧 Planned |
| .md          | .html, .pdf         | Markdown to web/print                         | 🚧 Planned |
| .epub        | .pdf                | Device compatibility                          | 🚧 Planned |
| .svg         | .png, .pdf          | Raster conversion                             | 🚧 Planned |

## Technical Notes

### Image Processing
- **Quality Settings**: JPEG/WebP at 85% quality, TIFF at 85% quality
- **Supported Input**: All major image formats including SVG (as input only)
- **PDF Creation**: Multi-image to single PDF document
- **Metadata**: Preserved where possible during conversion

### Audio/Video Processing  
- **Engine**: FFmpeg for all audio/video conversions
- **Quality**: Maintains reasonable quality while optimizing file size
- **Codecs**: Uses standard codecs for maximum compatibility
- **Bitrates**: Audio at 192kbps for MP3, lossless for WAV

### Document Processing
- **Text Extraction**: Uses Mammoth.js for DOCX processing  
- **HTML Generation**: Clean HTML output with basic styling
- **Encoding**: UTF-8 for all text operations
- **Limitations**: Complex formatting may not be preserved

### Performance
- **Processing Time**: Varies by file size and conversion complexity
- **Memory Usage**: Optimized for server environments
- **Concurrent Processing**: Supports multiple simultaneous conversions
- **File Size Limits**: 50MB per file, 10 files per session