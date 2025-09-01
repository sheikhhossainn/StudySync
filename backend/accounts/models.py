from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Enhanced User model matching PostgreSQL schema"""
    
    ACCOUNT_TYPE_CHOICES = [
        ('student', 'Student'),
        ('tutor', 'Tutor'),
        ('mentor', 'Mentor'),
        ('admin', 'Admin'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    # Primary fields (matching PostgreSQL schema)
    id = models.AutoField(primary_key=True)  # Using SERIAL from PostgreSQL
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=255)  # Renamed from password_hash
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Account status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Premium features
    is_premium = models.BooleanField(default=False)
    premium_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_premium_active(self):
        """Check if user has active premium subscription"""
        return (
            self.is_premium and 
            (self.premium_expires_at is None or self.premium_expires_at > timezone.now())
        )

    def delete_account(self):
        """Soft delete user account with CASCADE effects"""
        from django.db import transaction
        
        with transaction.atomic():
            # Mark user as inactive instead of hard delete
            self.is_active = False
            self.is_verified = False
            self.email = f"deleted_{self.id}_{self.email}"
            self.username = f"deleted_{self.id}_{self.username}"
            self.save()
            
            # Related data will be handled by CASCADE in database
            return True


class UserProfile(models.Model):
    """User profile with extended information"""
    
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.CharField(max_length=255, blank=True, null=True)
    university = models.CharField(max_length=100, blank=True, null=True)
    major = models.CharField(max_length=100, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=50, default='Asia/Dhaka')
    study_preferences = models.TextField(blank=True, null=True)
    availability_hours = models.JSONField(default=dict, blank=True)
    
    # Additional profile fields
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=User.GENDER_CHOICES, blank=True, null=True)
    student_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Verification status
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.full_name}'s Profile"

    @property
    def completion_percentage(self):
        """Calculate profile completion percentage"""
        fields = [
            self.bio, self.university, self.major, self.year_of_study,
            self.location, self.date_of_birth, self.gender
        ]
        completed = sum(1 for field in fields if field)
        return int((completed / len(fields)) * 100)

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
