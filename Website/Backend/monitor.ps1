# Swaggo Backend Server Monitor
Write-Host "🔍 Swaggo Backend Server Monitor" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if server process is running
$serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($serverProcess) {
    Write-Host "✅ Server Status: RUNNING" -ForegroundColor Green
    Write-Host "📊 Process Info:" -ForegroundColor Yellow
    $serverProcess | Select-Object Id, ProcessName, WorkingSet, CPU | Format-Table -AutoSize
} else {
    Write-Host "❌ Server Status: NOT RUNNING" -ForegroundColor Red
}

# Check port 45799
Write-Host "🌐 Network Status:" -ForegroundColor Yellow
$portStatus = netstat -ano | Select-String "45799"
if ($portStatus) {
    Write-Host "✅ Port 45799: LISTENING" -ForegroundColor Green
    $portStatus
} else {
    Write-Host "❌ Port 45799: NOT LISTENING" -ForegroundColor Red
}

# Check MongoDB connections
Write-Host "🗄️ Database Connections:" -ForegroundColor Yellow
$mongoConnections = netstat -an | Select-String "27017" | Measure-Object
$connectionCount = $mongoConnections.Count
Write-Host "📊 MongoDB connections: $connectionCount" -ForegroundColor $(if ($connectionCount -lt 30) { "Green" } else { "Yellow" })

# Health check
Write-Host "🏥 Health Check:" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:45799/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Server Health: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "📝 Message: $($healthResponse.message)" -ForegroundColor Cyan
    Write-Host "⏰ Timestamp: $($healthResponse.timestamp)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "• To start server: npm start" -ForegroundColor Cyan
Write-Host "• To stop server: Get-Process -Name node | Stop-Process" -ForegroundColor Cyan