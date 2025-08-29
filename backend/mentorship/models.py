from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class UserConnection(models.Model):
    CONNECTION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='mentor_connections')
    student_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='student_connections')
    connection_status = models.CharField(max_length=10, choices=CONNECTION_STATUS_CHOICES, default='pending')
    initiated_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='initiated_connections')  # Who initiated the connection
    notes = models.TextField(max_length=1000, blank=True, null=True)  # Private notes about the connection
    started_at = models.DateTimeField(blank=True, null=True)  # When connection became active
    ended_at = models.DateTimeField(blank=True, null=True)  # When connection ended
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_connections'
        unique_together = [['mentor_user', 'student_user']]

    def __str__(self):
        return f"Connection: {self.mentor_user.email} -> {self.student_user.email}"


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reviews_received')
    connection = models.ForeignKey(UserConnection, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        unique_together = [['reviewer', 'reviewee', 'connection']]

    def __str__(self):
        return f"Review by {self.reviewer.email} for {self.reviewee.email} - {self.rating}/5"
