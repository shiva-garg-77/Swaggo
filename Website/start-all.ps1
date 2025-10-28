# 🚀 Swaggo Complete Startup Script
# Starts backend, frontend, and runs tests

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SWAGGO COMPLETE STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "  Starting Backend, Frontend, and Running Tests" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if (-not $mongoCheck.TcpTestSucceeded) {
    Write-Host "⚠️  MongoDB is not running on port 27017" -ForegroundColor Yellow
    Write-Host "   Please start MongoDB and try again" -ForegroundColor Yellow
    Write-Host "   Or update MONGOURI in Backend/.env.local" -ForegroundColor Yellow
} else {
    Write-Host "✅ MongoDB is running on port 27017" -ForegroundColor Green
}
Write-Host ""

# Check if Redis is running
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
$redisCheck = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
if (-not $redisCheck.TcpTestSucceeded) {
    Write-Host "⚠️  Redis is not running on port 6379" -ForegroundColor Yellow
    Write-Host "   Starting Redis from local installation..." -ForegroundColor Yellow
    
    $redisPath = ".\Backend\redis\redis-server.exe"
    if (Test-Path $redisPath) {
        Start-Process -FilePath $redisPath -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-Host "✅ Redis started" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis executable not found at $redisPath" -ForegroundColor Yellow
        Write-Host "   Please install Redis or update REDIS_HOST in Backend/.env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Redis is running on port 6379" -ForegroundColor Green
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "  Installing root dependencies..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot\..
npm install --silent 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Root dependencies installed" -ForegroundColor Green
}

Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot\Backend
npm install --silent 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green
}

Write-Host "  Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot\Frontend
npm install --silent 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
}
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot\Backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PSScriptRoot\Backend
    npm start
}
Write-Host "  Backend server starting (Job ID: $($backendJob.Id))..." -ForegroundColor Cyan

# Wait for backend to be ready
Write-Host "  Waiting for backend to be ready..." -ForegroundColor Cyan
$maxWait = 30
$waited = 0
$backendReady = $false

while ($waited -lt $maxWait -and -not $backendReady) {
    Start-Sleep -Seconds 1
    $waited++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:45799/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "  ✅ Backend server is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Cyan
    }
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "  ⚠️  Backend server did not respond within $maxWait seconds" -ForegroundColor Yellow
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot\Frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PSScriptRoot\Frontend
    npm run dev
}
Write-Host "  Frontend server starting (Job ID: $($frontendJob.Id))..." -ForegroundColor Cyan

# Wait for frontend to be ready
Write-Host "  Waiting for frontend to be ready..." -ForegroundColor Cyan
$maxWait = 30
$waited = 0
$frontendReady = $false

while ($waited -lt $maxWait -and -not $frontendReady) {
    Start-Sleep -Seconds 1
    $waited++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "  ✅ Frontend server is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Cyan
    }
}

if (-not $frontendReady) {
    Write-Host ""
    Write-Host "  ⚠️  Frontend server did not respond within $maxWait seconds" -ForegroundColor Yellow
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Run Tests
Write-Host "Running Socket Connection Tests..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot\Backend
node test-socket-connection.js

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTUP COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:45799" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  GraphQL:  http://localhost:45799/graphql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Job IDs:" -ForegroundColor Yellow
Write-Host "  Backend:  $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "  Frontend: $($frontendJob.Id)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, run:" -ForegroundColor Yellow
Write-Host "  Stop-Job -Id $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "  Stop-Job -Id $($frontendJob.Id)" -ForegroundColor Cyan
Write-Host "  Remove-Job -Id $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "  Remove-Job -Id $($frontendJob.Id)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use the stop-all.ps1 script" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to exit this script (services will continue running)" -ForegroundColor Yellow
Write-Host ""

# Keep script running to show logs
Write-Host "Showing backend logs (press Ctrl+C to exit):" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    while ($true) {
        $backendOutput = Receive-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        if ($backendOutput) {
            Write-Host $backendOutput
        }
        
        $frontendOutput = Receive-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            Write-Host $frontendOutput -ForegroundColor Blue
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "Script exited. Services are still running." -ForegroundColor Yellow
    Write-Host "Use stop-all.ps1 to stop all services." -ForegroundColor Yellow
}
