# Multi-File Conversion - Render Deployment Files

## Essential Files for Render Deployment

### 📁 Root Files (Required)
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions  
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `render.yaml` - Render deployment configuration

### 📁 Source Code Directories
- `client/` - Frontend React application
- `server/` - Backend Express server  
- `shared/` - Shared TypeScript definitions
- `scripts/` - Installation and startup scripts

### 📁 Configuration
- `docker/` - Docker deployment files (optional for Render)
- `docs/` - Documentation (optional)

## 🚀 Render Deployment Steps

### Auto-Deploy Method:
1. **Upload project files** to Render
2. **Build command**: `npm run render:build`
3. **Start command**: `npm start`  
4. **Environment**: `NODE_ENV=production`

### Manual Method:
1. **Zip the project** (excluding .git, node_modules)
2. **Upload to Render** via dashboard
3. **Set build settings:**
   - Build Command: `./scripts/install-gm.sh && npm install && npm run build`
   - Start Command: `npm start`
   - Node Version: 18+

## 📦 Essential package.json Scripts
```json
{
  "scripts": {
    "render:build": "./scripts/install-gm.sh && npm install && npm run build",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --external:vite --external:./dev-server --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## 🔧 Key Files for Render

### render.yaml (Auto-deployment)
```yaml
services:
  - type: web
    name: multi-file-conversion
    env: node
    buildCommand: ./scripts/install-gm.sh && npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Environment Variables
- `NODE_ENV=production`
- `PORT=10000` (Render assigns automatically)

## 📋 Deployment Checklist
- [ ] All source files included
- [ ] Dependencies in package.json
- [ ] Build scripts configured  
- [ ] GraphicsMagick installation script
- [ ] Environment variables set
- [ ] Static file serving configured

## 🚨 Important Notes
- **GraphicsMagick** auto-installs via `scripts/install-gm.sh`
- **Port 10000** used in production (Render requirement)
- **Static files** served from `dist/public/`
- **API endpoints** under `/api/` prefix
- **Health check** available at `/health`