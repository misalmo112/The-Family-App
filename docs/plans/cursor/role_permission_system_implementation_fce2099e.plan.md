---
name: Role Permission System Implementation
overview: Implement a complete role-based permission system following the existing code structure patterns. This includes permission constants, enhanced permission classes, role management APIs, and updating existing views to use the new permission system.
todos:
  - id: create-permissions
    content: Create utils/permissions.py with PermissionCode enum and PERMISSION_GROUPS dictionary
    status: completed
  - id: enhance-permissions
    content: Enhance utils/user_permission.py with HasPermission and IsAdminOrHasPermission classes
    status: completed
    dependencies:
      - create-permissions
  - id: update-initial-data
    content: Update load_initial_data.py to create admin and normal_user roles with proper permissions
    status: completed
    dependencies:
      - create-permissions
  - id: create-role-service
    content: Create user_accounts/role_service.py following existing service pattern
    status: completed
  - id: create-role-serializer
    content: Add RoleSerializer to user_accounts/serializers.py extending IDBaseModelSerializer
    status: completed
  - id: create-role-views
    content: Create user_accounts/role_views.py with RoleViewSet, RoleCreateView, and RoleUpdateView
    status: completed
    dependencies:
      - create-role-service
      - create-role-serializer
      - enhance-permissions
  - id: add-role-urls
    content: Update user_accounts/urls.py to add role management endpoints with router
    status: completed
    dependencies:
      - create-role-views
  - id: update-existing-views
    content: Update country_views.py, currency_views.py, and state_views.py to use new permission classes
    status: completed
    dependencies:
      - enhance-permissions
---

# Role & Permission System Implementation

## Overview
Implement Priority 1: Complete Role & Permission System following existing code patterns (IDBaseModel, service layer, DRF views, etc.)

## Implementation Steps

### Step 1: Create Permission Constants
**File:** `InteriorDesign/utils/permissions.py` (NEW)
- Define `PermissionCode` enum with all module permissions (ORG_CREATE, USER_CREATE, RFQ_CREATE, etc.)
- Create `PERMISSION_GROUPS` dictionary mapping role types to permission dictionaries
- Include permissions for: Organization, Branch, User, Role, Master Data (Country/State/Currency), and future modules (RFQ, PO, Invoice, etc.)

### Step 2: Enhance Permission Classes
**File:** `InteriorDesign/utils/user_permission.py` (MODIFY)
- Keep existing `IsSuperAdmin` and `IsAuthenticated` classes
- Add `HasPermission(BasePermission)` class that checks specific permission codes
- Add `IsAdminOrHasPermission(BasePermission)` class for superadmin OR permission-based access
- Both new classes should check `user.get_all_permissions()` and respect superadmin bypass

### Step 3: Update Initial Data Script
**File:** `InteriorDesign/load_initial_data.py` (MODIFY)
- Import `PERMISSION_GROUPS` from `utils.permissions`
- Update role creation section to create three roles:
  - `superadmin` with `{"all_access": True}`
  - `admin` with `PERMISSION_GROUPS["admin"]`
  - `normal_user` with `PERMISSION_GROUPS["normal_user"]`
- Use `get_or_create` pattern and update permissions if role exists
- Ensure roles have proper `code` and `name` fields (following IDBaseModel pattern)

### Step 4: Create Role Service
**File:** `InteriorDesign/user_accounts/role_service.py` (NEW)
- Follow existing service pattern (like `CountryService`)
- Methods: `get_queryset()`, `list_roles(role_type=None)`, `get_role_by_id(id)`, `get_role_by_code(code)`, `create_role(validated_data)`, `update_role(id, validated_data)`
- Add `get_role_permissions(role_type)` helper method

### Step 5: Create Role Serializer
**File:** `InteriorDesign/user_accounts/serializers.py` (MODIFY)
- Add `RoleSerializer` class extending `IDBaseModelSerializer`
- Include fields: all IDBaseModel fields + `role`, `role_display`, `permissions`
- Add `validate_permissions()` to ensure permissions is a dict
- Mark `role_display` as read-only

### Step 6: Create Role Views
**File:** `InteriorDesign/user_accounts/role_views.py` (NEW)
- Create `RoleViewSet(viewsets.ReadOnlyModelViewSet)` with `IsAuthenticated` permission
- Add custom `active` action for filtering active roles
- Create `RoleCreateView(generics.CreateAPIView)` with `IsSuperAdmin` permission
- Create `RoleUpdateView(generics.UpdateAPIView)` with `IsSuperAdmin` permission
- Use `RoleService` for business logic
- Use `build_serialized_response` and `proccess_exception` utilities

### Step 7: Add Role URLs
**File:** `InteriorDesign/user_accounts/urls.py` (MODIFY)
- Import `DefaultRouter` and role views
- Create router and register `RoleViewSet` at `"admin/roles"`
- Add paths: `"admin/roles/create"` and `"admin/roles/<int:id>/update"`
- Keep existing user management URLs

### Step 8: Update Existing Views to Use New Permissions
**Files to modify:**
- `InteriorDesign/common/country_views.py`: Update `CountryCreateView` and `CountryUpdateView` to use `IsAdminOrHasPermission(PermissionCode.COUNTRY_CREATE)` and `IsAdminOrHasPermission(PermissionCode.COUNTRY_UPDATE)`
- `InteriorDesign/common/currency_views.py`: Update `CurrencyCreateView` and `CurrencyUpdateView` similarly
- `InteriorDesign/common/state_views.py`: Update `StateCreateView` and `StateUpdateView` similarly

### Step 9: Test and Verify
- Run migrations if needed: `python manage.py makemigrations` and `python manage.py migrate`
- Run initial data script: `python manage.py shell` → `from load_initial_data import run_initial_script` → `run_initial_script()`
- Test API endpoints:
  - `GET /api/admin/roles/` (should list all roles)
  - `GET /api/admin/roles/active/` (should list active roles)
  - `POST /api/admin/roles/create` (superadmin only)
  - `PUT /api/admin/roles/<id>/update` (superadmin only)

## Key Implementation Details

1. **Permission Structure**: Permissions stored as JSON in Role model, merged via `UserRole.get_all_permissions()`
2. **Permission Checking**: Views use permission classes that check `user.get_all_permissions()` dict
3. **Superadmin Bypass**: All permission classes allow superadmin access regardless of permissions
4. **Code Patterns**: Follow existing patterns (IDBaseModel, service layer, DRF views, utility functions)
5. **URL Structure**: Follow existing pattern (`/api/admin/...` for admin endpoints)

## Files Created
- `InteriorDesign/utils/permissions.py`
- `InteriorDesign/user_accounts/role_service.py`
- `InteriorDesign/user_accounts/role_views.py`

## Files Modified
- `InteriorDesign/utils/user_permission.py`
- `InteriorDesign/load_initial_data.py`
- `InteriorDesign/user_accounts/serializers.py`
- `InteriorDesign/user_accounts/urls.py`
- `InteriorDesign/common/country_views.py`
- `InteriorDesign/common/currency_views.py`
- `InteriorDesign/common/state_views.py`