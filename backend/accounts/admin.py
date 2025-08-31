from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Student, Mentor


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'subscription_type', 'is_active', 'date_joined')
    list_filter = ('user_type', 'subscription_type', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'subscription_type', 'premium_expires_at', 'email_verified')}),
    )


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'institution_name', 'field_of_study', 'academic_year')
    list_filter = ('institution_name', 'field_of_study', 'academic_year')
    search_fields = ('name', 'user__email', 'institution_name', 'student_id')


@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'job_role', 'organization_name', 'is_verified')
    list_filter = ('job_role', 'organization_name', 'is_verified', 'years_of_experience')
    search_fields = ('name', 'user__email', 'organization_name', 'job_role')
    search_fields = ('user__username', 'user__email', 'bio')
