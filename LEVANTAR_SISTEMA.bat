@echo off
echo ========================================
echo    RAMEN ORQUESTADOR - INICIANDO
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/3] Iniciando Backend (Puerto 3001)...
cd backend
start "Ramen Backend" cmd /k "node simple-server.js"
timeout /t 3 >nul

echo.
echo [3/3] Abriendo Demo en navegador...
cd ..
start demo.html

echo.
echo ========================================
echo    SISTEMA INICIADO
echo ========================================
echo.
echo Backend API: http://localhost:3001/api/health
echo Demo HTML: Se abrió en tu navegador
echo.
echo Credenciales:
echo   Usuario: owner
echo   Password: admin123
echo.
echo Presiona cualquier tecla para ver los logs del backend...
pause >nul

echo.
echo Para detener el sistema, cierra la ventana del backend.
echo.
pause
