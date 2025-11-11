#!/usr/bin/env pwsh
# test-delete-module.ps1 - Test completo de eliminación de módulos

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:4000"

Write-Host "`n🧪 TEST: Eliminación Completa de Módulos`n" -ForegroundColor Cyan

# 1. LOGIN
Write-Host "1️⃣ Login como owner..." -ForegroundColor Yellow
$loginBody = @{
    username = "owner"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Host "   ✅ Token obtenido" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. CREAR MÓDULO DE PRUEBA
Write-Host "`n2️⃣ Creando módulo de prueba..." -ForegroundColor Yellow
$moduleBody = @{
    name = "Test Delete Module"
    description = "Módulo temporal para probar eliminación"
    type = "internal"
    enabled = $true
} | ConvertTo-Json

try {
    $moduleResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules" -Method POST -Headers $headers -Body $moduleBody
    $moduleId = $moduleResponse._id
    Write-Host "   ✅ Módulo creado: $moduleId" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error creando módulo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. GUARDAR ARCHIVOS DEL MÓDULO
Write-Host "`n3️⃣ Guardando archivos del módulo en disco..." -ForegroundColor Yellow
$filesBody = @{
    files = @(
        @{
            path = "package.json"
            content = @"
{
  "name": "test-delete-module",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}
"@
            language = "json"
        },
        @{
            path = "server.js"
            content = @"
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log('Test module running on port ' + PORT);
});
"@
            language = "javascript"
        },
        @{
            path = "src/utils.js"
            content = "module.exports = { test: () => 'test' };"
            language = "javascript"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $filesResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules/$moduleId/files" -Method POST -Headers $headers -Body $filesBody
    Write-Host "   ✅ Archivos guardados: $($filesResponse.count) archivos" -ForegroundColor Green
    Write-Host "   📂 Directorio: $($filesResponse.moduleDir)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error guardando archivos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. VERIFICAR QUE EXISTEN LOS ARCHIVOS EN DISCO
Write-Host "`n4️⃣ Verificando archivos en disco..." -ForegroundColor Yellow
$modulesBaseDir = Join-Path $PSScriptRoot "..\modules"
$moduleDir = Join-Path $modulesBaseDir $moduleId

if (Test-Path $moduleDir) {
    $fileCount = (Get-ChildItem -Path $moduleDir -Recurse -File).Count
    Write-Host "   ✅ Carpeta existe: $moduleDir" -ForegroundColor Green
    Write-Host "   📁 Archivos encontrados: $fileCount" -ForegroundColor Gray
    
    # Listar archivos
    Write-Host "   📄 Contenido:" -ForegroundColor Gray
    Get-ChildItem -Path $moduleDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Replace("$moduleDir\", "")
        Write-Host "      - $relativePath" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   ❌ ERROR: Carpeta no existe en disco" -ForegroundColor Red
    exit 1
}

# 5. ELIMINAR MÓDULO
Write-Host "`n5️⃣ Eliminando módulo..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules/$moduleId" -Method DELETE -Headers $headers
    Write-Host "   ✅ Módulo eliminado de la API" -ForegroundColor Green
    Write-Host "   💾 Memoria eliminada: $($deleteResponse.message)" -ForegroundColor Gray
    Write-Host "   💿 Disco eliminado: $($deleteResponse.diskDeleted)" -ForegroundColor $(if ($deleteResponse.diskDeleted) { "Green" } else { "Red" })
    
    if ($deleteResponse.moduleDir) {
        Write-Host "   📂 Directorio: $($deleteResponse.moduleDir)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error eliminando módulo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. VERIFICAR QUE NO EXISTE EN LA API
Write-Host "`n6️⃣ Verificando eliminación en API..." -ForegroundColor Yellow
try {
    $checkResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules" -Method GET -Headers $headers
    $exists = $checkResponse.modules | Where-Object { $_._id -eq $moduleId }
    
    if ($null -eq $exists) {
        Write-Host "   ✅ Módulo NO existe en API (correcto)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: Módulo TODAVÍA existe en API" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error verificando API: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. VERIFICAR QUE NO EXISTEN LOS ARCHIVOS EN DISCO
Write-Host "`n7️⃣ Verificando eliminación en disco..." -ForegroundColor Yellow
Start-Sleep -Seconds 1  # Dar tiempo al sistema de archivos

if (Test-Path $moduleDir) {
    Write-Host "   ❌ ERROR: Carpeta TODAVÍA existe en disco" -ForegroundColor Red
    Write-Host "   📂 Ruta: $moduleDir" -ForegroundColor Gray
    
    # Listar lo que quedó
    $remainingFiles = (Get-ChildItem -Path $moduleDir -Recurse -File).Count
    Write-Host "   📁 Archivos que quedaron: $remainingFiles" -ForegroundColor Red
    exit 1
} else {
    Write-Host "   ✅ Carpeta NO existe en disco (correcto)" -ForegroundColor Green
}

# 8. RESULTADO FINAL
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ TEST COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Módulo creado correctamente" -ForegroundColor White
Write-Host "   ✅ Archivos guardados en disco" -ForegroundColor White
Write-Host "   ✅ Eliminación de memoria exitosa" -ForegroundColor White
Write-Host "   ✅ Eliminación de disco exitosa" -ForegroundColor White
Write-Host "   ✅ Verificaciones pasadas" -ForegroundColor White
Write-Host ""
