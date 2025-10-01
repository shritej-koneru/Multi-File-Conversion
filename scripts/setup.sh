#!/usr/bin/env bash

# Combined setup script for Multi-File Conversion Service
# This script either verifies existing dependencies or installs them

set -e

echo "🚀 Multi-File Conversion Service Setup"
echo "======================================"

# Function to check if we can install packages
can_install_packages() {
    if [ "$EUID" -eq 0 ]; then
        return 0  # Running as root
    elif sudo -n true 2>/dev/null; then
        return 0  # Can sudo without password
    else
        return 1  # Cannot install packages
    fi
}

# Function to install if missing
install_if_missing() {
    local cmd="$1"
    local package="$2"
    local name="$3"
    
    if command -v "$cmd" >/dev/null 2>&1; then
        echo "✅ $name: Already installed"
        return 0
    else
        echo "❌ $name: Not found"
        if can_install_packages; then
            echo "📦 Installing $name..."
            if [ "$package" = "graphicsmagick" ]; then
                apt-get update -y
                apt-get install -y graphicsmagick imagemagick poppler-utils ghostscript
            else
                apt-get install -y "$package"
            fi
            echo "✅ $name: Installed successfully"
        else
            echo "⚠️  Cannot install $name (no sudo access)"
            echo "   Please install manually or run with appropriate permissions"
            return 1
        fi
    fi
}

# Check if this is a production environment
if [ "${NODE_ENV}" = "production" ] || [ "${RENDER}" = "true" ] || [ "${RAILWAY_ENVIRONMENT}" = "production" ]; then
    echo "🏭 Production environment detected"
    INSTALL_MODE=true
else
    echo "🛠️  Development environment detected"
    INSTALL_MODE=false
fi

# Core dependencies check
echo ""
echo "Checking Core Dependencies:"
echo "--------------------------"

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found - this is required!"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found - this is required!"
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Conversion dependencies
echo ""
echo "Checking Conversion Dependencies:"
echo "--------------------------------"

if [ "$INSTALL_MODE" = true ]; then
    install_if_missing "gm" "graphicsmagick" "GraphicsMagick"
else
    if command -v gm >/dev/null 2>&1; then
        echo "✅ GraphicsMagick: $(gm version | head -1 | cut -d' ' -f1-2)"
    else
        echo "⚠️  GraphicsMagick: Not found"
        echo "   Run: sudo apt-get install -y graphicsmagick"
    fi
fi

# Additional checks
if command -v convert >/dev/null 2>&1; then
    echo "✅ ImageMagick: Available"
else
    echo "⚠️  ImageMagick: Not found (install with GraphicsMagick)"
fi

if command -v pdfinfo >/dev/null 2>&1; then
    echo "✅ PDF Tools: Available"
else
    echo "⚠️  PDF Tools: Not found (install poppler-utils)"
fi

if command -v gs >/dev/null 2>&1; then
    echo "✅ Ghostscript: Available"
else
    echo "⚠️  Ghostscript: Not found"
fi

# Optional dependencies
echo ""
echo "Checking Optional Dependencies:"
echo "------------------------------"

if command -v ffmpeg >/dev/null 2>&1; then
    echo "✅ FFmpeg: Available for audio/video conversion"
else
    echo "⚠️  FFmpeg: Not found (audio/video conversion disabled)"
fi

# Setup application directories
echo ""
echo "Setting up Application:"
echo "----------------------"

# Create uploads directory
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo "✅ Created uploads/ directory"
else
    echo "✅ uploads/ directory exists"
fi

# Set appropriate permissions
chmod 755 uploads 2>/dev/null || true

# Create a simple test
echo ""
echo "Running Basic Tests:"
echo "-------------------"

# Test GraphicsMagick if available
if command -v gm >/dev/null 2>&1; then
    if gm version >/dev/null 2>&1; then
        echo "✅ GraphicsMagick: Basic test passed"
    else
        echo "❌ GraphicsMagick: Basic test failed"
    fi
fi

# Test ImageMagick if available
if command -v convert >/dev/null 2>&1; then
    if convert -version >/dev/null 2>&1; then
        echo "✅ ImageMagick: Basic test passed"
    else
        echo "❌ ImageMagick: Basic test failed"
    fi
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Ready to start Multi-File Conversion Service"
echo "Use: npm start (production) or npm run dev (development)"