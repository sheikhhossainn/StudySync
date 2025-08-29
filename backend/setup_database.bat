@echo off
REM StudySync Database Setup Script for Windows
REM This script will help you set up the PostgreSQL database and run migrations

echo StudySync Database Setup
echo =======================

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo    Download from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed

REM Database configuration
set DB_NAME=studysync_db
set DB_USER=studysync_user
set DB_PASSWORD=password
set DB_HOST=localhost
set DB_PORT=5432

echo.
echo 📦 Creating database and user...

REM Create database and user
psql -U postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul || echo Database might already exist
psql -U postgres -c "CREATE USER %DB_USER% WITH ENCRYPTED PASSWORD '%DB_PASSWORD%';" 2>nul || echo User might already exist
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;" 2>nul

REM Grant additional permissions
psql -U postgres -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" 2>nul
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%;" 2>nul
psql -U postgres -d %DB_NAME% -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;" 2>nul

echo ✅ Database setup completed

echo.
echo 🔧 Setting up Django environment...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo ✅ Virtual environment activated

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

echo.
echo 🔄 Running Django migrations...

REM Make migrations for Django apps
python manage.py makemigrations accounts
python manage.py makemigrations study_sessions
python manage.py makemigrations mentorship

REM Apply migrations
python manage.py migrate

echo.
echo 👤 Creating superuser...
echo Please create a superuser account for Django admin:
python manage.py createsuperuser

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update your .env file with the database credentials:
echo    DB_NAME=%DB_NAME%
echo    DB_USER=%DB_USER%
echo    DB_PASSWORD=%DB_PASSWORD%
echo    DB_HOST=%DB_HOST%
echo    DB_PORT=%DB_PORT%
echo.
echo 2. Start the Django development server:
echo    python manage.py runserver
echo.
echo 3. Access the admin panel at: http://localhost:8000/admin/
echo 4. API endpoints are available at: http://localhost:8000/api/
echo.
echo Frontend integration:
echo - The my-posts.html page is now connected to the database
echo - Posts will be fetched from and saved to PostgreSQL
echo - All user interactions will update the database in real-time

pause
