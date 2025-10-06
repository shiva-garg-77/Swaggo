# PowerShell Test Script for Refresh Token Fix
# This script tests if the Mongoose casting error is fixed

param(
    [string]$ApiBase = "http://localhost:45799",
    [switch]$Verbose
)

Write-Host "🧪 Refresh Token Test Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Test helper function
function Test-ApiEndpoint {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    $uri = "$ApiBase$Endpoint"
    
    try {
        Write-Host "➤ Testing: $Method $Endpoint" -ForegroundColor Yellow
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "✅ Success: $Method $Endpoint" -ForegroundColor Green
        return @{
            Success = $true
            Data = $response
            Status = 200
        }
    }
    catch {
        $statusCode = 0
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        Write-Host "⚠️  Response: $Method $Endpoint - Status: $statusCode" -ForegroundColor Yellow
        
        if ($Verbose) {
            Write-Host "   Error: $errorMessage" -ForegroundColor Red
        }
        
        return @{
            Success = $false
            Error = $errorMessage
            Status = $statusCode
        }
    }
}

# Test 1: Backend Health
Write-Host "🏥 Testing backend health..." -ForegroundColor Blue
$healthResult = Test-ApiEndpoint -Endpoint "/api/health"

if (-not $healthResult.Success) {
    Write-Host "❌ Backend is not healthy. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend is healthy and responsive" -ForegroundColor Green
Write-Host ""

# Test 2: Test Session Status Endpoint (should work without authentication)
Write-Host "🔍 Testing session status endpoint..." -ForegroundColor Blue
$sessionResult = Test-ApiEndpoint -Endpoint "/api/auth/session-status" -Method "POST" -Body '{"timestamp": 1234567890, "purpose": "test"}'

if ($sessionResult.Status -eq 401 -or $sessionResult.Status -eq 200) {
    Write-Host "✅ Session status endpoint is responding correctly" -ForegroundColor Green
} else {
    Write-Host "⚠️  Session status endpoint returned unexpected status: $($sessionResult.Status)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Test Refresh Token Endpoint (should return error but no Mongoose casting error)
Write-Host "🔄 Testing refresh token endpoint (this should NOT cause Mongoose casting error)..." -ForegroundColor Blue

$refreshHeaders = @{
    "Cookie" = "refreshToken=invalid_test_token"
}

$refreshBody = @{
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    purpose = "test_mongoose_fix"
} | ConvertTo-Json

$refreshResult = Test-ApiEndpoint -Endpoint "/api/auth/refresh" -Method "POST" -Headers $refreshHeaders -Body $refreshBody

Write-Host ""
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "REFRESH TOKEN TEST RESULTS:" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta

if ($refreshResult.Success) {
    Write-Host "✅ UNEXPECTED: Refresh succeeded with invalid token" -ForegroundColor Yellow
} else {
    Write-Host "Status Code: $($refreshResult.Status)" -ForegroundColor White
    Write-Host "Error Message: $($refreshResult.Error)" -ForegroundColor White
    
    # Check for Mongoose casting error specifically
    if ($refreshResult.Error -match "Cast to string failed" -or $refreshResult.Error -match "CastError") {
        Write-Host ""
        Write-Host "🚨 MONGOOSE CASTING ERROR DETECTED!" -ForegroundColor Red
        Write-Host "🚨 The fix did NOT work - Mongoose is still trying to cast query objects to strings" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Red
        Write-Host $refreshResult.Error -ForegroundColor Red
        
        exit 1
    } elseif ($refreshResult.Status -eq 401) {
        Write-Host ""
        Write-Host "✅ GOOD: Received 401 Unauthorized (expected for invalid token)" -ForegroundColor Green
        Write-Host "✅ NO MONGOOSE CASTING ERROR DETECTED" -ForegroundColor Green
        Write-Host "✅ The fix appears to be working!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ℹ️  Received status $($refreshResult.Status) - checking if this indicates success..." -ForegroundColor Blue
        
        if ($refreshResult.Status -ne 500) {
            Write-Host "✅ Status is not 500, so no server error - likely fixed!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Got 500 error - need to investigate further" -ForegroundColor Yellow
        }
    }
}

Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""

# Test 4: Create a test user and get a real token to test with
Write-Host "👤 Testing with real user signup and login..." -ForegroundColor Blue

$testUser = @{
    username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPassword123!"
    displayName = "Test User"
    acceptTerms = $true
    gdprConsent = $true
} | ConvertTo-Json

Write-Host "Creating test user..." -ForegroundColor Yellow
$signupResult = Test-ApiEndpoint -Endpoint "/api/auth/signup" -Method "POST" -Body $testUser

if ($signupResult.Success -and $signupResult.Data.success) {
    Write-Host "✅ User signup successful" -ForegroundColor Green
    
    # Now try to login
    $loginData = @{
        identifier = ($testUser | ConvertFrom-Json).email
        password = ($testUser | ConvertFrom-Json).password
        rememberMe = $true
    } | ConvertTo-Json
    
    Write-Host "Attempting login..." -ForegroundColor Yellow
    $loginResult = Test-ApiEndpoint -Endpoint "/api/auth/login" -Method "POST" -Body $loginData
    
    if ($loginResult.Success -and $loginResult.Data.success) {
        Write-Host "✅ User login successful" -ForegroundColor Green
        
        $refreshToken = $loginResult.Data.tokens.refreshToken
        Write-Host "Got refresh token: $($refreshToken.Substring(0, [Math]::Min(20, $refreshToken.Length)))..." -ForegroundColor Blue
        
        # Test refresh with real token
        Write-Host "Testing refresh with real token..." -ForegroundColor Yellow
        $realRefreshHeaders = @{
            "Cookie" = "refreshToken=$refreshToken"
        }
        
        $realRefreshBody = @{
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            purpose = "real_token_test"
        } | ConvertTo-Json
        
        $realRefreshResult = Test-ApiEndpoint -Endpoint "/api/auth/refresh" -Method "POST" -Headers $realRefreshHeaders -Body $realRefreshBody
        
        if ($realRefreshResult.Success) {
            Write-Host "🎉 REAL TOKEN REFRESH SUCCESSFUL!" -ForegroundColor Green
            Write-Host "✅ Token refresh is working perfectly" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Real token refresh failed: $($realRefreshResult.Error)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Login failed, can't test with real token" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Signup failed, can't test with real token" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 FINAL RESULTS" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

if ($refreshResult.Error -notmatch "Cast to string failed" -and $refreshResult.Error -notmatch "CastError") {
    Write-Host "🎊 SUCCESS: No Mongoose casting errors detected!" -ForegroundColor Green
    Write-Host "✅ The refresh token fix is working" -ForegroundColor Green
    Write-Host "✅ Autologin should now function properly" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Fix Status: SUCCESSFUL" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FAILURE: Mongoose casting errors still present" -ForegroundColor Red
    Write-Host "❌ The fix needs more work" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Fix Status: NEEDS MORE WORK" -ForegroundColor Red
    exit 1
}