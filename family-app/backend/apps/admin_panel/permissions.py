from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permission class that checks if user is a superadmin"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superadmin
        )
