# Database Reset Script for FinSmart
# This script drops and recreates the PostgreSQL database

param(
    [string]$DbName = "finsmartdb",
    [string]$DbUser = "finsmart",
    [string]$DbPassword = "finsmartpwd",
    [string]$DbHost = "127.0.0.1",
    [int]$DbPort = 5432,
    [string]$AdminUser = "postgres",
    [string]$AdminPassword = "postgres"
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "FinSmart Database Reset Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Find psql executable
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    # Try to find it
    $psqlPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if (-not $psqlPath) {
        Write-Host "✗ PostgreSQL psql.exe not found. Please ensure PostgreSQL is installed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Using psql: $psqlPath" -ForegroundColor Gray
Write-Host ""

# Set PGPASSWORD environment variable to avoid password prompt
$env:PGPASSWORD = $AdminPassword

Write-Host "Dropping existing database '$DbName'..." -ForegroundColor Yellow

# Drop the database (connect to postgres database first)
$dropCommand = "DROP DATABASE IF EXISTS $DbName;"
$output = & $psqlPath -h $DbHost -p $DbPort -U $AdminUser -d postgres -c $dropCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database '$DbName' dropped successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to drop database. It may not exist." -ForegroundColor Red
    Write-Host $output
}

Write-Host ""
Write-Host "Creating new database '$DbName'..." -ForegroundColor Yellow

# Create the database
$createCommand = "CREATE DATABASE $DbName OWNER $DbUser;"
$output = & $psqlPath -h $DbHost -p $DbPort -U $AdminUser -d postgres -c $createCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database '$DbName' created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    Write-Host $output
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the Spring Boot application." -ForegroundColor Cyan
Write-Host "Run: mvn spring-boot:run" -ForegroundColor Yellow
Write-Host ""

# Clear the password from environment
Remove-Item Env:\PGPASSWORD
