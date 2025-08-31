# PostgreSQL Setup Guide for StudySync

## Local Development Setup

### 1. Install PostgreSQL
- **Windows:** Download from https://www.postgresql.org/download/windows/
- **macOS:** `brew install postgresql` or download from the website
- **Linux:** `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database and User
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE studysync_db;

-- Create user
CREATE USER studysync_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;
ALTER USER studysync_user CREATEDB;

-- Exit PostgreSQL
\q
```

### 3. Create .env file
Copy `.env.example` to `.env` and update database settings:
```bash
# Database Configuration
DB_NAME=studysync_db
DB_USER=studysync_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

## Cloud Deployment (Vercel/Railway/Heroku)

### Option 1: Use DATABASE_URL
Set environment variable:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Option 2: Individual Settings
Set these environment variables:
```
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
```

## Popular PostgreSQL Cloud Providers

1. **Vercel Postgres** - Integrated with Vercel
2. **Railway** - Simple PostgreSQL hosting
3. **Supabase** - PostgreSQL with additional features
4. **ElephantSQL** - Dedicated PostgreSQL hosting
5. **AWS RDS** - Amazon's managed PostgreSQL
6. **Google Cloud SQL** - Google's managed PostgreSQL

## Verification Commands

Check database connection:
```bash
python manage.py dbshell
```

Check migrations status:
```bash
python manage.py showmigrations
```

Test database operations:
```bash
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
>>> print("Database connected successfully!")
```
