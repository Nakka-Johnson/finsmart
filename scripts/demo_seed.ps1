# FinSmart Demo Data Seeder
# Usage: .\demo_seed.ps1 -Token "your-admin-bearer-token"
# Purpose: Populates the database with demo data for testing

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "http://localhost:8081"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FinSmart Demo Data Seeder" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
try {
    $healthCheck = Invoke-WebRequest -Uri "$BackendUrl/actuator/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[✓] Backend is running at $BackendUrl" -ForegroundColor Green
} catch {
    Write-Host "[✗] Backend is not running at $BackendUrl" -ForegroundColor Red
    Write-Host "    Please start the backend first using: .\scripts\run_all.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Seeding demo data..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest `
        -Uri "$BackendUrl/api/admin/demo/seed" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Demo Data Created Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created Counts:" -ForegroundColor Cyan
    Write-Host "  Users:        $($result.users)" -ForegroundColor White
    Write-Host "  Accounts:     $($result.accounts)" -ForegroundColor White
    Write-Host "  Transactions: $($result.transactions)" -ForegroundColor White
    Write-Host "  Budgets:      $($result.budgets)" -ForegroundColor White
    Write-Host "  Categories:   $($result.categories)" -ForegroundColor White
    Write-Host ""
    Write-Host "Demo credentials:" -ForegroundColor Cyan
    Write-Host "  Email:    demo@finsmart.com" -ForegroundColor White
    Write-Host "  Password: Demo1234!" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "[✗] Failed to seed demo data" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "    Invalid or expired token. Please provide a valid admin token." -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "    Forbidden. Token does not have admin privileges." -ForegroundColor Yellow
    }
    
    exit 1
}
