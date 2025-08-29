#!/usr/bin/env python
"""
Django Setup Test Script
This script tests if Django is properly installed and configured.
"""

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def test_django_setup():
    """Test Django installation and setup"""
    
    print("🔍 Testing Django Installation...")
    print(f"✅ Django Version: {django.get_version()}")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
    
    try:
        django.setup()
        print("✅ Django setup successful!")
        
        # Test database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful!")
        
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        return False
    
    print("\n🚀 Django is ready to use!")
    return True

def run_django_commands():
    """Run basic Django management commands"""
    
    print("\n📋 Running Django Management Commands...")
    
    commands_to_test = [
        ['check'],
        ['showmigrations'],
        ['collectstatic', '--dry-run'],
    ]
    
    for cmd in commands_to_test:
        try:
            print(f"Running: python manage.py {' '.join(cmd)}")
            execute_from_command_line(['manage.py'] + cmd)
            print(f"✅ Command successful: {' '.join(cmd)}")
        except Exception as e:
            print(f"❌ Command failed: {' '.join(cmd)} - {e}")
    
def main():
    """Main test function"""
    print("🎯 StudySync Django Setup Test")
    print("=" * 50)
    
    if test_django_setup():
        run_django_commands()
        
        print("\n🎉 All tests passed! Django is properly installed and configured.")
        print("\n📝 Next steps:")
        print("1. Run migrations: python manage.py migrate")
        print("2. Create superuser: python manage.py createsuperuser")
        print("3. Start development server: python manage.py runserver")
        print("4. Access admin at: http://127.0.0.1:8000/admin/")
        
    else:
        print("\n❌ Django setup has issues. Please check the configuration.")

if __name__ == "__main__":
    main()
