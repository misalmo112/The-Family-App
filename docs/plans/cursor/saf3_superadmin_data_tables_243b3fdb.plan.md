---
name: SAF3 Superadmin Data Tables
overview: "Implement 5 MUI table pages in /frontend/src/pages/Superadmin with admin service API calls: Users, Families, Error Logs, Audit Logs, and Feedback pages. Each page includes search, table display, and action dialogs. Backend API endpoints will be created in admin_panel app."
todos:
  - id: backend-views
    content: Create admin_panel/views.py with all API views (users, families, error logs, audit logs, feedback)
    status: completed
  - id: backend-urls
    content: Create admin_panel/urls.py and add to config/urls.py
    status: completed
  - id: backend-serializer
    content: Add SystemErrorLogSerializer to serializers.py
    status: completed
  - id: frontend-service
    content: Create services/admin.js with all API functions
    status: completed
  - id: users-page
    content: Create Superadmin/Users.jsx with search, table, and action dialogs
    status: completed
  - id: families-page
    content: Create Superadmin/Families.jsx with search, table, and suspend/unsuspend actions
    status: completed
  - id: error-logs-page
    content: Create Superadmin/ErrorLogs.jsx with table and details drawer
    status: completed
  - id: audit-logs-page
    content: Create Superadmin/AuditLogs.jsx with read-only table
    status: completed
  - id: feedback-page
    content: Create Superadmin/Feedback.jsx with table and status update action
    status: completed
  - id: app-routes
    content: Add Superadmin routes to App.jsx
    status: completed
---

# SAF3 — Data Tables + Actions Implementation Plan

## Overview

Implement 5 superadmin pages with MUI tables for managing users, families, error logs, audit logs, and feedback. All pages will be in `/frontend/src/pages/Superadmin` and use `src/services/admin.js` for API calls.

## Backend Implementation

### 1. Create Admin Panel Views

**File:** `family-app/backend/apps/admin_panel/views.py` (NEW)

Create API views for:
- **UsersListView**: GET `/api/admin/users/` with search query param `q`
- **UserDisableView**: POST `/api/admin/users/{id}/disable/` (requires reason)
- **UserSuperadminToggleView**: POST `/api/admin/users/{id}/toggle-superadmin/`
- **FamiliesListView**: GET `/api/admin/families/` with search query param `q`
- **FamilySuspendView**: POST `/api/admin/families/{id}/suspend/` (requires reason)
- **FamilyUnsuspendView**: POST `/api/admin/families/{id}/unsuspend/`
- **ErrorLogsListView**: GET `/api/admin/error-logs/`
- **AuditLogsListView**: GET `/api/admin/audit-logs/`
- **FeedbackListView**: GET `/api/admin/feedback/`
- **FeedbackStatusUpdateView**: PATCH `/api/admin/feedback/{id}/status/`

All views require `IsSuperAdmin` permission from `apps.admin_panel.permissions`.

### 2. Create Admin Panel URLs

**File:** `family-app/backend/apps/admin_panel/urls.py` (NEW)

Define URL patterns:
- `users/` → UsersListView
- `users/<int:pk>/disable/` → UserDisableView
- `users/<int:pk>/toggle-superadmin/` → UserSuperadminToggleView
- `families/` → FamiliesListView
- `families/<int:pk>/suspend/` → FamilySuspendView
- `families/<int:pk>/unsuspend/` → FamilyUnsuspendView
- `error-logs/` → ErrorLogsListView
- `audit-logs/` → AuditLogsListView
- `feedback/` → FeedbackListView
- `feedback/<int:pk>/status/` → FeedbackStatusUpdateView

### 3. Update Root URLs

**File:** `family-app/backend/config/urls.py` (MODIFY)

Add: `path('api/admin/', include('apps.admin_panel.urls'))`

### 4. Create SystemErrorLog Serializer

**File:** `family-app/backend/apps/admin_panel/serializers.py` (MODIFY)

Add `SystemErrorLogSerializer` with fields: `id`, `created_at`, `level`, `message`, `endpoint`, `status_code`, `traceback`, `payload_sanitized`.

## Frontend Implementation

### 5. Create Admin Service

**File:** `family-app/frontend/src/services/admin.js` (NEW)

Create API functions:
- `getUsers(q)` - GET `/api/admin/users/?q={q}`
- `disableUser(id, reason)` - POST `/api/admin/users/{id}/disable/`
- `toggleSuperadmin(id)` - POST `/api/admin/users/{id}/toggle-superadmin/`
- `getFamilies(q)` - GET `/api/admin/families/?q={q}`
- `suspendFamily(id, reason)` - POST `/api/admin/families/{id}/suspend/`
- `unsuspendFamily(id)` - POST `/api/admin/families/{id}/unsuspend/`
- `getErrorLogs()` - GET `/api/admin/error-logs/`
- `getAuditLogs()` - GET `/api/admin/audit-logs/`
- `getFeedback()` - GET `/api/admin/feedback/`
- `updateFeedbackStatus(id, status)` - PATCH `/api/admin/feedback/{id}/status/`

### 6. Create Superadmin Pages Directory

**Directory:** `family-app/frontend/src/pages/Superadmin/` (NEW)

### 7. Users Page

**File:** `family-app/frontend/src/pages/Superadmin/Users.jsx` (NEW)

Features:
- Search box with `q` parameter
- MUI Table with columns: `id`, `username`, `is_active`, `is_superadmin`, `last_login`, `date_joined`, `families_count`
- Actions column with:
  - "Disable User" button → opens Dialog asking for reason
  - "Make Superadmin" / "Revoke Superadmin" button → shows confirmation dialog
- Refresh list after actions

### 8. Families Page

**File:** `family-app/frontend/src/pages/Superadmin/Families.jsx` (NEW)

Features:
- Search box with `q` parameter
- MUI Table with columns: `id`, `name`, `member_count`, `created_at`, `suspended`
- Actions column with:
  - "Suspend" / "Unsuspend" button → shows Dialog asking for reason (on suspend)
- Refresh list after actions

### 9. Error Logs Page

**File:** `family-app/frontend/src/pages/Superadmin/ErrorLogs.jsx` (NEW)

Features:
- MUI Table with columns: `created_at`, `level`, `message`, `endpoint`, `status_code`
- Clickable rows → opens Drawer/Dialog showing:
  - `traceback` (formatted)
  - `payload_sanitized` (formatted JSON)

### 10. Audit Logs Page

**File:** `family-app/frontend/src/pages/Superadmin/AuditLogs.jsx` (NEW)

Features:
- MUI Table with columns: `created_at`, `actor_user_id`, `action_type`, `entity_type`, `entity_id`, `family_id`
- Read-only display (no actions)

### 11. Feedback Page

**File:** `family-app/frontend/src/pages/Superadmin/Feedback.jsx` (NEW)

Features:
- MUI Table with columns: `created_at`, `type`, `status`, `title`, `page`
- Actions column with:
  - Status dropdown/select: `NEW`, `IN_PROGRESS`, `RESOLVED`
- Refresh list after status update

### 12. Update App Routes

**File:** `family-app/frontend/src/App.jsx` (MODIFY)

Add routes under protected route:
- `/superadmin/users` → Users page
- `/superadmin/families` → Families page
- `/superadmin/error-logs` → ErrorLogs page
- `/superadmin/audit-logs` → AuditLogs page
- `/superadmin/feedback` → Feedback page

## Implementation Details

### MUI Table Structure

Use MUI `Table`, `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell` components (not DataGrid) for consistency with existing codebase.

### Dialog Components

- Use MUI `Dialog` for action confirmations
- Use MUI `TextField` for reason input
- Use MUI `Drawer` or `Dialog` for error log details

### Error Handling

- Show Snackbar notifications for success/error
- Handle 401 errors (redirect to login)
- Display error messages from API responses

### Loading States

- Show CircularProgress while fetching data
- Disable action buttons during API calls
- Use loading state per row for individual actions

## Files to Create/Modify

**Backend:**
- `family-app/backend/apps/admin_panel/views.py` (NEW)
- `family-app/backend/apps/admin_panel/urls.py` (NEW)
- `family-app/backend/config/urls.py` (MODIFY)
- `family-app/backend/apps/admin_panel/serializers.py` (MODIFY - add SystemErrorLogSerializer)

**Frontend:**
- `family-app/frontend/src/services/admin.js` (NEW)
- `family-app/frontend/src/pages/Superadmin/Users.jsx` (NEW)
- `family-app/frontend/src/pages/Superadmin/Families.jsx` (NEW)
- `family-app/frontend/src/pages/Superadmin/ErrorLogs.jsx` (NEW)
- `family-app/frontend/src/pages/Superadmin/AuditLogs.jsx` (NEW)
- `family-app/frontend/src/pages/Superadmin/Feedback.jsx` (NEW)
- `family-app/frontend/src/App.jsx` (MODIFY)