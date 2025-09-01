"""
Enhanced serializers for dynamic user account management
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Enhanced User serializer with dynamic fields"""
    
    full_name = serializers.ReadOnlyField()
    is_premium_active = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'uuid', 'username', 'email', 'first_name', 'last_name', 
            'phone', 'is_active', 'is_verified', 'is_premium', 'premium_expires_at',
            'date_joined', 'last_login', 'full_name', 'is_premium_active'
        ]
        read_only_fields = ['id', 'uuid', 'date_joined', 'last_login', 'is_premium', 'premium_expires_at']

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


class UserProfileSerializer(serializers.ModelSerializer):
    """Enhanced UserProfile serializer with dynamic updates"""
    
    completion_percentage = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'bio', 'profile_picture', 'university', 'major', 'year_of_study',
            'gpa', 'location', 'timezone', 'study_preferences', 'availability_hours',
            'date_of_birth', 'gender', 'student_id', 'email_verified', 'phone_verified',
            'created_at', 'updated_at', 'completion_percentage', 'user_email', 'user_full_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'email_verified', 'phone_verified']

    def validate_gpa(self, value):
        """Validate GPA range"""
        if value is not None and (value < 0 or value > 4.0):
            raise serializers.ValidationError("GPA must be between 0.00 and 4.00")
        return value

    def validate_year_of_study(self, value):
        """Validate year of study"""
        if value is not None and (value < 1 or value > 8):
            raise serializers.ValidationError("Year of study must be between 1 and 8")
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Enhanced registration serializer with profile creation"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone',
            'password', 'password_confirm', 'profile'
        ]

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password and password confirmation do not match.")
        return attrs

    def create(self, validated_data):
        """Create user with profile in a transaction"""
        from django.db import transaction
        
        # Remove password_confirm and profile data
        validated_data.pop('password_confirm')
        profile_data = validated_data.pop('profile', {})
        
        with transaction.atomic():
            # Create user
            user = User.objects.create_user(**validated_data)
            
            # Create profile
            UserProfile.objects.create(user=user, **profile_data)
            
        return user


class GoogleOAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication"""
    
    credential = serializers.CharField(required=True)
    
    def validate_credential(self, value):
        """Validate Google credential format"""
        if not value or len(value) < 100:
            raise serializers.ValidationError("Invalid Google credential")
        return value


class ProfileUpdateSerializer(serializers.Serializer):
    """Serializer for profile updates with nested user data"""
    
    user = UserSerializer(partial=True, required=False)
    profile = UserProfileSerializer(partial=True, required=False)
    
    def validate(self, attrs):
        """Ensure at least one field is being updated"""
        if not attrs.get('user') and not attrs.get('profile'):
            raise serializers.ValidationError("At least one field must be provided for update")
        return attrs


class AccountDeletionSerializer(serializers.Serializer):
    """Serializer for account deletion confirmation"""
    
    confirmation = serializers.CharField(required=True)
    
    def validate_confirmation(self, value):
        """Validate deletion confirmation"""
        if value != 'DELETE_MY_ACCOUNT':
            raise serializers.ValidationError('Please type "DELETE_MY_ACCOUNT" to confirm deletion')
        return value
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type')
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password fields didn't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(**validated_data)
        return user
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password fields didn't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class SocialAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    backend = serializers.CharField()
    
    def validate_backend(self, value):
        allowed_backends = ['google-oauth2', 'facebook', 'github']
        if value not in allowed_backends:
            raise serializers.ValidationError(f'Backend must be one of: {", ".join(allowed_backends)}')
        return value


class OAuth2TokenSerializer(serializers.Serializer):
    grant_type = serializers.CharField()
    code = serializers.CharField(required=False)
    client_id = serializers.CharField(required=False)
    client_secret = serializers.CharField(required=False)
    redirect_uri = serializers.CharField(required=False)
    refresh_token = serializers.CharField(required=False)
    
    def validate_grant_type(self, value):
        allowed_types = ['authorization_code', 'refresh_token']
        if value not in allowed_types:
            raise serializers.ValidationError(f'Grant type must be one of: {", ".join(allowed_types)}')
        return value
