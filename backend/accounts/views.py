from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from oauth2_provider.decorators import protected_resource
from oauth2_provider.models import Application, AccessToken
from social_django.utils import psa
import json
import logging

from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                logger.info(f"User {user.email} registered successfully")
                
                # Return user data without sensitive information
                user_data = UserSerializer(user).data
                
                return Response({
                    'message': 'Registration successful',
                    'user': user_data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Registration error: {str(e)}")
                return Response({
                    'error': 'Registration failed',
                    'details': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile information"""
        try:
            user_data = UserSerializer(request.user).data
            
            return Response({
                'user': user_data,
                'completion_percentage': request.user.completion_percentage
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile fetch error for user {request.user.id}: {str(e)}")
            return Response({
                'error': 'Failed to fetch profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request):
        """Update user profile"""
        try:
            # Update all user fields directly
            user_fields = ['first_name', 'last_name', 'email', 'phone', 'bio', 'location', 
                          'gender', 'date_of_birth', 'student_id', 'institution', 'department',
                          'year_of_study', 'skills', 'interests']
            
            for field in user_fields:
                if field in request.data:
                    setattr(request.user, field, request.data[field])
            
            request.user.save()
            
            # Return updated data
            user_data = UserSerializer(request.user).data
            
            return Response({
                'message': 'Profile updated successfully',
                'user': user_data,
                'completion_percentage': request.user.completion_percentage
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile update error for user {request.user.id}: {str(e)}")
            return Response({
                'error': 'Failed to update profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_endpoint(request):
    """Test endpoint for OAuth functionality"""
    return Response({
        'message': 'OAuth test endpoint working',
        'data': request.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data"""
    try:
        user = request.user
        
        # Calculate basic stats
        dashboard_data = {
            'user': UserSerializer(user).data,
            'stats': {
                'total_study_sessions': 0,  # Will be populated from actual study sessions
                'total_study_hours': 0,
                'current_streak': 0,
                'profile_completion_percentage': calculate_profile_completion(user),
                'weekly_goal_progress': 0
            },
            'recent_activities': [],  # Will be populated from actual activities
            'upcoming_sessions': []   # Will be populated from actual sessions
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard error for user {request.user.id}: {str(e)}")
        return Response({
            'error': 'Failed to load dashboard data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def calculate_profile_completion(user):
    """Calculate profile completion percentage"""
    total_fields = 10
    completed_fields = 0
    
    # Check user fields
    if user.first_name:
        completed_fields += 1
    if user.last_name:
        completed_fields += 1
    if user.email:
        completed_fields += 1
    if user.phone:
        completed_fields += 1
    if user.bio:
        completed_fields += 1
    
    # Check profile fields (now part of User model)
    if user.institution:
        completed_fields += 1
    if user.student_id:
        completed_fields += 1
    if user.skills:
        completed_fields += 1
    if user.interests:
        completed_fields += 1
        if user.profile_picture:
            completed_fields += 1
    
    return int((completed_fields / total_fields) * 100)


# Backward compatibility endpoints (to be deprecated)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Legacy login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=email, password=password)
    if user:
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Legacy logout endpoint"""
    logout(request)
    return Response({
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)
