#!/bin/bash

# Build script for Vercel deployment
pip3 install -r requirements.txt

# Run database migrations
python3 manage.py migrate --noinput

# Collect static files
python3 manage.py collectstatic --noinput --clear
