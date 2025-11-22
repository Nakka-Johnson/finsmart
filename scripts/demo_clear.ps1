# FinSmart Demo Data Cleaner
# Usage: .\demo_clear.ps1 -Token "your-admin-bearer-token"
# Purpose: Removes all demo data from the database

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "http://localhost:8081",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FinSmart Demo Data Cleaner" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
try {
    $healthCheck = Invoke-WebRequest -Uri "$BackendUrl/actuator/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[✓] Backend is running at $BackendUrl" -ForegroundColor Green
} catch {
    Write-Host "[✗] Backend is not running at $BackendUrl" -ForegroundColor Red
    Write-Host "    Please start the backend first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Confirm deletion unless -Force is used
if (-not $Force) {
    Write-Host "WARNING: This will delete all demo data from the database!" -ForegroundColor Yellow
    $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Clearing demo data..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest `
        -Uri "$BackendUrl/api/admin/demo/clear" `
        -Method DELETE `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Demo Data Cleared Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deleted Counts:" -ForegroundColor Cyan
    Write-Host "  Users:        $($result.users)" -ForegroundColor White
    Write-Host "  Accounts:     $($result.accounts)" -ForegroundColor White
    Write-Host "  Transactions: $($result.transactions)" -ForegroundColor White
    Write-Host "  Budgets:      $($result.budgets)" -ForegroundColor White
    Write-Host "  Categories:   $($result.categories)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "[✗] Failed to clear demo data" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "    Invalid or expired token. Please provide a valid admin token." -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "    Forbidden. Token does not have admin privileges." -ForegroundColor Yellow
    }
    
    exit 1
}
