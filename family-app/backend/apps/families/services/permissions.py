"""
Permission checking functions for family access control.

This module provides functions to enforce family membership and admin permissions,
with support for family suspension checks via AdminFamilyFlag.
"""
from django.core.exceptions import PermissionDenied
from apps.families.models import FamilyMembership


# Safe import of AdminFamilyFlag - try multiple locations
try:
    from apps.core.models import AdminFamilyFlag
except ImportError:
    try:
        from apps.families.models import AdminFamilyFlag
    except ImportError:
        # AdminFamilyFlag not found - assume no suspension feature
        AdminFamilyFlag = None


def _is_family_suspended(family):
    """
    Check if a family is suspended via AdminFamilyFlag.
    
    Args:
        family: Family instance to check
        
    Returns:
        bool: True if family is suspended, False otherwise
        Returns False if AdminFamilyFlag doesn't exist (backward compatibility)
    """
    if AdminFamilyFlag is None:
        # No suspension feature available
        return False
    
    try:
        flag = AdminFamilyFlag.objects.get(family=family)
        return flag.suspended
    except AdminFamilyFlag.DoesNotExist:
        # No flag exists, family is not suspended
        return False


def require_member(user, family):
    """
    Ensure user is a member of the family and family is not suspended.
    
    This function checks:
    1. User has an active membership in the family
    2. Family is not suspended (blocks ALL users including superadmins if suspended)
    
    Args:
        user: User instance
        family: Family instance
        
    Raises:
        PermissionDenied: If user is not a member or family is suspended
    """
    # Check if user is a member of the family
    try:
        membership = FamilyMembership.objects.get(
            user=user,
            family=family,
            status=FamilyMembership.Status.ACTIVE
        )
    except FamilyMembership.DoesNotExist:
        raise PermissionDenied("You must be a member of this family")
    
    # Check if family is suspended
    if _is_family_suspended(family):
        # Block ALL users including superadmins for regular endpoints
        raise PermissionDenied("Family is suspended")
    
    return membership


def require_admin(user, family):
    """
    Ensure user is an admin of the family and family is not suspended.
    
    Superadmins can bypass suspension check for admin operations (admin panel access).
    Regular admins are blocked if family is suspended.
    
    This function checks:
    1. User has an active admin membership in the family OR user is superadmin
    2. If not superadmin, family must not be suspended
    
    Args:
        user: User instance
        family: Family instance
        
    Raises:
        PermissionDenied: If user is not admin or family is suspended (unless superadmin)
    """
    # Check if user is superadmin
    is_superadmin = getattr(user, 'is_superadmin', False)
    
    if is_superadmin:
        # Superadmins can access admin APIs even if family is suspended
        return True
    
    # For regular users, check admin membership
    try:
        membership = FamilyMembership.objects.get(
            user=user,
            family=family,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        )
    except FamilyMembership.DoesNotExist:
        raise PermissionDenied("Only family admins can perform this action")
    
    # Check if family is suspended (only for regular admins)
    if _is_family_suspended(family):
        raise PermissionDenied("Family is suspended")
    
    return membership
