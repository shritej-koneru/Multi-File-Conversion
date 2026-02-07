#!/usr/bin/env pwsh
# Installation script for document conversion tools (Windows)
# This script installs LibreOffice and Pandoc for the best DOCX to PDF conversion quality

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Document Conversion Tools Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some installations may require admin privileges." -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to check Chocolatey
function Test-Chocolatey {
    return Test-CommandExists "choco"
}

# Function to install Chocolatey
function Install-Chocolatey {
    Write-Host "[Installing] Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Check installation status
Write-Host "[Checking] Current installation status..." -ForegroundColor Cyan
Write-Host ""

$pandocInstalled = Test-CommandExists "pandoc"
$libreOfficeInstalled = $false

# Check LibreOffice in common paths
$libreOfficePaths = @(
    "C:\Program Files\LibreOffice\program\soffice.exe",
    "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
)

foreach ($path in $libreOfficePaths) {
    if (Test-Path $path) {
        $libreOfficeInstalled = $true
        break
    }
}

if (-not $libreOfficeInstalled) {
    $libreOfficeInstalled = Test-CommandExists "soffice"
}

Write-Host "Pandoc:      $(if ($pandocInstalled) { '[OK] Installed' } else { '[X] Not installed' })" -ForegroundColor $(if ($pandocInstalled) { 'Green' } else { 'Red' })
Write-Host "LibreOffice: $(if ($libreOfficeInstalled) { '[OK] Installed' } else { '[X] Not installed' })" -ForegroundColor $(if ($libreOfficeInstalled) { 'Green' } else { 'Red' })
Write-Host ""

if ($pandocInstalled -and $libreOfficeInstalled) {
    Write-Host "[SUCCESS] All conversion tools are already installed!" -ForegroundColor Green
    Write-Host "Your system is ready for high-quality document conversions." -ForegroundColor Green
    exit 0
}

# Prompt user for installation
Write-Host "Would you like to install the missing tools? (Y/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -ne 'Y' -and $response -ne 'y') {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Check/Install Chocolatey
if (-not (Test-Chocolatey)) {
    Write-Host "Chocolatey package manager is not installed." -ForegroundColor Yellow
    Write-Host "Chocolatey is recommended for easy installation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Install using Chocolatey? (Y/N): " -ForegroundColor Yellow -NoNewline
    $chocoResponse = Read-Host
    
    if ($chocoResponse -eq 'Y' -or $chocoResponse -eq 'y') {
        Install-Chocolatey
    } else {
        Write-Host ""
        Write-Host "Manual installation instructions:" -ForegroundColor Cyan
        Write-Host "1. Pandoc: Download from https://pandoc.org/installing.html" -ForegroundColor White
        Write-Host "2. LibreOffice: Download from https://www.libreoffice.org/download/download-libreoffice/" -ForegroundColor White
        Write-Host ""
        exit 0
    }
}

# Install Pandoc
if (-not $pandocInstalled) {
    try {
        Write-Host "[Installing] Pandoc..." -ForegroundColor Yellow
        choco install pandoc -y
        Write-Host "[SUCCESS] Pandoc installed successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[ERROR] Failed to install Pandoc: $_" -ForegroundColor Red
        Write-Host "Please install manually from: https://pandoc.org/installing.html" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Install LibreOffice
if (-not $libreOfficeInstalled) {
    try {
        Write-Host "[Installing] LibreOffice..." -ForegroundColor Yellow
        Write-Host "(This may take a few minutes...)" -ForegroundColor Gray
        choco install libreoffice-fresh -y
        Write-Host "[SUCCESS] LibreOffice installed successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[ERROR] Failed to install LibreOffice: $_" -ForegroundColor Red
        Write-Host "Please install manually from: https://www.libreoffice.org/download/download-libreoffice/" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Refresh environment variables
Write-Host "[Refreshing] Environment variables..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[IMPORTANT] You may need to restart your terminal or VS Code" -ForegroundColor Yellow
Write-Host "for the changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify installation, restart your terminal and run:" -ForegroundColor Cyan
Write-Host "  pandoc --version" -ForegroundColor White
Write-Host "  soffice --version" -ForegroundColor White
Write-Host ""Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")