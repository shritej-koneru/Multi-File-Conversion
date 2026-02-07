#!/bin/bash
# Installation script for document conversion tools (Linux/Mac)
# This script installs LibreOffice and Pandoc for the best DOCX to PDF conversion quality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo "Document Conversion Tools Installer"
echo -e "========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command_exists apt-get; then
        PKG_MGR="apt"
    elif command_exists yum; then
        PKG_MGR="yum"
    elif command_exists dnf; then
        PKG_MGR="dnf"
    else
        echo -e "${RED}❌ Unsupported package manager${NC}"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    PKG_MGR="brew"
else
    echo -e "${RED}❌ Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

echo -e "${CYAN}Detected OS: $OS${NC}"
echo ""

# Check installation status
echo -e "${CYAN}🔍 Checking current installation status...${NC}"
echo ""

PANDOC_INSTALLED=false
LIBREOFFICE_INSTALLED=false

if command_exists pandoc; then
    PANDOC_INSTALLED=true
    echo -e "Pandoc:      ${GREEN}✅ Installed${NC} ($(pandoc --version | head -n1))"
else
    echo -e "Pandoc:      ${RED}❌ Not installed${NC}"
fi

if command_exists soffice; then
    LIBREOFFICE_INSTALLED=true
    echo -e "LibreOffice: ${GREEN}✅ Installed${NC} ($(soffice --version 2>/dev/null || echo 'version check failed'))"
else
    echo -e "LibreOffice: ${RED}❌ Not installed${NC}"
fi

echo ""

if [ "$PANDOC_INSTALLED" = true ] && [ "$LIBREOFFICE_INSTALLED" = true ]; then
    echo -e "${GREEN}✅ All conversion tools are already installed!${NC}"
    echo -e "${GREEN}Your system is ready for high-quality document conversions.${NC}"
    exit 0
fi

# Prompt for installation
read -p "Would you like to install the missing tools? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation cancelled.${NC}"
    exit 0
fi

echo ""

# Check if package manager is available
if [ "$OS" = "mac" ] && ! command_exists brew; then
    echo -e "${YELLOW}Homebrew is not installed.${NC}"
    echo -e "${YELLOW}Install Homebrew first: https://brew.sh/${NC}"
    exit 1
fi

# Function to install on Linux
install_linux() {
    echo -e "${CYAN}Installing conversion tools on Linux ($PKG_MGR)...${NC}"
    echo ""
    
    # Check for sudo
    if [ "$EUID" -ne 0 ]; then
        SUDO="sudo"
    else
        SUDO=""
    fi
    
    case $PKG_MGR in
        apt)
            if [ "$PANDOC_INSTALLED" = false ]; then
                echo -e "${YELLOW}📥 Installing Pandoc...${NC}"
                $SUDO apt-get update
                $SUDO apt-get install -y pandoc
                echo -e "${GREEN}✅ Pandoc installed!${NC}"
                echo ""
            fi
            
            if [ "$LIBREOFFICE_INSTALLED" = false ]; then
                echo -e "${YELLOW}📥 Installing LibreOffice...${NC}"
                echo -e "${YELLOW}(This may take a few minutes...)${NC}"
                $SUDO apt-get install -y libreoffice
                echo -e "${GREEN}✅ LibreOffice installed!${NC}"
                echo ""
            fi
            ;;
        
        yum|dnf)
            if [ "$PANDOC_INSTALLED" = false ]; then
                echo -e "${YELLOW}📥 Installing Pandoc...${NC}"
                $SUDO $PKG_MGR install -y pandoc
                echo -e "${GREEN}✅ Pandoc installed!${NC}"
                echo ""
            fi
            
            if [ "$LIBREOFFICE_INSTALLED" = false ]; then
                echo -e "${YELLOW}📥 Installing LibreOffice...${NC}"
                echo -e "${YELLOW}(This may take a few minutes...)${NC}"
                $SUDO $PKG_MGR install -y libreoffice
                echo -e "${GREEN}✅ LibreOffice installed!${NC}"
                echo ""
            fi
            ;;
    esac
}

# Function to install on Mac
install_mac() {
    echo -e "${CYAN}Installing conversion tools on macOS...${NC}"
    echo ""
    
    if [ "$PANDOC_INSTALLED" = false ]; then
        echo -e "${YELLOW}📥 Installing Pandoc...${NC}"
        brew install pandoc
        echo -e "${GREEN}✅ Pandoc installed!${NC}"
        echo ""
    fi
    
    if [ "$LIBREOFFICE_INSTALLED" = false ]; then
        echo -e "${YELLOW}📥 Installing LibreOffice...${NC}"
        echo -e "${YELLOW}(This may take a few minutes...)${NC}"
        brew install --cask libreoffice
        echo -e "${GREEN}✅ LibreOffice installed!${NC}"
        echo ""
    fi
}

# Install based on OS
if [ "$OS" = "linux" ]; then
    install_linux
elif [ "$OS" = "mac" ]; then
    install_mac
fi

echo ""
echo -e "${GREEN}========================================"
echo "Installation Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}To verify installation, run:${NC}"
echo "  pandoc --version"
echo "  soffice --version"
echo ""
echo -e "${YELLOW}⚠️  You may need to restart your terminal for changes to take effect.${NC}"
echo ""
