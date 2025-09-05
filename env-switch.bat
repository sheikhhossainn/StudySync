@echo off
REM StudySync Environment Switcher for Windows

echo StudySync Environment Configuration Switcher
echo ============================================

if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
if "%1"=="local" goto dev

:help
echo Usage: env-switch.bat [dev^|prod^|local]
echo.
echo Commands:
echo   dev   - Switch to development configuration
echo   local - Switch to development configuration (alias)
echo   prod  - Switch to production configuration
echo.
echo Current configuration in .env:
type backend\.env | findstr "DEBUG="
type backend\.env | findstr "ALLOWED_HOSTS="
goto end

:dev
echo Switching to DEVELOPMENT configuration...
copy /Y backend\.env.local backend\.env
echo ✅ Development configuration activated
echo.
echo Django backend will run on: http://localhost:8000
echo Make sure to run: python manage.py runserver
echo Frontend will detect localhost automatically
goto end

:prod
echo Switching to PRODUCTION configuration...
copy /Y backend\.env.production backend\.env
echo ✅ Production configuration activated
echo.
echo Make sure to set DATABASE_URL in Vercel environment variables
echo Deploy backend and update frontend config with backend URL
goto end

:end
