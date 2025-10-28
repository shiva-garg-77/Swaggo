# 🛑 Swaggo Stop All Services Script

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  STOPPING ALL SWAGGO SERVICES" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# Stop all Node.js processes on ports 3000, 3001, and 45799
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow

# Find and kill processes on port 45799 (Backend)
$backendProcess = Get-NetTCPConnection -LocalPort 45799 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($backendProcess) {
    foreach ($pid in $backendProcess) {
        Write-Host "  Stopping backend process (PID: $pid)..." -ForegroundColor Cyan
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ Backend stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No backend process found on port 45799" -ForegroundColor Gray
}

# Find and kill processes on port 3000 (Frontend)
$frontendProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($frontendProcess) {
    foreach ($pid in $frontendProcess) {
        Write-Host "  Stopping frontend process (PID: $pid)..." -ForegroundColor Cyan
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ Frontend stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No frontend process found on port 3000" -ForegroundColor Gray
}

# Find and kill processes on port 3001 (Alternative Frontend)
$frontendProcess2 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($frontendProcess2) {
    foreach ($pid in $frontendProcess2) {
        Write-Host "  Stopping frontend process (PID: $pid)..." -ForegroundColor Cyan
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ Alternative frontend stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No frontend process found on port 3001" -ForegroundColor Gray
}

# Stop all PowerShell jobs
Write-Host ""
Write-Host "Stopping PowerShell jobs..." -ForegroundColor Yellow
$jobs = Get-Job -ErrorAction SilentlyContinue
if ($jobs) {
    foreach ($job in $jobs) {
        Write-Host "  Stopping job: $($job.Name) (ID: $($job.Id))..." -ForegroundColor Cyan
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ All jobs stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No PowerShell jobs found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ALL SERVICES STOPPED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
