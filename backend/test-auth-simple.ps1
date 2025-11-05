# Simple JWT Authentication Tests

Write-Host "Testing JWT Authentication Endpoints" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Test 1: Register User
Write-Host "1. Register User..." -ForegroundColor Yellow
$registerBody = '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

try {
    $registerResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8081/api/auth/register" -ContentType "application/json" -Body $registerBody
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.userId)"
    Write-Host "  Email: $($registerResponse.email)"
    Write-Host "  Token: $($registerResponse.token.Substring(0, 50))...`n"
    $global:token = $registerResponse.token
}
catch {
    Write-Host "✗ Registration failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)`n"
    exit 1
}

# Test 2: Duplicate Registration
Write-Host "2. Test Duplicate Email (should fail with 409)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8081/api/auth/register" -ContentType "application/json" -Body $registerBody
    Write-Host "✗ Should have failed!" -ForegroundColor Red
}
catch {
    Write-Host "✓ Correctly rejected duplicate email`n" -ForegroundColor Green
}

# Test 3: Login
Write-Host "3. Login..." -ForegroundColor Yellow
$loginBody = '{"email":"test@example.com","password":"password123"}'

try {
    $loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8081/api/auth/login" -ContentType "application/json" -Body $loginBody
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($loginResponse.token.Substring(0, 50))...`n"
    $global:token = $loginResponse.token
}
catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)`n"
}

# Test 4: Wrong Password
Write-Host "4. Test Wrong Password (should fail with 401)..." -ForegroundColor Yellow
$wrongBody = '{"email":"test@example.com","password":"wrongpassword"}'

try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8081/api/auth/login" -ContentType "application/json" -Body $wrongBody
    Write-Host "✗ Should have failed!" -ForegroundColor Red
}
catch {
    Write-Host "✓ Correctly rejected invalid credentials`n" -ForegroundColor Green
}

# Test 5: Access Protected Endpoint
Write-Host "5. Access /api/auth/me with JWT token..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Method Get -Uri "http://localhost:8081/api/auth/me" -Headers @{Authorization = "Bearer $global:token"}
    Write-Host "✓ Protected endpoint accessed successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($meResponse.userId)"
    Write-Host "  Email: $($meResponse.email)"
    Write-Host "  Full Name: $($meResponse.fullName)`n"
}
catch {
    Write-Host "✗ Failed to access protected endpoint" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)`n"
}

# Test 6: No Token
Write-Host "6. Access /api/auth/me without token (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Method Get -Uri "http://localhost:8081/api/auth/me"
    Write-Host "✗ Should have failed!" -ForegroundColor Red
}
catch {
    Write-Host "✓ Correctly rejected unauthorized request`n" -ForegroundColor Green
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All Tests Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
