# Multi-File-Conversion Copilot Instructions

## Architecture Overview

This is a **full-stack TypeScript project** with a Node.js/Express backend and React frontend, unified by a single Vite build process. Key architectural patterns:

- **Unified monorepo**: Single `package.json` with both client and server dependencies
- **Shared schema**: `/shared/schema.ts` defines Drizzle ORM types used across client/server
- **Session-based file handling**: Files are organized by auto-generated session IDs in `/uploads/`
- **Single port deployment**: Server serves both API (`/api/*`) and static files on one port (required for containerized environments)

## Development Workflow

- **Start dev**: `npm run dev` - runs server with Vite dev server integration
- **Build**: `npm run build` - builds client to `/dist/public/` and server to `/dist/`
- **Database**: `npm run db:push` - applies schema changes via Drizzle Kit

## Key File Conversion Patterns

### File Processing Flow
1. Files upload to session-specific directories: `uploads/{sessionId}/`
2. `FileConverter` service handles format-specific conversion logic in `server/services/file-converter.ts`
3. Currently supports: images → jpg/png/webp/pdf via Sharp library
4. Conversion jobs stored in PostgreSQL with progress tracking

### Adding New Conversion Types
- Extend `FileConverter.convertSingleFile()` switch statement
- Add format support in `client/src/lib/file-types.ts` → `getAvailableConversions()`
- Update file validation in `server/routes.ts` → `fileFilter` regex

## Component Architecture

- **Shadcn/UI components**: All UI components in `client/src/components/ui/`
- **Page-level state management**: React Query in `client/src/lib/queryClient.ts`
- **File upload pattern**: `react-dropzone` with `FormData` → Express `multer`

## Critical Configuration

- **Vite aliases**: `@` → `client/src`, `@shared` → `shared/`
- **Port binding**: Always use `process.env.PORT || 5000` and bind to `0.0.0.0` (container requirement)
- **File cleanup**: Session cleanup on window unload via `navigator.sendBeacon`

## Database Schema

Drizzle ORM with PostgreSQL. Key tables:
- `conversions`: Job tracking with `sessionId`, `status`, `progress`, file metadata
- Schema defined in `shared/schema.ts`, shared between client/server

## Tailwind + Radix UI Pattern

Uses CSS custom properties for theming. Component variants follow `class-variance-authority` pattern. Dark mode via class-based switching.

## Production Considerations

- `NODE_ENV=production` disables Vite dev server, serves from `/dist/public/`
- File cleanup service runs periodically via `server/services/cleanup.ts`
- Session-based temporary storage prevents cross-user file access