---
name: Revert Multi-Tenancy Features
overview: Complete revert of all Core system multi-tenancy features including models, services, views, frontend pages, migrations, and related code changes. This will restore the codebase to its pre-multi-tenancy state.
todos:
  - id: rollback_migrations
    content: Rollback all multi-tenancy migrations for user_accounts, common, and company_management apps
    status: completed
  - id: revert_idbasemodel
    content: Remove organization field and TENANT_ISOLATED flag from IDBaseModel
    status: completed
  - id: revert_models
    content: Revert UserRole, Role, Organization, Branch, and common models - remove organization fields and TENANT_ISOLATED flags
    status: completed
  - id: delete_mt_models
    content: Delete AuditLog, UserInvite, and ImpersonationSession models from user_accounts/models.py
    status: completed
  - id: delete_services
    content: Delete all new service files (organization_service, branch_service, user_service, invite_service, audit_service, superadmin_service, dashboard_service)
    status: completed
  - id: delete_views
    content: Delete all new view files (organization_views, branch_views, user_views, invite_views, audit_views, superadmin_views, dashboard_views)
    status: completed
  - id: revert_serializers
    content: Remove multi-tenancy fields and logic from serializers, delete new serializer classes
    status: completed
  - id: revert_urls
    content: Remove multi-tenancy URL routes from user_accounts/urls.py, delete company_management/urls.py, remove include from main urls.py
    status: completed
  - id: delete_utils
    content: Delete tenant_context.py, remove AUDIT_VIEW and other MT permissions from permissions.py
    status: completed
  - id: delete_signals
    content: Delete signals.py file and revert apps.py to remove signal registration
    status: completed
  - id: revert_settings
    content: Change user_accounts app config back to simple string in settings.py
    status: completed
  - id: revert_existing_views
    content: Remove audit logging and organization logic from RegisterUserView, LoginView, LogoutView
    status: completed
  - id: delete_frontend_pages
    content: Delete all new frontend pages (Organization, Branch, User, UserInvite, AuditLog, TenantList, Impersonate)
    status: completed
  - id: delete_frontend_hooks
    content: Delete all new frontend API hooks (useOrganizationAPI, useBranchAPI, useUserAPI, useAuditLogAPI, useSuperadminAPI, useDashboardAPI)
    status: completed
  - id: revert_frontend_routes
    content: Remove multi-tenancy routes from adminRouteConfig.jsx
    status: completed
  - id: revert_navigation
    content: Remove multi-tenancy sections from AdminSidebar and revert icons.js
    status: completed
  - id: revert_frontend_utils
    content: Remove multi-tenancy endpoints from enums.js, remove grid columns, revert AuthContext and authUtils
    status: completed
  - id: revert_translations
    content: Remove multi-tenancy translation keys from en.json
    status: completed
  - id: delete_test_files
    content: Delete all Phase test directories (Phase1_Test through Phase8_Test)
    status: completed
  - id: verify_cleanup
    content: Search codebase for remaining multi-tenancy references and verify application runs without errors
    status: completed
---

# Revert Multi-Tenancy Features Plan

## Overview

This plan will systematically revert all multi-tenancy changes made to the codebase, including:

- Database schema changes (via migration rollback)
- Backend models, services, views, serializers
- Frontend pages, hooks, routes, and navigation
- Utility functions and permissions
- Test files

## Phase 1: Database Migration Rollback

### 1.1 Rollback Multi-Tenancy Migrations

- Rollback `user_accounts` migrations:
- `0005_make_userinvite_organization_required.py`
- `0004_make_organization_required.py`
- `0003_assign_users_to_organizations.py`
- `0002_role_organization_userrole_organization_and_more.py`
- Rollback `common` migrations:
- `0004_city_organization_country_organization_and_more.py` (if exists)
- Rollback `company_management` migrations related to organization field additions (if any)

**Command**: `python manage.py migrate user_accounts <previous_migration>` and similar for other apps

## Phase 2: Backend Model Revert

### 2.1 Revert IDBaseModel

**File**: `InteriorDesign/model_base_class/IDBaseModel.py`

- Remove `organization` ForeignKey field (lines 22-30)
- Remove `TENANT_ISOLATED` class variable (line 11)

### 2.2 Revert UserRole Model

**File**: `InteriorDesign/user_accounts/models.py`

- Remove `organization` ForeignKey field (lines 32-40)
- Remove `clean()` method that validates branch-organization relationship (lines 51-58)
- Remove `get_tenant_organization()` method (lines 60-62)

### 2.3 Revert Role Model

**File**: `InteriorDesign/user_accounts/models.py`

- Remove `TENANT_ISOLATED = False` (line 12)

### 2.4 Remove Multi-Tenancy Models

**File**: `InteriorDesign/user_accounts/models.py`

- Remove `AuditLog` model (lines 79-179)
- Remove `UserInvite` model (lines 180-238)
- Remove `ImpersonationSession` model (lines 241+)

### 2.5 Revert Organization Model

**File**: `InteriorDesign/company_management/models.py`

- Remove `TENANT_ISOLATED = False` (line 10)
- Remove `organization = None` override (line 13)

### 2.6 Revert Branch Model

**File**: `InteriorDesign/company_management/models.py`

- Remove `TENANT_ISOLATED = True` (line 39)
- Note: Keep `organization` FK if it existed before multi-tenancy (verify original model)

### 2.7 Revert Common Models

**File**: `InteriorDesign/common/models.py`

- Remove `TENANT_ISOLATED = False` from:
- `Currency` (line 9)
- `Country` (line 25)
- `State` (line 38)
- `City` (line 66)

## Phase 3: Delete Backend Service Files

### 3.1 Delete New Service Files

- `InteriorDesign/company_management/organization_service.py`
- `InteriorDesign/company_management/branch_service.py`
- `InteriorDesign/user_accounts/user_service.py`
- `InteriorDesign/user_accounts/invite_service.py`
- `InteriorDesign/user_accounts/audit_service.py`
- `InteriorDesign/user_accounts/superadmin_service.py`
- `InteriorDesign/user_accounts/dashboard_service.py`

## Phase 4: Delete Backend View Files

### 4.1 Delete New View Files

- `InteriorDesign/company_management/organization_views.py`
- `InteriorDesign/company_management/branch_views.py`
- `InteriorDesign/user_accounts/user_views.py`
- `InteriorDesign/user_accounts/invite_views.py`
- `InteriorDesign/user_accounts/audit_views.py`
- `InteriorDesign/user_accounts/superadmin_views.py`
- `InteriorDesign/user_accounts/dashboard_views.py`

## Phase 5: Revert Backend Serializers

### 5.1 Revert UserRoleSerializer

**File**: `InteriorDesign/user_accounts/serializers.py`

- Remove `organization_id` and `organization_name` fields (lines 90-97)
- Remove audit logging calls in `create()` and `update()` methods
- Remove imports: `AuditService`, `UserInvite`, `AuditLog`, `ImpersonationSession`

### 5.2 Revert CustomTokenObtainPairSerializer

**File**: `InteriorDesign/user_accounts/serializers.py`

- Remove `organization_id` from token payload (line 26)
- Remove impersonation logic (lines 31-42)
- Remove `ImpersonationSession` import

### 5.3 Remove New Serializers

**File**: `InteriorDesign/user_accounts/serializers.py`

- Remove `UserInviteSerializer`
- Remove `UserInviteAcceptSerializer`
- Remove `AuditLogSerializer`
- Remove `OrganizationStatsSerializer`
- Remove `ImpersonationSessionSerializer`

### 5.4 Revert OrganizationSerializer

**File**: `InteriorDesign/company_management/serializers.py`

- Verify if `country_id` and `state_id` fields existed before (may need to keep if they were original)
- Remove any tenant-related logic if added

### 5.5 Revert BranchSerializer

**File**: `InteriorDesign/company_management/serializers.py`

- Verify original structure (may have had `organization_id` before multi-tenancy)

## Phase 6: Revert Backend URLs

### 6.1 Revert user_accounts URLs

**File**: `InteriorDesign/user_accounts/urls.py`

- Remove imports: `user_views`, `invite_views`, `audit_views`, `superadmin_views`, `dashboard_views`
- Remove router registrations for `UserViewSet`, `UserInviteViewSet` (lines 19-20)
- Remove URL patterns:
- User CRUD routes (lines 31-32)
- User Invite routes (lines 34-36)
- Audit Log routes (line 39)
- Dashboard routes (line 42)
- Superadmin routes (lines 45-48)

### 6.2 Delete company_management URLs

**File**: `InteriorDesign/company_management/urls.py`

- Delete entire file (if it didn't exist before multi-tenancy)

### 6.3 Revert Main URLs

**File**: `InteriorDesign/interior_design/urls.py`

- Remove `company_management.urls` include (line 10)

## Phase 7: Delete Backend Utility Files

### 7.1 Delete Tenant Context

**File**: `InteriorDesign/utils/tenant_context.py`

- Delete entire file

### 7.2 Revert Permissions

**File**: `InteriorDesign/utils/permissions.py`

- Remove `AUDIT_VIEW` permission (line 97)
- Remove Organization permissions (lines 13-16) if they didn't exist before
- Remove Branch permissions (lines 19-22) if they didn't exist before
- Remove User permissions (lines 25-30) if they didn't exist before

## Phase 8: Revert Backend Signals and Apps

### 8.1 Delete Signals

**File**: `InteriorDesign/user_accounts/signals.py`

- Delete entire file (if it didn't exist before)

### 8.2 Revert Apps Config

**File**: `InteriorDesign/user_accounts/apps.py`

- Remove signal registration (lines 8-10)
- Revert to simple `AppConfig` or remove file if it didn't exist before

### 8.3 Revert Settings

**File**: `InteriorDesign/interior_design/settings.py`

- Change `"user_accounts.apps.UserAccountsConfig"` back to `"user_accounts"` (line 43)

## Phase 9: Revert Backend Views (Existing Files)

### 9.1 Revert RegisterUserView

**File**: `InteriorDesign/user_accounts/views.py`

- Remove organization assignment logic
- Remove audit logging calls
- Revert to original user creation flow

### 9.2 Revert LoginView/LogoutView

**File**: `InteriorDesign/user_accounts/views.py`

- Remove audit logging calls for LOGIN/LOGOUT actions

## Phase 10: Delete Frontend Pages

### 10.1 Delete Admin Pages

- `my-app/src/pages/admin/Organization/` (entire directory)
- `my-app/src/pages/admin/Branch/` (entire directory)
- `my-app/src/pages/admin/User/` (entire directory)
- `my-app/src/pages/admin/UserInvite/` (entire directory)
- `my-app/src/pages/admin/AuditLog/` (entire directory)

### 10.2 Delete Superadmin Pages

- `my-app/src/pages/superadmin/TenantListPage.jsx`
- `my-app/src/pages/superadmin/ImpersonatePage.jsx`
- `my-app/src/pages/superadmin/` (entire directory if empty)

### 10.3 Revert SuperAdminLanding

**File**: `my-app/src/pages/admin/Landing/SuperAdminLanding.jsx`

- Remove multi-tenancy feature cards
- Revert to original structure

## Phase 11: Delete Frontend Hooks

### 11.1 Delete API Hooks

- `my-app/src/hooks/useOrganizationAPI.js`
- `my-app/src/hooks/useBranchAPI.js`
- `my-app/src/hooks/useUserAPI.js` (or revert if it existed before)
- `my-app/src/hooks/useAuditLogAPI.js`
- `my-app/src/hooks/useSuperadminAPI.js`
- `my-app/src/hooks/useDashboardAPI.js`

## Phase 12: Revert Frontend Routes

### 12.1 Revert Admin Routes

**File**: `my-app/src/routes/adminRouteConfig.jsx`

- Remove routes for:
- Organization
- Branch
- User (if new)
- UserInvite
- AuditLog
- TenantList
- Impersonate

## Phase 13: Revert Frontend Navigation

### 13.1 Revert Admin Sidebar

**File**: `my-app/src/components/Layout/admin/AdminSidebar.jsx`

- Remove multi-tenancy navigation sections:
- "Organization Management"
- "User Management" (if new)
- "System Management"
- "Superadmin Console"
- Revert to original navigation structure
- Remove `useAuthContext` import and usage if only used for multi-tenancy

### 13.2 Revert Icons

**File**: `my-app/src/utils/icons.js`

- Remove icon mappings:
- `AUDIT`, `SUPERADMIN`, `ORGANIZATION`, `BRANCH`, `INVITE`, `TENANT`, `IMPERSONATE`
- Remove from `IconMappings.SIDEBAR` and `IconMappings.ADMIN_LANDING`

## Phase 14: Revert Frontend Utilities

### 14.1 Revert Enums

**File**: `my-app/src/utils/enums.js`

- Remove multi-tenancy endpoints:
- Organization endpoints
- Branch endpoints
- User Invite endpoints
- Audit Log endpoints
- Superadmin endpoints
- Dashboard endpoints
- Remove `DASHBOARD_STATS` from `apiEndpoint` (if added)

### 14.2 Revert Grid Columns

**File**: `my-app/src/utils/gridColumns.js`

- Remove `getOrganizationGridColumns()` function
- Remove `getBranchGridColumns()` function (if new)
- Remove `getUserGridColumns()` function (if new)
- Remove `getAuditLogGridColumns()` function
- Remove `address` and `phone` from Organization columns if they were added

### 14.3 Revert Auth Context

**File**: `my-app/src/context/AuthContext.jsx`

- Remove `organizationId`, `organizationName` from context
- Remove `isImpersonating`, `impersonatedBy` from context

### 14.4 Revert Auth Utils

**File**: `my-app/src/utils/authUtils.js`

- Remove `organizationId`, `organizationName` from `decodeTokenPayload`
- Remove impersonation fields parsing

## Phase 15: Revert Frontend Translations

### 15.1 Revert Locales

**File**: `my-app/src/locales/en.json`

- Remove multi-tenancy translation keys:
- Organization management keys
- Branch management keys
- User invite keys
- Audit log keys
- Superadmin console keys
- Dashboard keys
- Field labels added for multi-tenancy (`address_label`, `phone_label`, etc.)

## Phase 16: Delete Test Files

### 16.1 Delete Phase Test Files

- `InteriorDesign/Test/Phase1_Test/` (entire directory)
- `InteriorDesign/Test/Phase2_Test/` (entire directory)
- `InteriorDesign/Test/Phase3_Test/` (entire directory)
- `InteriorDesign/Test/Phase4_Test/` (entire directory)
- `InteriorDesign/Test/Phase5_Test/` (entire directory)
- `InteriorDesign/Test/Phase6_Test/` (entire directory)
- `InteriorDesign/Test/Phase7_Test/` (entire directory)
- `InteriorDesign/Test/Phase8_Test/` (entire directory)

## Phase 17: Verification and Cleanup

### 17.1 Verify No Remaining References

- Search codebase for:
- `TENANT_ISOLATED`
- `tenant_context`
- `AuditService`
- `UserInvite`
- `ImpersonationSession`
- `organization_id` (in contexts where it was added for multi-tenancy)

### 17.2 Test Application

- Run Django server and verify no import errors
- Run frontend and verify no broken imports
- Test basic functionality (login, user management if it existed before)

### 17.3 Database Verification

- Verify migration rollback was successful
- Check that `organization` columns are removed from tables