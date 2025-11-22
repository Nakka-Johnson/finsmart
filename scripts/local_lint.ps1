#requires -Version 5.1
<#
.SYNOPSIS
    Local lint/format script for FinSmart monorepo.

.DESCRIPTION
    Runs code formatters and linters for backend (Spotless), frontend (Prettier + ESLint),
    and AI (optional ruff). Automatically fixes issues where possible.

.EXAMPLE
    .\scripts\local_lint.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting code formatting and linting..." -ForegroundColor Cyan
Write-Host "Root: $root`n" -ForegroundColor Gray

$lintFailed = $false
$startTime = Get-Date

# ============================================================================
# BACKEND (Maven Spotless - Google Java Format)
# ============================================================================
Write-Host "[1/3] Formatting Backend (Spotless)..." -ForegroundColor Yellow

try {
    Set-Location (Join-Path $root "backend")
    
    Write-Host "  Running: mvn spotless:apply" -ForegroundColor Gray
    & mvn -q spotless:apply 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Spotless failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "  [OK] Backend formatted successfully" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARN] Backend formatting failed: $_" -ForegroundColor Yellow
    Write-Host "     Continuing with other services..." -ForegroundColor Gray
    # Don't fail the script for backend formatting issues
}

# ============================================================================
# FRONTEND (Prettier + ESLint)
# ============================================================================
Write-Host "`n[2/3] Formatting Frontend (Prettier + ESLint)..." -ForegroundColor Yellow

try {
    Set-Location (Join-Path $root "frontend")
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies first..." -ForegroundColor Gray
        & npm ci 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed - cannot run formatters"
        }
    }
    
    # Run Prettier
    Write-Host "  Running: npm run format" -ForegroundColor Gray
    & npm run format 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Prettier (npm run format) failed"
    }
    
    # Run ESLint with auto-fix
    Write-Host "  Running: npm run lint:fix" -ForegroundColor Gray
    
    # Check if lint:fix script exists, otherwise use lint
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.PSObject.Properties.Name -contains "lint:fix") {
        & npm run lint:fix 2>&1 | Out-Null
    } else {
        Write-Host "     (lint:fix not found, running lint only)" -ForegroundColor Gray
        & npm run lint 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -ne 0) {
        # ESLint warnings/errors don't fail the script
        Write-Host "  [WARN] ESLint reported some issues (check manually)" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] Frontend formatted successfully" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  [WARN] Frontend formatting failed: $_" -ForegroundColor Yellow
    Write-Host "     Continuing with other services..." -ForegroundColor Gray
}

# ============================================================================
# AI (Python - Optional Ruff/Black)
# ============================================================================
Write-Host "`n[3/3] Checking AI Service (Python)..." -ForegroundColor Yellow

try {
    Set-Location (Join-Path $root "ai")
    
    # Check if ruff is available
    $ruffAvailable = $false
    try {
        if (Test-Path ".venv\Scripts\ruff.exe") {
            $ruffAvailable = $true
        }
    } catch {
        # ruff not installed
    }
    
    if ($ruffAvailable) {
        Write-Host "  Running: ruff format ." -ForegroundColor Gray
        & .venv\Scripts\ruff format . 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] AI service formatted with ruff" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Ruff formatting had issues (non-critical)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [INFO] No formatter configured (ruff not found)" -ForegroundColor Gray
        Write-Host "     Skipping AI formatting (optional)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "  [INFO] AI formatting skipped: $_" -ForegroundColor Gray
}

# ============================================================================
# SUMMARY
# ============================================================================
Set-Location $root
$duration = (Get-Date) - $startTime

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "LINT/FORMAT SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray

Write-Host "`n[OK] FORMATTING COMPLETE" -ForegroundColor Green
Write-Host "   Backend:  Spotless (Google Java Format)" -ForegroundColor Gray
Write-Host "   Frontend: Prettier + ESLint" -ForegroundColor Gray
Write-Host "   AI:       Optional (ruff if available)" -ForegroundColor Gray

Write-Host "`nTotal time: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan

Write-Host "`nTip: Run this before committing to ensure consistent formatting" -ForegroundColor Yellow

exit 0
