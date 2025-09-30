# Multi-File Conversion Service 🔄

A powerful web-based file conversion service that supports multiple formats including images, documents, audio, video, and archives. Built with automatic GraphicsMagick installation and Docker support.

## ✨ Features

- **🖼️ Image Conversion**: JPG, PNG, WebP, GIF, TIFF, BMP ↔ PDF and other formats
- **📄 Document Processing**: PDF ↔ Images, Text extraction, DOCX ↔ various formats
- **🎵 Audio/Video**: MP3, WAV, MP4, AVI conversion (with FFmpeg)
- **📦 Archive Support**: ZIP, TAR creation and extraction
- **🔄 Batch Processing**: Multiple files, multiple output formats
- **⚡ Auto-Installation**: GraphicsMagick and dependencies installed automatically
- **🐳 Docker Ready**: One-command deployment with all dependencies

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Clone and build
git clone <your-repo>
cd Multi-File-Conversion

# Build and run
docker build -t multi-file-conversion .
docker run -p 10000:10000 multi-file-conversion

# Access at http://localhost:10000
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

## 📋 Supported Conversions

### Image Formats
| From | To | Quality |
|------|-------|---------|
| JPG, PNG, GIF, WebP, BMP, TIFF | Any image format + PDF | High quality with optimization |

### Document Formats
| From | To | Notes |
|------|-----|-------|
| PDF | JPG, PNG, TXT | Text extraction + image conversion |
| DOCX, DOC | PDF, TXT, HTML | Preserves formatting where possible |
| TXT | PDF, DOCX, HTML | Basic formatting applied |

### Media Formats
| From | To | Requirements |
|------|-----|-------------|
| MP3, WAV, OGG, M4A | Any audio format | FFmpeg (auto-installed in Docker) |
| MP4, AVI, MOV, WebM | Any video format | FFmpeg (auto-installed in Docker) |

## 🔧 API Endpoints

### Upload Files
```bash
POST /api/upload
Content-Type: multipart/form-data

curl -X POST -F "files=@image.jpg" http://localhost:10000/api/upload
```

### Start Conversion
```bash
POST /api/convert
Content-Type: application/json

{
  "sessionId": "uuid",
  "targetFormat": "png", 
  "files": [...]
}
```

### Check Status
```bash
GET /api/conversion/:id
```

### Download Files
```bash
GET /api/download/:conversionId/:filename
```

### Health Check
```bash
GET /health

Response: {
  "status": "healthy",
  "dependencies": {
    "graphicsMagick": true,
    "imagemagick": true,
    "ffmpeg": true
  }
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Web UI │────│   Express Server │────│ File Converter  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Session Storage │    │ GraphicsMagick  │
                       └──────────────────┘    └─────────────────┘
```

## 📁 File Storage

- **Location**: `/app/uploads/` (Docker) or `./uploads/` (local)
- **Structure**: `uploads/<session-id>/<uuid>-filename.ext`
- **Cleanup**: Automatic cleanup on server restart + periodic cleanup
- **Limits**: 50MB per file, 10 files per upload

## 🔒 Security Features

- **File Type Validation**: Only allowed extensions accepted
- **Filename Sanitization**: UUIDs prevent path traversal
- **Session Isolation**: Each user session has separate directory
- **Size Limits**: Prevents abuse and disk space issues
- **Automatic Cleanup**: Regular cleanup prevents disk filling

## 📦 Dependencies

### Auto-Installed (Docker)
- GraphicsMagick - Image processing
- ImageMagick - Fallback image processing  
- Poppler Utils - PDF processing
- Ghostscript - PDF rendering
- FFmpeg - Audio/video processing

### Manual Installation (Local Dev)
```bash
# Ubuntu/Debian
sudo apt-get install graphicsmagick imagemagick poppler-utils ghostscript ffmpeg

# macOS  
brew install graphicsmagick imagemagick poppler ghostscript ffmpeg
```

## 🛠️ Configuration

### Environment Variables
```bash
NODE_ENV=production          # Environment mode
PORT=10000                   # Server port
```

### File Limits (in code)
```javascript
fileSize: 50 * 1024 * 1024,  // 50MB per file
maxFiles: 10                  // Max files per upload
```

## 🚨 Troubleshooting

### Common Issues

#### "GraphicsMagick not found"
- **Docker**: Rebuild image `docker build -t multi-file-conversion .`
- **Local**: Install with `sudo apt-get install graphicsmagick`

#### "Port already in use"
```bash
# Stop existing containers
docker stop $(docker ps -q --filter ancestor=multi-file-conversion)

# Then restart
docker run -p 10000:10000 multi-file-conversion
```

#### "Conversion failed"
- Check supported file formats
- Verify file isn't corrupted
- Check file size limits (50MB)
- View logs: `docker logs <container-id>`

### Debug Commands
```bash
# Check dependencies
npm run check-deps

# View container logs
docker logs <container-id>

# Test health endpoint
curl http://localhost:10000/health

# Check uploads directory
docker exec <container-id> ls -la /app/uploads/
```

## 📈 Performance Tips

1. **Use Docker** for consistent performance across environments
2. **Limit file sizes** for better response times
3. **Monitor disk usage** in uploads directory
4. **Use appropriate image quality** settings for size vs quality balance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test locally
4. Test Docker build: `npm run docker:build`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Need help?** Check the [Deployment Guide](deployment-guide.md) or [GraphicsMagick Setup](graphicsmagick-setup.md) for detailed instructions.