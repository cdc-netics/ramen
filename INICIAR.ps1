#!/usr/bin/env pwsh
# RAMEN SOC - Script de inicio completo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAMEN SOC ORQUESTADOR - INICIO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = Get-Location }

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Función para detener procesos en un puerto
function Stop-ProcessOnPort {
    param([int]$Port, [string]$Name)
    
    if (Test-Port -Port $Port) {
        Write-Host "⚠️  Puerto $Port ocupado. Deteniendo proceso..." -ForegroundColor Yellow
        $proc = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                Select-Object -ExpandProperty OwningProcess -First 1
        if ($proc) {
            Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "✅ Proceso detenido" -ForegroundColor Green
        }
    }
}

# Paso 1: Detener procesos anteriores
Write-Host "[1/6] Deteniendo procesos anteriores..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 4000 -Name "Backend"
Stop-ProcessOnPort -Port 4200 -Name "Frontend"
Write-Host ""

# Paso 2: Verificar Node.js
Write-Host "[2/6] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descarga e instala Node.js desde: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Paso 3: Verificar dependencias del backend
Write-Host "[3/6] Verificando dependencias del backend..." -ForegroundColor Yellow
Set-Location "$rootDir\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencias del backend OK" -ForegroundColor Green
}
Write-Host ""

# Paso 4: Verificar dependencias del frontend
Write-Host "[4/6] Verificando dependencias del frontend..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencias del frontend OK" -ForegroundColor Green
}
Write-Host ""

# Paso 5: Iniciar backend
Write-Host "[5/6] Iniciando backend en puerto 4000..." -ForegroundColor Yellow
Set-Location "$rootDir\backend"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:rootDir\backend
    node simple-server.js
}
Start-Sleep -Seconds 5

# Verificar que el backend levantó
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/api/health" -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "✅ Backend iniciado correctamente" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend no responde. Revisar logs." -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}
Write-Host ""

# Paso 6: Iniciar frontend
Write-Host "[6/6] Iniciando frontend en puerto 4200..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:rootDir\frontend
    npm start 2>&1 | Out-Null
}

Write-Host "⏳ Esperando compilación de Angular (esto puede tomar 30-60 segundos)..." -ForegroundColor Cyan

# Esperar hasta que el frontend esté listo
$maxAttempts = 60
$attempt = 0
$frontendReady = $false

while ($attempt -lt $maxAttempts -and -not $frontendReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "✅ Frontend compilado y listo" -ForegroundColor Green
        }
    } catch {
        # Seguir esperando
        if ($attempt -eq 15) {
            Write-Host "   Aún compilando... ($attempt segundos)" -ForegroundColor DarkGray
        } elseif ($attempt -eq 30) {
            Write-Host "   Todavía compilando... ($attempt segundos)" -ForegroundColor DarkGray
        }
    }
}

if (-not $frontendReady) {
    Write-Host "⚠️  Frontend tardó demasiado en compilar" -ForegroundColor Yellow
    Write-Host "   Puede que necesite más tiempo. Verifica manualmente en: http://localhost:4200" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ SISTEMA INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Credenciales:" -ForegroundColor Yellow
Write-Host "   Usuario:  owner" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Abrir navegador
Write-Host "🌐 Abriendo navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:4200"

Write-Host ""
Write-Host "⚠️  Para detener el sistema:" -ForegroundColor Yellow
Write-Host "   1. Cierra las ventanas del backend y frontend" -ForegroundColor White
Write-Host "   2. O ejecuta: taskkill /F /IM node.exe" -ForegroundColor White
Write-Host ""
Write-Host "📊 Estado de los servicios:" -ForegroundColor Cyan
Write-Host "   Backend Job ID: $($backendJob.Id)" -ForegroundColor DarkGray
Write-Host "   Frontend Job ID: $($frontendJob.Id)" -ForegroundColor DarkGray
Write-Host ""

# Mantener el script corriendo y mostrar logs
Write-Host "Presiona Ctrl+C para detener todos los servicios y salir..." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Verificar que los servicios sigan corriendo
        if (-not (Test-Port -Port 4000)) {
            Write-Host "❌ Backend dejó de funcionar" -ForegroundColor Red
            break
        }
        if (-not (Test-Port -Port 4200)) {
            Write-Host "❌ Frontend dejó de funcionar" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Stop-ProcessOnPort -Port 4000 -Name "Backend"
    Stop-ProcessOnPort -Port 4200 -Name "Frontend"
    
    Write-Host "✅ Servicios detenidos" -ForegroundColor Green
}
