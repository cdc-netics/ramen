@echo off
echo.
echo ========================================
echo   RAMEN SOC - INICIO RAPIDO
echo ========================================
echo.

cd /d "%~dp0\backend"

REM Matar procesos anteriores
taskkill /F /IM node.exe >nul 2>&1

REM Verificar dependencias
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install >nul
)

echo Iniciando servidor...
echo.
node simple-server.js
