# Start server in background
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "main.js"

# Wait for server to start
Start-Sleep -Seconds 3

# Test GraphQL endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:45799/graphql" -Method POST -ContentType "application/json" -Body '{"query":"{ hello }"}' -TimeoutSec 5
    Write-Output "Success: $($response.Content)"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}

# Test basic endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:45799/" -TimeoutSec 5
    Write-Output "Root endpoint: $($response.Content)"
} catch {
    Write-Output "Root endpoint error: $($_.Exception.Message)"
}

# Clean up
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
