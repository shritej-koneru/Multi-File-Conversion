# Test Files for Multi-File Conversion Service

This directory contains sample files for testing the conversion service.

## 📁 Directory Structure

```
test-files/
├── documents/     # Document format test files
├── images/        # Image format test files
├── audio/         # Audio format test files (to be added)
├── video/         # Video format test files (to be added)
├── spreadsheets/  # Spreadsheet test files (to be added)
└── presentations/ # Presentation test files (to be added)
```

## 📄 Documents

| File | Format | Size | Features Tested |
|------|--------|------|----------------|
| `sample.md` | Markdown | ~1.6 KB | Headers, **bold**, *italic*, tables, code blocks, lists |
| `sample.txt` | Plain Text | ~1.8 KB | Multi-paragraph text, special characters, line breaks |
| `sample.docx` | Word Document | ~1.3 MB | **BEST for testing DOCX→PDF formatting!** Real document with fonts, styles |
| `sample.pdf` | PDF | ~86 KB | Multi-page PDF for testing PDF→Image conversions |
| `sample.json` | JSON | ~1.2 KB | Nested objects, arrays, data conversion |
| `sample.csv` | CSV | ~452 B | Spreadsheet data, headers, multiple columns |
| `sample.yaml` | YAML | ~2.1 KB | Configuration data, nested structures, lists |
| `sample.xml` | XML | ~4 KB | Structured data with attributes and elements |

## 🖼️ Images

| File | Format | Size | Features Tested |
|------|--------|------|----------------|
| `sample.jpg` | JPEG | ~1 MB | Photo quality, compression, color accuracy |
| `sample.png` | PNG | ~1 MB | Lossless quality, transparency support (if applicable) |
| `sample.webp` | WebP | ~30 KB | Modern format, compression efficiency |
| `sample.svg` | SVG | ~1.7 KB | Vector graphics, shapes, gradients, text |

## 🎵 Audio

| File | Format | Size | Features Tested |
|------|--------|------|----------------|
| `sample.mp3` | MP3 | ~1 MB | Compressed audio, MP3→WAV/OGG conversions |
| `sample.wav` | WAV | ~1 MB | Uncompressed audio, WAV→MP3 conversions |

## 🎬 Video

| File | Format | Size | Features Tested |
|------|--------|------|----------------|
| `sample.mp4` | MP4 | ~1.5 MB | Video conversion, MP4→AVI/WebM conversions |

## 🎯 Usage with Test Conversion Feature

1. Navigate to the website's **Test Conversion** section
2. Select a test file from the dropdown
3. Choose your target format
4. Click "Convert" to test the conversion
5. Download and verify the output preserves formatting

## ✅ What to Test

### Document Conversions (⭐ PRIORITY)
- ✅ **sample.docx → PDF**: Verify fonts, tables, styles maintained (**THIS IS THE BIG ONE!**)
- ✅ **sample.md → PDF**: Check headers, tables, code blocks, lists preserved
- ✅ **sample.txt → PDF**: Ensure paragraphs and spacing maintained
- ✅ **sample.json → YAML/TOML/XML**: Validate data structure conversion
- ✅ **sample.yaml → JSON/XML**: Check nested structure preservation
- ✅ **sample.xml → JSON/YAML**: Verify attribute and element conversion
- ✅ **sample.csv → JSON/XLSX**: Check column headers and data types
- ✅ **sample.pdf → PNG/JPG**: Test PDF to image conversion

### Image Conversions
- ✅ **sample.svg → PNG**: Verify rasterization quality
- ✅ **sample.png → JPG**: Check color accuracy
- ✅ **sample.jpg → WEBP**: Verify compression and quality
- ✅ **sample.webp → JPG/PNG**: Test modern format compatibility

### Audio Conversions (Docker/FFmpeg required)
- ✅ **sample.mp3 → WAV**: Test lossy to lossless conversion
- ✅ **sample.wav → MP3**: Check compression quality
- ✅ **sample.mp3 → OGG**: Verify alternative format support

### Video Conversions (Docker/FFmpeg required)
- ✅ **sample.mp4 → AVI**: Test video format conversion
- ✅ **sample.mp4 → WebM**: Check web-optimized output

### Quality Indicators
✅ **Good conversion**: Formatting, fonts, colors, structure preserved
❌ **Poor conversion**: Plain text only, no formatting, missing elements

## 🔧 Tools Required for Best Quality

For optimal test results, install:
- **Pandoc**: Markdown/document conversions
- **LibreOffice**: Office document formatting
- **FFmpeg**: Audio/video (Docker only)

See main README for installation instructions.

## 📝 Adding New Test Files

To add new test files:
1. Create file in appropriate category directory
2. Use descriptive content that demonstrates format features
3. Update this README with file description
4. Test the file with multiple target formats
5. Verify conversion quality

---

**Test files are designed to demonstrate successful conversions with full formatting preservation!**
