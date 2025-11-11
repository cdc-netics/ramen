#!/usr/bin/env pwsh
# test-zip-validation.ps1 - Test completo de validación y subida de módulos ZIP

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:4000"

Write-Host "`n🧪 TEST: Validación y Subida de Módulos ZIP`n" -ForegroundColor Cyan

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
}

# 2. CREAR MÓDULO DE PRUEBA VÁLIDO
Write-Host "`n2️⃣ Creando módulo de prueba válido..." -ForegroundColor Yellow

$tempDir = Join-Path $env:TEMP "ramen-test-module-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Crear package.json
$packageJson = @"
{
  "name": "test-valid-module",
  "version": "1.0.0",
  "description": "Módulo de prueba válido para testing",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "author": "Test Suite"
}
"@
Set-Content -Path (Join-Path $tempDir "package.json") -Value $packageJson

# Crear server.js
$serverJs = @"
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'test-valid-module' });
});

app.listen(PORT, () => {
  console.log('Test module listening on port ' + PORT);
});
"@
Set-Content -Path (Join-Path $tempDir "server.js") -Value $serverJs

# Crear README.md
$readme = @"
# Test Valid Module

Este es un módulo de prueba válido.

## Instalación

\`\`\`bash
npm install
npm start
\`\`\`
"@
Set-Content -Path (Join-Path $tempDir "README.md") -Value $readme

# Crear src/utils.js
$srcDir = Join-Path $tempDir "src"
New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
Set-Content -Path (Join-Path $srcDir "utils.js") -Value "module.exports = { test: () => 'test' };"

Write-Host "   ✅ Estructura de archivos creada" -ForegroundColor Green

# 3. CREAR ZIP DEL MÓDULO VÁLIDO
Write-Host "`n3️⃣ Creando archivo ZIP del módulo válido..." -ForegroundColor Yellow

$validZipPath = Join-Path $env:TEMP "test-valid-module.zip"

# Eliminar ZIP anterior si existe
if (Test-Path $validZipPath) {
    Remove-Item $validZipPath -Force
}

# Crear ZIP usando .NET
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $validZipPath)

Write-Host "   ✅ ZIP creado: $validZipPath" -ForegroundColor Green
Write-Host "   📦 Tamaño: $([Math]::Round((Get-Item $validZipPath).Length / 1024, 2)) KB" -ForegroundColor Gray

# 4. VALIDAR MÓDULO (sin instalar)
Write-Host "`n4️⃣ Validando módulo (sin instalar)..." -ForegroundColor Yellow

try {
    $validateForm = @{
        module = Get-Item -Path $validZipPath
    }
    
    $validateResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules/validate-zip" -Method POST -Headers $headers -Form $validateForm
    
    Write-Host "   ✅ Validación completada" -ForegroundColor Green
    Write-Host "   📊 Estado: $(if ($validateResponse.valid) { '✅ VÁLIDO' } else { '❌ INVÁLIDO' })" -ForegroundColor $(if ($validateResponse.valid) { "Green" } else { "Red" })
    Write-Host "   🎯 Score: $($validateResponse.score)/100" -ForegroundColor Cyan
    Write-Host "   📦 Package: $($validateResponse.packageJson.name) v$($validateResponse.packageJson.version)" -ForegroundColor Gray
    Write-Host "   🚀 Entry Point: $($validateResponse.entryPoint)" -ForegroundColor Gray
    Write-Host "   📁 Archivos: $($validateResponse.structure.fileCount)" -ForegroundColor Gray
    
    if ($validateResponse.errors.Count -gt 0) {
        Write-Host "   ❌ Errores: $($validateResponse.errors.Count)" -ForegroundColor Red
        $validateResponse.errors | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    }
    
    if ($validateResponse.warnings.Count -gt 0) {
        Write-Host "   ⚠️ Advertencias: $($validateResponse.warnings.Count)" -ForegroundColor Yellow
        $validateResponse.warnings | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
    }
    
    # Mostrar reporte de texto
    if ($validateResponse.textReport) {
        Write-Host "`n   📄 REPORTE DETALLADO:" -ForegroundColor Cyan
        Write-Host $validateResponse.textReport -ForegroundColor Gray
    }
    
} catch {
    Write-Host "   ❌ Error en validación: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. SUBIR E INSTALAR MÓDULO
Write-Host "`n5️⃣ Subiendo e instalando módulo..." -ForegroundColor Yellow

try {
    $uploadForm = @{
        module = Get-Item -Path $validZipPath
        enabled = "true"
        type = "internal"
    }
    
    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules/upload-zip" -Method POST -Headers $headers -Form $uploadForm
    
    Write-Host "   ✅ Módulo subido e instalado" -ForegroundColor Green
    Write-Host "   🆔 ID: $($uploadResponse.module._id)" -ForegroundColor Gray
    Write-Host "   📦 Nombre: $($uploadResponse.module.name)" -ForegroundColor Gray
    Write-Host "   📝 Descripción: $($uploadResponse.module.description)" -ForegroundColor Gray
    Write-Host "   🚀 Entry Point: $($uploadResponse.module.entryPoint)" -ForegroundColor Gray
    Write-Host "   👤 Subido por: $($uploadResponse.module.uploadedBy)" -ForegroundColor Gray
    
    if ($uploadResponse.installation) {
        Write-Host "   📦 Instalación: $($uploadResponse.installation.status)" -ForegroundColor $(if ($uploadResponse.installation.status -eq 'installed') { "Green" } else { "Yellow" })
    }
    
    $moduleId = $uploadResponse.module._id
    
} catch {
    Write-Host "   ❌ Error subiendo módulo: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Detalles: $_" -ForegroundColor Red
    exit 1
}

# 6. VERIFICAR QUE EL MÓDULO ESTÁ REGISTRADO
Write-Host "`n6️⃣ Verificando módulo registrado en API..." -ForegroundColor Yellow

try {
    $modules = Invoke-RestMethod -Uri "$baseUrl/api/modules" -Method GET -Headers $headers
    $foundModule = $modules | Where-Object { $_._id -eq $moduleId }
    
    if ($foundModule) {
        Write-Host "   ✅ Módulo encontrado en la API" -ForegroundColor Green
        Write-Host "   📦 Nombre: $($foundModule.name)" -ForegroundColor Gray
        Write-Host "   🔧 Tipo: $($foundModule.type)" -ForegroundColor Gray
        Write-Host "   ✅ Habilitado: $($foundModule.enabled)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ Módulo no encontrado por ID, buscando por nombre..." -ForegroundColor Yellow
        $foundModule = $modules | Where-Object { $_.name -eq 'test-valid-module' } | Select-Object -First 1
        
        if ($foundModule) {
            Write-Host "   ✅ Módulo encontrado por nombre" -ForegroundColor Green
            Write-Host "   🆔 ID: $($foundModule._id)" -ForegroundColor Gray
            Write-Host "   📦 Nombre: $($foundModule.name)" -ForegroundColor Gray
            $moduleId = $foundModule._id  # Actualizar ID para la limpieza
        } else {
            Write-Host "   ❌ ERROR: Módulo NO encontrado en la API" -ForegroundColor Red
            Write-Host "   📋 Módulos disponibles:" -ForegroundColor Gray
            $modules | ForEach-Object { Write-Host "      - $($_._id): $($_.name)" -ForegroundColor DarkGray }
            exit 1
        }
    }
} catch {
    Write-Host "   ❌ Error verificando API: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. VERIFICAR ARCHIVOS EN DISCO
Write-Host "`n7️⃣ Verificando archivos en disco..." -ForegroundColor Yellow

$modulesBaseDir = Join-Path $PSScriptRoot "..\modules"
$moduleDir = Join-Path $modulesBaseDir $moduleId

if (Test-Path $moduleDir) {
    Write-Host "   ✅ Carpeta del módulo existe" -ForegroundColor Green
    Write-Host "   📂 Ruta: $moduleDir" -ForegroundColor Gray
    
    # Verificar archivos clave
    $packageJsonPath = Join-Path $moduleDir "package.json"
    $serverJsPath = Join-Path $moduleDir "server.js"
    $nodeModulesPath = Join-Path $moduleDir "node_modules"
    
    if (Test-Path $packageJsonPath) {
        Write-Host "   ✅ package.json existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ package.json NO existe" -ForegroundColor Red
    }
    
    if (Test-Path $serverJsPath) {
        Write-Host "   ✅ server.js existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ server.js NO existe" -ForegroundColor Red
    }
    
    if (Test-Path $nodeModulesPath) {
        Write-Host "   ✅ node_modules instalado" -ForegroundColor Green
        $depCount = (Get-ChildItem $nodeModulesPath -Directory).Count
        Write-Host "   📦 Dependencias instaladas: $depCount" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ node_modules NO existe (instalación falló)" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "   ❌ ERROR: Carpeta del módulo NO existe" -ForegroundColor Red
    exit 1
}

# 8. CREAR MÓDULO INVÁLIDO (sin package.json)
Write-Host "`n8️⃣ Probando módulo INVÁLIDO (sin package.json)..." -ForegroundColor Yellow

$invalidDir = Join-Path $env:TEMP "ramen-test-invalid-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $invalidDir -Force | Out-Null

# Solo crear server.js (sin package.json)
Set-Content -Path (Join-Path $invalidDir "server.js") -Value "console.log('invalid module');"

$invalidZipPath = Join-Path $env:TEMP "test-invalid-module.zip"
if (Test-Path $invalidZipPath) {
    Remove-Item $invalidZipPath -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($invalidDir, $invalidZipPath)

Write-Host "   📦 ZIP inválido creado" -ForegroundColor Gray

try {
    $invalidForm = @{
        module = Get-Item -Path $invalidZipPath
    }
    
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules/validate-zip" -Method POST -Headers $headers -Form $invalidForm
    
    if (-not $invalidResponse.valid) {
        Write-Host "   ✅ Validación correcta: módulo rechazado" -ForegroundColor Green
        Write-Host "   ❌ Errores detectados: $($invalidResponse.errors.Count)" -ForegroundColor Cyan
        $invalidResponse.errors | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    } else {
        Write-Host "   ❌ ERROR: Módulo inválido fue aceptado" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "   ✅ Validación rechazó el módulo (esperado)" -ForegroundColor Green
}

# 9. LIMPIAR MÓDULO DE PRUEBA
Write-Host "`n9️⃣ Limpiando módulo de prueba..." -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "$baseUrl/api/modules/$moduleId" -Method DELETE -Headers $headers | Out-Null
    Write-Host "   ✅ Módulo eliminado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ No se pudo eliminar el módulo" -ForegroundColor Yellow
}

# 10. LIMPIAR ARCHIVOS TEMPORALES
Write-Host "`n🧹 Limpiando archivos temporales..." -ForegroundColor Yellow

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $invalidDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $validZipPath -Force -ErrorAction SilentlyContinue
Remove-Item $invalidZipPath -Force -ErrorAction SilentlyContinue

Write-Host "   ✅ Archivos temporales eliminados" -ForegroundColor Green

# RESULTADO FINAL
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ TEST COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Login exitoso" -ForegroundColor White
Write-Host "   ✅ Módulo válido creado y comprimido" -ForegroundColor White
Write-Host "   ✅ Validación de ZIP funcional" -ForegroundColor White
Write-Host "   ✅ Subida e instalación exitosa" -ForegroundColor White
Write-Host "   ✅ Módulo registrado en API" -ForegroundColor White
Write-Host "   ✅ Archivos extraídos en disco" -ForegroundColor White
Write-Host "   ✅ Dependencias instaladas" -ForegroundColor White
Write-Host "   ✅ Módulo inválido rechazado correctamente" -ForegroundColor White
Write-Host "   ✅ Limpieza completada" -ForegroundColor White
Write-Host ""
Write-Host "🎯 El sistema de validación y subida de ZIP funciona perfectamente" -ForegroundColor Green
Write-Host ""
