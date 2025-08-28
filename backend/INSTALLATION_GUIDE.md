# StudySync Django Backend Installation Guide

## Prerequisites
Before starting, ensure you have:
- Python 3.8 or higher installed
- PostgreSQL 12+ installed
- Git installed

## Step-by-Step Installation

### Step 1: Verify Python Installation
```bash
python --version
# Should show Python 3.8 or higher
```

### Step 2: Navigate to Backend Directory
```bash
cd E:\StudySync\StudySync\backend
```

### Step 3: Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
venv\Scripts\Activate.ps1

# On Windows (Command Prompt):
venv\Scripts\activate.bat

# On Linux/Mac:
source venv/bin/activate
```

### Step 4: Upgrade pip (Important!)
```bash
python -m pip install --upgrade pip
```

### Step 5: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 6: Set Up Environment Variables
```bash
# Copy the environment template
copy .env.example .env

# Open .env file in your text editor and update these values:
```

**Edit the `.env` file with these settings:**
```env
# Database Configuration
DB_NAME=studysync_db
DB_USER=studysync_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Django Configuration
SECRET_KEY=django-insecure-your-very-long-random-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Payment API Keys (Use sandbox URLs for testing)
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=your_bkash_sandbox_username
BKASH_PASSWORD=your_bkash_sandbox_password
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret

NAGAD_BASE_URL=https://sandbox.mynagad.com/api/dfs/check-out/v1
NAGAD_MERCHANT_ID=your_nagad_merchant_id
NAGAD_PUBLIC_KEY=your_nagad_public_key
NAGAD_PRIVATE_KEY=your_nagad_private_key

ROCKET_BASE_URL=https://sandbox.rocket.com.bd/api
ROCKET_MERCHANT_ID=your_rocket_merchant_id
ROCKET_API_KEY=your_rocket_api_key
ROCKET_SECRET_KEY=your_rocket_secret_key

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Step 7: Set Up PostgreSQL Database

#### Option A: Using PostgreSQL Command Line
```bash
# Connect to PostgreSQL (you'll need to enter your postgres user password)
psql -U postgres

# In PostgreSQL shell, run these commands:
CREATE DATABASE studysync_db;
CREATE USER studysync_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;
ALTER USER studysync_user CREATEDB;
\q
```

#### Option B: Using pgAdmin (GUI)
1. Open pgAdmin
2. Create a new database named `studysync_db`
3. Create a new user named `studysync_user`
4. Grant all privileges to the user

### Step 8: Run Django Migrations
```bash
# Make sure virtual environment is activated
python manage.py makemigrations
python manage.py migrate
```

### Step 9: Create Django Superuser
```bash
python manage.py createsuperuser
```
Follow the prompts to create your admin user.

### Step 10: Test the Installation
```bash
# Start the development server
python manage.py runserver
```

You should see output like:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
[Date] - Django version 4.2.7, using settings 'studysync.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Step 11: Verify Installation
Open your browser and visit:
- **Admin Interface**: http://127.0.0.1:8000/admin/
- **API Root**: http://127.0.0.1:8000/api/
- **Health Check**: http://127.0.0.1:8000/api/health/

## Troubleshooting

### Common Issues and Solutions

#### 1. "psycopg2-binary" Installation Error
```bash
# If you get psycopg2 errors on Windows, try:
pip install psycopg2-binary --force-reinstall --no-cache-dir
```

#### 2. PostgreSQL Connection Error
- Make sure PostgreSQL service is running
- Verify database name, username, and password in `.env`
- Check if PostgreSQL is listening on port 5432

#### 3. "ModuleNotFoundError: No module named 'django'"
- Make sure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt`

#### 4. Port Already in Use
```bash
# Use a different port
python manage.py runserver 8001
```

#### 5. Static Files Issues
```bash
# Collect static files
python manage.py collectstatic
```

### Development Commands

```bash
# Create new Django app
python manage.py startapp app_name

# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Start Django shell
python manage.py shell

# Run tests
python manage.py test

# Check for issues
python manage.py check
```

### Next Steps After Installation

1. **Configure Payment APIs**: Get actual credentials from bKash, Nagad, and Rocket
2. **Set up Frontend Integration**: Update CORS settings for your frontend
3. **Create Sample Data**: Use Django admin to create test users and sessions
4. **Test Payment Flow**: Use sandbox credentials to test payments

### Production Deployment Checklist

Before deploying to production:
- [ ] Set `DEBUG=False` in `.env`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up HTTPS
- [ ] Use production database
- [ ] Configure static files with WhiteNoise or CDN
- [ ] Set up logging
- [ ] Use Gunicorn as WSGI server
- [ ] Configure Nginx as reverse proxy

## Need Help?

If you encounter any issues:
1. Check the error messages carefully
2. Ensure all prerequisites are installed
3. Verify your `.env` configuration
4. Make sure PostgreSQL is running
5. Check that virtual environment is activated

The Django backend is now ready to work with your StudySync frontend!
