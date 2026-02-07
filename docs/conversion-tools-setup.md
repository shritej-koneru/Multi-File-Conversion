# Document Conversion Tools Setup

This guide explains how to install LibreOffice and Pandoc for the best quality document conversions (especially DOCX to PDF).

## Why Install These Tools?

The application uses a **smart fallback chain** for document conversions:

1. **LibreOffice** (Best) - Preserves all formatting, tables, images, fonts, styles
2. **Pandoc** (Good) - Preserves most formatting, good for simple documents  
3. **HTML-based** (Basic) - Preserves paragraphs and basic text structure
4. **Plain Text** (Fallback) - Loses all formatting but always works

Without LibreOffice or Pandoc, conversions will use the basic HTML-based method which loses tables, images, and complex formatting.

## Quick Installation (Windows)

### Automated Installation

Run the provided PowerShell script:

```powershell
# Run from project root
.\scripts\install-conversion-tools.ps1
```

This will automatically install both LibreOffice and Pandoc using Chocolatey.

### Manual Installation

#### Option 1: Using Chocolatey (Recommended)

If you have [Chocolatey](https://chocolatey.org/install) installed:

```powershell
# Install both tools
choco install pandoc libreoffice-fresh -y
```

#### Option 2: Manual Downloads

**Pandoc:**
1. Download from: https://pandoc.org/installing.html
2. Run the installer
3. Restart your terminal

**LibreOffice:**
1. Download from: https://www.libreoffice.org/download/download-libreoffice/
2. Run the installer (choose default options)
3. Restart your terminal

## Installation (Linux/Mac)

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y pandoc libreoffice
```

### macOS
```bash
# Using Homebrew
brew install pandoc libreoffice
```

### CentOS/RHEL
```bash
sudo yum install -y pandoc libreoffice
```

## Verify Installation

After installation, verify the tools are available:

```bash
# Check Pandoc
pandoc --version

# Check LibreOffice
soffice --version
```

If commands are not found, you may need to:
1. Restart your terminal/VS Code
2. Add the installation paths to your system PATH
3. Log out and log back in (Windows)

## Common Installation Paths

### Windows
- Pandoc: `C:\Users\<username>\AppData\Local\Pandoc\pandoc.exe`
- LibreOffice: `C:\Program Files\LibreOffice\program\soffice.exe`

### Linux
- Pandoc: `/usr/bin/pandoc`
- LibreOffice: `/usr/bin/soffice`

### macOS
- Pandoc: `/usr/local/bin/pandoc`
- LibreOffice: `/Applications/LibreOffice.app/Contents/MacOS/soffice`

## Troubleshooting

### "Command not found" after installation

**Windows:**
1. Close and reopen your terminal/VS Code
2. Check if the program is in your PATH:
   ```powershell
   $env:Path -split ';' | Select-String -Pattern 'pandoc|LibreOffice'
   ```
3. If not, add manually to PATH or reinstall

**Linux/Mac:**
1. Restart terminal
2. Check installation:
   ```bash
   which pandoc
   which soffice
   ```

### LibreOffice not detected

The application checks these paths automatically:
- `C:\Program Files\LibreOffice\program\soffice.exe`
- `C:\Program Files (x86)\LibreOffice\program\soffice.exe`
- System PATH

If LibreOffice is installed elsewhere, add it to your system PATH.

### Pandoc LaTeX errors

Some Pandoc conversions require LaTeX. If you get LaTeX-related errors:

**Windows:**
```powershell
choco install miktex -y
```

**Linux:**
```bash
sudo apt-get install texlive-xetex
```

**macOS:**
```bash
brew install --cask mactex-no-gui
```

## Testing the Installation

After installation, restart your development server and try converting a DOCX file. Check the server logs:

✅ **Success with LibreOffice:**
```
Available tools - Pandoc: true, LibreOffice: true
Attempting conversion with LibreOffice...
✅ LibreOffice conversion successful
```

✅ **Success with Pandoc:**
```
Available tools - Pandoc: true, LibreOffice: false
Attempting conversion with Pandoc...
✅ Pandoc conversion successful
```

⚠️ **Fallback mode:**
```
Available tools - Pandoc: false, LibreOffice: false
⚠️  Falling back to HTML-based conversion (preserves basic formatting)
```

## Performance Comparison

| Tool | Speed | Quality | Tables | Images | Fonts | Complex Layout |
|------|-------|---------|--------|--------|-------|----------------|
| **LibreOffice** | Slow | Excellent | ✅ | ✅ | ✅ | ✅ |
| **Pandoc** | Fast | Good | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **HTML-based** | Fast | Basic | ❌ | ❌ | ❌ | ❌ |
| **Plain Text** | Fastest | Poor | ❌ | ❌ | ❌ | ❌ |

## Recommendation

**For production use**: Install **both LibreOffice and Pandoc**
- LibreOffice handles complex documents perfectly
- Pandoc provides fast conversion for simple documents
- System automatically chooses the best available tool
- Falls back gracefully if tools are unavailable

## Support

If you encounter issues:
1. Check the [troubleshooting guide](troubleshooting.md)
2. Verify installation with `--version` commands
3. Check server logs for detailed error messages
4. Try the HTML-based fallback (always works)
