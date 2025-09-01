from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views, auth_views, dynamic_views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Enhanced Dynamic Authentication & Profile Management
    path('auth/google/oauth/', dynamic_views.google_oauth_signup, name='google-oauth-signup'),
    path('auth/google/login/', dynamic_views.google_oauth_login, name='google-oauth-login'),
    path('auth/register/', dynamic_views.UserRegistrationView.as_view(), name='user-register'),
    path('profile/manage/', dynamic_views.user_profile_management, name='profile-manage'),
    path('profile/upload-picture/', dynamic_views.upload_profile_picture, name='upload-profile-picture'),
    path('account/delete/', dynamic_views.delete_user_account, name='delete-account'),
    path('dashboard/data/', dynamic_views.user_dashboard_data, name='dashboard-data'),
    
    # Utility endpoints
    path('check/username/', dynamic_views.check_username_availability, name='check-username'),
    path('check/email/', dynamic_views.check_email_availability, name='check-email'),
    path('verify/email/', dynamic_views.verify_email, name='verify-email'),
    path('verify/phone/', dynamic_views.verify_phone, name='verify-phone'),
    
    # Original JWT Authentication (backward compatibility)
    path('auth/login/', auth_views.custom_login, name='auth-login'),
    path('auth/logout/', auth_views.logout, name='auth-logout'),
    path('auth/refresh/', auth_views.refresh_token, name='auth-refresh'),
    
    # JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Traditional authentication (compatible with existing views)
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('dashboard/', views.user_dashboard, name='dashboard'),
    path('test/', views.test_endpoint, name='test'),
]
