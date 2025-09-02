from django.contrib import admin
from .models import MentorshipRequest, UserConnection, Review


@admin.register(MentorshipRequest)
class MentorshipRequestAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'field', 'budget', 'experience_level', 
        'status', 'created_at'
    ]
    list_filter = [
        'field', 'budget', 'experience_level', 'status', 
        'preferred_time', 'session_frequency'
    ]
    search_fields = ['title', 'description', 'topics', 'target_role']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'author', 'status')
        }),
        ('Career Details', {
            'fields': ('target_role', 'field', 'topics', 'experience_level')
        }),
        ('Preferences', {
            'fields': ('preferred_time', 'session_frequency', 'budget', 'duration')
        }),
        ('Additional Information', {
            'fields': ('additional_info', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserConnection)
class UserConnectionAdmin(admin.ModelAdmin):
    list_display = [
        'mentor_user', 'student_user', 'connection_status', 
        'initiated_by', 'created_at'
    ]
    list_filter = ['connection_status', 'created_at']
    search_fields = [
        'mentor_user__email', 'student_user__email', 
        'mentor_user__first_name', 'mentor_user__last_name',
        'student_user__first_name', 'student_user__last_name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'reviewer', 'reviewee', 'rating', 'connection', 'created_at'
    ]
    list_filter = ['rating', 'created_at']
    search_fields = [
        'reviewer__email', 'reviewee__email', 
        'reviewer__first_name', 'reviewer__last_name',
        'reviewee__first_name', 'reviewee__last_name'
    ]
    readonly_fields = ['id', 'created_at']
