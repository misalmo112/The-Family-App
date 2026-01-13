from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Permission class to check if user is a superadmin.
    
    Allows access only to authenticated users with is_superadmin=True.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, "is_superadmin", False)
        )
