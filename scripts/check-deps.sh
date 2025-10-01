#!/usr/bin/env bash

# Dependency verification script - can be run without sudo
# This script checks if all required dependencies are available

echo "🔍 Checking Multi-File Conversion Service Dependencies..."
echo "=================================================="

# Function to check if a command exists and show version
check_dependency() {
    local cmd="$1"
    local name="$2"
    local required="$3"
    
    if command -v "$cmd" >/dev/null 2>&1; then
        local version=$($cmd --version 2>&1 | head -1 | cut -d' ' -f1-3)
        echo "✅ $name: $version"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo "❌ $name: Not found (REQUIRED)"
            return 1
        else
            echo "⚠️  $name: Not found (optional)"
            return 0
        fi
    fi
}

# Function to check GraphicsMagick specifically
check_graphicsmagick() {
    if command -v gm >/dev/null 2>&1; then
        local version=$(gm version | head -1)
        echo "✅ GraphicsMagick: $version"
        
        # Test basic functionality
        if gm version | grep -q "GraphicsMagick"; then
            echo "   └─ Basic functionality: OK"
        fi
        return 0
    else
        echo "❌ GraphicsMagick: Not found (REQUIRED for image conversions)"
        return 1
    fi
}

# Function to check ImageMagick
check_imagemagick() {
    if command -v convert >/dev/null 2>&1; then
        local version=$(convert -version | head -1)
        echo "✅ ImageMagick: $version"
        return 0
    else
        echo "⚠️  ImageMagick: Not found (fallback for some conversions)"
        return 0
    fi
}

# Function to check PDF tools
check_pdf_tools() {
    local has_tools=false
    
    if command -v pdfinfo >/dev/null 2>&1; then
        local version=$(pdfinfo -v 2>&1 | head -1)
        echo "✅ Poppler Utils (pdfinfo): $version"
        has_tools=true
    fi
    
    if command -v gs >/dev/null 2>&1; then
        local version=$(gs --version 2>&1)
        echo "✅ Ghostscript: $version"
        has_tools=true
    fi
    
    if [ "$has_tools" = false ]; then
        echo "⚠️  PDF Tools: Not found (PDF conversions may be limited)"
    fi
}

# Core dependencies
echo "Core Dependencies:"
echo "------------------"
check_dependency "node" "Node.js" "required" || exit 1
check_dependency "npm" "npm" "required" || exit 1

echo ""
echo "Conversion Dependencies:"
echo "-----------------------"
check_graphicsmagick || exit 1
check_imagemagick
check_pdf_tools

echo ""
echo "Optional Dependencies:"
echo "---------------------"
check_dependency "ffmpeg" "FFmpeg" "optional"

echo ""
echo "System Information:"
echo "------------------"
echo "OS: $(uname -s) $(uname -r)"
if [ -f /etc/os-release ]; then
    echo "Distribution: $(grep PRETTY_NAME /etc/os-release | cut -d'=' -f2 | tr -d '"')"
fi

# Check disk space
echo "Available disk space:"
df -h . | tail -1 | awk '{print "   └─ " $4 " available"}'

# Check memory
if command -v free >/dev/null 2>&1; then
    echo "Available memory:"
    free -h | grep "Mem:" | awk '{print "   └─ " $7 " available"}'
fi

echo ""
echo "Upload Directory:"
echo "----------------"
if [ -d "uploads" ]; then
    echo "✅ uploads/ directory exists"
    ls -la uploads/ | head -5
else
    echo "⚠️  uploads/ directory not found - will be created automatically"
fi

echo ""
echo "🎉 Dependency check completed!"
echo ""
echo "Summary:"
echo "--------"
if command -v gm >/dev/null 2>&1; then
    echo "✅ Ready for image conversions (GraphicsMagick)"
else
    echo "❌ Image conversions NOT available"
fi

if command -v pdfinfo >/dev/null 2>&1 || command -v gs >/dev/null 2>&1; then
    echo "✅ Ready for PDF processing"
else
    echo "⚠️  Limited PDF processing capability"
fi

if command -v ffmpeg >/dev/null 2>&1; then
    echo "✅ Ready for audio/video conversions"
else
    echo "⚠️  Audio/video conversions NOT available"
fi