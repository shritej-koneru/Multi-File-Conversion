#!/usr/bin/env bash

# Master Installation Script for All Multi-File Conversion Dependencies
# This script installs GraphicsMagick, Pandoc, and LibreOffice

set -e  # Exit on any error

echo "🚀 Starting installation of all dependencies..."
echo ""

# Install GraphicsMagick and ImageMagick
echo "=========================================="
echo "1/3: Installing GraphicsMagick..."
echo "=========================================="
./scripts/install-gm.sh
echo ""

# Install Pandoc
echo "=========================================="
echo "2/3: Installing Pandoc..."
echo "=========================================="
./scripts/install-pandoc.sh
echo ""

# Install LibreOffice
echo "=========================================="
echo "3/3: Installing LibreOffice..."
echo "=========================================="
./scripts/install-libreoffice.sh
echo ""

echo "=========================================="
echo "🎉 All dependencies installed successfully!"
echo "=========================================="
echo ""
echo "Installed components:"
echo "  ✅ GraphicsMagick (image conversion)"
echo "  ✅ ImageMagick (advanced image processing)"
echo "  ✅ Pandoc (document conversion)"
echo "  ✅ LibreOffice (Office suite conversion)"
echo ""
echo "🔧 The Multi-File Conversion service is ready!"
