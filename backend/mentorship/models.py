from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class MentorshipRequest(models.Model):
    """Model for students requesting mentorship"""
    
    FIELD_CHOICES = [
        ('software_engineering', 'Software Engineering'),
        ('data_science', 'Data Science'),
        ('machine_learning', 'Machine Learning'),
        ('product_management', 'Product Management'),
        ('ui_ux_design', 'UI/UX Design'),
        ('cybersecurity', 'Cybersecurity'),
        ('devops', 'DevOps'),
        ('mobile_development', 'Mobile Development'),
        ('web_development', 'Web Development'),
        ('finance', 'Finance'),
        ('marketing', 'Marketing'),
        ('consulting', 'Consulting'),
        ('other', 'Other'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('student', 'Student'),
        ('entry_level', 'Entry Level (0-1 years)'),
        ('junior', 'Junior (1-3 years)'),
        ('mid_level', 'Mid Level (3-5 years)'),
        ('senior', 'Senior (5+ years)'),
    ]
    
    TIME_PREFERENCE_CHOICES = [
        ('morning', 'Morning (6 AM - 12 PM)'),
        ('afternoon', 'Afternoon (12 PM - 6 PM)'),
        ('evening', 'Evening (6 PM - 11 PM)'),
        ('weekend', 'Weekends'),
        ('flexible', 'Flexible'),
    ]
    
    SESSION_FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('as_needed', 'As needed'),
    ]
    
    BUDGET_CHOICES = [
        ('free', 'Free/Volunteer'),
        ('under_500', 'Under $500'),
        ('500_1000', '$500 - $1000'),
        ('1000_2000', '$1000 - $2000'),
        ('2000_3000', '$2000 - $3000'),
        ('3000_5000', '$3000 - $5000'),
        ('above_5000', 'Above $5000'),
    ]
    
    DURATION_CHOICES = [
        ('1_month', '1 Month'),
        ('3_months', '3 Months'),
        ('6_months', '6 Months'),
        ('1_year', '1 Year'),
        ('ongoing', 'Ongoing'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('matched', 'Matched'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='mentorship_requests')
    title = models.CharField(max_length=255)
    description = models.TextField()
    target_role = models.CharField(max_length=255)
    field = models.CharField(max_length=30, choices=FIELD_CHOICES)
    topics = models.CharField(max_length=500, help_text="Comma-separated topics/skills needed")
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    preferred_time = models.CharField(max_length=20, choices=TIME_PREFERENCE_CHOICES, blank=True, null=True)
    session_frequency = models.CharField(max_length=20, choices=SESSION_FREQUENCY_CHOICES, blank=True, null=True)
    budget = models.CharField(max_length=20, choices=BUDGET_CHOICES)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES, blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Tracking fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'mentorship_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['field']),
            models.Index(fields=['budget']),
            models.Index(fields=['experience_level']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Mentorship Request: {self.title} by {self.author.email}"


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
