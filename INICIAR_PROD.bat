@echo off
echo ========================================
echo INICIANDO RAMEN ORQUESTADOR PRODUCTIVO
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando MongoDB...
docker ps | findstr ramen-mongo >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo MongoDB ya esta corriendo
) else (
    echo Iniciando MongoDB en Docker...
    docker start ramen-mongo >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Creando contenedor MongoDB...
        docker run --name ramen-mongo -p 27017:27017 -d mongo:7
    )
    timeout /t 3 >nul
)

echo.
echo [2/4] Inicializando base de datos...
cd backend
call npm run seed

echo.
echo [3/4] Iniciando Backend (Puerto 4000)...
start "Ramen Backend" cmd /k "node server.js"
timeout /t 3 >nul

echo.
echo [4/4] Iniciando Frontend Angular (Puerto 4200)...
cd ..\frontend
start "Ramen Frontend" cmd /k "ng serve --port 4200"

echo.
echo ========================================
echo SISTEMA INICIADO
echo ========================================
echo Backend: http://localhost:4000
echo Frontend: http://localhost:4200
echo.
echo Espera 30 segundos y abre: http://localhost:4200
echo Login: owner / admin123
echo.
pause
