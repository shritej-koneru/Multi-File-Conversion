# Multi-File Conversion Service 🔄

A powerful, production-ready web service for converting files between **40+ formats**. Built with React, Express, and featuring modern format support.

![Multi-File Conversion Service](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🖼️ **Modern Image Formats**: JPG, PNG, WebP, **AVIF**, GIF, TIFF, BMP, SVG ↔ PDF and other formats
- 📄 **Document Processing with Formatting**: 
  - ✅ **DOCX → PDF** with full formatting preservation (via LibreOffice)
  - ✅ **Markdown → PDF** with headers, tables, code blocks (via Pandoc + LibreOffice)
  - ✅ **Auto-detection** of conversion tools (no PATH configuration needed)
  - PDF ↔ Images, Text extraction, HTML conversion
- 📊 **Data Format Conversions**: **NEW!** JSON ↔ YAML ↔ TOML ↔ XML bidirectional conversion
- 📑 **Spreadsheets**: XLSX, XLS, CSV with JSON/YAML/XML export capability
- 🎵 **Media Support**: Audio (MP3, WAV, OGG, M4A) and Video (MP4, AVI, MOV, WebM) conversion with FFmpeg
- 📦 **Archive Creation**: ZIP and TAR archive support
- ⚡ **Batch Processing**: Multiple files, multiple output formats, progress tracking
- 🔒 **Secure**: File validation, session isolation, automatic cleanup

## 🚀 Quick Start

```bash
git clone <your-repo-url>
cd Multi-File-Conversion

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

### 📚 Optional: Enhanced Document Conversion (⭐ Recommended)

For **high-quality document conversions with formatting preservation**, install LibreOffice and Pandoc:

#### What You Get:
- ✅ **DOCX → PDF**: Full formatting (fonts, tables, images, styles)
- ✅ **Markdown → PDF**: Headers, tables, code blocks, lists preserved
- ✅ **Auto-detection**: No PATH configuration needed
- ❌ **Without tools**: Plain text only, all formatting lost

#### Installation:

**Windows (PowerShell):**
```powershell
# Install using winget (Windows Package Manager)
winget install --id JohnMacFarlane.Pandoc
winget install --idTheDocumentFoundation.LibreOffice

# Then restart your PowerShell/terminal
```

**Linux:**
```bash
sudo apt-get install pandoc libreoffice -y
```

**Already Installed**: The server auto-detects tools even if not in PATH!

See [Conversion Tools Setup](docs/conversion-tools-setup.md) for detailed installation guide.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📚 Full Documentation](docs/README.md) | Complete feature overview and usage guide |
| [🔄 Supported Conversions](docs/conversion_supported.md) | All supported formats and conversion matrix |
| [🚀 Deployment Guide](docs/deployment-guide.md) | Render, Railway deployment instructions |
| [🛠️ Conversion Tools Setup](docs/conversion-tools-setup.md) | Install LibreOffice/Pandoc for best quality |
| [📡 API Reference](docs/api-reference.md) | Complete REST API documentation |
| [🔧 Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

## 🎯 Supported Formats

### Images
**JPG, PNG, GIF, WebP, BMP, TIFF, SVG, AVIF** → **JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, PDF**

### Documents  
**PDF, DOCX, DOC, TXT, HTML** → **PDF, Images (JPG/PNG), TXT, HTML**

### Spreadsheets
**XLSX, XLS, CSV** → **CSV, XLSX, PDF, HTML, JSON, YAML, XML**

### Data Formats
**JSON, YAML, TOML, XML** ↔ **JSON, YAML, TOML, XML**  
**CSV** → **JSON, YAML, XML**

### Media (requires FFmpeg)
**MP3, WAV, OGG, M4A** ↔ **MP3, WAV, OGG, M4A**  
**MP4, AVI, MOV, WebM** ↔ **MP4, AVI, MOV, WebM**

### Archives
**Any files** → **ZIP, TAR**

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Web UI │────│   Express API    │────│ File Converter  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Session Storage │    │ GraphicsMagick  │
                       └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Multer (file uploads)
- **Processing**: GraphicsMagick, ImageMagick, FFmpeg, Poppler Utils
- **Storage**: File-based with session management
- **Deployment**: Render, Railway

## 📊 API Overview

### Upload Files
```bash
POST /api/upload
# Upload up to 10 files (50MB each)
```

### Convert Files  
```bash
POST /api/convert
# Convert to single or multiple formats
```

### Check Status
```bash  
GET /api/conversion/:id
# Real-time conversion progress
```

### Download Results
```bash
GET /api/download/:conversionId/:filename
# Download converted files or ZIP
```

### Health Check
```bash
GET /health
# Service status and dependencies
```

See [API Reference](docs/api-reference.md) for complete documentation.

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production    # Environment mode
PORT=10000            # Server port (default: 5000 dev, 10000 prod)
```

### File Limits
- **Max file size**: 50MB per file
- **Max files**: 10 files per upload  
- **Supported extensions**: 25+ formats (see [conversion matrix](docs/conversion_supported.md))

## 🚨 Quick Troubleshooting

### PDF Formatting Issues
```bash
# Check if conversion tools are detected
GET http://localhost:5000/health
# Look for: pandocAvailable, libreofficeAvailable

# Windows: Restart terminal after installing Pandoc/LibreOffice
# Tools are auto-detected even if not in PATH!
```

### Dependency Issues
```bash
# Verify all tools are available
npm run check-deps

# Test health endpoint
curl http://localhost:5000/health
```

See [Troubleshooting Guide](docs/troubleshooting.md) for detailed solutions.

## 🔐 Security Features

- **File Type Validation**: Only allowed extensions accepted
- **Filename Sanitization**: UUIDs prevent path traversal attacks  
- **Session Isolation**: Each user session has separate directory
- **Size Limits**: Prevents disk space abuse
- **Automatic Cleanup**: Temporary files cleaned up regularly

## 📈 Performance

- **Processing Speed**: 1-30 seconds depending on file size/format
- **Memory Usage**: ~256MB base, scales with file size  
- **Concurrent Users**: Supports multiple simultaneous conversions
- **File Throughput**: Optimized for files under 10MB

## 🚀 Deployment Options

### Render (Cloud)  
```yaml
# render.yaml included - automatic deployment
runtime: node
buildCommand: npm install && npm run build
startCommand: npm start
```

### Railway (Cloud)
```bash  
# Connect GitHub repo, Railway auto-detects Node.js
railway login
railway link
railway up
```

### Local
```bash
npm run dev    # Development server with hot reload
npm start      # Production server  
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`  
3. Test locally: `npm run dev`
4. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Open GitHub issue with logs and error details
- **API Problems**: See [API Reference](docs/api-reference.md)
- **Deployment**: See [Deployment Guide](docs/deployment-guide.md)

---

**Ready to convert?** Start with the [Quick Start](#-quick-start) guide or explore the [full documentation](docs/README.md)!
