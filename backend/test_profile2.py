#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
django.setup()

from accounts.models import User

# Check user data (all in single table now)
print(f"Total users: {User.objects.count()}")

# Show all users with their profile data
users = User.objects.all()
for user in users:
    print(f"\n--- User {user.email} ---")
    print(f"Student ID: {user.student_id}")
    print(f"Institution: {user.institution}")
    print(f"Date of Birth: {user.date_of_birth}")
    print(f"Phone: {user.phone}")
    print(f"Bio: {user.bio}")

# Check first user
user = User.objects.first()
if user:
    print(f"\nFirst user {user.email} profile data:")
    print(f"Student ID: {user.student_id}")
    print(f"Institution: {user.institution}")
    print(f"Skills: {user.skills}")
    print(f"Interests: {user.interests}")
else:
    print("No users found")
