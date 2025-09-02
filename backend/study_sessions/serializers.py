from rest_framework import serializers
from .models import Post, JoinRequest, Message
from accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for nested serialization"""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'name']
    
    def get_name(self, obj):
        # With single User model, just use first_name + last_name
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username


class PostSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()
    total_requests = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    accepted_requests = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ['id', 'user', 'view_count', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        # With single User model, just use first_name + last_name
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    
    def get_total_requests(self, obj):
        return obj.join_requests.count()
    
    def get_pending_requests(self, obj):
        return obj.join_requests.filter(status='pending').count()
    
    def get_accepted_requests(self, obj):
        return obj.join_requests.filter(status='accepted').count()


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['title', 'content', 'post_type', 'subject_area', 'difficulty_level', 'tags', 'expires_at']


class JoinRequestSerializer(serializers.ModelSerializer):
    requester_user = UserBasicSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = '__all__'
        read_only_fields = ['id', 'requester_user', 'responded_by', 'responded_at', 'created_at', 'updated_at']


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = ['post', 'message']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    receiver = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['id', 'sender', 'receiver', 'is_read', 'read_at', 'created_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['receiver', 'content']
