#!/usr/bin/env python
"""
Django initialization script for StudySync
This script helps initialize the Django project after setup
"""

import os
import sys
import django

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')

# Setup Django
django.setup()

def create_sample_data():
    """Create sample data for testing"""
    from accounts.models import User
    from django.contrib.auth.hashers import make_password
    
    # Create sample users
    users_data = [
        {
            'username': 'student1',
            'email': 'student1@studysync.com',
            'password': make_password('password123'),
            'user_type': 'student',
            'first_name': 'John',
            'last_name': 'Doe'
        },
        {
            'username': 'mentor1',
            'email': 'mentor1@studysync.com', 
            'password': make_password('password123'),
            'user_type': 'mentor',
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
    ]
    
    for user_data in users_data:
        # Add profile fields directly to user_data
        user_data.update({
            'bio': f"Sample user for testing",
            'skills': ['JavaScript', 'Python', 'Math'],
            'institution': 'Test University',
            'student_id': f"STU00{len(users_data)}",
        })
        
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults=user_data
        )
        
        if created:
            print(f"Created user: {user.email}")
        else:
            print(f"User already exists: {user.email}")

def run_initial_setup():
    """Run initial setup commands"""
    print("Running StudySync Django initialization...")
    
    try:
        # Import Django management commands
        from django.core.management import execute_from_command_line
        
        # Make migrations
        print("Creating migrations...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        
        # Apply migrations
        print("Applying migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Create sample data
        print("Creating sample data...")
        create_sample_data()
        
        print("\n✅ Django initialization completed successfully!")
        print("\nNext steps:")
        print("1. Create a superuser: python manage.py createsuperuser")
        print("2. Start the development server: python manage.py runserver")
        print("3. Visit http://localhost:8000/admin/ for admin interface")
        print("4. Visit http://localhost:8000/api/ for API browsable interface")
        
    except Exception as e:
        print(f"❌ Error during initialization: {str(e)}")
        return False
    
    return True

if __name__ == '__main__':
    success = run_initial_setup()
    sys.exit(0 if success else 1)
