from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'institution', 'student_id', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_verified', 'is_premium', 'institution', 'gender', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone', 'student_id', 'institution')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': (
                'phone', 
                'profile_picture',
                'bio',
                'date_of_birth',
                'gender',
                'student_id',
                'institution',
                'department',
                'year_of_study',
                'skills',
                'interests',
                'location',
                'timezone',
                'language_preference'
            )
        }),
        ('Account Status', {
            'fields': (
                'is_verified', 
                'email_verified',
                'phone_verified',
                'profile_completed',
                'is_premium',
                'premium_expires_at',
                'uuid'
            )
        }),
    )
