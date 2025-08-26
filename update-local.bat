@echo off
echo ========================================
echo   ZedUno Local Update Script
echo ========================================
echo.

echo [1] Updating for local access only (localhost)
echo [2] Updating for network access (192.168.2.49)
echo [3] Custom IP address
echo.

set /p choice="Select option (1-3): "

if "%choice%"=="1" (
    echo VITE_API_URL=http://localhost:5000/api > .env.local
    goto :build
)

if "%choice%"=="2" (
    echo VITE_API_URL=http://192.168.2.49:5000/api > .env.local
    goto :build
)

if "%choice%"=="3" (
    set /p customip="Enter your IP address or domain: "
    echo VITE_API_URL=http://%customip%:5000/api > .env.local
    goto :build
)

:build
echo VITE_APP_NAME=ZedUno >> .env.local
echo VITE_APP_VERSION=1.0.0 >> .env.local
echo VITE_ENABLE_ANALYTICS=true >> .env.local
echo VITE_ENABLE_PAYMENT_GATEWAYS=true >> .env.local
echo VITE_DEFAULT_CURRENCY=KES >> .env.local

echo.
echo Updating dependencies...
call npm install

echo.
echo Building frontend with new configuration...
call npm run build:frontend

echo.
echo ========================================
echo   Update Complete!
echo ========================================
echo.
echo Access your ZedUno installation at:

if "%choice%"=="1" (
    echo   - Local: http://localhost:5173
    echo   - API: http://localhost:5000/api
)

if "%choice%"=="2" (
    echo   - Local: http://localhost:5173
    echo   - Network: http://192.168.2.49:5173
    echo   - API: http://192.168.2.49:5000/api
    echo.
    echo Other devices on your network can now access ZedUno!
)

if "%choice%"=="3" (
    echo   - URL: http://%customip%:5173
    echo   - API: http://%customip%:5000/api
)

echo.
pause