from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from .models import Post, JoinRequest, Message
from .serializers import (
    PostSerializer, PostCreateSerializer, 
    JoinRequestSerializer, JoinRequestCreateSerializer,
    MessageSerializer, MessageCreateSerializer
)


class PostListCreateView(generics.ListCreateAPIView):
    """List all posts or create a new post"""
    queryset = Post.objects.filter(is_active=True).select_related('user').prefetch_related('join_requests')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Allow reading without auth
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post_type', 'subject_area', 'difficulty_level']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer
    
    def perform_create(self, serializer):
        # Save the post with the current user
        serializer.save(user=self.request.user)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(subject_area__icontains=search)
            )
        
        return queryset.order_by('-created_at')


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific post"""
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow read access without authentication, but require authentication for update/delete
        """
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_object(self):
        post = super().get_object()
        # View count functionality removed as requested
        return post
    
    def perform_update(self, serializer):
        # Only allow the post owner to update
        if serializer.instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only update your own posts.')
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow the post owner to delete
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only delete your own posts.')
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()


class MyPostsView(generics.ListAPIView):
    """List current user's posts"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Post.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('user').prefetch_related('join_requests').annotate(
            total_requests=Count('join_requests'),
            pending_requests=Count(
                Case(When(join_requests__status='pending', then=1), 
                     output_field=IntegerField())
            ),
            accepted_requests=Count(
                Case(When(join_requests__status='accepted', then=1), 
                     output_field=IntegerField())
            )
        ).order_by('-created_at')


class JoinRequestListCreateView(generics.ListCreateAPIView):
    """List join requests or create a new join request"""
    serializer_class = JoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JoinRequestCreateSerializer
        return JoinRequestSerializer
    
    def get_queryset(self):
        # Show join requests for current user's posts or requests sent by current user
        return JoinRequest.objects.filter(
            Q(post__user=self.request.user) | Q(requester_user=self.request.user)
        ).select_related('post', 'requester_user', 'responded_by').order_by('-created_at')
    
    def perform_create(self, serializer):
        post = serializer.validated_data['post']
        
        # Check if user is trying to join their own post
        if post.user == self.request.user:
            return Response(
                {'error': 'You cannot join your own post.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has already requested to join this post
        if JoinRequest.objects.filter(post=post, requester_user=self.request.user).exists():
            return Response(
                {'error': 'You have already requested to join this post.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(requester_user=self.request.user)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_join_request(request, request_id):
    """Accept or reject a join request"""
    join_request = get_object_or_404(JoinRequest, id=request_id)
    
    # Only the post owner can respond to join requests
    if join_request.post.user != request.user:
        return Response(
            {'error': 'You can only respond to requests for your own posts.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if already responded
    if join_request.status != 'pending':
        return Response(
            {'error': 'This request has already been responded to.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    status_value = request.data.get('status')
    response_message = request.data.get('response_message', '')
    
    if status_value not in ['accepted', 'rejected']:
        return Response(
            {'error': 'Status must be either "accepted" or "rejected".'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    join_request.status = status_value
    join_request.response_message = response_message
    join_request.responded_by = request.user
    join_request.responded_at = timezone.now()
    join_request.save()
    
    serializer = JoinRequestSerializer(join_request)
    return Response(serializer.data)


class MessageListCreateView(generics.ListCreateAPIView):
    """List messages or send a new message"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_queryset(self):
        # Show messages sent to or from current user
        return Message.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).select_related('sender', 'receiver').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_message_as_read(request, message_id):
    """Mark a message as read"""
    message = get_object_or_404(Message, id=message_id, receiver=request.user)
    
    if not message.is_read:
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
    
    serializer = MessageSerializer(message)
    return Response(serializer.data)
