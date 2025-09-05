#!/bin/bash
# StudySync Environment Switcher for Linux/Mac

echo "StudySync Environment Configuration Switcher"
echo "============================================"

case "$1" in
    "dev"|"local")
        echo "Switching to DEVELOPMENT configuration..."
        cp backend/.env.local backend/.env
        echo "✅ Development configuration activated"
        echo ""
        echo "Django backend will run on: http://localhost:8000"
        echo "Make sure to run: python manage.py runserver"
        echo "Frontend will detect localhost automatically"
        ;;
    "prod")
        echo "Switching to PRODUCTION configuration..."
        cp backend/.env.production backend/.env
        echo "✅ Production configuration activated"
        echo ""
        echo "Make sure to set DATABASE_URL in Vercel environment variables"
        echo "Deploy backend and update frontend config with backend URL"
        ;;
    *)
        echo "Usage: ./env-switch.sh [dev|prod|local]"
        echo ""
        echo "Commands:"
        echo "  dev   - Switch to development configuration"
        echo "  local - Switch to development configuration (alias)"
        echo "  prod  - Switch to production configuration"
        echo ""
        echo "Current configuration in .env:"
        grep "DEBUG=" backend/.env
        grep "ALLOWED_HOSTS=" backend/.env
        ;;
esac
