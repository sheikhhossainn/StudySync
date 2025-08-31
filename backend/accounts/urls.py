from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views, auth_views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'mentors', views.MentorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # JWT Authentication
    path('auth/login/', auth_views.custom_login, name='auth-login'),
    path('auth/register/', auth_views.custom_register, name='auth-register'),
    path('auth/logout/', auth_views.logout, name='auth-logout'),
    path('auth/refresh/', auth_views.refresh_token, name='auth-refresh'),
    
    # Google OAuth 2.0
    path('auth/google/login/', auth_views.google_oauth_login, name='google-login'),
    path('auth/google/register/', auth_views.google_oauth_register, name='google-register'),
    
    # JWT Token endpoints (alternative)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Traditional authentication (legacy)
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # OAuth 2.0 endpoints (legacy)
    path('oauth/token/', views.OAuth2TokenView.as_view(), name='oauth-token'),
    path('oauth/user/', views.user_info, name='oauth-user-info'),
    
    # Social authentication (legacy)
    path('social/<str:backend>/', views.SocialAuthView.as_view(), name='social-auth'),
    path('social/complete/<str:backend>/', views.social_auth_complete, name='social-auth-complete'),
]
