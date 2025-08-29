# StudySync Django Quick Start Script
# Run this script to start your Django development server

Write-Host "========================================" -ForegroundColor Green
Write-Host "StudySync Django Quick Start" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$pythonPath = "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe"

Write-Host "`n1. Checking Django installation..." -ForegroundColor Yellow
& $pythonPath -c "import django; print('✅ Django version:', django.get_version())"

Write-Host "`n2. Running Django project check..." -ForegroundColor Yellow
& $pythonPath manage.py check

Write-Host "`n3. Creating migrations..." -ForegroundColor Yellow
& $pythonPath manage.py makemigrations

Write-Host "`n4. Applying migrations..." -ForegroundColor Yellow
& $pythonPath manage.py migrate

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Django setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTo start the development server, run:" -ForegroundColor Cyan
Write-Host "& '$pythonPath' manage.py runserver" -ForegroundColor White

Write-Host "`nThen visit:" -ForegroundColor Cyan
Write-Host "• Main site: http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "• Admin panel: http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host "• API endpoints: http://127.0.0.1:8000/api/" -ForegroundColor White

Write-Host "`nPress Enter to start the server now, or Ctrl+C to exit..."
Read-Host

Write-Host "`nStarting Django development server..." -ForegroundColor Yellow
& $pythonPath manage.py runserver
