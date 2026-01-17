---
name: Superadmin routing guard layout
overview: Add superadmin section to frontend with service layer, route guard, layout component, and route integration. Creates admin service API client, SuperadminGuard for authorization checks, SuperadminLayout with sidebar navigation, and integrates all routes into the main router.
todos:
  - id: create-admin-service
    content: Create src/services/admin.js with all required API methods using shared axios client
    status: completed
  - id: create-superadmin-guard
    content: Create SuperadminGuard component that checks authorization via getHealth() and shows Not Authorized page on 403
    status: completed
  - id: create-superadmin-layout
    content: Create SuperadminLayout component with MUI Drawer sidebar and navigation links
    status: completed
  - id: create-placeholder-pages
    content: Create placeholder page components for all superadmin routes
    status: completed
  - id: integrate-routes
    content: Add superadmin routes to App.jsx with SuperadminGuard and SuperadminLayout
    status: completed
---

# Phase SAF-1: Superadmin Routing + Guard + Layout

## Overview

This plan implements the superadmin section in the frontend, including API service layer, route protection, layout component, and route integration.

## Components

### 1. Admin Service (`src/services/admin.js`)

Create a new service file following the pattern from `services/families.js`, using the shared axios client from `services/api.js`. The service will include:

- `getHealth()` - Health check endpoint for authorization verification
- `getStats(days)` - System statistics
- `listUsers(params)` - List users with pagination/filtering
- `disableUser(id, reason)` - Disable a user account
- `makeSuperadmin(id)` - Grant superadmin privileges
- `revokeSuperadmin(id)` - Revoke superadmin privileges
- `listFamilies(params)` - List all families
- `suspendFamily(id, reason)` - Suspend a family
- `unsuspendFamily(id)` - Unsuspend a family
- `listErrorLogs(params)` - List system error logs
- `getErrorLog(id)` - Get specific error log details
- `listAuditLogs(params)` - List audit trail entries
- `listFeedback(params)` - List user feedback
- `updateFeedbackStatus(id, status)` - Update feedback status

All methods will use the shared `api` instance which automatically includes authentication tokens.

### 2. SuperadminGuard (`src/routes/SuperadminGuard.jsx`)

Create a guard component similar to `ProtectedRoute.jsx` that:

- Wraps superadmin routes
- On mount/navigation, calls `admin.getHealth()` to verify superadmin status
- If response is 200 → allows access
- If response is 403 → shows a clean "Not Authorized" page (no redirect loops)
- Shows loading state while checking
- Uses `useLocation` to detect route changes

The guard should prevent redirect loops by showing a static error page instead of redirecting.

### 3. SuperadminLayout (`src/components/SuperadminLayout.jsx`)

Create a layout component similar to `AppShell.jsx` that:

- Uses MUI `Drawer` for left sidebar (permanent on desktop, temporary on mobile)
- Uses MUI `List` for navigation items
- Includes navigation links for:
- Dashboard (`/superadmin`)
- Health (`/superadmin/health`)
- Users (`/superadmin/users`)
- Families (`/superadmin/families`)
- Error Logs (`/superadmin/logs/errors`)
- Audit Logs (`/superadmin/logs/audit`)
- Feedback (`/superadmin/feedback`)
- Main content area with `Outlet` for nested routes
- Responsive design (mobile drawer toggle, desktop permanent sidebar)
- Active route highlighting using `useLocation`

### 4. Route Integration (`src/App.jsx`)

Add new routes to the router:

- `/superadmin` - Dashboard (index route)
- `/superadmin/health` - Health check page
- `/superadmin/users` - User management page
- `/superadmin/families` - Family management page
- `/superadmin/logs/errors` - Error logs page
- `/superadmin/logs/audit` - Audit logs page
- `/superadmin/feedback` - Feedback management page

All routes should be wrapped with `SuperadminGuard` and use `SuperadminLayout` as the parent layout.

### 5. Placeholder Pages

Create minimal placeholder page components for each route (or they can be created in later phases):

- `src/pages/Superadmin/Dashboard.jsx`
- `src/pages/Superadmin/Health.jsx`
- `src/pages/Superadmin/Users.jsx`
- `src/pages/Superadmin/Families.jsx`
- `src/pages/Superadmin/ErrorLogs.jsx`
- `src/pages/Superadmin/AuditLogs.jsx`
- `src/pages/Superadmin/Feedback.jsx`

Each placeholder should display a simple heading indicating the page purpose.

## Implementation Details

### API Endpoint Assumptions

The service methods assume backend endpoints at:

- `GET /api/admin/health/` - Health check
- `GET /api/admin/stats/?days={days}` - Statistics
- `GET /api/admin/users/` - List users
- `POST /api/admin/users/{id}/disable/` - Disable user
- `POST /api/admin/users/{id}/make-superadmin/` - Grant superadmin
- `POST /api/admin/users/{id}/revoke-superadmin/` - Revoke superadmin
- `GET /api/admin/families/` - List families
- `POST /api/admin/families/{id}/suspend/` - Suspend family
- `POST /api/admin/families/{id}/unsuspend/` - Unsuspend family
- `GET /api/admin/logs/errors/` - List error logs
- `GET /api/admin/logs/errors/{id}/` - Get error log
- `GET /api/admin/logs/audit/` - List audit logs
- `GET /api/admin/feedback/` - List feedback
- `PATCH /api/admin/feedback/{id}/` - Update feedback status

### Error Handling

- The guard should handle 403 errors gracefully without redirect loops
- Service methods should throw errors that can be caught by consuming components
- The "Not Authorized" page should be a simple, clean component with no navigation

### Styling

- Follow existing MUI theme patterns
- Use consistent drawer width (280px) matching `AppShell`
- Use MUI icons for navigation items (Dashboard, Health, People, FamilyRestroom, Error, History, Feedback)

## Files to Create/Modify

**New Files:**

- `family-app/frontend/src/services/admin.js`
- `family-app/frontend/src/routes/SuperadminGuard.jsx`
- `family-app/frontend/src/components/SuperadminLayout.jsx`
- `family-app/frontend/src/pages/Superadmin/Dashboard.jsx`
- `family-app/frontend/src/pages/Superadmin/Health.jsx`
- `family-app/frontend/src/pages/Superadmin/Users.jsx`
- `family-app/frontend/src/pages/Superadmin/Families.jsx`
- `family-app/frontend/src/pages/Superadmin/ErrorLogs.jsx`
- `family-app/frontend/src/pages/Superadmin/AuditLogs.jsx`
- `family-app/frontend/src/pages/Superadmin/Feedback.jsx`

**Modified Files:**

- `family-app/frontend/src/App.jsx` - Add superadmin routes

## Acceptance Criteria

- `/superadmin` pages are reachable when user has superadmin privileges
- Non-superadmin users see "Not Authorized" page (no redirect loops)
- Layout displays sidebar navigation with all routes
- All service methods are implemented and use shared axios client
- Routes are properly nested and protected