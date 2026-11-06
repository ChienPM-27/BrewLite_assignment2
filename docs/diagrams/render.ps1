# ==============================================================================
# PowerShell Script: Kết xuất sơ đồ PlantUML (.puml) sang SVG (.svg) cho Windows
# ==============================================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..").FullName

Write-Host "🎨 Đang tìm kiếm các file PlantUML (*.puml) trong docs..." -ForegroundColor Cyan

$pumlFiles = Get-ChildItem -Path "$rootDir\docs" -Recurse -Filter "*.puml"

if ($pumlFiles.Count -eq 0) {
    Write-Warning "Không tìm thấy file .puml nào trong docs."
    exit 0
}

# 1. Kiểm tra Docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host "🐳 Tìm thấy Docker! Đang kết xuất sơ đồ bằng container plantuml/plantuml..." -ForegroundColor Green
    foreach ($file in $pumlFiles) {
        $relPath = $file.FullName.Substring($rootDir.Length + 1).Replace("\", "/")
        Write-Host "  ➔ Đang xử lý: $relPath" -ForegroundColor Yellow
        docker run --rm -v "${rootDir}:/workspace" -w /workspace plantuml/plantuml -tsvg $relPath
    }
    Write-Host "✅ Hoàn tất kết xuất toàn bộ sơ đồ sang SVG bằng Docker!" -ForegroundColor Green
    exit 0
}

# 2. Kiểm tra lệnh plantuml
$plantumlCmd = Get-Command plantuml -ErrorAction SilentlyContinue
if ($plantumlCmd) {
    Write-Host "☕ Tìm thấy plantuml CLI trên máy!" -ForegroundColor Green
    foreach ($file in $pumlFiles) {
        Write-Host "  ➔ Đang xử lý: $($file.Name)" -ForegroundColor Yellow
        plantuml -tsvg $file.FullName
    }
    Write-Host "✅ Hoàn tất kết xuất toàn bộ sơ đồ sang SVG!" -ForegroundColor Green
    exit 0
}

Write-Error "Không tìm thấy Docker hoặc plantuml CLI. Vui lòng bật Docker Desktop để chạy script!"
