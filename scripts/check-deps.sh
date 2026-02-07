#!/usr/bin/env bash

# Dependency verification script
echo "🔍 Checking Multi-File Conversion Service Dependencies..."
echo "=================================================="

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

echo "Core Dependencies:"
check_dependency "node" "Node.js" "required" || exit 1
check_dependency "npm" "npm" "required" || exit 1

echo ""
echo "Conversion Dependencies:"
check_dependency "gm" "GraphicsMagick" "required" || exit 1
check_dependency "convert" "ImageMagick" "optional"
check_dependency "ffmpeg" "FFmpeg" "optional"
check_dependency "pandoc" "Pandoc" "optional"
check_dependency "pdfinfo" "Poppler Utils" "optional"

echo ""
echo "System Information:"
echo "OS: $(uname -s) $(uname -r)"
df -h . | tail -1 | awk '{print "   └─ Disk Space: " $4 " available"}'

echo ""
echo "🎉 Dependency check completed!"
