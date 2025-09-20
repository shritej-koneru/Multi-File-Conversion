# File Conversion Website

## Overview

This is a multi-extension file conversion website that allows users to upload one or more files and convert them into different formats. The application features a modern React frontend with TypeScript and a Node.js Express backend, providing seamless file upload, conversion, and download functionality. Users can drag and drop files, select from available conversion formats based on uploaded file types, and download converted files individually or as ZIP archives.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: react-dropzone for drag-and-drop file upload functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: 
  - Sharp for image conversions (PNG, JPG, WebP, etc.)
  - PDF-lib for PDF generation and manipulation
  - Multer for multipart file upload handling
  - Archiver for creating ZIP files when multiple files are converted
- **Session Management**: In-memory storage with session-based file organization
- **File Storage**: Local filesystem with session-based directories under `/uploads`

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM configured for production
- **Schema**: 
  - Users table for authentication (currently unused)
  - Conversions table for tracking conversion jobs with metadata
  - JSON fields for storing file information arrays
- **Development Storage**: In-memory fallback storage for development environments
- **File Storage**: Temporary local storage with automatic cleanup of expired conversions

### Authentication and Authorization
- **Current State**: Basic session-based architecture prepared but not actively used
- **Session Management**: Express sessions with potential PostgreSQL session store
- **File Access**: Session-based file isolation to prevent cross-user access
- **Security**: File type validation, size limits (50MB), and sanitized file naming

### External Dependencies
- **Database**: Neon Database serverless PostgreSQL for production
- **File Processing Libraries**:
  - Sharp for high-performance image processing
  - PDF-lib for PDF manipulation
  - Archiver for ZIP file creation
- **UI Framework**: Radix UI for accessible component primitives
- **Development Tools**: 
  - Replit-specific plugins for development environment
  - Vite with React plugin for fast development builds
  - ESBuild for production server bundling

The architecture supports both single and multiple file conversions, with intelligent format detection and availability based on uploaded file types. The system includes automatic cleanup of expired files and conversions, progress tracking for long-running operations, and responsive design for mobile and desktop use.