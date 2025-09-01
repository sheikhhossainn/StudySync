#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
django.setup()

from accounts.models import User

# Get the first user and check all profile fields (now part of User model)
user = User.objects.first()
if user:
    print(f"=== Current User Profile Data ===")
    print(f"User: {user.email}")
    print(f"Student ID: {user.student_id}")
    print(f"Institution: {user.institution}")
    print(f"Date of Birth: {user.date_of_birth}")
    print(f"Department: {user.department}")
    print(f"Year of Study: {user.year_of_study}")
    print(f"User Phone: {user.phone}")
    
    # Update the user profile with sample data to test
    print(f"\n=== Updating User Profile ===")
    user.institution = "East West University"  # Sample institution
    user.department = "Computer Science"       # Sample department  
    user.save()
    print(f"Institution updated to: {user.institution}")
    print(f"Department updated to: {user.department}")
else:
    print("No user found")
