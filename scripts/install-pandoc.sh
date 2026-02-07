#!/usr/bin/env bash

# Pandoc Installation Script for Multi-File Conversion
# This script automatically installs Pandoc and LaTeX dependencies

set -e  # Exit on any error

echo "📚 Starting Pandoc installation..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update -y

# Install Pandoc
echo "📄 Installing Pandoc..."
apt-get install -y pandoc

# Install LaTeX packages for PDF generation
# These are needed for Pandoc to create PDFs
echo "📝 Installing LaTeX packages for PDF generation..."
apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-xetex

# Clean up package cache to reduce image size
echo "🧹 Cleaning up package cache..."
apt-get clean
rm -rf /var/lib/apt/lists/*

# Verify installation
echo "✅ Verifying Pandoc installation..."

if command -v pandoc &> /dev/null; then
    echo "✅ Pandoc installed successfully:"
    pandoc --version | head -1
else
    echo "❌ Pandoc installation failed"
    exit 1
fi

echo "🎉 Pandoc and LaTeX dependencies installed successfully!"
echo "🔧 The Multi-File Conversion service can now handle document conversions with Pandoc."
