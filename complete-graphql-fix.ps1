# Complete GraphQL Fix Script for Swaggo Project
Write-Host "Starting comprehensive GraphQL fix..." -ForegroundColor Green

# 1. Clean all node_modules
Write-Host "1. Cleaning node_modules directories..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Removing root node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

if (Test-Path "Website\Frontend\node_modules") {
    Write-Host "Removing Frontend node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "Website\Frontend\node_modules" -ErrorAction SilentlyContinue
}

if (Test-Path "Website\Backend\node_modules") {
    Write-Host "Removing Backend node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "Website\Backend\node_modules" -ErrorAction SilentlyContinue
}

# 2. Clean package-lock files
Write-Host "2. Cleaning package-lock files..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

if (Test-Path "Website\Frontend\package-lock.json") {
    Remove-Item -Force "Website\Frontend\package-lock.json" -ErrorAction SilentlyContinue
}

if (Test-Path "Website\Backend\package-lock.json") {
    Remove-Item -Force "Website\Backend\package-lock.json" -ErrorAction SilentlyContinue
}

# 3. Update root package.json to remove direct graphql dependency
Write-Host "3. Updating root package.json..." -ForegroundColor Yellow
$rootPackage = Get-Content "package.json" | ConvertFrom-Json
$rootPackage.PSObject.Properties.Remove('dependencies')
$rootPackage | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# 4. Update Frontend package.json to remove resolutions and keep only overrides
Write-Host "4. Updating Frontend package.json..." -ForegroundColor Yellow
$frontendPackage = Get-Content "Website\Frontend\package.json" | ConvertFrom-Json
$frontendPackage.PSObject.Properties.Remove('resolutions')
$frontendPackage | ConvertTo-Json -Depth 10 | Set-Content "Website\Frontend\package.json"

# 5. Install dependencies from root
Write-Host "5. Installing root dependencies..." -ForegroundColor Yellow
npm install

# 6. Install Frontend dependencies
Write-Host "6. Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location "Website\Frontend"
npm install
Set-Location "..\.."

# 7. Install Backend dependencies
Write-Host "7. Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location "Website\Backend"
npm install
Set-Location "..\.."

Write-Host "Complete GraphQL fix finished!" -ForegroundColor Green
Write-Host "Please run 'npm run dev' in both Frontend and Backend directories to test." -ForegroundColor Cyan