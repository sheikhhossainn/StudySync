@echo off
echo ==========================================
echo    StudySync Admin Access (No Codes!)
echo ==========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Python detected: 
    python --version
    echo.
    echo [OPTION 1] Starting Python servers...
    echo Main Site: http://localhost:3000
    echo Admin Portal: http://localhost:8080
    echo.
    
    REM Start Python servers
    start "StudySync Main Site" cmd /k "python -m http.server 3000"
    timeout /t 2 /nobreak >nul
    start "StudySync Admin Portal" cmd /k "python -m http.server 8080"
    
    timeout /t 3 /nobreak >nul
    echo Opening browsers...
    start http://localhost:3000
    start http://localhost:8080/instant-admin-access.html
    
    echo.
    echo ==========================================
    echo    INSTANT ADMIN ACCESS - NO CODES NEEDED!
    echo ==========================================
    echo.
    echo Just click the green button in the browser!
    echo No passwords or access codes required!
    echo.
    echo Servers started! Press any key to stop...
    pause >nul
    
    echo Stopping servers...
    taskkill /f /im python.exe >nul 2>&1
    
) else (
    echo [INFO] Python not detected. Using direct file access...
    echo.
    echo [OPTION 2] Opening instant admin access...
    echo.
    
    REM Get current directory
    set "CURRENT_DIR=%cd%"
    
    echo Opening Instant Admin Access...
    start "" "file:///%CURRENT_DIR:\=/%/instant-admin-access.html"
    
    timeout /t 2 /nobreak >nul
    
    echo.
    echo ==========================================
    echo    INSTANT ADMIN ACCESS OPENED!
    echo ==========================================
    echo.
    echo Click the green "Open Admin Dashboard Now" button
    echo No access codes needed - just click and go!
    echo.
    echo If you need access codes for other methods:
    echo - ADMIN2024SS (Super Admin)
    echo - STUDYSYNC24 (Standard Admin)
    echo - MANAGER2024 (Manager Level)
    echo - DEVTEST123 (Developer)
    echo.
)

echo Press any key to exit...
pause >nul
