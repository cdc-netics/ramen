@echo off
echo ========================================
echo   RAMEN SOC ORQUESTADOR - INICIO
echo ========================================
echo.

cd /d "%~dp0"

REM Matar procesos node existentes
echo [1/3] Deteniendo procesos anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Iniciar backend
echo [2/3] Iniciando backend en puerto 4000...
cd backend
start "Ramen Backend" cmd /k "node simple-server.js"
timeout /t 3 /nobreak >nul

REM Abrir navegador
echo [3/3] Abriendo navegador...
start http://localhost:4000

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo   URL: http://localhost:4000
echo   Usuario: owner
echo   Password: admin123
echo ========================================
echo.
echo Presiona cualquier tecla para detener...
pause >nul

REM Detener al salir
taskkill /F /IM node.exe /T 2>nul
echo Sistema detenido.
