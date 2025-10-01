# Troubleshooting Guide 🔧

Common issues and solutions for the Multi-File Conversion service.

## 🚨 Common Issues

### Container Won't Start

#### "Port already allocated"
```bash
# Error: Bind for 0.0.0.0:10000 failed: port is already allocated

# Solution: Stop existing containers
docker stop $(docker ps -q --filter ancestor=multi-file-conversion)
docker run -p 10000:10000 multi-file-conversion
```

#### "GraphicsMagick not found"
```bash
# Error: gm: command not found

# Solution 1: Rebuild Docker image
docker build --no-cache -t multi-file-conversion .

# Solution 2: Check installation script
./install-gm.sh
```

### Conversion Failures

#### "Conversion failed" errors
1. **Check file format support**: See [conversion_supported.md](conversion_supported.md)
2. **Verify file size**: Must be under 50MB
3. **Check file corruption**: Try with a different file
4. **View detailed logs**: `docker logs <container-id>`

#### "File type not supported"
```bash
# Check allowed extensions in server logs
# Currently supported: jpg, png, pdf, docx, mp3, mp4, zip, etc.
```

### Upload Issues

#### "No files uploaded"
- Ensure files are selected in the web interface
- Check file size limits (50MB per file, 10 files max)
- Verify file extensions are supported

#### Files disappear after upload
- **Normal behavior**: Files are cleaned up on server restart
- **To persist**: Use Docker volumes (see deployment guide)

### Web Interface Issues

#### Only seeing JSON response
```bash
# If you see {"status":"healthy"...} instead of web interface:

# Check you're accessing the right URL:
# ✅ Correct: http://localhost:10000
# ❌ Wrong: http://localhost:10000/health
```

#### 404 errors on static files
```bash
# Solution: Rebuild with proper static files
npm run build
docker build -t multi-file-conversion .
```

---

## 🔍 Debugging Commands

### Check Container Status
```bash
# List running containers
docker ps

# Check container logs
docker logs <container-id>

# Execute commands in container
docker exec -it <container-id> bash
```

### Verify Dependencies
```bash
# Check all dependencies
npm run check-deps

# Test specific tools
docker exec <container-id> gm version      # GraphicsMagick
docker exec <container-id> convert -version  # ImageMagick
docker exec <container-id> ffmpeg -version   # FFmpeg
```

### Check Uploads Directory
```bash
# Local development
ls -la uploads/

# Docker container
docker exec <container-id> ls -la /app/uploads/

# Watch for new uploads
docker exec <container-id> watch -n 1 'ls -la /app/uploads/'
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:10000/health

# Test file upload
curl -X POST -F "files=@test.txt" http://localhost:10000/api/upload

# Check available formats
curl http://localhost:10000/api/formats/<session-id>
```

---

## 🛠️ Development Issues

### Build Failures

#### "vite: not found"
```bash
# Error during Docker build
# Solution: Install all dependencies before build
npm ci  # Not npm ci --only=production
npm run build
```

#### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Local Development

#### Port conflicts
```bash
# If port 5000 is in use
PORT=3000 npm run dev

# Or kill existing process
lsof -ti:5000 | xargs kill -9
```

#### Missing dependencies
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install graphicsmagick imagemagick poppler-utils ffmpeg

# macOS
brew install graphicsmagick imagemagick poppler ffmpeg
```

---

## 📊 Performance Issues

### Slow Conversions
1. **Check file size**: Larger files take longer
2. **Monitor resources**: Use `docker stats <container-id>`
3. **Increase memory**: Add `--memory=2g` to docker run
4. **Check disk space**: Ensure adequate free space

### Out of Memory Errors
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start

# Or for Docker:
docker run --memory=2g -p 10000:10000 multi-file-conversion
```

### Disk Space Issues
```bash
# Check disk usage
df -h
docker system df

# Clean up old containers/images
docker system prune -f

# Manual cleanup uploads
docker exec <container-id> rm -rf /app/uploads/*
```

---

## 🔐 Security Issues

### File Upload Vulnerabilities
- **File type validation**: Only allowed extensions accepted
- **Size limits**: 50MB per file prevents abuse
- **Filename sanitization**: UUIDs prevent path traversal
- **Session isolation**: Each session has separate directory

### Container Security
```bash
# Run with non-root user (add to Dockerfile)
USER node

# Limit container resources
docker run --memory=1g --cpus=1 multi-file-conversion

# Read-only file system (except uploads)
docker run --read-only --tmpfs /tmp multi-file-conversion
```

---

## 📱 Platform-Specific Issues

### Render Deployment
```bash
# If build fails on Render:
# 1. Use Docker deployment method
# 2. Check build logs for specific errors
# 3. Verify render.yaml configuration
```

### Railway Deployment
```bash
# Ensure Docker deployment is selected
# Check that PORT environment variable is set
# Verify health check endpoint: /health
```

### Local Docker Issues
```bash
# Docker daemon not running
sudo systemctl start docker

# Permission errors
sudo usermod -aG docker $USER
# (logout/login required)

# Docker out of space
docker system prune -a
```

---

## 📞 Getting Help

### Log Information to Provide
1. **Container logs**: `docker logs <container-id>`
2. **System info**: `docker version`, `npm --version`
3. **Error message**: Full error text with stack trace
4. **File details**: Size, format, source of problematic files
5. **Environment**: Local dev vs Docker vs deployed

### Useful Debug Info
```bash
# System information
uname -a
docker info
node --version
npm --version

# Service status
curl -s http://localhost:10000/health | jq .

# Container resource usage
docker stats --no-stream
```

### Quick Fixes Checklist
- [ ] Restart container: `docker restart <container-id>`
- [ ] Rebuild image: `docker build --no-cache -t multi-file-conversion .`
- [ ] Clear uploads: `docker exec <container-id> rm -rf /app/uploads/*`
- [ ] Check dependencies: `npm run check-deps`
- [ ] Test with small file: `curl -X POST -F "files=@small-test.txt" http://localhost:10000/api/upload`
- [ ] Verify web interface: Open http://localhost:10000 in browser

---

Most issues can be resolved by rebuilding the Docker image or restarting the container. If problems persist, check the container logs for specific error messages.