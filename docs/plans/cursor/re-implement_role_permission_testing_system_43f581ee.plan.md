---
name: Re-implement Role Permission Testing System
overview: Re-implement the complete role and permission testing system that was previously created but reverted. This includes recreating the permission system infrastructure, test suite, setup scripts, and documentation to verify that normal users can view but cannot create Currency, Country, and State resources.
todos:
  - id: recreate-permissions-file
    content: Create utils/permissions.py with PermissionCode enum and PERMISSION_GROUPS dictionary, including normal_user view-only permissions
    status: completed
  - id: complete-permission-checkers
    content: Add HasPermission() and IsAdminOrHasPermission() factory functions to utils/user_permission.py
    status: completed
    dependencies:
      - recreate-permissions-file
  - id: update-currency-views
    content: Update CurrencyCreateView and CurrencyUpdateView to use IsAdminOrHasPermission permission checks
    status: completed
    dependencies:
      - complete-permission-checkers
  - id: update-country-views
    content: Update CountryCreateView and CountryUpdateView to use IsAdminOrHasPermission permission checks
    status: completed
    dependencies:
      - complete-permission-checkers
  - id: update-state-views
    content: Update StateCreateView and StateUpdateView to use IsAdminOrHasPermission permission checks
    status: completed
    dependencies:
      - complete-permission-checkers
  - id: create-test-structure
    content: Create Test/RolePermissionTests/__init__.py and ensure directory structure exists
    status: completed
  - id: create-test-suite
    content: Create comprehensive pytest test suite with fixtures and 10 test cases for currency, country, and state permissions
    status: completed
    dependencies:
      - create-test-structure
      - update-currency-views
      - update-country-views
      - update-state-views
  - id: create-setup-script
    content: Create setup_test_user.py script to create test user and role with proper dependency handling
    status: completed
    dependencies:
      - create-test-structure
      - recreate-permissions-file
  - id: create-documentation
    content: Create README.md with test scenario documentation, architecture explanation, and manual testing guide
    status: completed
    dependencies:
      - create-test-structure
  - id: create-results-template
    content: Create TEST_RESULTS.md template for documenting test execution results
    status: completed
    dependencies:
      - create-test-structure
---

# Re-implement Role Perm

ission Testing System

## Overview

This plan re-implements the complete role and permission testing system that validates the permission enforcement for Currency, Country, and State modules. The system will verify that users with the `normal_user` role can view these resources but cannot create them.

## Current State Analysis

- ✅ `UserRole` model exists with `get_all_permissions()` method
- ✅ `Role` model exists with JSON permissions field
- ❌ `utils/permissions.py` was deleted (needs recreation)
- ❌ `utils/user_permission.py` is incomplete (missing permission checkers)
- ❌ Views are using basic `IsAuthenticated` (need permission checks)
- ❌ Test folder structure exists but is empty
- ❌ No test scripts or documentation

## Implementation Steps

### 1. Recreate Permission System Infrastructure

**File**: `InteriorDesign/utils/permissions.py`

- Create `PermissionCode` enum with all permission constants
- Include: `COUNTRY_VIEW`, `COUNTRY_CREATE`, `STATE_VIEW`, `STATE_CREATE`, `CURRENCY_VIEW`, `CURRENCY_CREATE`
- Include other existing permissions (ORG, BRANCH, USER, ROLE, etc.)
- Create `PERMISSION_GROUPS` dictionary with predefined role permissions
- `superadmin`: `{"all_access": True}`
- `admin`: Full permissions for all modules
- `normal_user`: View-only permissions for Currency, Country, State (no create permissions)

### 2. Complete Permission Checker Functions

**File**: `InteriorDesign/utils/user_permission.py`

- Add `HasPermission(permission_code)` factory function
- Returns permission class that checks specific permission code
- Handles superuser bypass
- Checks `all_access` flag
- Validates specific permission from `get_all_permissions()`
- Add `IsAdminOrHasPermission(permission_code)` factory function
- Similar to `HasPermission` but with clearer naming
- Used in views for admin-level operations

### 3. Update Views to Use Permission Checks

**Files to Update**:

- `InteriorDesign/common/currency_views.py`
- `CurrencyCreateView`: Add `IsAdminOrHasPermission(PermissionCode.CURRENCY_CREATE)`
- `CurrencyUpdateView`: Add `IsAdminOrHasPermission(PermissionCode.CURRENCY_UPDATE)`
- `InteriorDesign/common/country_views.py`
- `CountryCreateView`: Add `IsAdminOrHasPermission(PermissionCode.COUNTRY_CREATE)`
- `CountryUpdateView`: Add `IsAdminOrHasPermission(PermissionCode.COUNTRY_UPDATE)`
- `InteriorDesign/common/state_views.py`
- `StateCreateView`: Add `IsAdminOrHasPermission(PermissionCode.STATE_CREATE)`
- `StateUpdateView`: Add `IsAdminOrHasPermission(PermissionCode.STATE_UPDATE)`

### 4. Create Test Folder Structure

**Location**: `InteriorDesign/Test/RolePermissionTests/`

- Create `__init__.py` file
- Ensure directory exists for test files

### 5. Create Comprehensive Test Suite

**File**: `InteriorDesign/Test/RolePermissionTests/test_role_permissions.py`

- Create pytest test class `TestRolePermissions`
- Test fixtures:
- `api_client`: APIClient instance
- `branch`: Test branch with Organization dependencies
- `normal_user_role`: Role with view-only permissions
- `test_user`: User with normal_user role
- `authenticated_client`: JWT-authenticated API client
- Sample data fixtures (currency, country, state)
- Test cases (10 total):
- Currency: list (200), detail (200), create forbidden (403)
- Country: list (200), detail (200), create forbidden (403)
- State: list (200), create forbidden (403)
- Permission verification: has view permissions, lacks create permissions

### 6. Create Setup Script

**File**: `InteriorDesign/Test/RolePermissionTests/setup_test_user.py`

- Standalone script to create test user and role
- Handle Organization/Branch dependencies (use existing or create minimal)
- Create `normal_user` role with correct permissions
- Create test user: `testnormaluser@example.com` / `testpass123`
- Display permission verification
- Handle Unicode encoding for Windows console

### 7. Create Documentation

**File**: `InteriorDesign/Test/RolePermissionTests/README.md`

- Document test scenario and expected behavior
- Explain permission system architecture
- Provide setup instructions
- Include manual testing guide with API examples
- Troubleshooting section

### 8. Create Test Results Template

**File**: `InteriorDesign/Test/RolePermissionTests/TEST_RESULTS.md`

- Template for documenting test execution
- Sections for each test case
- Manual testing checklist
- Issues tracking
- Conclusion section

## Key Implementation Details

### Permission System Flow

1. User makes API request with JWT token
2. Django REST Framework authenticates user
3. View's `permission_classes` are checked
4. `IsAdminOrHasPermission.has_permission()` is called
5. Checks: authentication → superuser → all_access → specific permission
6. `get_all_permissions()` merges role + user permissions
7. Returns True/False → allows or denies request (403)

### Normal User Permissions

```python
"normal_user": {
    PermissionCode.COUNTRY_VIEW: True,
    PermissionCode.STATE_VIEW: True,
    PermissionCode.CURRENCY_VIEW: True,
    # No CREATE permissions
}
```



### Test Scenarios

- ✅ GET `/api/admin/currencies/` → 200 OK
- ✅ GET `/api/admin/currencies/{id}/` → 200 OK
- ❌ POST `/api/admin/currency/create` → 403 Forbidden
- ✅ GET `/api/admin/countries/` → 200 OK
- ✅ GET `/api/admin/countries/{id}/` → 200 OK
- ❌ POST `/api/admin/countries/create` → 403 Forbidden
- ✅ GET `/api/admin/states/` → 200 OK
- ❌ POST `/api/admin/state/create` → 403 Forbidden

## Files to Create/Modify

### Create:

1. `InteriorDesign/utils/permissions.py` - Permission codes and groups
2. `InteriorDesign/Test/RolePermissionTests/__init__.py` - Package init
3. `InteriorDesign/Test/RolePermissionTests/test_role_permissions.py` - Test suite
4. `InteriorDesign/Test/RolePermissionTests/setup_test_user.py` - Setup script
5. `InteriorDesign/Test/RolePermissionTests/README.md` - Documentation
6. `InteriorDesign/Test/RolePermissionTests/TEST_RESULTS.md` - Results template

### Modify:

1. `InteriorDesign/utils/user_permission.py` - Add permission checker functions
2. `InteriorDesign/common/currency_views.py` - Add permission checks to create/update views
3. `InteriorDesign/common/country_views.py` - Add permission checks to create/update views
4. `InteriorDesign/common/state_views.py` - Add permission checks to create/update views

## Expected Outcomes

- Permission system infrastructure fully functional
- All views enforce proper permission checks
- Test suite validates permission enforcement
- Normal users can view but cannot create Currency, Country, State
- All 10 tests pass successfully
- Complete documentation for future reference

## Dependencies

- Django 5.2.6
- Django REST Framework