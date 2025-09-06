# Simple URLs for testing Vercel deployment
from django.http import JsonResponse
from django.urls import path

def api_root(request):
    return JsonResponse({
        'message': 'StudySync API is working!',
        'status': 'success',
        'database': 'connected' if hasattr(request, '_cached_user') else 'unknown'
    })

def health_check(request):
    return JsonResponse({'status': 'healthy'})

urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health'),
    path('api/', api_root, name='api-root-api'),
]
