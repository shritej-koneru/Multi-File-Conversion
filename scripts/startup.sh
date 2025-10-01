#!/usr/bin/env bash

# Startup script for Multi-File Conversion Service
# This script verifies dependencies and starts the application

set -e

echo "🚀 Starting Multi-File Conversion Service..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if command_exists node; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check npm
if command_exists npm; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
    exit 1
fi

# Check GraphicsMagick
if command_exists gm; then
    echo "✅ GraphicsMagick: $(gm version | head -1)"
else
    echo "⚠️  GraphicsMagick not found - some image conversions may fail"
fi

# Check ImageMagick
if command_exists convert; then
    echo "✅ ImageMagick: $(convert -version | head -1)"
else
    echo "⚠️  ImageMagick not found - some image conversions may fail"
fi

# Check Poppler utils
if command_exists pdfinfo; then
    echo "✅ Poppler utils: $(pdfinfo -v 2>&1 | head -1)"
else
    echo "⚠️  Poppler utils not found - PDF processing may be limited"
fi

# Check FFmpeg (optional)
if command_exists ffmpeg; then
    echo "✅ FFmpeg: $(ffmpeg -version 2>&1 | head -1)"
else
    echo "⚠️  FFmpeg not found - audio/video conversions will not work"
fi

# Create uploads directory
echo "📁 Ensuring uploads directory exists..."
mkdir -p uploads

# Set permissions
chmod 755 uploads

echo "🎉 All checks completed!"

# Start the application
echo "🌟 Starting the application..."
exec "$@"