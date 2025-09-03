from rest_framework import serializers
from .models import MentorshipRequest, UserConnection, Review
from accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for displaying minimal user info
    """
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']
        read_only_fields = ['id', 'email']


class MentorshipRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for MentorshipRequest model
    """
    author = UserBasicSerializer(read_only=True)
    field_display = serializers.CharField(source='get_field_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    budget_display = serializers.CharField(source='get_budget_display', read_only=True)
    preferred_time_display = serializers.CharField(source='get_preferred_time_display', read_only=True)
    session_frequency_display = serializers.CharField(source='get_session_frequency_display', read_only=True)
    duration_display = serializers.CharField(source='get_duration_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MentorshipRequest
        fields = [
            'id', 'author', 'title', 'description', 'target_role', 
            'field', 'field_display', 'topics', 'experience_level', 'experience_level_display',
            'preferred_time', 'preferred_time_display', 'session_frequency', 'session_frequency_display',
            'budget', 'budget_display', 'duration', 'duration_display', 
            'additional_info', 'status', 'status_display',
            'created_at', 'updated_at', 'expires_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def validate_title(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Title must be at least 10 characters long.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value.strip()

    def validate_topics(self, value):
        cleaned_value = value.strip()
        if len(cleaned_value) < 3:
            raise serializers.ValidationError("Please specify at least 3 characters for topics or skills.")
        return cleaned_value


class UserConnectionSerializer(serializers.ModelSerializer):
    """
    Serializer for UserConnection model
    """
    mentor_user = UserBasicSerializer(read_only=True)
    student_user = UserBasicSerializer(read_only=True)
    initiated_by = UserBasicSerializer(read_only=True)
    connection_status_display = serializers.CharField(source='get_connection_status_display', read_only=True)

    class Meta:
        model = UserConnection
        fields = [
            'id', 'mentor_user', 'student_user', 'connection_status', 'connection_status_display',
            'initiated_by', 'notes', 'started_at', 'ended_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'initiated_by', 'created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            mentor_user_id = request.data.get('mentor_user')
            student_user_id = request.data.get('student_user')
            
            if mentor_user_id and student_user_id:
                if mentor_user_id == student_user_id:
                    raise serializers.ValidationError("Mentor and student cannot be the same person.")
                
                # Check if connection already exists
                existing = UserConnection.objects.filter(
                    mentor_user_id=mentor_user_id,
                    student_user_id=student_user_id
                ).exists()
                
                if existing:
                    raise serializers.ValidationError("Connection already exists between these users.")
        
        return data

    def create(self, validated_data):
        mentor_user_id = self.context['request'].data.get('mentor_user')
        student_user_id = self.context['request'].data.get('student_user')
        
        if mentor_user_id:
            validated_data['mentor_user_id'] = mentor_user_id
        if student_user_id:
            validated_data['student_user_id'] = student_user_id
            
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model
    """
    reviewer = UserBasicSerializer(read_only=True)
    reviewee = UserBasicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'reviewee', 'connection', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            reviewee_id = request.data.get('reviewee')
            if reviewee_id:
                if str(request.user.id) == str(reviewee_id):
                    raise serializers.ValidationError("You cannot review yourself.")
                
                # Check if review already exists for this connection
                connection_id = data.get('connection')
                if connection_id:
                    existing = Review.objects.filter(
                        reviewer=request.user,
                        reviewee_id=reviewee_id,
                        connection=connection_id
                    ).exists()
                    
                    if existing:
                        raise serializers.ValidationError("You have already reviewed this user for this connection.")
        
        return data

    def create(self, validated_data):
        reviewee_id = self.context['request'].data.get('reviewee')
        if reviewee_id:
            validated_data['reviewee_id'] = reviewee_id
            
        return super().create(validated_data)


class MentorshipRequestCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating mentorship requests
    """
    class Meta:
        model = MentorshipRequest
        fields = [
            'title', 'description', 'target_role', 'field', 'topics', 
            'experience_level', 'preferred_time', 'session_frequency',
            'budget', 'duration', 'additional_info'
        ]

    def validate_title(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Title must be at least 10 characters long.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value.strip()
