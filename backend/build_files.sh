#!/bin/bash

# Build script for Vercel deployment
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput --clear
