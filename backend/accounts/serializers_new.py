"""
Enhanced serializers for simplified single-table user management
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Enhanced User serializer with all profile fields included"""
    
    full_name = serializers.ReadOnlyField()
    profile_completion_percentage = serializers.ReadOnlyField()
    is_premium_active = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'profile_picture', 'bio', 'date_of_birth', 'gender', 'student_id',
            'institution', 'department', 'year_of_study', 'skills', 'interests',
            'location', 'timezone', 'language_preference', 'is_active', 'is_verified',
            'email_verified', 'phone_verified', 'profile_completed', 'is_premium',
            'premium_expires_at', 'date_joined', 'last_login', 'created_at', 'updated_at',
            'full_name', 'profile_completion_percentage', 'is_premium_active'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'created_at', 'updated_at',
            'is_verified', 'email_verified', 'phone_verified', 'full_name',
            'profile_completion_percentage', 'is_premium_active'
        ]

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username uniqueness"""
        if User.objects.filter(username=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_year_of_study(self, value):
        """Validate year of study"""
        if value is not None and (value < 1 or value > 8):
            raise serializers.ValidationError("Year of study must be between 1 and 8")
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Simplified registration serializer"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone',
            'password', 'password_confirm'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password fields didn't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class GoogleOAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication"""
    
    credential = serializers.CharField()
    email = serializers.EmailField(required=False)
    name = serializers.CharField(required=False)
    google_id = serializers.CharField(required=False)
    profile_picture = serializers.URLField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    student_id = serializers.CharField(required=False)
    organization_name = serializers.CharField(required=False)
    date_of_birth = serializers.DateField(required=False)
    phone_number = serializers.CharField(required=False)
    extracted_full_name = serializers.CharField(required=False)


class ProfileUpdateSerializer(serializers.Serializer):
    """Serializer for profile updates"""
    
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    bio = serializers.CharField(required=False)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, required=False)
    student_id = serializers.CharField(required=False)
    institution = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    year_of_study = serializers.IntegerField(required=False)
    skills = serializers.ListField(child=serializers.CharField(), required=False)
    interests = serializers.ListField(child=serializers.CharField(), required=False)
    location = serializers.CharField(required=False)
    timezone = serializers.CharField(required=False)
    language_preference = serializers.CharField(required=False)


class AccountDeletionSerializer(serializers.Serializer):
    """Serializer for account deletion confirmation"""
    
    password = serializers.CharField(write_only=True)
    confirm_deletion = serializers.BooleanField()

    def validate_confirm_deletion(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm account deletion.")
        return value
