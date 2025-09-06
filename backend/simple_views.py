# Minimal views for Vercel deployment
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["GET", "POST"])
def study_sessions_posts(request):
    """Simple study sessions endpoint"""
    if request.method == 'GET':
        # Return empty list for now
        return JsonResponse({
            'results': [],
            'count': 0,
            'message': 'Study sessions endpoint working - no data yet'
        })
    elif request.method == 'POST':
        return JsonResponse({
            'message': 'Post creation not implemented yet',
            'status': 'success'
        })

@csrf_exempt 
def auth_status(request):
    """Simple auth status endpoint"""
    return JsonResponse({
        'authenticated': False,
        'message': 'Auth endpoint working'
    })
