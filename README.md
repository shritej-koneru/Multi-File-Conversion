# Multi-File Conversion Service 🔄

A powerful, production-ready web service for converting files between **40+ formats**. Built with React, Express, and featuring modern format support inspired by ConvertX.

![Multi-File Conversion Service](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🖼️ **Modern Image Formats**: JPG, PNG, WebP, **AVIF**, GIF, TIFF, BMP, SVG ↔ PDF and other formats
- 📊 **Data Format Conversions**: **NEW!** JSON ↔ YAML ↔ TOML ↔ XML bidirectional conversion
- 📄 **Document Processing**: PDF ↔ Images, Text extraction, Office documents (DOCX, DOC, HTML)
- 📑 **Spreadsheets**: XLSX, XLS, CSV with JSON/YAML/XML export capability
- 🎵 **Media Support**: Audio (MP3, WAV, OGG, M4A) and Video (MP4, AVI, MOV, WebM) conversion with FFmpeg
- 📦 **Archive Creation**: ZIP and TAR archive support
- 🚀 **Auto-Installation**: GraphicsMagick and dependencies installed automatically  
- 🐳 **Docker Ready**: One-command deployment with all dependencies included
- ⚡ **Batch Processing**: Multiple files, multiple output formats, progress tracking
- 🔒 **Secure**: File validation, session isolation, automatic cleanup

## 🚀 Quick Start

### Docker (Recommended)
```bash
git clone <your-repo-url>
cd Multi-File-Conversion

# Build and run
npm run docker:build
npm run docker:run

# Or manually:
# docker build -f docker/Dockerfile -t multi-file-conversion .
# docker run -p 10000:10000 multi-file-conversion

# Access at http://localhost:10000
```

### Local Development
```bash
# Prerequisites: Node.js 18+, GraphicsMagick
npm install
npm run dev

# Access at http://localhost:5000
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📚 Full Documentation](docs/README.md) | Complete feature overview and usage guide |
| [🔄 Supported Conversions](docs/conversion_supported.md) | All supported formats and conversion matrix |
| [🚀 Deployment Guide](docs/deployment-guide.md) | Docker, Render, Railway deployment instructions |
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

### Media (Docker only)
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
- **Deployment**: Docker, Render, Railway support

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

### Container Issues
```bash
# Port in use
docker stop $(docker ps -q --filter ancestor=multi-file-conversion)

# Rebuild image  
docker build --no-cache -t multi-file-conversion .

# Check logs
docker logs <container-id>
```

### Dependency Issues
```bash
# Verify all tools are available
npm run check-deps

# Test health endpoint
curl http://localhost:10000/health
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

### Docker (Production)
```bash
# Using npm scripts (recommended)
npm run docker:build
npm run docker:run

# Or manually
docker build -f docker/Dockerfile -t multi-file-conversion .
docker run -p 10000:10000 multi-file-conversion
```

### Render (Cloud)  
```yaml
# render.yaml included - automatic deployment
runtime: docker
buildCommand: automatic
startCommand: automatic
```

### Railway (Cloud)
```bash  
# Connect GitHub repo, Railway auto-detects Docker
railway login
railway link
railway up
```

### Local (Development)
```bash
npm run dev    # Development server with hot reload
npm start      # Production server  
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`  
3. Test locally: `npm run dev`
4. Test Docker: `npm run docker:build && npm run docker:run`
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Open GitHub issue with logs and error details
- **API Problems**: See [API Reference](docs/api-reference.md)
- **Deployment**: See [Deployment Guide](docs/deployment-guide.md)

---

**Ready to convert?** Start with the [Quick Start](#-quick-start) guide or explore the [full documentation](docs/README.md)! 🚀