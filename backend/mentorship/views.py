from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import MentorshipRequest, UserConnection, Review
from .serializers import MentorshipRequestSerializer, UserConnectionSerializer, ReviewSerializer
from accounts.models import User


class MentorshipRequestListCreateView(generics.ListCreateAPIView):
    """
    List all mentorship requests or create a new one
    """
    serializer_class = MentorshipRequestSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = MentorshipRequest.objects.filter(status='active').select_related('author')
        
        # Filter by field
        field = self.request.query_params.get('field')
        if field:
            queryset = queryset.filter(field=field)
        
        # Filter by budget
        budget = self.request.query_params.get('budget')
        if budget:
            queryset = queryset.filter(budget=budget)
        
        # Filter by experience level
        experience_level = self.request.query_params.get('experience_level')
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        
        # Search in title and description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(topics__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class MentorshipRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a mentorship request
    """
    serializer_class = MentorshipRequestSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return MentorshipRequest.objects.select_related('author')

    def get_object(self):
        obj = super().get_object()
        # Only allow owner to update/delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.author != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only modify your own mentorship requests.")
        return obj


class UserMentorshipRequestsView(generics.ListAPIView):
    """
    List mentorship requests created by the authenticated user
    """
    serializer_class = MentorshipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MentorshipRequest.objects.filter(
            author=self.request.user
        ).order_by('-created_at')


class UserConnectionListCreateView(generics.ListCreateAPIView):
    """
    List user connections or create a new connection request
    """
    serializer_class = UserConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return UserConnection.objects.filter(
            Q(mentor_user=user) | Q(student_user=user)
        ).select_related('mentor_user', 'student_user', 'initiated_by')

    def perform_create(self, serializer):
        serializer.save(initiated_by=self.request.user)


class UserConnectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user connection
    """
    serializer_class = UserConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return UserConnection.objects.filter(
            Q(mentor_user=user) | Q(student_user=user)
        ).select_related('mentor_user', 'student_user', 'initiated_by')


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    List reviews or create a new review
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Review.objects.filter(reviewee_id=user_id).select_related('reviewer', 'reviewee')
        return Review.objects.select_related('reviewer', 'reviewee')

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_mentorship_request(request, request_id):
    """
    Respond to a mentorship request by creating a connection
    """
    try:
        mentorship_request = get_object_or_404(MentorshipRequest, id=request_id)
        
        if mentorship_request.author == request.user:
            return Response(
                {'error': 'You cannot respond to your own mentorship request.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if connection already exists
        existing_connection = UserConnection.objects.filter(
            mentor_user=request.user,
            student_user=mentorship_request.author
        ).first()
        
        if existing_connection:
            return Response(
                {'error': 'Connection already exists with this user.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new connection
        connection = UserConnection.objects.create(
            mentor_user=request.user,
            student_user=mentorship_request.author,
            initiated_by=request.user,
            notes=request.data.get('message', '')
        )
        
        # Update mentorship request status
        mentorship_request.status = 'matched'
        mentorship_request.save()
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_connection_request(request, connection_id):
    """
    Accept a pending connection request
    """
    try:
        connection = get_object_or_404(UserConnection, id=connection_id)
        
        if connection.student_user != request.user:
            return Response(
                {'error': 'You can only accept connection requests sent to you.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if connection.connection_status != 'pending':
            return Response(
                {'error': 'Connection is not in pending status.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        connection.connection_status = 'active'
        from django.utils import timezone
        connection.started_at = timezone.now()
        connection.save()
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Legacy view to maintain compatibility
class MentorshipListView(generics.ListAPIView):
    """
    Legacy view for listing mentorship requests
    """
    serializer_class = MentorshipRequestSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return MentorshipRequest.objects.filter(status='active').select_related('author')
