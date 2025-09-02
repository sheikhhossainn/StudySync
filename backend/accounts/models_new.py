from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
import uuid


class User(AbstractUser):
    """Enhanced User model with all profile information included - Single Table Design"""
    
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
    
    # Primary fields (inherited from AbstractUser: username, email, first_name, last_name, password, is_active, is_staff, is_superuser, date_joined, last_login)
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Profile Information (merged from UserProfile table)
    profile_picture = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    student_id = models.CharField(max_length=50, blank=True, null=True)
    institution = models.CharField(max_length=200, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    skills = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    interests = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    location = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')
    language_preference = models.CharField(max_length=10, default='en')
    
    # Account Status
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    profile_completed = models.BooleanField(default=False)
    
    # Premium features
    is_premium = models.BooleanField(default=False)
    premium_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
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

    @property
    def profile_completion_percentage(self):
        """Calculate profile completion percentage"""
        fields = [
            self.bio, self.institution, self.department, self.year_of_study,
            self.location, self.date_of_birth, self.gender, self.student_id
        ]
        completed = sum(1 for field in fields if field)
        return int((completed / len(fields)) * 100)

    def can_use_premium_features(self):
        """Check if user can access premium features"""
        return self.is_verified and self.profile_completed

    def delete_account(self):
        """Soft delete user account with CASCADE effects"""
        from django.db import transaction
        from django.utils import timezone
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            with transaction.atomic():
                # Store original values for logging
                original_email = self.email
                original_username = self.username
                user_id = self.id
                
                logger.info(f"Starting account deletion for user {original_email} (ID: {user_id})")
                
                # Mark user as inactive and anonymize sensitive data
                self.is_active = False
                self.is_verified = False
                self.is_staff = False
                self.is_superuser = False
                
                # Anonymize email and username with timestamp to avoid conflicts
                timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
                self.email = f"deleted_{user_id}_{timestamp}@deleted.local"
                self.username = f"deleted_{user_id}_{timestamp}"
                
                # Clear sensitive profile data
                self.bio = None
                self.phone = None
                self.location = None
                self.profile_picture = None
                self.student_id = None
                self.date_of_birth = None
                self.gender = None
                self.institution = None
                self.department = None
                
                # Save the user with anonymized data
                self.save()
                logger.info(f"User {user_id} marked as deleted and anonymized")
                
                return True
                
        except Exception as e:
            logger.error(f"Error during account deletion for user {self.id}: {e}")
            raise e
