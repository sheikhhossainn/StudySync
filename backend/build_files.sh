#!/bin/bash

# Build script for Vercel deployment
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
python3 manage.py migrate --noinput

# Create database indexes
echo "Creating database indexes..."
python3 manage.py migrate --run-syncdb

# Collect static files
echo "Collecting static files..."
python3 manage.py collectstatic --noinput --clear

echo "Build completed successfully!"
