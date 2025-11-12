#!/usr/bin/env pwsh
# RAMEN SOC - Inicio rápido

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RAMEN SOC - INICIO RÁPIDO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Detener procesos anteriores
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Verificar dependencias
Push-Location "$rootDir\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install | Out-Null
}

Write-Host "🚀 Iniciando servidor...`n" -ForegroundColor Green
node simple-server.js
Pop-Location
