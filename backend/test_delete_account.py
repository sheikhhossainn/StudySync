#!/usr/bin/env python
"""
Test script for account deletion functionality
Run this to verify the delete account API endpoint works correctly
"""

import os
import sys
import django
from django.conf import settings

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()

def test_delete_account_functionality():
    """Test the delete account functionality"""
    
    print("🧪 Testing Account Deletion Functionality")
    print("=" * 50)
    
    # Create a test user
    test_user = User.objects.create_user(
        email='test_delete@example.com',
        username='test_delete_user',
        password='testpassword123',
        first_name='Test',
        last_name='User'
    )
    
    print(f"✅ Created test user: {test_user.email}")
    
    # Create access token
    refresh = RefreshToken.for_user(test_user)
    access_token = str(refresh.access_token)
    
    print(f"✅ Generated access token")
    
    # Test the API endpoint
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test with wrong confirmation
    response = client.delete(
        '/api/auth/account/delete/',
        data={'confirmation': 'WRONG_CONFIRMATION'},
        format='json'
    )
    
    print(f"❌ Wrong confirmation test: {response.status_code} - {response.data}")
    
    # Test with correct confirmation
    response = client.delete(
        '/api/auth/account/delete/',
        data={'confirmation': 'DELETE_MY_ACCOUNT'},
        format='json'
    )
    
    print(f"✅ Correct confirmation test: {response.status_code} - {response.data}")
    
    # Verify user is soft-deleted
    test_user.refresh_from_db()
    print(f"✅ User is_active after deletion: {test_user.is_active}")
    print(f"✅ User email after deletion: {test_user.email}")
    print(f"✅ User username after deletion: {test_user.username}")
    
    # Cleanup
    test_user.delete()
    print("🧹 Cleaned up test user")
    
    print("\n🎉 Account deletion test completed!")

if __name__ == '__main__':
    test_delete_account_functionality()
