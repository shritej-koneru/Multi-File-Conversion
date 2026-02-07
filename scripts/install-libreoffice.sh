#!/usr/bin/env bash

# LibreOffice Installation Script for Multi-File Conversion
# This script automatically installs LibreOffice for headless document conversion

set -e  # Exit on any error

echo "📊 Starting LibreOffice installation..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update -y

# Install LibreOffice core components
echo "📄 Installing LibreOffice..."
apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-core

# Install additional fonts for better document rendering
echo "🔤 Installing additional fonts..."
apt-get install -y \
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf

# Clean up package cache to reduce image size
echo "🧹 Cleaning up package cache..."
apt-get clean
rm -rf /var/lib/apt/lists/*

# Verify installation
echo "✅ Verifying LibreOffice installation..."

if command -v soffice &> /dev/null; then
    echo "✅ LibreOffice installed successfully:"
    soffice --version
else
    echo "❌ LibreOffice installation failed"
    exit 1
fi

echo "🎉 LibreOffice installed successfully!"
echo "🔧 The Multi-File Conversion service can now handle complex Office documents."
