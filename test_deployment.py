#!/usr/bin/env python
"""
Test script to verify StudySync deployment configuration
Run this to check if your deployment will work correctly
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent / 'backend'
sys.path.append(str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')

import django
django.setup()

def test_database_connection():
    """Test database connection"""
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Database connection: SUCCESS")
        return True
    except Exception as e:
        print(f"❌ Database connection: FAILED - {e}")
        return False

def test_environment_variables():
    """Check critical environment variables"""
    from decouple import config
    
    critical_vars = [
        ('SECRET_KEY', 'Django secret key'),
        ('DEBUG', 'Debug mode'),
        ('ALLOWED_HOSTS', 'Allowed hosts'),
    ]
    
    optional_vars = [
        ('DATABASE_URL', 'Database URL for production'),
        ('GOOGLE_OAUTH2_CLIENT_ID', 'Google OAuth client ID'),
        ('CORS_ALLOWED_ORIGINS', 'CORS allowed origins'),
    ]
    
    # Check if we're in development mode
    debug_mode = config('DEBUG', default=False, cast=bool)
    print(f"\n🔧 Environment Mode: {'DEVELOPMENT' if debug_mode else 'PRODUCTION'}")
    
    print("\n🔍 Environment Variables Check:")
    all_good = True
    
    for var, desc in critical_vars:
        try:
            value = config(var)
            if value:
                print(f"✅ {var}: SET")
            else:
                print(f"❌ {var}: EMPTY")
                all_good = False
        except Exception:
            print(f"❌ {var}: NOT SET")
            all_good = False
    
    for var, desc in optional_vars:
        try:
            value = config(var, default='')
            if value:
                print(f"✅ {var}: SET")
            else:
                print(f"⚠️  {var}: NOT SET (optional for development)")
        except Exception:
            print(f"⚠️  {var}: NOT SET")
    
    return all_good

def test_django_apps():
    """Test if Django apps are properly configured"""
    try:
        from django.apps import apps
        app_configs = apps.get_app_configs()
        
        required_apps = ['accounts', 'study_sessions', 'payments', 'mentorship', 'core']
        found_apps = [app.name for app in app_configs if app.name in required_apps]
        
        print(f"\n📱 Django Apps Check:")
        for app in required_apps:
            if app in found_apps:
                print(f"✅ {app}: LOADED")
            else:
                print(f"❌ {app}: NOT FOUND")
        
        return len(found_apps) == len(required_apps)
    except Exception as e:
        print(f"❌ Django apps check failed: {e}")
        return False

def test_migrations():
    """Check migration status"""
    try:
        from django.core.management import execute_from_command_line
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connection
        
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        print(f"\n🔄 Migrations Check:")
        if plan:
            print(f"⚠️  {len(plan)} unapplied migrations found")
            print("   Run 'python manage.py migrate' to apply them")
        else:
            print("✅ All migrations applied")
        
        return True
    except Exception as e:
        print(f"❌ Migration check failed: {e}")
        return False

def main():
    print("🚀 StudySync Deployment Test")
    print("=" * 40)
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Database Connection", test_database_connection),
        ("Django Apps", test_django_apps),
        ("Migrations", test_migrations),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append(False)
    
    print("\n" + "=" * 40)
    print("📊 SUMMARY")
    print("=" * 40)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All {total} tests passed! Ready for deployment.")
    else:
        print(f"⚠️  {passed}/{total} tests passed. Please fix issues before deploying.")
    
    print("\n🔗 Next Steps:")
    print("1. Set up production database (see DEPLOYMENT_GUIDE.md)")
    print("2. Configure environment variables in Vercel")
    print("3. Update Google OAuth settings")
    print("4. Deploy and test!")

if __name__ == '__main__':
    main()
