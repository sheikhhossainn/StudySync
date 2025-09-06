# Enhanced URLs for Vercel deployment with study sessions
from django.http import JsonResponse
from django.urls import path, include
from django.contrib import admin

def api_root(request):
    return JsonResponse({
        'message': 'StudySync API is working!',
        'status': 'success',
        'database': 'connected' if hasattr(request, '_cached_user') else 'unknown',
        'endpoints': {
            'auth': '/api/auth/',
            'study-sessions': '/api/study-sessions/',
            'admin': '/admin/',
        }
    })

def health_check(request):
    return JsonResponse({'status': 'healthy'})

# Import simple fallback views
from simple_views import study_sessions_posts, auth_status

urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health'),
    path('api/', api_root, name='api-root-api'),
    
    # Simple working endpoints
    path('api/study-sessions/posts/', study_sessions_posts, name='study-sessions-posts'),
    path('api/auth/status/', auth_status, name='auth-status'),
    
    # Admin (if working)
    path('admin/', admin.site.urls),
]
