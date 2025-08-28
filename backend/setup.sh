#!/bin/bash

# StudySync Backend Setup Script
echo "Setting up StudySync Django Backend with PostgreSQL..."

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python 3.8 or higher is required. You have Python $python_version"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Visit: https://www.postgresql.org/download/"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Copy environment file
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please update the values in .env file."
else
    echo ".env file already exists."
fi

# Database setup instructions
echo ""
echo "=== DATABASE SETUP ==="
echo "Please run the following commands to set up PostgreSQL:"
echo ""
echo "1. Connect to PostgreSQL as superuser:"
echo "   sudo -u postgres psql"
echo ""
echo "2. Create database and user:"
echo "   CREATE DATABASE studysync_db;"
echo "   CREATE USER studysync_user WITH PASSWORD 'your_db_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;"
echo "   \\q"
echo ""
echo "3. Update the .env file with your database credentials"
echo ""

# Django setup
echo "=== DJANGO SETUP ==="
echo "After setting up the database, run these commands:"
echo ""
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Run database migrations:"
echo "   python manage.py makemigrations"
echo "   python manage.py migrate"
echo ""
echo "3. Create superuser:"
echo "   python manage.py createsuperuser"
echo ""
echo "4. Start development server:"
echo "   python manage.py runserver"
echo ""

echo "=== PAYMENT API SETUP ==="
echo "Don't forget to:"
echo "1. Get API credentials from bKash, Nagad, and Rocket"
echo "2. Update the payment API settings in .env file"
echo "3. Test with sandbox credentials first"
echo ""

echo "Setup script completed!"
echo "Please follow the instructions above to complete the setup."
