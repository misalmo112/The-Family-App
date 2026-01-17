---
name: Enforce Family Suspension in Permission Checks
overview: Create permission functions `require_member` and `require_admin` in `backend/apps/families/services/permissions.py` that check if a family is suspended via `AdminFamilyFlag.suspended` and block access accordingly. Regular endpoints block all users (including superadmins) when suspended, while admin APIs allow superadmins but block regular admins.
todos:
  - id: create_permissions_module
    content: Create backend/apps/families/services/permissions.py with require_member and require_admin functions
    status: completed
  - id: implement_safe_import
    content: Implement safe import of AdminFamilyFlag with try/except ImportError
    status: completed
  - id: implement_require_member
    content: Implement require_member function that checks membership and blocks all users (including superadmins) if family is suspended
    status: completed
  - id: implement_require_admin
    content: Implement require_admin function that checks admin status and allows superadmins to bypass suspension for admin operations
    status: completed
  - id: add_suspension_check
    content: Add suspension check logic that queries AdminFamilyFlag.suspended for the family
    status: completed
---

# Enforce Family Suspension in Permission Checks

## Overview

Create permission checking functions that enforce family suspension status. When a family is suspended (`AdminFamilyFlag.suspended == True`), access should be blocked for non-superadmin users. Superadmins can still access admin APIs but are blocked from regular endpoints (feed/topology) for suspended families.

## Current State

- Permission checks are currently done inline in views (e.g., `is_family_member`, `is_family_admin` in `apps/graph/views.py`)
- No centralized permission service exists
- `AdminFamilyFlag` model location is unknown (will use safe import)
- User model has `is_superadmin` field in `apps/accounts/models.py`

## Implementation

### 1. Create Permission Service Module

**File**: `family-app/backend/apps/families/services/permissions.py` (NEW)

Create a new permissions module with two main functions:

- `require_member(user, family)` - Ensures user is a member and family is not suspended
- `require_admin(user, family)` - Ensures user is admin and family is not suspended (or user is superadmin)

**Key Requirements:**
- Import `AdminFamilyFlag` safely with try/except ImportError
- Check `AdminFamilyFlag.suspended == True` for the family
- If suspended:
  - `require_member`: Block all users (including superadmins) - raise `PermissionDenied("Family is suspended")`
  - `require_admin`: Block regular admins, but allow superadmins (for admin panel access)
- Use `django.core.exceptions.PermissionDenied` for errors
- Check user's `is_superadmin` field from `apps.accounts.models.User`

**Function Signatures:**
```python
def require_member(user, family):
    """
    Ensure user is a member of the family and family is not suspended.
    Raises PermissionDenied if user is not a member or family is suspended.
    """
    
def require_admin(user, family):
    """
    Ensure user is an admin of the family and family is not suspended.
    Superadmins can bypass suspension check for admin operations.
    Raises PermissionDenied if user is not admin or family is suspended (unless superadmin).
    """
```

### 2. Suspension Check Logic

**For `require_member`:**
1. Check if user is a member via `FamilyMembership`
2. Check if family is suspended via `AdminFamilyFlag`
3. If suspended, raise `PermissionDenied` for ALL users (including superadmins)

**For `require_admin`:**
1. Check if user is an admin via `FamilyMembership`
2. Check if user is superadmin (`user.is_superadmin`)
3. If superadmin, allow access (bypass suspension check)
4. If not superadmin, check if family is suspended
5. If suspended, raise `PermissionDenied` for regular admins

### 3. Safe Import Pattern

Since `AdminFamilyFlag` location is unknown, use safe import:

```python
try:
    from apps.core.models import AdminFamilyFlag
except ImportError:
    try:
        from apps.families.models import AdminFamilyFlag
    except ImportError:
        # AdminFamilyFlag not found - assume no suspension feature
        AdminFamilyFlag = None
```

When `AdminFamilyFlag` is None, skip suspension checks (backward compatibility).

### 4. Integration Points

These functions will be used in:
- `apps/graph/views.py` - PersonView, TopologyView, RelationshipView
- `apps/feed/views.py` - PostListView, PostCreateView
- `apps/families/views.py` - FamilyView, JoinRequest views
- Any other views that check family membership

## Files to Create/Modify

1. **NEW**: `family-app/backend/apps/families/services/permissions.py`
   - Implement `require_member(user, family)`
   - Implement `require_admin(user, family)`
   - Safe import of `AdminFamilyFlag`
   - Helper function to check suspension status

## Testing Considerations

- Test `require_member` with suspended family (should block all users)
- Test `require_admin` with suspended family (should block regular admins, allow superadmins)
- Test with non-existent `AdminFamilyFlag` (should work without errors)
- Test with non-suspended family (should work normally)
- Test with non-member/non-admin users (should raise PermissionDenied)

## Notes

- The functions should be reusable decorators or utility functions
- Consider making them usable as decorators for view methods
- Error messages should be clear: "Family is suspended"
- Superadmin access to admin APIs is preserved, but regular endpoints are blocked even for superadmins