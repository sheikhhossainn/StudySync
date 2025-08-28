@echo off
REM StudySync Backend Setup Script for Windows
echo Setting up StudySync Django Backend with PostgreSQL...

REM Check if Python 3.8+ is installed
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://python.org
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: PostgreSQL is not installed.
    echo Please install PostgreSQL from https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Copy environment file
echo Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please update the values in .env file.
) else (
    echo .env file already exists.
)

REM Database setup instructions
echo.
echo === DATABASE SETUP ===
echo Please run the following commands to set up PostgreSQL:
echo.
echo 1. Open Command Prompt as Administrator and run:
echo    psql -U postgres
echo.
echo 2. In PostgreSQL shell, run:
echo    CREATE DATABASE studysync_db;
echo    CREATE USER studysync_user WITH PASSWORD 'your_db_password';
echo    GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;
echo    \q
echo.
echo 3. Update the .env file with your database credentials
echo.

REM Django setup
echo === DJANGO SETUP ===
echo After setting up the database, run these commands:
echo.
echo 1. Activate virtual environment:
echo    venv\Scripts\activate.bat
echo.
echo 2. Run database migrations:
echo    python manage.py makemigrations
echo    python manage.py migrate
echo.
echo 3. Create superuser:
echo    python manage.py createsuperuser
echo.
echo 4. Start development server:
echo    python manage.py runserver
echo.

echo === PAYMENT API SETUP ===
echo Don't forget to:
echo 1. Get API credentials from bKash, Nagad, and Rocket
echo 2. Update the payment API settings in .env file
echo 3. Test with sandbox credentials first
echo.

echo Setup script completed!
echo Please follow the instructions above to complete the setup.
pause
