#!/usr/bin/env pwsh
# RAMEN SOC - Script de inicio simple y robusto

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RAMEN SOC - INICIO AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Función para verificar puerto
function Test-PortInUse {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    } catch {
        return $true
    }
}

# Detener procesos anteriores
Write-Host "[1/5] Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos limpiados`n" -ForegroundColor Green

# Verificar Node.js
Write-Host "[2/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version
    Write-Host "✅ Node.js $nodeVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Instala desde https://nodejs.org`n" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Instalar dependencias backend
Write-Host "[3/5] Verificando backend..." -ForegroundColor Yellow
Push-Location "$rootDir\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Cyan
    & npm install | Out-Null
}
Write-Host "✅ Backend listo`n" -ForegroundColor Green
Pop-Location

# Instalar dependencias frontend
Write-Host "[4/5] Verificando frontend..." -ForegroundColor Yellow
Push-Location "$rootDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Cyan
    & npm install | Out-Null
}
Write-Host "✅ Frontend listo`n" -ForegroundColor Green
Pop-Location

# Iniciar servicios
Write-Host "[5/5] Iniciando servicios..." -ForegroundColor Yellow

# Iniciar backend en nueva ventana
$backendCmd = "Set-Location '$rootDir\backend'; Write-Host '🚀 Backend iniciando...' -ForegroundColor Cyan; node simple-server.js"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "⏳ Esperando backend (5 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Verificar backend
$backendOk = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/health" -TimeoutSec 3
    if ($response.status -eq "ok") {
        Write-Host "✅ Backend OK - http://localhost:4000" -ForegroundColor Green
        $backendOk = $true
    }
} catch {
    Write-Host "⚠️  Backend aún iniciando..." -ForegroundColor Yellow
}

# Iniciar frontend en nueva ventana
$frontendCmd = "Set-Location '$rootDir\frontend'; Write-Host '🚀 Frontend compilando (puede tardar 1 minuto)...' -ForegroundColor Cyan; npm start"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "⏳ Esperando compilación de Angular..." -ForegroundColor Cyan
Write-Host "   (Esto puede tardar 30-60 segundos)" -ForegroundColor DarkGray

# Esperar frontend
$frontendOk = $false
$maxWait = 90
$waited = 0

while (-not $frontendOk -and $waited -lt $maxWait) {
    Start-Sleep -Seconds 3
    $waited += 3
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $frontendOk = $true
        }
    } catch {
        if ($waited % 15 -eq 0) {
            Write-Host "   Compilando... ($waited segundos)" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
if ($frontendOk) {
    Write-Host "✅ Frontend OK - http://localhost:4200" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend tardó más de lo esperado" -ForegroundColor Yellow
    Write-Host "   Verifica manualmente: http://localhost:4200" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✅ SISTEMA INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:4200" -ForegroundColor White
Write-Host "📡 Backend:  " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Credenciales:" -ForegroundColor Yellow
Write-Host "   Usuario:  " -NoNewline -ForegroundColor White
Write-Host "owner" -ForegroundColor Green
Write-Host "   Password: " -NoNewline -ForegroundColor White
Write-Host "admin123" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Abrir navegador
Write-Host "🌐 Abriendo navegador..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:4200"

Write-Host ""
Write-Host "ℹ️  Para detener el sistema:" -ForegroundColor Yellow
Write-Host "   • Cierra las ventanas de PowerShell del backend y frontend" -ForegroundColor White
Write-Host "   • O ejecuta: " -NoNewline -ForegroundColor White
Write-Host "taskkill /F /IM node.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para salir de este asistente..." -ForegroundColor DarkGray
Read-Host

Write-Host "✅ Asistente cerrado. Los servicios siguen corriendo.`n" -ForegroundColor Green
