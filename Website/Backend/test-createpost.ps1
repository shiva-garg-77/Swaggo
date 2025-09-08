# Start server in background
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "main.js"

# Wait for server to start
Start-Sleep -Seconds 3

# Test CreatePost mutation without authentication
try {
    $body = @{
        query = 'mutation {
            CreatePost(
                profileid: "test123",
                postUrl: "https://example.com/image.jpg",
                title: "Test Post",
                postType: "IMAGE"
            ) {
                postid
                title
            }
        }'
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:45799/graphql" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 5
    Write-Output "CreatePost without auth: $($response.Content)"
} catch {
    Write-Output "CreatePost error: $($_.Exception.Message)"
}

# Clean up
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
