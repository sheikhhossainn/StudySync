from django.db import models
from django.core.validators import MinLengthValidator
import uuid


class Post(models.Model):
    POST_TYPE_CHOICES = [
        ('help_request', 'Help Request'),
        ('study_group', 'Study Group'),
        ('mentorship', 'Mentorship'),
        ('discussion', 'Discussion'),
    ]
    
    DIFFICULTY_LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=255, validators=[MinLengthValidator(5)])
    content = models.TextField(validators=[MinLengthValidator(10)])
    post_type = models.CharField(max_length=15, choices=POST_TYPE_CHOICES)
    subject_area = models.CharField(max_length=255)
    difficulty_level = models.CharField(max_length=15, choices=DIFFICULTY_LEVEL_CHOICES, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    view_count = models.IntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)  # Array of tags for better searchability
    expires_at = models.DateTimeField(blank=True, null=True)  # For time-sensitive posts
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.user.email}"


class JoinRequest(models.Model):
    REQUEST_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='join_requests')
    requester_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_requests')
    status = models.CharField(max_length=10, choices=REQUEST_STATUS_CHOICES, default='pending')
    message = models.TextField(max_length=500, blank=True, null=True)
    response_message = models.TextField(max_length=500, blank=True, null=True)  # Message from post owner when accepting/rejecting
    responded_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, blank=True, null=True, related_name='responses')  # Who responded to the request
    responded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'join_requests'
        unique_together = [['post', 'requester_user']]

    def __str__(self):
        return f"Join request for {self.post.title} by {self.requester_user.email}"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(max_length=2000)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.sender.email} to {self.receiver.email}"
