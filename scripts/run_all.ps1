#requires -Version 5.1
<#
.SYNOPSIS
    Starts all FinSmart services in the correct order: AI → Backend → Frontend.

.DESCRIPTION
    Launches AI service (FastAPI), Backend (Spring Boot), and Frontend (Vite) in separate
    PowerShell windows. Services are started in dependency order with health checks.

.EXAMPLE
    .\scripts\run_all.ps1

.EXAMPLE
    .\scripts\run_all.ps1 -SkipAI
    Starts only Backend and Frontend (useful if AI service not needed)
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipAI,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FinSmart Local Development Server" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Root: $root" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Test-Port {
    param([int]$Port)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Host "  Waiting for $Name to be ready..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -ErrorAction Stop
            Write-Host "  ✅ $Name is ready!" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "    Attempt $i/$MaxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    Write-Host "  ⚠️  $Name health check timeout (continuing anyway)" -ForegroundColor Yellow
    return $false
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Write-Host "Pre-flight checks..." -ForegroundColor Cyan

# Check for required directories
$aiDir = Join-Path $root "ai"
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ Frontend directory not found: $frontendDir" -ForegroundColor Red
    exit 1
}

if (-not $SkipAI -and -not (Test-Path $aiDir)) {
    Write-Host "⚠️  AI directory not found: $aiDir" -ForegroundColor Yellow
    Write-Host "   Continuing without AI service..." -ForegroundColor Gray
    $SkipAI = $true
}

Write-Host "✅ Directory structure OK" -ForegroundColor Green
Write-Host ""

# ============================================================================
# START AI SERVICE (Port 8001)
# ============================================================================

if (-not $SkipAI) {
    Write-Host "[1/3] Starting AI Service (FastAPI)..." -ForegroundColor Yellow
    Write-Host "  URL: http://127.0.0.1:8001" -ForegroundColor Gray
    
    if (Test-Port -Port 8001) {
        Write-Host "  ⚠️  Port 8001 already in use - AI service may already be running" -ForegroundColor Yellow
    } else {
        # Start AI service in new PowerShell window
        $aiCmd = "Set-Location '$aiDir'; if (Test-Path '.venv\Scripts\Activate.ps1') { .venv\Scripts\Activate.ps1 }; python main.py"
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $aiCmd
        
        # Wait for AI service to be ready
        Start-Sleep -Seconds 3
        Wait-ForService -Name "AI Service" -Url "http://127.0.0.1:8001/health" -MaxAttempts 15
    }
    
    Write-Host ""
} else {
    Write-Host "[SKIPPED] AI Service" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# START BACKEND (Port 8081)
# ============================================================================

Write-Host "[2/3] Starting Backend (Spring Boot)..." -ForegroundColor Yellow
Write-Host "  URL: http://localhost:8081" -ForegroundColor Gray

if (Test-Port -Port 8081) {
    Write-Host "  ⚠️  Port 8081 already in use - Backend may already be running" -ForegroundColor Yellow
} else {
    # Start backend in new PowerShell window
    $backendCmd = "Set-Location '$backendDir'; mvn spring-boot:run"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    # Wait for backend to be ready
    Start-Sleep -Seconds 5
    Wait-ForService -Name "Backend" -Url "http://localhost:8081/actuator/health" -MaxAttempts 45 -DelaySeconds 3
}

Write-Host ""

# ============================================================================
# START FRONTEND (Port 5173)
# ============================================================================

if (-not $SkipFrontend) {
    Write-Host "[3/3] Starting Frontend (Vite)..." -ForegroundColor Yellow
    Write-Host "  URL: http://localhost:5173" -ForegroundColor Gray
    
    if (Test-Port -Port 5173) {
        Write-Host "  ⚠️  Port 5173 already in use - Frontend may already be running" -ForegroundColor Yellow
    } else {
        # Check if node_modules exists
        $nodeModules = Join-Path $frontendDir "node_modules"
        if (-not (Test-Path $nodeModules)) {
            Write-Host "  Installing frontend dependencies first..." -ForegroundColor Yellow
            Set-Location $frontendDir
            & npm ci
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  ❌ npm ci failed" -ForegroundColor Red
                exit 1
            }
        }
        
        # Start frontend in new PowerShell window
        $frontendCmd = "Set-Location '$frontendDir'; npm run dev"
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
        
        # Wait for frontend to be ready
        Start-Sleep -Seconds 3
        Wait-ForService -Name "Frontend" -Url "http://localhost:5173" -MaxAttempts 20
    }
    
    Write-Host ""
} else {
    Write-Host "[SKIPPED] Frontend" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "================================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan

if (-not $SkipAI) {
    Write-Host "  🤖 AI Service:  http://127.0.0.1:8001" -ForegroundColor White
}
Write-Host "  ⚙️  Backend:     http://localhost:8081" -ForegroundColor White
if (-not $SkipFrontend) {
    Write-Host "  🌐 Frontend:    http://localhost:5173" -ForegroundColor White
}

Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Cyan
if (-not $SkipAI) {
    Write-Host "  🤖 AI:      http://127.0.0.1:8001/health" -ForegroundColor Gray
}
Write-Host "  ⚙️  Backend: http://localhost:8081/actuator/health" -ForegroundColor Gray

Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  Close the PowerShell windows or press Ctrl+C in each" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
