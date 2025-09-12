#!/usr/bin/env pwsh
# Fix mongoose model overwrite errors

Write-Host "🔧 Fixing Mongoose model overwrite errors..." -ForegroundColor Yellow

$modelsPath = "C:\Users\Aditya\OneDrive\Desktop\swaggo\Swaggo\Website\Backend\Models"

# Get all JS files recursively
$jsFiles = Get-ChildItem -Path $modelsPath -Filter "*.js" -Recurse

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Simple string replacement for mongoose.model exports
    if ($content -like "*export default mongoose.model(*") {
        # Use simple string replacement
        $lines = Get-Content -Path $file.FullName
        $updatedLines = @()
        
        foreach ($line in $lines) {
            if ($line -match "^export default mongoose\.model\(") {
                # Extract model name and schema from the line
                if ($line -match 'mongoose\.model\("([^"]+)",\s*(.+)\)') {
                    $modelName = $matches[1]
                    $schemaName = $matches[2]
                    $newLine = "export default mongoose.models.$modelName || mongoose.model(`"$modelName`", $schemaName)"
                    $updatedLines += $newLine
                    Write-Host "✅ Fixed: $($file.Name) - $modelName model" -ForegroundColor Green
                } else {
                    $updatedLines += $line
                }
            } else {
                $updatedLines += $line
            }
        }
        
        Set-Content -Path $file.FullName -Value $updatedLines
    }
}

Write-Host "🎉 All mongoose models fixed!" -ForegroundColor Green
