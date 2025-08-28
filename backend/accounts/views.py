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

from .models import User, UserProfile
from .serializers import UserSerializer, UserProfileSerializer, UserRegistrationSerializer

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                bio=request.data.get('bio', ''),
                subjects_of_interest=request.data.get('subjects_of_interest', []),
                expertise_level=request.data.get('expertise_level', 'beginner')
            )
            
            return Response({
                'message': 'User registered successfully',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            login(request, user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            return Response({
                'user': UserSerializer(request.user).data,
                'profile': UserProfileSerializer(profile).data
            })
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)
            return Response({
                'user': UserSerializer(request.user).data,
                'profile': UserProfileSerializer(profile).data
            })
    
    def put(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                
                # Update user fields if provided
                user_data = {}
                if 'first_name' in request.data:
                    user_data['first_name'] = request.data['first_name']
                if 'last_name' in request.data:
                    user_data['last_name'] = request.data['last_name']
                if 'user_type' in request.data:
                    user_data['user_type'] = request.data['user_type']
                
                if user_data:
                    user_serializer = UserSerializer(request.user, data=user_data, partial=True)
                    if user_serializer.is_valid():
                        user_serializer.save()
                
                return Response({
                    'message': 'Profile updated successfully',
                    'user': UserSerializer(request.user).data,
                    'profile': UserProfileSerializer(profile).data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)


# OAuth 2.0 Social Authentication Views

class SocialAuthView(APIView):
    permission_classes = [AllowAny]
    
    @psa('social:complete')
    def post(self, request, backend):
        """
        Social authentication endpoint
        """
        token = request.data.get('access_token')
        
        if not token:
            return Response({
                'error': 'Access token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use social auth to authenticate user
            user = request.backend.do_auth(token)
            
            if user:
                # Create or get user profile
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f'User authenticated via {backend}',
                        'subjects_of_interest': [],
                        'expertise_level': 'beginner'
                    }
                )
                
                # Create OAuth token for API access
                application = Application.objects.get(name='StudySync Frontend')
                access_token = AccessToken.objects.create(
                    user=user,
                    application=application,
                    token=token,
                    scope='read write'
                )
                
                return Response({
                    'access_token': access_token.token,
                    'user': UserSerializer(user).data,
                    'profile': UserProfileSerializer(profile).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Authentication failed'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            logger.error(f'Social auth error: {str(e)}')
            return Response({
                'error': 'Authentication failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OAuth2TokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        OAuth 2.0 token exchange endpoint
        """
        grant_type = request.data.get('grant_type')
        
        if grant_type == 'authorization_code':
            return self.handle_authorization_code(request)
        elif grant_type == 'refresh_token':
            return self.handle_refresh_token(request)
        else:
            return Response({
                'error': 'unsupported_grant_type'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def handle_authorization_code(self, request):
        # Implementation for authorization code flow
        code = request.data.get('code')
        client_id = request.data.get('client_id')
        client_secret = request.data.get('client_secret')
        redirect_uri = request.data.get('redirect_uri')
        
        # Validate and exchange code for token
        # This would typically involve oauth2_provider's token endpoint
        return Response({
            'access_token': 'generated_access_token',
            'token_type': 'Bearer',
            'expires_in': 3600,
            'refresh_token': 'generated_refresh_token',
            'scope': 'read write'
        })
    
    def handle_refresh_token(self, request):
        # Implementation for refresh token flow
        refresh_token = request.data.get('refresh_token')
        
        # Validate and refresh token
        return Response({
            'access_token': 'new_access_token',
            'token_type': 'Bearer',
            'expires_in': 3600,
            'refresh_token': 'new_refresh_token',
            'scope': 'read write'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@protected_resource()
def user_info(request):
    """
    OAuth 2.0 user info endpoint
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        return Response({
            'id': request.user.id,
            'email': request.user.email,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'user_type': request.user.user_type,
            'profile': UserProfileSerializer(profile).data
        })
    except UserProfile.DoesNotExist:
        return Response({
            'id': request.user.id,
            'email': request.user.email,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'user_type': request.user.user_type,
            'profile': None
        })


# Social Auth callback views

@csrf_exempt
@require_http_methods(["GET", "POST"])
def social_auth_complete(request, backend):
    """
    Handle social authentication completion
    """
    if request.method == 'GET':
        # Handle OAuth callback from provider
        return JsonResponse({'message': f'{backend} authentication callback'})
    
    # Handle POST request with access token
    return JsonResponse({'message': f'{backend} authentication complete'})
