from django.urls import path
from . import views

urlpatterns = [
    # Mentorship Requests
    path('requests/', views.MentorshipRequestListCreateView.as_view(), name='mentorship-requests'),
    path('requests/<uuid:pk>/', views.MentorshipRequestDetailView.as_view(), name='mentorship-request-detail'),
    path('requests/my/', views.UserMentorshipRequestsView.as_view(), name='my-mentorship-requests'),
    path('requests/<uuid:request_id>/respond/', views.respond_to_mentorship_request, name='respond-to-mentorship'),
    
    # User Connections
    path('connections/', views.UserConnectionListCreateView.as_view(), name='user-connections'),
    path('connections/<uuid:pk>/', views.UserConnectionDetailView.as_view(), name='user-connection-detail'),
    path('connections/<uuid:connection_id>/accept/', views.accept_connection_request, name='accept-connection'),
    
    # Reviews
    path('reviews/', views.ReviewListCreateView.as_view(), name='reviews'),
    
    # Legacy endpoint for backward compatibility
    path('', views.MentorshipListView.as_view(), name='mentorship-list'),
]
