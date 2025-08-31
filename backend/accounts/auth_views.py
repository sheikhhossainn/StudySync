from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from google.auth.transport import requests
from google.oauth2 import id_token
from django.conf import settings
import requests as http_requests
import json
from .models import User as CustomUser, Student, Mentor
from .serializers import UserSerializer


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Handle Google OAuth login for Vercel deployment
    Expects: { "credential": "google_id_token" }
    """
    try:
        credential = request.data.get('credential')
        if not credential:
            return Response(
                {'error': 'Google credential is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify Google token
        try:
            idinfo = id_token.verify_oauth2_token(
                credential, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            # Check if token is valid
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response(
                    {'error': 'Invalid token issuer'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValueError as e:
            return Response(
                {'error': f'Invalid Google token: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information
        email = idinfo.get('email')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture', '')
        google_id = idinfo.get('sub')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        try:
            user = CustomUser.objects.get(email=email)
            # Update user info if needed
            if not user.first_name:
                user.first_name = first_name
            if not user.last_name:
                user.last_name = last_name
            user.save()
        except CustomUser.DoesNotExist:
            # Create new user
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            
            # Create user profile based on user type
            try:
                if user.user_type == 'student':
                    profile, created = Student.objects.get_or_create(
                        user=user,
                        defaults={'name': f'{first_name} {last_name}', 'institution_name': 'Not specified', 'field_of_study': 'Not specified'}
                    )
                elif user.user_type == 'mentor':
                    profile, created = Mentor.objects.get_or_create(
                        user=user,
                        defaults={'name': f'{first_name} {last_name}', 'job_role': 'Not specified', 'organization_name': 'Not specified'}
                    )
            except Exception as e:
                pass  # Profile creation is optional
        
        # Generate JWT tokens
        tokens = get_tokens_for_user(user)
        
        # Serialize user data
        user_serializer = UserSerializer(user)
        
        return Response({
            'message': 'Login successful',
            'user': user_serializer.data,
            'tokens': tokens,
            'google_info': {
                'picture': picture,
                'google_id': google_id
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_register(request):
    """
    Handle Google OAuth registration
    Expects: { "credential": "google_id_token" }
    """
    return google_oauth_login(request)  # Same logic for registration


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    """
    Custom login with email/password
    Expects: { "email": "email", "password": "password" }
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        try:
            user = CustomUser.objects.get(email=email)
            if user.check_password(password):
                if not user.is_active:
                    return Response(
                        {'error': 'Account is deactivated'}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Generate JWT tokens
                tokens = get_tokens_for_user(user)
                user_serializer = UserSerializer(user)
                
                return Response({
                    'message': 'Login successful',
                    'user': user_serializer.data,
                    'tokens': tokens
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Login failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_register(request):
    """
    Custom registration with email/password
    Expects: { "email": "email", "password": "password", "first_name": "name", "last_name": "name" }
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new user
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )
        
        # Create user profile based on user type
        try:
            if user.user_type == 'student':
                profile, created = Student.objects.get_or_create(
                    user=user,
                    defaults={'name': f'{first_name} {last_name}', 'institution_name': 'Not specified', 'field_of_study': 'Not specified'}
                )
            elif user.user_type == 'mentor':
                profile, created = Mentor.objects.get_or_create(
                    user=user,
                    defaults={'name': f'{first_name} {last_name}', 'job_role': 'Not specified', 'organization_name': 'Not specified'}
                )
        except Exception as e:
            pass  # Profile creation is optional
        
        # Generate JWT tokens
        tokens = get_tokens_for_user(user)
        user_serializer = UserSerializer(user)
        
        return Response({
            'message': 'Registration successful',
            'user': user_serializer.data,
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def refresh_token(request):
    """
    Refresh JWT token
    Expects: { "refresh": "refresh_token" }
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Invalid refresh token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        return Response(
            {'error': f'Token refresh failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def logout(request):
    """
    Logout user by blacklisting refresh token
    Expects: { "refresh": "refresh_token" }
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token might already be blacklisted
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Logout failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
