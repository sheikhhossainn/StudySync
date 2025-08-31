from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Student, Mentor


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'subscription_type', 'is_premium', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'is_premium')


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = ('id', 'user', 'name', 'date_of_birth', 'age', 'institution_name', 'student_id', 
                 'field_of_study', 'academic_year', 'bio', 'student_id_card_image_url', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'age')


class MentorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Mentor
        fields = ('id', 'user', 'name', 'age', 'expertise', 'years_of_experience', 'job_role', 
                 'organization_name', 'bio', 'linkedin_url', 'is_verified', 'verification_date',
                 'nid_card_image_url', 'organization_id_card_image_url', 'created_at', 'updated_at')
        read_only_fields = ('id', 'is_verified', 'verification_date', 'created_at', 'updated_at')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
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
