from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(UserAdmin):
    """Admin configuration for User model"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superadmin', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_superadmin', 'date_joined')
    fieldsets = UserAdmin.fieldsets + (
        ('Superadmin', {'fields': ('is_superadmin',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Superadmin', {'fields': ('is_superadmin',)}),
    )
