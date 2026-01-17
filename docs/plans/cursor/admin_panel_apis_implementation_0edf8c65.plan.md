---
name: Admin Panel APIs Implementation
overview: Implement comprehensive admin APIs in backend/apps/admin_panel with health checks, statistics, user management, family management, audit logs, error logs, and feedback management. All endpoints require IsSuperAdmin permission.
todos:
  - id: create-app-structure
    content: Create admin_panel app directory structure with __init__.py, apps.py
    status: completed
  - id: create-permissions
    content: Create IsSuperAdmin permission class in admin_panel/permissions.py
    status: completed
  - id: create-models
    content: Create AdminFamilyFlag, AuditLog, ErrorLog, Feedback models in admin_panel/models.py
    status: completed
  - id: create-serializers
    content: Create all serializers in admin_panel/serializers.py (UserList, UserAction, FamilyList, FamilyAction, ErrorLog, AuditLog, Feedback, FeedbackStatus, Stats)
    status: completed
  - id: create-health-stats-views
    content: Create HealthCheckView and StatsView in admin_panel/views.py
    status: completed
  - id: create-user-views
    content: Create UserListView, UserDisableView, UserMakeSuperadminView, UserRevokeSuperadminView
    status: completed
  - id: create-family-views
    content: Create FamilyListView, FamilySuspendView, FamilyUnsuspendView
    status: completed
  - id: create-log-views
    content: Create ErrorLogListView, ErrorLogDetailView, AuditLogListView
    status: completed
  - id: create-feedback-views
    content: Create FeedbackListView, FeedbackStatusUpdateView
    status: completed
  - id: create-urls
    content: Create admin_panel/urls.py with all route patterns and document all routes for Integrator
    status: completed
---

# Admin Panel APIs Implementation Plan

## Overview

Create a new `admin_panel` Django app with comprehensive admin APIs for system management. All endpoints will be protected by `IsSuperAdmin` permission and use DRF pagination.

## App Structure

Create `backend/apps/admin_panel/` with:
- `models.py` - AdminFamilyFlag, AuditLog, ErrorLog, Feedback models
- `serializers.py` - All serializers for admin endpoints
- `views.py` - All view classes
- `urls.py` - URL routing
- `permissions.py` - IsSuperAdmin permission class
- `services.py` - Business logic (optional, for complex operations)
- `apps.py` - App configuration
- `__init__.py` - Package init

## Models to Create

### 1. AdminFamilyFlag (`admin_panel/models.py`)
- `family_id` (ForeignKey to Family, unique=True)
- `suspended` (BooleanField, default=False)
- `reason` (TextField, blank=True)
- `updated_at` (DateTimeField, auto_now=True)
- Meta: unique_together on family_id

### 2. AuditLog (`admin_panel/models.py`)
- `user` (ForeignKey to AUTH_USER_MODEL)
- `action_type` (CharField with choices: USER_DISABLE, USER_MAKE_SUPERADMIN, USER_REVOKE_SUPERADMIN, FAMILY_SUSPEND, FAMILY_UNSUSPEND, etc.)
- `entity_type` (CharField) - e.g., 'User', 'Family'
- `entity_id` (BigIntegerField, null=True)
- `family_id` (ForeignKey to Family, null=True, blank=True)
- `changes` (JSONField, default=dict)
- `ip_address` (GenericIPAddressField, null=True)
- `user_agent` (TextField, blank=True)
- `timestamp` (DateTimeField, auto_now_add=True)

### 3. ErrorLog (`admin_panel/models.py`)
- `error_type` (CharField) - e.g., 'Exception', 'ValidationError'
- `message` (TextField)
- `traceback` (TextField, blank=True)
- `path` (CharField, max_length=500, blank=True)
- `method` (CharField, max_length=10, blank=True)
- `user_id` (ForeignKey to AUTH_USER_MODEL, null=True, blank=True)
- `family_id` (ForeignKey to Family, null=True, blank=True)
- `request_data` (JSONField, null=True, blank=True)
- `created_at` (DateTimeField, auto_now_add=True)

### 4. Feedback (`admin_panel/models.py`)
- `user` (ForeignKey to AUTH_USER_MODEL, null=True, blank=True)
- `type` (CharField with choices: BUG, FEATURE, GENERAL)
- `subject` (CharField, max_length=255)
- `message` (TextField)
- `status` (CharField with choices: PENDING, REVIEWED, RESOLVED, CLOSED)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

## Permission Class

### IsSuperAdmin (`admin_panel/permissions.py`)
```python
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superadmin
```

## Endpoints Implementation

### 1. Health Check
- **GET** `/api/admin/health/`
- Returns: `{"status": "ok", "time": "ISO", "db": "ok"|"down"}`
- Simple DB check: `from django.db import connection; connection.ensure_connection()`

### 2. Statistics
- **GET** `/api/admin/stats/?days=30`
- Returns counts with try/except for optional apps:
  - `users_total`
  - `users_active_24h` (last_login in last 24h)
  - `users_active_7d`
  - `families_total`
  - `families_created_last_7d`
  - `posts_last_7d` (if feed.Post exists)
  - `join_requests_pending` (if families.JoinRequest exists)

### 3. User Management
- **GET** `/api/admin/users/?q=&page=` - Paginated list with search
  - Fields: id, username, is_active, is_superadmin, date_joined, last_login, families_count
- **POST** `/api/admin/users/<id>/disable/` - Disable user
  - Body: `{"reason": "..."}`
  - Sets `is_active=False`
  - Creates AuditLog with action_type `USER_DISABLE`
- **POST** `/api/admin/users/<id>/make-superadmin/` - Grant superadmin
  - Creates AuditLog with action_type `USER_MAKE_SUPERADMIN`
- **POST** `/api/admin/users/<id>/revoke-superadmin/` - Revoke superadmin
  - Creates AuditLog with action_type `USER_REVOKE_SUPERADMIN`

### 4. Family Management
- **GET** `/api/admin/families/?q=&page=` - Paginated list with search
  - Fields: id, name, created_at, created_by_user_id, member_count, suspended (from AdminFamilyFlag)
- **POST** `/api/admin/families/<id>/suspend/` - Suspend family
  - Body: `{"reason": "..."}`
  - Creates/updates AdminFamilyFlag
  - Creates AuditLog with action_type `FAMILY_SUSPEND`
- **POST** `/api/admin/families/<id>/unsuspend/` - Unsuspend family
  - Updates AdminFamilyFlag
  - Creates AuditLog with action_type `FAMILY_UNSUSPEND`

### 5. Error Logs
- **GET** `/api/admin/logs/errors/?q=&page=&since_hours=`
  - Filter by query (icontains on message), since_hours
- **GET** `/api/admin/logs/errors/<id>/` - Single error log detail

### 6. Audit Logs
- **GET** `/api/admin/logs/audit/?page=&action_type=&entity_type=&family_id=`
  - Filter by action_type, entity_type, family_id

### 7. Feedback Management
- **GET** `/api/admin/feedback/?page=&status=&type=`
  - Filter by status, type
- **POST** `/api/admin/feedback/<id>/status/`
  - Body: `{"status": "PENDING"|"REVIEWED"|"RESOLVED"|"CLOSED"}`

## Serializers

Create serializers in `admin_panel/serializers.py`:
- `UserListSerializer` - For user list (exclude sensitive fields)
- `UserActionSerializer` - For disable action (reason field)
- `FamilyListSerializer` - For family list (metadata only)
- `FamilyActionSerializer` - For suspend/unsuspend (reason field)
- `ErrorLogSerializer` - For error logs
- `AuditLogSerializer` - For audit logs
- `FeedbackSerializer` - For feedback
- `FeedbackStatusSerializer` - For status updates
- `StatsSerializer` - For statistics response

## Views

All views in `admin_panel/views.py`:
- Use `IsSuperAdmin` permission class
- Use DRF pagination (PageNumberPagination)
- Implement query filtering with `icontains` where applicable
- Use try/except for optional app imports (feed, families)
- Do NOT expose post contents or person names

## URL Configuration

Create `admin_panel/urls.py` with all routes:
- Health, stats, users (list, disable, make-superadmin, revoke-superadmin)
- Families (list, suspend, unsuspend)
- Logs (errors list, error detail, audit list)
- Feedback (list, status update)

## Files to Create

1. `backend/apps/admin_panel/__init__.py`
2. `backend/apps/admin_panel/apps.py`
3. `backend/apps/admin_panel/models.py`
4. `backend/apps/admin_panel/permissions.py`
5. `backend/apps/admin_panel/serializers.py`
6. `backend/apps/admin_panel/views.py`
7. `backend/apps/admin_panel/urls.py`
8. `backend/apps/admin_panel/migrations/__init__.py` (will be auto-generated)

## Integration Notes

- Add `'apps.admin_panel'` to `INSTALLED_APPS` in `config/settings.py` (NOT in this phase per instructions)
- Add `path('api/admin/', include('apps.admin_panel.urls'))` to `config/urls.py` (NOT in this phase per instructions)
- All endpoints use `/api/admin/` prefix
- Use DRF's `PageNumberPagination` for pagination
- All date filtering uses timezone-aware datetime

## Key Implementation Details

1. **Database Health Check**: Use `connection.ensure_connection()` and catch `OperationalError`
2. **Optional App Handling**: Wrap feed.Post and families.JoinRequest imports in try/except
3. **Family Suspension**: Check AdminFamilyFlag for suspended status, create if doesn't exist
4. **Audit Logging**: Create AuditLog entries for all admin actions (disable, superadmin changes, suspensions)
5. **Query Filtering**: Use `Q` objects for complex filtering with `icontains` for text search
6. **Pagination**: Use DRF's `PageNumberPagination` with default page size (e.g., 20)
7. **Time Filtering**: Use `timezone.now() - timedelta(hours=since_hours)` for error log filtering