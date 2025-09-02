"""
Dynamic Account Management Views
Handles OAuth signup, profile updates, and account deletion
"""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.generic import CreateView, UpdateView, DeleteView
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import json
import logging
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

from .models import User
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


class UserRegistrationView(CreateView):
    """Handle user registration with profile creation"""
    model = User
    template_name = 'accounts/register.html'
    fields = ['username', 'email', 'first_name', 'last_name', 'password']

    def form_valid(self, form):
        """Create user in a transaction"""
        try:
            with transaction.atomic():
                # Create user
                user = form.save(commit=False)
                user.set_password(form.cleaned_data['password'])
                user.save()
                
                # Log the user in
                login(self.request, user)
                
                return JsonResponse({
                    'success': True,
                    'message': 'Account created successfully!',
                    'user_id': user.id,
                    'redirect_url': '/dashboard/'
                })
                
        except IntegrityError as e:
            logger.error(f"Registration error: {e}")
            return JsonResponse({
                'success': False,
                'error': 'Username or email already exists.'
            }, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def google_oauth_signup(request):
    """Handle Google OAuth signup with automatic profile creation"""
    try:
        logger.info(f"Received Google OAuth request: {request.data}")
        
        credential = request.data.get('credential')
        if not credential:
            logger.error("No credential provided in request")
            return Response({
                'error': 'Credential is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            credential, 
            requests.Request(), 
            settings.GOOGLE_OAUTH2_CLIENT_ID
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return Response({
                'error': 'Invalid token issuer'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract user data from Google and form
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        profile_picture = idinfo.get('picture', '')
        
        # Extract additional fields from request
        student_id = request.data.get('student_id', '')
        organization_name = request.data.get('organization_name', '')
        date_of_birth = request.data.get('date_of_birth')
        phone_number = request.data.get('phone_number', '')
        extracted_full_name = request.data.get('extracted_full_name', '')
        
        # Use extracted full name if available, otherwise use Google name
        if extracted_full_name:
            name_parts = extracted_full_name.split(' ', 1)
            first_name = name_parts[0] if name_parts else first_name
            last_name = name_parts[1] if len(name_parts) > 1 else last_name
        
        with transaction.atomic():
            # Check if user exists
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone_number,
                    'is_verified': True,
                    'is_active': True,
                    'profile_picture': profile_picture,
                    'email_verified': True,
                    'student_id': student_id,
                    'institution': organization_name,
                    'date_of_birth': date_of_birth if date_of_birth else None,
                }
            )
            
            if not created:
                # Update existing user with new data
                user.profile_picture = profile_picture
                user.email_verified = True
                if student_id:
                    user.student_id = student_id
                if organization_name:
                    user.institution = organization_name
                if date_of_birth:
                    user.date_of_birth = date_of_birth
                if phone_number and not user.phone:
                    user.phone = phone_number
                user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save()
            
            response_data = {
                'success': True,
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                },
                'created': created,
                'message': 'Account created successfully!' if created else 'Login successful!'
            }
            
            logger.info(f"Google OAuth {'signup' if created else 'login'} successful for {email}")
            return Response(response_data, status=status.HTTP_200_OK)
            
    except ValueError as e:
        logger.error(f"Google OAuth error: {e}")
        return Response({
            'error': 'Invalid Google token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in Google OAuth: {e}")
        return Response({
            'error': 'Authentication failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def google_oauth_login(request):
    """Handle Google OAuth login for existing users only"""
    try:
        logger.info(f"Received Google OAuth login request: {request.data}")
        
        credential = request.data.get('credential')
        user_type = request.data.get('user_type', 'student')
        
        if not credential:
            logger.error("No credential provided in request")
            return Response({
                'error': 'Credential is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify Google token
        try:
            logger.info(f"Verifying Google token with client ID: {settings.GOOGLE_OAUTH2_CLIENT_ID}")
            # For JWT tokens from Google Sign-In, we only need the client ID for audience verification
            idinfo = id_token.verify_oauth2_token(
                credential, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            logger.info(f"Token verification successful for: {idinfo.get('email', 'unknown')}")
        except Exception as e:
            logger.error(f"Google token verification failed: {str(e)}")
            logger.error(f"Token type: {type(credential)}")
            logger.error(f"Token preview: {credential[:50] if credential else 'None'}...")
            return Response({
                'error': 'Invalid Google token',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return Response({
                'error': 'Invalid token issuer'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract user email from Google
        email = idinfo['email']
        
        try:
            # Check if user exists (LOGIN ONLY - no new account creation)
            user = User.objects.get(email=email)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save()
            
            response_data = {
                'success': True,
                'access_token': str(access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_verified': user.is_verified,
                    'profile_picture': user.profile_picture,
                    'student_id': user.student_id,
                    'institution': user.institution,
                    'date_of_birth': user.date_of_birth,
                },
                'profile': {
                    'profile_picture': user.profile_picture,
                    'student_id': user.student_id,
                    'university': user.institution,
                    'date_of_birth': user.date_of_birth,
                    'user_type': user_type,
                },
                'message': 'Login successful!'
            }
            
            logger.info(f"Google OAuth login successful for existing user: {email}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            logger.warning(f"Login attempt for non-existent user: {email}")
            return Response({
                'error': 'User not found',
                'message': 'No account found with this email. Please sign up first.',
                'code': 'USER_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except ValueError as e:
        logger.error(f"Google OAuth login error: {e}")
        return Response({
            'error': 'Invalid Google token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in Google OAuth login: {e}")
        return Response({
            'error': 'Authentication failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile_management(request):
    """Handle profile viewing and updates"""
    
    if request.method == 'GET':
        """Get user profile data"""
        return Response({
            'user': UserSerializer(request.user).data,
            'completion_percentage': request.user.completion_percentage
        })
    
    elif request.method in ['PUT', 'PATCH']:
        """Update user profile"""
        try:
            with transaction.atomic():
                # Update user fields
                user_data = request.data.get('user', {})
                for field in ['first_name', 'last_name', 'username', 'phone']:
                    if field in user_data:
                        setattr(request.user, field, user_data[field])
                
                # Update profile fields  
                for field in ['bio', 'location', 'gender', 'date_of_birth', 'student_id', 
                             'institution', 'department', 'year_of_study', 'skills', 'interests']:
                    if field in request.data:
                        setattr(request.user, field, request.data[field])
                
                request.user.save()
                
                logger.info(f"Profile updated for user {request.user.email}")
                
                return Response({
                    'success': True,
                    'message': 'Profile updated successfully!',
                    'user': UserSerializer(request.user).data,
                    'completion_percentage': request.user.completion_percentage
                })
                
        except ValidationError as e:
            return Response({
                'error': 'Validation error',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Profile update error: {e}")
            return Response({
                'error': 'Failed to update profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_account(request):
    """Handle account deletion with CASCADE effects"""
    
    try:
        # Confirm deletion with exact confirmation text
        confirmation = request.data.get('confirmation')
        if confirmation != 'DELETE_MY_ACCOUNT':
            return Response({
                'error': 'Please type "DELETE_MY_ACCOUNT" to confirm deletion'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user_email = user.email
        user_id = user.id
        
        # Log deletion attempt
        logger.info(f"Account deletion initiated for user {user_email} (ID: {user_id})")
        
        # Get counts before deletion for logging (outside transaction to avoid conflicts)
        try:
            from study_sessions.models import Post
            from mentorship.models import UserConnection, Review
            from django.db.models import Q
            
            posts_count = Post.objects.filter(user=user).count()
            connections_count = UserConnection.objects.filter(
                Q(mentor_user=user) | Q(student_user=user)
            ).count()
            reviews_count = Review.objects.filter(
                Q(reviewer=user) | Q(reviewee=user)
            ).count()
            
            logger.info(f"User {user_email} data to be affected: "
                       f"{posts_count} posts, {connections_count} connections, {reviews_count} reviews")
        except Exception as e:
            logger.warning(f"Could not count user data before deletion: {e}")
        
        # Perform the account deletion
        try:
            success = user.delete_account()
            if success:
                logger.info(f"Account successfully deleted for user {user_email} (ID: {user_id})")
                
                return Response({
                    'success': True,
                    'message': 'Your account has been successfully deleted. All your data has been removed from our system.'
                }, status=status.HTTP_200_OK)
            else:
                logger.error(f"delete_account returned False for user {user_id}")
                return Response({
                    'error': 'Failed to delete account. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as deletion_error:
            logger.error(f"Error during account deletion for user {user_id}: {deletion_error}")
            return Response({
                'error': 'Failed to delete account due to database error. Please try again or contact support.',
                'details': str(deletion_error) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Account deletion error for user {request.user.email if request.user else 'unknown'}: {e}")
        return Response({
            'error': 'Failed to delete account. Please try again or contact support.',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Handle profile picture upload"""
    try:
        profile = request.user.profile
        
        if 'profile_picture' not in request.FILES:
            return Response({
                'error': 'No file uploaded'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['profile_picture']
        
        # Validate file type and size
        if file.size > 5 * 1024 * 1024:  # 5MB limit
            return Response({
                'error': 'File too large. Maximum size is 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not file.content_type.startswith('image/'):
            return Response({
                'error': 'Invalid file type. Please upload an image.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file (implement your file storage logic here)
        # For now, we'll just save the filename
        profile.profile_picture = f"profile_pictures/{request.user.id}_{file.name}"
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Profile picture updated successfully!',
            'profile_picture_url': profile.profile_picture
        })
        
    except Exception as e:
        logger.error(f"Profile picture upload error: {e}")
        return Response({
            'error': 'Failed to upload profile picture'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_data(request):
    """Get comprehensive user dashboard data"""
    try:
        user = request.user
        
        # Get related data counts
        from study_sessions.models import StudySession
        from payments.models import Payment
        
        dashboard_data = {
            'user': UserSerializer(user).data,
            'stats': {
                'sessions_hosted': StudySession.objects.filter(host=user).count(),
                'sessions_joined': user.session_participants.count(),
                'total_payments': Payment.objects.filter(user=user, status='completed').count(),
                'profile_completion': user.completion_percentage,
            },
            'recent_activity': {
                'recent_sessions': StudySession.objects.filter(host=user).order_by('-created_at')[:5],
                'recent_payments': Payment.objects.filter(user=user).order_by('-created_at')[:3],
            }
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        logger.error(f"Dashboard data error: {e}")
        return Response({
            'error': 'Failed to load dashboard data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Additional utility functions

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_email(request):
    """Send email verification"""
    # Implement email verification logic
    pass

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_phone(request):
    """Send phone verification"""
    # Implement phone verification logic
    pass

@api_view(['POST'])
@permission_classes([AllowAny])
def check_username_availability(request):
    """Check if username is available"""
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=400)
    
    is_available = not User.objects.filter(username=username).exists()
    return Response({'available': is_available})

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_availability(request):
    """Check if email is available"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    is_available = not User.objects.filter(email=email).exists()
    return Response({'available': is_available})
