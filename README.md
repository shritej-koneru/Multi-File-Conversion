# Multi-File Conversion Website

A modern web application for converting files between different formats, built with React, TypeScript, and Node.js.

## Features

- 📁 Upload single or multiple files (drag & drop)
- 🎯 Smart suggestions for compatible output formats
- 📦 Batch conversion with ZIP download
- 🔒 Secure temporary storage with auto-cleanup
- ⚡ Real-time conversion progress tracking
- 📱 Responsive design for all devices

## Currently Supported Conversions

### Image Formats
- **From:** JPG, PNG, WebP, GIF, BMP, TIFF
- **To:** JPG, PNG, WebP, PDF
- **Use Cases:** Format compatibility, web optimization, document compilation

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **File Processing:** Sharp (images), PDF-lib (PDF generation)
- **Database:** Drizzle ORM (configurable)
- **UI Components:** Radix UI, Lucide Icons

## Setup & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Multi-File-Conversion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Project Structure
```
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript schemas
├── uploads/         # Temporary file storage
└── docs/           # Documentation
```

## API Endpoints

- `POST /api/upload` - Upload files
- `GET /api/formats/:sessionId` - Get available conversion formats
- `POST /api/convert` - Start conversion process
- `GET /api/conversion/:id` - Check conversion status
- `GET /api/download/:conversionId/:filename` - Download converted files

## Configuration

- **File Size Limit:** 50MB per file
- **Supported Uploads:** 10 files maximum
- **Cleanup:** Temporary files auto-deleted after 24 hours
- **Session Management:** UUID-based session tracking

---

**Note:** This project is actively being developed. More conversion formats will be added in future releases.
