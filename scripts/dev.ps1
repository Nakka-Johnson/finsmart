# FinSmart Development Helper (PowerShell)
# Usage: .\scripts\dev.ps1 [command]
#
# Commands:
#   up      Start all services (docker compose up --build -d)
#   down    Stop all services
#   logs    Tail logs from all services
#   reset   Stop, remove volumes, and restart fresh

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "logs", "reset")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = "docker-compose.yml"

Push-Location $ProjectRoot

try {
    switch ($Command) {
        "up" {
            Write-Host "🚀 Starting FinSmart..." -ForegroundColor Cyan
            docker compose -f $ComposeFile up --build -d
            Write-Host ""
            Write-Host "✅ Services starting:" -ForegroundColor Green
            Write-Host "   Frontend:  http://localhost:5173"
            Write-Host "   Backend:   http://localhost:8081"
            Write-Host "   AI:        http://localhost:8001"
            Write-Host "   Postgres:  localhost:5433"
            Write-Host ""
            Write-Host "Run '.\scripts\dev.ps1 logs' to watch logs" -ForegroundColor Yellow
        }
        "down" {
            Write-Host "🛑 Stopping FinSmart..." -ForegroundColor Yellow
            docker compose -f $ComposeFile down
            Write-Host "✅ All services stopped" -ForegroundColor Green
        }
        "logs" {
            docker compose -f $ComposeFile logs -f
        }
        "reset" {
            Write-Host "🔄 Resetting FinSmart (removes all data)..." -ForegroundColor Magenta
            docker compose -f $ComposeFile down -v
            docker compose -f $ComposeFile up --build -d
            Write-Host "✅ Fresh start complete" -ForegroundColor Green
        }
    }
} finally {
    Pop-Location
}
