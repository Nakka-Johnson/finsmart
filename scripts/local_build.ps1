#requires -Version 5.1
<#
.SYNOPSIS
    Local build script for FinSmart monorepo - ensures clean builds for all services.

.DESCRIPTION
    Builds backend (Maven), frontend (npm), and AI (Python) services with proper
    environment setup and dependency management. Logs output to _local_logs/.

.EXAMPLE
    .\scripts\local_build.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Create logs directory
$logDir = Join-Path $root "_local_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host "🔨 Starting local build for FinSmart monorepo..." -ForegroundColor Cyan
Write-Host "📁 Root: $root" -ForegroundColor Gray
Write-Host "📝 Logs: $logDir`n" -ForegroundColor Gray

$buildFailed = $false
$startTime = Get-Date

# ============================================================================
# BACKEND (Spring Boot 3 / Maven)
# ============================================================================
Write-Host "📦 [1/3] Building Backend (Maven)..." -ForegroundColor Yellow
$backendLog = Join-Path $logDir "01_backend.txt"

try {
    Set-Location (Join-Path $root "backend")
    
    "=== BACKEND BUILD ===" | Out-File $backendLog
    "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $backendLog -Append
    "Command: mvn -B -DskipITs=true -Dtestcontainers.check.skip=true clean test package" | Out-File $backendLog -Append
    "" | Out-File $backendLog -Append
    
    # Run Maven build
    & mvn -B "-DskipITs=true" "-Dtestcontainers.check.skip=true" clean test package 2>&1 | 
        Tee-Object -FilePath $backendLog -Append | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Maven build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  ✅ Backend build successful" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ Backend build failed: $_" -ForegroundColor Red
    Write-Host "     See log: $backendLog" -ForegroundColor Gray
    $buildFailed = $true
}

# ============================================================================
# FRONTEND (Vite + React + TypeScript)
# ============================================================================
Write-Host "`n📦 [2/3] Building Frontend (npm)..." -ForegroundColor Yellow
$frontendLog = Join-Path $logDir "02_frontend.txt"

try {
    Set-Location (Join-Path $root "frontend")
    
    "=== FRONTEND BUILD ===" | Out-File $frontendLog
    "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $frontendLog -Append
    "" | Out-File $frontendLog -Append
    
    # Ensure package-lock.json exists
    if (-not (Test-Path "package-lock.json")) {
        "Creating package-lock.json..." | Tee-Object -FilePath $frontendLog -Append
        & npm install --package-lock-only 2>&1 | Tee-Object -FilePath $frontendLog -Append | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            throw "npm install --package-lock-only failed"
        }
    }
    
    # Set environment variables for Vite
    $env:VITE_API_BASE = "http://localhost:8080"
    $env:VITE_AI_URL = "http://127.0.0.1:8001"
    
    "Environment:" | Tee-Object -FilePath $frontendLog -Append
    "  VITE_API_BASE=$env:VITE_API_BASE" | Tee-Object -FilePath $frontendLog -Append
    "  VITE_AI_URL=$env:VITE_AI_URL" | Tee-Object -FilePath $frontendLog -Append
    "" | Tee-Object -FilePath $frontendLog -Append
    
    # Clean install
    "Running: npm ci" | Tee-Object -FilePath $frontendLog -Append
    & npm ci 2>&1 | Tee-Object -FilePath $frontendLog -Append | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE"
    }
    
    # Build
    "Running: npm run build" | Tee-Object -FilePath $frontendLog -Append
    & npm run build 2>&1 | Tee-Object -FilePath $frontendLog -Append | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  ✅ Frontend build successful" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ Frontend build failed: $_" -ForegroundColor Red
    Write-Host "     See log: $frontendLog" -ForegroundColor Gray
    $buildFailed = $true
}

# ============================================================================
# AI (FastAPI / Python)
# ============================================================================
Write-Host "`n📦 [3/3] Building AI Service (Python)..." -ForegroundColor Yellow
$aiLog = Join-Path $logDir "03_ai.txt"

try {
    Set-Location (Join-Path $root "ai")
    
    "=== AI SERVICE BUILD ===" | Out-File $aiLog
    "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $aiLog -Append
    "" | Out-File $aiLog -Append
    
    # Create virtual environment if missing
    if (-not (Test-Path ".venv")) {
        "Creating virtual environment..." | Tee-Object -FilePath $aiLog -Append
        & python -m venv .venv 2>&1 | Tee-Object -FilePath $aiLog -Append | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            throw "python -m venv .venv failed"
        }
    }
    
    # Activate virtual environment
    $activateScript = Join-Path (Get-Location) ".venv\Scripts\Activate.ps1"
    if (-not (Test-Path $activateScript)) {
        throw "Virtual environment activation script not found: $activateScript"
    }
    
    "Activating virtual environment..." | Tee-Object -FilePath $aiLog -Append
    & $activateScript
    
    # Upgrade pip
    "Upgrading pip..." | Tee-Object -FilePath $aiLog -Append
    & python -m pip install --upgrade pip 2>&1 | Tee-Object -FilePath $aiLog -Append | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "pip upgrade failed"
    }
    
    # Install dependencies
    "Installing requirements..." | Tee-Object -FilePath $aiLog -Append
    & pip install -r requirements.txt 2>&1 | Tee-Object -FilePath $aiLog -Append | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "pip install -r requirements.txt failed"
    }
    
    # Smoke test imports
    "Running smoke test..." | Tee-Object -FilePath $aiLog -Append
    
    # Set UTF-8 encoding for Python output
    $env:PYTHONIOENCODING = "utf-8"
    
    $smokeTest = @'
import sys
try:
    import fastapi
    import pydantic
    print("[OK] FastAPI imported successfully")
    print("[OK] Pydantic imported successfully")
    print("[OK] AI service smoke test passed")
    sys.exit(0)
except ImportError as e:
    print(f"[FAIL] Import failed: {e}")
    sys.exit(1)
'@
    
    $smokeTest | & python - 2>&1 | Tee-Object -FilePath $aiLog -Append
    
    if ($LASTEXITCODE -ne 0) {
        throw "Smoke test failed - FastAPI/Pydantic imports failed"
    }
    
    # Deactivate virtual environment
    deactivate
    
    Write-Host "  ✅ AI service build successful" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ AI service build failed: $_" -ForegroundColor Red
    Write-Host "     See log: $aiLog" -ForegroundColor Gray
    $buildFailed = $true
}

# ============================================================================
# SUMMARY
# ============================================================================
Set-Location $root
$duration = (Get-Date) - $startTime

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "📊 BUILD SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray

if ($buildFailed) {
    Write-Host "`n❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "   One or more services failed to build." -ForegroundColor Red
    Write-Host "`n📝 Check logs in: $logDir" -ForegroundColor Yellow
    Write-Host "   - 01_backend.txt" -ForegroundColor Gray
    Write-Host "   - 02_frontend.txt" -ForegroundColor Gray
    Write-Host "   - 03_ai.txt" -ForegroundColor Gray
    
    exit 1
} else {
    Write-Host "`n✅ ALL BUILDS SUCCESSFUL" -ForegroundColor Green
    Write-Host "   Backend:  Maven build + tests passed" -ForegroundColor Gray
    Write-Host "   Frontend: npm ci + build succeeded" -ForegroundColor Gray
    Write-Host "   AI:       venv setup + dependencies installed" -ForegroundColor Gray
    
    Write-Host "`n⏱️  Total time: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host "📝 Logs saved to: $logDir" -ForegroundColor Gray
    
    exit 0
}
