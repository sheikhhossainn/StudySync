from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'phone_number', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('user', 'bio', 'location', 'date_of_birth', 'avatar', 'subjects_of_interest', 
                 'expertise_level', 'github_url', 'linkedin_url', 'website_url', 
                 'receive_notifications', 'is_available_for_mentoring', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type', 'phone_number')
    
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
