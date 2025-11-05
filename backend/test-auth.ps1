# Test JWT Authentication Endpoints

Write-Host "Testing JWT Authentication Endpoints" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Test 1: Register User
Write-Host "1. Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:8081/api/auth/register" `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.userId)" -ForegroundColor White
    Write-Host "Email: $($registerResponse.email)" -ForegroundColor White
    Write-Host "Full Name: $($registerResponse.fullName)" -ForegroundColor White
    Write-Host "Token: $($registerResponse.token.Substring(0, 50))..." -ForegroundColor White
    
    # Save token for later tests
    $token = $registerResponse.token
    
    Write-Host "`n"
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host "`n"
    exit 1
}

# Test 2: Try to register same email again (should fail with 409)
Write-Host "2. Testing Duplicate Email Registration..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:8081/api/auth/register" `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✗ Should have failed with 409 Conflict!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "✓ Correctly returned 409 Conflict" -ForegroundColor Green
    }
    elseif ($statusCode) {
        Write-Host "✗ Wrong error code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n"

# Test 3: Login with correct credentials
Write-Host "3. Testing Login with Valid Credentials..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:8081/api/auth/login" `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor White
    
    # Use login token for next test
    $token = $loginResponse.token
    
    Write-Host "`n"
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Login with wrong password
Write-Host "4. Testing Login with Invalid Password..." -ForegroundColor Yellow
$wrongLoginBody = @{
    email = "test@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:8081/api/auth/login" `
        -ContentType "application/json" `
        -Body $wrongLoginBody
    
    Write-Host "✗ Should have failed with 401 Unauthorized!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✓ Correctly returned 401 Unauthorized" -ForegroundColor Green
    }
    elseif ($statusCode) {
        Write-Host "✗ Wrong error code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n"

# Test 5: Access protected endpoint with token
Write-Host "5. Testing Protected Endpoint with JWT Token..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Method Get `
        -Uri "http://localhost:8081/api/auth/me" `
        -Headers @{Authorization = "Bearer $token"}
    
    Write-Host "✓ Protected endpoint accessed successfully!" -ForegroundColor Green
    Write-Host "User ID: $($meResponse.userId)" -ForegroundColor White
    Write-Host "Email: $($meResponse.email)" -ForegroundColor White
    Write-Host "Full Name: $($meResponse.fullName)" -ForegroundColor White
    
    Write-Host "`n"
} catch {
    Write-Host "✗ Failed to access protected endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Access protected endpoint without token
Write-Host "6. Testing Protected Endpoint without JWT Token..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Method Get -Uri "http://localhost:8081/api/auth/me"
    
    Write-Host "✗ Should have failed with 401 Unauthorized!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "✓ Correctly returned $statusCode (Unauthorized)" -ForegroundColor Green
    }
    elseif ($statusCode) {
        Write-Host "✗ Wrong error code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n"
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "JWT Authentication Tests Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
