from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
import uuid


class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ('student', 'Student'),
        ('mentor', 'Mentor'),
    ]
    
    SUBSCRIPTION_TYPE_CHOICES = [
        ('free', 'Free'),
        ('premium', 'Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    subscription_type = models.CharField(max_length=10, choices=SUBSCRIPTION_TYPE_CHOICES, default='free')
    premium_expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_expires_at = models.DateTimeField(blank=True, null=True)
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_expires_at = models.DateTimeField(blank=True, null=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'user_type']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    @property
    def is_premium(self):
        """Check if user has active premium subscription"""
        from django.utils import timezone
        return (
            self.subscription_type == 'premium' and 
            (self.premium_expires_at is None or self.premium_expires_at > timezone.now())
        )

    @property
    def has_ads(self):
        """Check if user should see ads"""
        return not self.is_premium

    def can_use_mentorship(self):
        """Check if user can access mentorship features"""
        return self.is_premium

    def get_post_limit(self):
        """Get user's monthly post limit"""
        if self.is_premium:
            return -1  # Unlimited
        return 5  # Free users get 5 posts per month

    def get_current_month_posts(self):
        """Get number of posts created this month"""
        from django.utils import timezone
        from datetime import datetime
        from study_sessions.models import Post
        
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return Post.objects.filter(
            user=self,
            created_at__gte=current_month,
            is_active=True
        ).count()

    def can_create_post(self):
        """Check if user can create more posts this month"""
        limit = self.get_post_limit()
        if limit == -1:  # Unlimited
            return True
        return self.get_current_month_posts() < limit


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id_card_image_url = models.URLField(max_length=500, blank=True, null=True)
    name = models.CharField(max_length=255, validators=[MinLengthValidator(2)])
    date_of_birth = models.DateField(blank=True, null=True)
    institution_name = models.CharField(max_length=255)
    student_id = models.CharField(max_length=100, blank=True, null=True)
    field_of_study = models.CharField(max_length=255)
    academic_year = models.IntegerField(blank=True, null=True)
    bio = models.TextField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f"{self.name} - {self.institution_name}"

    @property
    def age(self):
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None


class Mentor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    nid_card_image_url = models.URLField(max_length=500, blank=True, null=True)
    organization_id_card_image_url = models.URLField(max_length=500, blank=True, null=True)
    name = models.CharField(max_length=255, validators=[MinLengthValidator(2)])
    age = models.IntegerField(blank=True, null=True)
    expertise = models.JSONField(default=list)  # Array of expertise areas
    years_of_experience = models.IntegerField(default=0)
    job_role = models.CharField(max_length=255)
    organization_name = models.CharField(max_length=255)
    bio = models.TextField(max_length=1500, blank=True, null=True)
    linkedin_url = models.URLField(
        max_length=500, 
        blank=True, 
        null=True,
        validators=[RegexValidator(
            regex=r'^https?://(www\.)?linkedin\.com/',
            message='Please enter a valid LinkedIn URL'
        )]
    )
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mentors'

    def __str__(self):
        return f"{self.name} - {self.job_role} at {self.organization_name}"
