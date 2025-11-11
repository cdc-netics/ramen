@echo off
echo ========================================
echo   RAMEN SOC ORQUESTADOR - INICIO
echo ========================================
echo.

cd /d "%~dp0"

REM Matar procesos node existentes
echo [1/5] Deteniendo procesos anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Verificar dependencias backend
echo [2/5] Verificando dependencias del backend...
cd backend
if not exist "node_modules\" (
    echo Instalando dependencias del backend...
    call npm install
)

REM Verificar dependencias frontend
echo [3/5] Verificando dependencias del frontend...
cd ..\frontend
if not exist "node_modules\" (
    echo Instalando dependencias del frontend...
    call npm install
)
cd ..

REM Iniciar backend
echo [4/5] Iniciando backend en puerto 4000...
cd backend
start "Ramen Backend" cmd /k "node simple-server.js"
timeout /t 5 /nobreak >nul

REM Iniciar frontend
echo [5/5] Iniciando frontend en puerto 4200...
cd ..\frontend
start "Ramen Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:4200
echo   Usuario:  owner
echo   Password: admin123
echo ========================================
echo.
echo Esperando 30 segundos para que Angular compile...
timeout /t 30 /nobreak >nul

REM Abrir navegador
echo Abriendo navegador...
start http://localhost:4200

echo.
echo Presiona cualquier tecla para detener...
pause >nul

REM Detener al salir
taskkill /F /IM node.exe /T 2>nul
echo Sistema detenido.
