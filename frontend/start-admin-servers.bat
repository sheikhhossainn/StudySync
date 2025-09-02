@echo off
echo ==========================================
echo    StudySync Admin Server Setup
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js detected: 
node --version

echo.
echo [INFO] Installing live-server globally...
npm install -g live-server

echo.
echo ==========================================
echo    Starting StudySync Servers
echo ==========================================
echo.

echo [INFO] Main Site will run on: http://localhost:3000
echo [INFO] Admin Portal will run on: http://localhost:8080
echo.

REM Get current directory
set "CURRENT_DIR=%cd%"

echo [INFO] Starting Main Site (Port 3000)...
start "StudySync Main Site" cmd /k "cd /d "%CURRENT_DIR%" && live-server --port=3000 --host=localhost --open=/index.html"

timeout /t 3 /nobreak >nul

echo [INFO] Starting Admin Portal (Port 8080)...
start "StudySync Admin Portal" cmd /k "cd /d "%CURRENT_DIR%" && live-server --port=8080 --host=localhost --open=/admin-portal.html"

echo.
echo ==========================================
echo    Servers Started Successfully!
echo ==========================================
echo.
echo Main Site: http://localhost:3000
echo Admin Portal: http://localhost:8080
echo.
echo Admin Access Codes:
echo - ADMIN2024SS (Super Admin)
echo - MANAGER2024 (Manager)
echo - DEVTEST123 (Developer)
echo - STUDYSYNC24 (Standard Admin)
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo [INFO] Stopping servers...
taskkill /f /im node.exe >nul 2>&1
echo [INFO] All servers stopped.
pause
