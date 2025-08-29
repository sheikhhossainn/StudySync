@echo off
echo ========================================
echo StudySync Django Setup Script
echo ========================================

echo.
echo 1. Checking Python environment...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" --version

echo.
echo 2. Checking Django installation...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" -c "import django; print('Django version:', django.get_version())"

echo.
echo 3. Checking Django project...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py check

echo.
echo 4. Creating migrations...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py makemigrations

echo.
echo 5. Applying migrations...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py migrate

echo.
echo 6. Collecting static files...
"C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py collectstatic --noinput

echo.
echo ========================================
echo Django setup complete!
echo ========================================
echo.
echo To start the development server:
echo "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py runserver
echo.
echo Then visit: http://127.0.0.1:8000/
echo Admin panel: http://127.0.0.1:8000/admin/
echo.

pause
