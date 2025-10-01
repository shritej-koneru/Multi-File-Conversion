# Deployment Guide 🚀

Complete deployment guide for the Multi-File Conversion service across different platforms.

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker installed on your system
- Docker Hub account (for pushing images)

### Build and Run Locally
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Deploy to Render (Docker)
1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically use the `Dockerfile` and `render.yaml` configuration
4. GraphicsMagick and all dependencies will be installed automatically

## 🌐 Render Web Service (Non-Docker)

### Option 1: Using render.yaml (Recommended)
1. Push your code to GitHub with the `render.yaml` file
2. Connect to Render - it will automatically detect the configuration
3. The `install-gm.sh` script will run during build

### Option 2: Manual Configuration
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command**: `./install-gm.sh && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 (or later)

### Environment Variables
Set these in your Render dashboard:
```
NODE_ENV=production
PORT=10000
```

## 🔧 Local Development Setup

### Install Dependencies Manually
```bash
# Install GraphicsMagick (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y graphicsmagick imagemagick poppler-utils

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### Verify Installation
```bash
# Check GraphicsMagick
gm version

# Check ImageMagick
convert -version

# Check PDF tools
pdfinfo -v
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Permission Denied on install-gm.sh
```bash
chmod +x install-gm.sh
```

#### 2. apt-get not available
- Use Docker deployment instead
- Or use a platform that supports system package installation

#### 3. PDF Conversion Failures
- Ensure Ghostscript is installed: `gs -version`
- Check file permissions in uploads directory
- Verify poppler-utils: `pdfinfo -v`

#### 4. Image Conversion Issues
- Test GraphicsMagick: `gm identify <image-file>`
- Test ImageMagick: `identify <image-file>`
- Check supported formats: `gm -list format`

### Performance Optimization

#### For Production
1. **Use Docker** for consistent environments
2. **Enable compression** in your reverse proxy
3. **Set appropriate memory limits** for large file processing
4. **Monitor disk usage** in uploads directory

#### Memory Settings
```bash
# For large file processing, increase Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

## 📋 Deployment Checklist

### Before Deployment
- [ ] Test `install-gm.sh` script locally
- [ ] Verify all file conversions work
- [ ] Check environment variables
- [ ] Test with sample files
- [ ] Ensure uploads directory exists

### After Deployment
- [ ] Test basic file upload
- [ ] Test image conversions
- [ ] Test PDF conversions
- [ ] Test audio/video conversions (if using FFmpeg)
- [ ] Monitor application logs
- [ ] Check disk space usage

## 🔄 Auto-Installation Features

The `install-gm.sh` script automatically installs:
- ✅ GraphicsMagick - Core graphics processing
- ✅ ImageMagick - Additional image tools  
- ✅ Poppler Utils - PDF processing
- ✅ Ghostscript - PostScript/PDF rendering
- ✅ Development libraries - For native modules

### Script Features
- Error handling with `set -e`
- Verification of installations
- Clean package cache to reduce size
- Detailed logging for debugging

## 📞 Support

If you encounter issues:
1. Check the application logs
2. Verify GraphicsMagick installation: `gm version`
3. Test file permissions in uploads directory
4. Review the deployment guide for your platform

### Log Locations
- **Development**: Console output
- **Production**: Check your platform's log viewer
- **Docker**: `docker logs <container-name>`