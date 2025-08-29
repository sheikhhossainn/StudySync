from django.urls import path
from . import views

app_name = 'study_sessions'

urlpatterns = [
    # Posts
    path('posts/', views.PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<uuid:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('my-posts/', views.MyPostsView.as_view(), name='my-posts'),
    
    # Join Requests
    path('join-requests/', views.JoinRequestListCreateView.as_view(), name='join-request-list-create'),
    path('join-requests/<uuid:request_id>/respond/', views.respond_to_join_request, name='respond-join-request'),
    
    # Messages
    path('messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('messages/<uuid:message_id>/read/', views.mark_message_as_read, name='mark-message-read'),
]
