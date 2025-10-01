#!/usr/bin/env bash

# GraphicsMagick Installation Script for Multi-File Conversion
# This script automatically installs GraphicsMagick and related dependencies

set -e  # Exit on any error

echo "🚀 Starting GraphicsMagick installation..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update -y

# Install GraphicsMagick and related dependencies
echo "🎨 Installing GraphicsMagick..."
apt-get install -y graphicsmagick

# Install additional image processing dependencies
echo "🖼️  Installing additional image processing tools..."
apt-get install -y \
    imagemagick \
    poppler-utils \
    ghostscript \
    libgraphicsmagick++-dev \
    libmagick++-dev

# Clean up package cache to reduce image size
echo "🧹 Cleaning up package cache..."
apt-get clean
rm -rf /var/lib/apt/lists/*

# Verify installations
echo "✅ Verifying installations..."

if command -v gm &> /dev/null; then
    echo "✅ GraphicsMagick installed successfully:"
    gm version | head -1
else
    echo "❌ GraphicsMagick installation failed"
    exit 1
fi

if command -v convert &> /dev/null; then
    echo "✅ ImageMagick installed successfully:"
    convert -version | head -1
else
    echo "❌ ImageMagick installation failed"
    exit 1
fi

if command -v pdfinfo &> /dev/null; then
    echo "✅ Poppler utils installed successfully:"
    pdfinfo -v 2>&1 | head -1
else
    echo "❌ Poppler utils installation failed"
    exit 1
fi

echo "🎉 All dependencies installed successfully!"
echo "🔧 The Multi-File Conversion service is ready to handle image and PDF conversions."