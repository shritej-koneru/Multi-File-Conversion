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

| File | Format | Features Tested |
|------|--------|----------------|
| `sample.md` | Markdown | Headers, **bold**, *italic*, tables, code blocks, lists |
| `sample.txt` | Plain Text | Multi-paragraph text, special characters, line breaks |
| `sample.json` | JSON | Nested objects, arrays, data conversion |
| `sample.csv` | CSV | Spreadsheet data, headers, multiple columns |

## 🖼️ Images

| File | Format | Features Tested |
|------|--------|----------------|
| `sample.svg` | SVG | Vector graphics, shapes, gradients, text |

## 🎯 Usage with Test Conversion Feature

1. Navigate to the website's **Test Conversion** section
2. Select a test file from the dropdown
3. Choose your target format
4. Click "Convert" to test the conversion
5. Download and verify the output preserves formatting

## ✅ What to Test

### Document Conversions
- ✅ **Markdown → PDF**: Verify headers, tables, code blocks preserved
- ✅ **DOCX → PDF**: Check fonts, styles, images intact
- ✅ **TXT → PDF**: Ensure paragraphs and spacing maintained
- ✅ **JSON → YAML/TOML/XML**: Validate data structure conversion
- ✅ **CSV → JSON/XLSX**: Check column headers and data types

### Image Conversions
- ✅ **SVG → PNG**: Verify rasterization quality
- ✅ **PNG → JPG**: Check color accuracy
- ✅ **JPG → WEBP**: Verify compression and quality

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
