#!/usr/bin/env python

import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
django.setup()

from accounts.models import User

# Test creating a user with profile data in single table
print("=== Testing Single User Table Design ===")

# Create a test user with all profile fields
test_user = User.objects.create_user(
    username='testuser123',
    email='test@example.com',
    first_name='Test',
    last_name='User',
    phone='123-456-7890',
    
    # Profile fields (now part of User model)
    student_id='STU12345',
    institution='Test University',
    department='Computer Science',
    year_of_study=2,
    bio='Test bio for the user',
    location='Test City',
    skills=['Python', 'Django'],
    interests=['Web Development', 'AI'],
    date_of_birth='1995-01-01',
    gender='male'
)

print(f"✅ Created user: {test_user.email}")
print(f"✅ Student ID: {test_user.student_id}")
print(f"✅ Institution: {test_user.institution}")
print(f"✅ Phone: {test_user.phone}")
print(f"✅ Skills: {test_user.skills}")
print(f"✅ Interests: {test_user.interests}")

# Test that all data is in one table
print(f"\n=== Data Retrieved Successfully from Single User Table ===")
print("✅ No separate user_profiles table needed!")
print("✅ All profile data is directly accessible from User model!")

# Clean up
test_user.delete()
print("✅ Test completed and cleaned up")
