from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profiles', views.UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Traditional authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # OAuth 2.0 endpoints
    path('oauth/token/', views.OAuth2TokenView.as_view(), name='oauth-token'),
    path('oauth/user/', views.user_info, name='oauth-user-info'),
    
    # Social authentication
    path('social/<str:backend>/', views.SocialAuthView.as_view(), name='social-auth'),
    path('social/complete/<str:backend>/', views.social_auth_complete, name='social-auth-complete'),
]
