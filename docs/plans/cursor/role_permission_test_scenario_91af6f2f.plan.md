---
name: Role Permission Test Scenario
overview: Create a comprehensive test scenario for the role and permission system. Update the normal_user role to have view-only permissions for currency, country, and state, then create test scripts and documentation to verify the permission system works correctly.
todos:
  - id: update-normal-user-permissions
    content: Update PERMISSION_GROUPS in permissions.py to add COUNTRY_VIEW, STATE_VIEW, and CURRENCY_VIEW to normal_user group
    status: completed
  - id: create-test-folder
    content: Create Test/RolePermissionTests directory structure
    status: completed
  - id: create-test-script
    content: Create pytest test script with fixtures and test cases for currency, country, and state permissions
    status: completed
    dependencies:
      - update-normal-user-permissions
      - create-test-folder
  - id: create-setup-script
    content: Create standalone setup script to create test user and role for manual testing
    status: completed
    dependencies:
      - update-normal-user-permissions
      - create-test-folder
  - id: create-documentation
    content: Create README.md with test scenario documentation and instructions
    status: completed
    dependencies:
      - create-test-folder
  - id: create-results-template
    content: Create TEST_RESULTS.md template for documenting test execution results
    status: completed
    dependencies:
      - create-test-folder
---

# Role and Permission System Test Scenario

## Overview
This plan creates a test scenario to verify the role and permission system works correctly. A normal user role will be configured with view-only permissions for Currency, Country, and State modules, and comprehensive tests will verify that users with this role can view but cannot create these resources.

## Current State Analysis
- The system uses a `Role` model with JSON-based permissions
- `UserRole` model merges role permissions via `get_all_permissions()`
- Permission checks use `IsAdminOrHasPermission()` factory function
- The `normal_user` role in `PERMISSION_GROUPS` currently lacks VIEW permissions for Currency, Country, and State
- Views use `IsAuthenticated` for list/view endpoints and `IsAdminOrHasPermission(PermissionCode.XXX_CREATE)` for create endpoints

## Implementation Steps

### 1. Update Normal User Permissions
**File**: `[InteriorDesign/utils/permissions.py](InteriorDesign/utils/permissions.py)`
- Add `COUNTRY_VIEW`, `STATE_VIEW`, and `CURRENCY_VIEW` permissions to the `normal_user` group in `PERMISSION_GROUPS`
- Ensure CREATE permissions are NOT included

### 2. Create Test Folder Structure
**Location**: `InteriorDesign/Test/RolePermissionTests/`
- Create directory structure for test files and documentation

### 3. Create Test Script
**File**: `InteriorDesign/Test/RolePermissionTests/test_role_permissions.py`
- Create pytest test class for role permission testing
- Test fixtures:
  - Create a normal_user role with view-only permissions
  - Create a test user with the normal_user role
  - Create authenticated API client for the test user
- Test cases:
  - **Currency Tests**: Verify user can list/view currencies but cannot create
  - **Country Tests**: Verify user can list/view countries but cannot create
  - **State Tests**: Verify user can list/view states but cannot create
- Each test should verify HTTP status codes (200 for view, 403 for create attempts)

### 4. Create Test Setup Script
**File**: `InteriorDesign/Test/RolePermissionTests/setup_test_user.py`
- Standalone script to create test user and role for manual testing
- Can be run independently to set up test data

### 5. Create Documentation
**File**: `InteriorDesign/Test/RolePermissionTests/README.md`
- Document the test scenario
- Explain the permission structure
- Provide instructions for running tests
- Document expected behavior

### 6. Create Test Results Template
**File**: `InteriorDesign/Test/RolePermissionTests/TEST_RESULTS.md`
- Template for documenting test execution results
- Include sections for each test case with pass/fail status
- Document any issues found

## Test Scenarios

### Scenario 1: Currency Permissions
- ✅ User can GET `/api/admin/currencies/` (should return 200)
- ✅ User can GET `/api/admin/currencies/{id}/` (should return 200)
- ❌ User cannot POST `/api/admin/currency/create` (should return 403)

### Scenario 2: Country Permissions
- ✅ User can GET `/api/admin/countries/` (should return 200)
- ✅ User can GET `/api/admin/countries/{id}/` (should return 200)
- ❌ User cannot POST `/api/admin/countries/create` (should return 403)

### Scenario 3: State Permissions
- ✅ User can GET `/api/admin/states/` (should return 200)
- ❌ User cannot POST `/api/admin/state/create` (should return 403)

## Files to Modify/Create

1. **Modify**: `InteriorDesign/utils/permissions.py` - Add view permissions to normal_user group
2. **Create**: `InteriorDesign/Test/RolePermissionTests/test_role_permissions.py` - Main test file
3. **Create**: `InteriorDesign/Test/RolePermissionTests/setup_test_user.py` - Setup script
4. **Create**: `InteriorDesign/Test/RolePermissionTests/README.md` - Documentation
5. **Create**: `InteriorDesign/Test/RolePermissionTests/TEST_RESULTS.md` - Results template

## Expected Outcomes
- Normal users can view Currency, Country, and State data
- Normal users receive 403 Forbidden when attempting to create Currency, Country, or State
- Test results are documented for review
- Permission system correctly enforces role-based access control