# StudySync Backend Setup Script for Windows PowerShell
# This script sets up the Django backend with OAuth 2.0 authentication

Write-Host "🚀 Setting up StudySync Backend with OAuth 2.0..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.9 or higher." -ForegroundColor Red
    exit 1
}

# Check if pip is installed
try {
    pip --version | Out-Null
    Write-Host "✅ pip is available" -ForegroundColor Green
} catch {
    Write-Host "❌ pip is not installed. Please install pip." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "⬆️ Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file from template" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No .env.example found. Please create .env file manually." -ForegroundColor Yellow
    }
}

# Check database connection
Write-Host "🗄️ Checking database connection..." -ForegroundColor Yellow
try {
    python manage.py check --database default
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database connection failed. Please ensure PostgreSQL is running and configured correctly." -ForegroundColor Yellow
    Write-Host "Please check your database settings in settings.py" -ForegroundColor Yellow
}

# Run migrations
Write-Host "🏗️ Running database migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

# Create OAuth2 Application
Write-Host "🔐 Setting up OAuth2 application..." -ForegroundColor Yellow
$oauthScript = @"
from oauth2_provider.models import Application
from django.contrib.auth import get_user_model

User = get_user_model()

# Create OAuth2 Application if it doesn't exist
if not Application.objects.filter(name='StudySync Frontend').exists():
    application = Application.objects.create(
        name='StudySync Frontend',
        client_type=Application.CLIENT_PUBLIC,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
    )
    print(f'OAuth2 Application created with client_id: {application.client_id}')
else:
    application = Application.objects.get(name='StudySync Frontend')
    print(f'OAuth2 Application already exists with client_id: {application.client_id}')
"@

$oauthScript | python manage.py shell

# Create superuser if it doesn't exist
Write-Host "👤 Setting up superuser account..." -ForegroundColor Yellow
$superuserScript = @"
from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@studysync.com',
        password='admin123'
    )
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"@

$superuserScript | python manage.py shell

# Collect static files
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your OAuth2 client IDs in the frontend JavaScript files" -ForegroundColor White
Write-Host "2. Configure your social authentication providers in Django admin" -ForegroundColor White
Write-Host "3. Set up your environment variables in .env file" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To start the development server, run:" -ForegroundColor Cyan
Write-Host "   python manage.py runserver" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Admin panel: http://127.0.0.1:8000/admin/" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📖 API Documentation: http://127.0.0.1:8000/api/docs/" -ForegroundColor Cyan

# Pause to show results
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
