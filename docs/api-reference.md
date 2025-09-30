# API Reference 📡

Complete API documentation for the Multi-File Conversion service.

## Base URL

- **Local Development**: `http://localhost:5000`
- **Production**: `http://localhost:10000` (Docker)

## Authentication

No authentication required. Sessions are managed automatically via session IDs.

---

## 📤 File Upload

### `POST /api/upload`

Upload one or more files for conversion.

#### Request
```bash
POST /api/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File(s) to upload (max 10 files, 50MB each)

#### Example
```bash
# Single file
curl -X POST -F "files=@document.pdf" http://localhost:10000/api/upload

# Multiple files  
curl -X POST \
  -F "files=@image1.jpg" \
  -F "files=@document.pdf" \
  -F "files=@audio.mp3" \
  http://localhost:10000/api/upload
```

#### Response
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "files": [
    {
      "name": "document.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "extension": ".pdf",
      "savedPath": "/app/uploads/550e8400-e29b-41d4-a716-446655440000/uuid-document.pdf"
    }
  ]
}
```

#### Error Responses
- `400`: No files uploaded
- `400`: File type not supported  
- `413`: File too large (>50MB)
- `500`: Upload failed

---

## 🔄 Start Conversion

### `POST /api/convert`

Convert uploaded files to target format(s).

#### Request
```bash
POST /api/convert
Content-Type: application/json
```

**Body:**
```json
{
  "sessionId": "string",
  "targetFormat": "string",      // Single format
  "targetFormats": ["string"],   // Multiple formats (optional)
  "files": [
    {
      "name": "string",
      "size": number,
      "type": "string", 
      "extension": "string",
      "savedPath": "string"
    }
  ]
}
```

#### Example
```bash
# Single format conversion
curl -X POST http://localhost:10000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "targetFormat": "jpg",
    "files": [...]
  }'

# Multiple format conversion
curl -X POST http://localhost:10000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000", 
    "targetFormats": ["jpg", "png", "pdf"],
    "files": [...]
  }'
```

#### Response
```json
{
  "conversionId": "conv_123456789"
}
```

#### Error Responses  
- `400`: Missing required fields
- `400`: Unsupported target format
- `500`: Conversion failed

---

## 📊 Check Conversion Status

### `GET /api/conversion/:id`

Get the status and progress of a conversion.

#### Request
```bash
GET /api/conversion/{conversionId}
```

#### Example
```bash
curl http://localhost:10000/api/conversion/conv_123456789
```

#### Response
```json
{
  "id": "conv_123456789",
  "status": "completed",           // "processing", "completed", "failed"
  "progress": 100,                 // 0-100
  "downloadUrl": "/api/download/conv_123456789/converted_files.zip",
  "convertedFiles": [
    {
      "originalName": "document.pdf",
      "convertedName": "document.jpg", 
      "size": 524288,
      "path": "/app/uploads/session/document.jpg"
    }
  ]
}
```

#### Status Values
- `processing`: Conversion in progress
- `completed`: Conversion successful
- `failed`: Conversion failed

#### Error Responses
- `404`: Conversion not found
- `500`: Status check failed

---

## 📥 Download Converted Files

### `GET /api/download/:conversionId/:filename`

Download a converted file.

#### Request
```bash
GET /api/download/{conversionId}/{filename}
```

#### Example
```bash
# Download single file
curl -O http://localhost:10000/api/download/conv_123456789/document.jpg

# Download ZIP (multiple files)
curl -O http://localhost:10000/api/download/conv_123456789/converted_files.zip
```

#### Response
- **Success**: File download (binary data)
- **Error**: JSON error message

#### Error Responses
- `404`: File not found
- `404`: Conversion not completed
- `500`: Download failed

---

## 📋 Get Available Formats

### `GET /api/formats/:sessionId`

Get available conversion formats for uploaded files.

#### Request
```bash
GET /api/formats/{sessionId}
```

#### Example
```bash
curl http://localhost:10000/api/formats/550e8400-e29b-41d4-a716-446655440000
```

#### Response
```json
[
  {
    "id": "jpg",
    "name": "JPEG",
    "description": "Best for photos, smaller file size",
    "icon": "fas fa-file-image"
  },
  {
    "id": "pdf", 
    "name": "PDF",
    "description": "Universal document format",
    "icon": "fas fa-file-pdf"
  }
]
```

---

## 🏥 Health Check

### `GET /health`

Check service health and dependencies.

#### Request
```bash
GET /health
```

#### Example
```bash
curl http://localhost:10000/health
```

#### Response
```json
{
  "status": "healthy",
  "message": "Multi-File Conversion Service is running",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "dependencies": {
    "graphicsMagick": true,
    "imagemagick": true,
    "ffmpeg": false
  }
}
```

---

## 🧹 Cleanup Operations

### `POST /api/cleanup/:sessionId`

Clean up files for a specific session.

#### Request
```bash
POST /api/cleanup/{sessionId}
```

#### Example
```bash
curl -X POST http://localhost:10000/api/cleanup/550e8400-e29b-41d4-a716-446655440000
```

#### Response
```json
{
  "message": "Session cleaned up successfully"
}
```

### `POST /api/cleanup`

Clean up all expired files.

#### Request
```bash
POST /api/cleanup
```

#### Example
```bash
curl -X POST http://localhost:10000/api/cleanup
```

#### Response
```json
{
  "message": "Cleanup completed successfully"
}
```

---

## 📝 Supported File Types

### Upload Filter
Only these file extensions are accepted:

**Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.tiff`, `.tif`, `.svg`

**Documents**: `.pdf`, `.docx`, `.doc`, `.pptx`, `.ppt`, `.txt`, `.md`, `.html`

**Spreadsheets**: `.csv`, `.xlsx`, `.xls`, `.tsv`

**Audio**: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`

**Video**: `.mp4`, `.avi`, `.mov`, `.webm`, `.mkv`

**Archives**: `.zip`, `.rar`, `.tar`, `.gz`, `.7z`

---

## ⚡ Rate Limits

- **File Size**: 50MB per file
- **File Count**: 10 files per upload
- **Concurrent Conversions**: No limit (processing is queued)
- **Session Timeout**: Files cleaned up after server restart

---

## 🔍 Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Missing fields, invalid format, file too large |
| 404 | Not Found | Conversion not found, file not found |
| 413 | Payload Too Large | File exceeds 50MB limit |
| 415 | Unsupported Media Type | File type not supported |
| 500 | Internal Server Error | Conversion failed, server error |

---

## 📖 Usage Examples

### Complete Workflow
```bash
# 1. Upload files
RESPONSE=$(curl -s -X POST -F "files=@image.jpg" http://localhost:10000/api/upload)
SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')

# 2. Start conversion
CONV_RESPONSE=$(curl -s -X POST http://localhost:10000/api/convert \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"targetFormat\":\"png\",\"files\":$(echo $RESPONSE | jq '.files')}")
CONV_ID=$(echo $CONV_RESPONSE | jq -r '.conversionId')

# 3. Check status
curl http://localhost:10000/api/conversion/$CONV_ID

# 4. Download result  
curl -O http://localhost:10000/api/download/$CONV_ID/image.png
```

### Batch Processing
```bash
# Upload multiple files
curl -X POST \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  -F "files=@image.jpg" \
  http://localhost:10000/api/upload

# Convert to multiple formats
curl -X POST http://localhost:10000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-id",
    "targetFormats": ["jpg", "png", "pdf"],
    "files": [...]
  }'
```