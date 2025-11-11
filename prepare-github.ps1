#!/usr/bin/env pwsh
# prepare-github.ps1 - Prepara el proyecto para subir a GitHub

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Preparando Ramen SOC para GitHub...`n" -ForegroundColor Cyan

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# 1. Verificar archivos sensibles
Write-Host "1️⃣ Verificando archivos sensibles..." -ForegroundColor Yellow

$sensitiveFiles = @(
    "backend/.env",
    "frontend/.env",
    "backend/*.log",
    "backend/credentials/*",
    "backend/secrets/*"
)

$found = $false
foreach ($pattern in $sensitiveFiles) {
    if (Test-Path $pattern) {
        Write-Host "   ⚠️  Archivo sensible encontrado: $pattern" -ForegroundColor Yellow
        $found = $true
    }
}

if ($found) {
    Write-Host "   ℹ️  Archivos sensibles NO se subirán (protegidos por .gitignore)" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ No hay archivos sensibles" -ForegroundColor Green
}

# 2. Verificar .gitignore
Write-Host "`n2️⃣ Verificando .gitignore..." -ForegroundColor Yellow

if (-not (Test-Path ".gitignore")) {
    Write-Host "   ❌ Falta archivo .gitignore" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ .gitignore presente" -ForegroundColor Green

# 3. Verificar archivos de ejemplo
Write-Host "`n3️⃣ Verificando archivos de ejemplo..." -ForegroundColor Yellow

$exampleFiles = @(
    "backend/.env.example",
    "frontend/.env.example"
)

foreach ($file in $exampleFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file presente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $file faltante (se recomienda crearlo)" -ForegroundColor Yellow
    }
}

# 4. Verificar documentación
Write-Host "`n4️⃣ Verificando documentación..." -ForegroundColor Yellow

$docs = @(
    "README.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "TECHNICAL_REFERENCE.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc presente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $doc faltante" -ForegroundColor Yellow
    }
}

# 5. Verificar estructura de carpetas
Write-Host "`n5️⃣ Verificando estructura de carpetas..." -ForegroundColor Yellow

$folders = @(
    "backend",
    "frontend",
    "modules",
    "storage"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "   ✅ $folder/ existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $folder/ faltante" -ForegroundColor Red
    }
}

# 6. Limpiar archivos temporales
Write-Host "`n6️⃣ Limpiando archivos temporales..." -ForegroundColor Yellow

$tempPatterns = @(
    "*.log",
    "*.tmp",
    "*.bak",
    "*_backup.*",
    "test-*.zip"
)

$cleaned = 0
foreach ($pattern in $tempPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.DirectoryName -notmatch "node_modules") {
            Remove-Item $file.FullName -Force
            $cleaned++
        }
    }
}

if ($cleaned -gt 0) {
    Write-Host "   ✅ $cleaned archivos temporales eliminados" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay archivos temporales" -ForegroundColor Green
}

# 7. Verificar node_modules NO está en git
Write-Host "`n7️⃣ Verificando que node_modules no se suba..." -ForegroundColor Yellow

$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -match "node_modules") {
    Write-Host "   ✅ node_modules en .gitignore" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules NO está en .gitignore" -ForegroundColor Red
    exit 1
}

# 8. Verificar package.json
Write-Host "`n8️⃣ Verificando package.json..." -ForegroundColor Yellow

if (Test-Path "backend/package.json") {
    $pkg = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
    Write-Host "   ✅ Backend: $($pkg.name) v$($pkg.version)" -ForegroundColor Green
}

if (Test-Path "frontend/package.json") {
    $pkg = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
    Write-Host "   ✅ Frontend: $($pkg.name) v$($pkg.version)" -ForegroundColor Green
}

# 9. Resumen de tamaño
Write-Host "`n9️⃣ Calculando tamaño del proyecto..." -ForegroundColor Yellow

$totalSize = 0
$fileCount = 0

Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "\.git" -and
    $_.FullName -notmatch "dist"
} | ForEach-Object {
    $totalSize += $_.Length
    $fileCount++
}

$sizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "   📊 Archivos: $fileCount" -ForegroundColor Cyan
Write-Host "   📦 Tamaño total: $sizeMB MB" -ForegroundColor Cyan

# 10. Git status
Write-Host "`n🔟 Estado de Git..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "   ✅ Repositorio Git inicializado" -ForegroundColor Green
    
    $branch = git branch --show-current 2>$null
    if ($branch) {
        Write-Host "   📍 Rama actual: $branch" -ForegroundColor Cyan
    }
    
    $status = git status --porcelain 2>$null
    if ($status) {
        $changes = ($status | Measure-Object).Count
        Write-Host "   📝 Archivos con cambios: $changes" -ForegroundColor Cyan
    } else {
        Write-Host "   ✅ Working directory limpio" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Git no inicializado. Ejecuta: git init" -ForegroundColor Yellow
}

# Resultado final
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ PROYECTO LISTO PARA GITHUB" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Inicializar Git (si no está):" -ForegroundColor White
Write-Host "      git init" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Agregar archivos:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Primer commit:" -ForegroundColor White
Write-Host "      git commit -m 'Initial commit: Ramen SOC v1.0'" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Crear repositorio en GitHub:" -ForegroundColor White
Write-Host "      https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Conectar y subir:" -ForegroundColor White
Write-Host "      git remote add origin https://github.com/tu-usuario/ramen-soc.git" -ForegroundColor Gray
Write-Host "      git branch -M main" -ForegroundColor Gray
Write-Host "      git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Verifica que .env NO se suba (debe estar en .gitignore)" -ForegroundColor Yellow
Write-Host "   - La licencia es BSL 1.1 (Business Source License)" -ForegroundColor Yellow
Write-Host "   - Actualiza los emails de contacto en LICENSE y SECURITY.md" -ForegroundColor Yellow
Write-Host ""
