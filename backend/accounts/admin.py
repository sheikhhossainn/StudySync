from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_verified', 'is_premium', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': (
                'phone', 
                'is_verified', 
                'is_premium',
                'premium_expires_at',
                'uuid'
            )
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'major', 'year_of_study', 'created_at')
    list_filter = ('university', 'major', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'university', 'major')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Academic Info', {
            'fields': ('university', 'major', 'year_of_study', 'gpa')
        }),
        ('Personal Info', {
            'fields': ('bio', 'profile_picture', 'location', 'timezone'),
            'classes': ('collapse',)
        }),
        ('Preferences', {
            'fields': ('study_preferences',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
