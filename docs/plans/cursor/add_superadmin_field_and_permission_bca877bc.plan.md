---
name: Add Superadmin Field and Permission
overview: Add is_superadmin boolean field to User model, create migration, register User in Django admin with is_superadmin field, and create IsSuperAdmin permission class in core app.
todos:
  - id: add-field
    content: Add is_superadmin boolean field to User model in accounts/models.py
    status: completed
  - id: create-migration
    content: Create migration for is_superadmin field using makemigrations
    status: completed
  - id: create-admin
    content: Create admin.py file to register User model with is_superadmin in list_display
    status: completed
  - id: create-permission
    content: Create permissions.py in core app with IsSuperAdmin permission class
    status: completed
---

# Phase SA-0: Superadmin Role + Permission

## Overview
Add `is_superadmin` boolean field to the User model, create a migration, configure Django admin to display and edit the field, and create a DRF permission class for superadmin access control.

## Implementation Details

### 1. Add `is_superadmin` Field to User Model
**File:** `family-app/backend/apps/accounts/models.py`

- Add boolean field: `is_superadmin = models.BooleanField(default=False)`
- Field will be added to the existing `User(AbstractUser)` class

### 2. Create Migration
**File:** `family-app/backend/apps/accounts/migrations/0002_user_is_superadmin.py` (NEW)

- Generate migration using Django's migration system
- Migration will add the `is_superadmin` field to the User table

### 3. Register User in Django Admin
**File:** `family-app/backend/apps/accounts/admin.py` (NEW)

- Create admin.py file (currently doesn't exist)
- Import `User` model and `admin` from `django.contrib`
- Register `User` with `list_display` including `is_superadmin`
- Allow editing `is_superadmin` in admin interface

### 4. Create IsSuperAdmin Permission Class
**File:** `family-app/backend/apps/core/permissions.py` (NEW)

- Create permissions.py file in core app
- Import `BasePermission` from `rest_framework.permissions`
- Implement `IsSuperAdmin` class:
  ```python
  class IsSuperAdmin(BasePermission):
      def has_permission(self, request, view):
          return bool(
              request.user and 
              request.user.is_authenticated and 
              getattr(request.user, "is_superadmin", False)
          )
  ```

## Files to Create
- `family-app/backend/apps/accounts/admin.py`
- `family-app/backend/apps/core/permissions.py`
- `family-app/backend/apps/accounts/migrations/0002_user_is_superadmin.py` (via makemigrations)

## Files to Modify
- `family-app/backend/apps/accounts/models.py`

## Acceptance Criteria
- Migration applies successfully
- `is_superadmin` field appears in Django admin User list
- `is_superadmin` can be edited from Django admin
- `IsSuperAdmin` permission class can be imported and used in views