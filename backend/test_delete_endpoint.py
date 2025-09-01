#!/usr/bin/env python
"""
Test script to check if the delete account endpoint is working
"""
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings')
django.setup()

def test_delete_endpoint():
    """Test the delete account endpoint"""
    
    # Test if the endpoint exists
    url = 'http://127.0.0.1:8000/api/auth/account/delete/'
    
    print("Testing delete account endpoint...")
    print(f"URL: {url}")
    
    try:
        # Test with invalid method first (GET instead of DELETE)
        response = requests.get(url)
        print(f"GET Response Status: {response.status_code}")
        print(f"GET Response Text: {response.text[:200]}")
        
        # Test with DELETE method but no auth
        response = requests.delete(url)
        print(f"DELETE (No Auth) Response Status: {response.status_code}")
        print(f"DELETE (No Auth) Response Text: {response.text[:200]}")
        
        # Test with DELETE method and some fake auth
        headers = {
            'Authorization': 'Bearer fake_token',
            'Content-Type': 'application/json'
        }
        data = {'confirmation': 'DELETE_MY_ACCOUNT'}
        
        response = requests.delete(url, headers=headers, json=data)
        print(f"DELETE (Fake Auth) Response Status: {response.status_code}")
        print(f"DELETE (Fake Auth) Response Text: {response.text[:200]}")
        
    except Exception as e:
        print(f"Error testing endpoint: {e}")

if __name__ == '__main__':
    test_delete_endpoint()
