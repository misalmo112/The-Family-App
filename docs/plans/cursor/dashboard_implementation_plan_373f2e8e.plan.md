---
name: Dashboard Implementation Plan
overview: Create dashboards for org admin and normal users, plus create two test users linked to Alpha Computer LLC organization. The dashboards will show role-appropriate statistics and information.
todos:
  - id: backend-dashboard-service
    content: Create DashboardService class in dashboard_service.py with get_dashboard_stats method that returns role-appropriate data
    status: completed
  - id: backend-dashboard-views
    content: Create DashboardStatsView API endpoint with permission checks (DASHBOARD_VIEW for all, DASHBOARD_ADMIN for admin stats)
    status: completed
  - id: backend-dashboard-urls
    content: Add dashboard/stats/ route to user_accounts/urls.py
    status: completed
  - id: frontend-dashboard-hook
    content: Create useDashboardAPI hook following existing hook patterns (useAPI, useFetchApi)
    status: completed
  - id: frontend-dashboard-page
    content: Create DashboardPage component with role-based rendering (admin vs normal user)
    status: completed
  - id: frontend-dashboard-styles
    content: Create DashboardPage.module.css with card-based layout for stats
    status: completed
  - id: frontend-route-update
    content: Update RouteConfig.jsx to use DashboardPage component instead of placeholder
    status: completed
  - id: frontend-enums-update
    content: Add DASHBOARD_STATS endpoint constant to enums.js
    status: completed
  - id: create-users-script
    content: Create create_dashboard_users.py script to create org admin and normal user for Alpha Computer LLC
    status: completed
---

# Dashboard Implementation Plan

## Overview
Create role-based dashboards for organization admin and normal users, following the existing code structure. Also create two test users (one org admin, one normal user) linked to the Alpha Computer LLC organization.

## Architecture

### Backend Components

1. **Dashboard API Endpoint** (`InteriorDesign/user_accounts/dashboard_views.py`)
   - Create `DashboardStatsView` that returns different data based on user role
   - Org admin sees: total users, branches, active users, recent activity
   - Normal user sees: personal info, limited org stats (view-only)
   - Use permission checks: `DASHBOARD_ADMIN` for admin features, `DASHBOARD_VIEW` for basic access

2. **Dashboard Service** (`InteriorDesign/user_accounts/dashboard_service.py`)
   - `DashboardService.get_dashboard_stats(user)` - aggregates stats based on role
   - Filters data by user's organization (tenant isolation)

3. **URL Configuration** (`InteriorDesign/user_accounts/urls.py`)
   - Add route: `path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats')`

### Frontend Components

1. **Dashboard Page** (`my-app/src/pages/Dashboard/DashboardPage.jsx`)
   - Single component that renders different content based on user role
   - Uses `useAuthContext()` to check if user has "admin" role
   - Shows admin dashboard if `user.roles.includes('admin')`, otherwise normal user dashboard

2. **Dashboard Hook** (`my-app/src/hooks/useDashboardAPI.js`)
   - `getDashboardStats()` - fetches dashboard data from backend
   - Uses existing `useAPI()` and `useFetchApi()` patterns

3. **Route Update** (`my-app/src/routes/RouteConfig.jsx`)
   - Replace placeholder `<div>Dashboard Page</div>` with `<DashboardPage />`

4. **Dashboard Styles** (`my-app/src/pages/Dashboard/DashboardPage.module.css`)
   - Card-based layout for stats
   - Responsive grid for admin dashboard
   - Simple layout for normal user dashboard

### User Creation

1. **Create User Script** (`InteriorDesign/create_dashboard_users.py`)
   - Script to create two users for Alpha Computer LLC:
     - **Org Admin User**: email `orgadmin@alphacomputer.com`, role "admin"
     - **Normal User**: email `normaluser@alphacomputer.com`, role "normal_user"
   - Both users linked to Alpha Computer LLC organization
   - Uses existing branch "Alpha Computer LLC HQ"

## Implementation Details

### Backend Dashboard Stats Structure

**For Org Admin:**
```python
{
    "organization": {...},
    "total_users": 10,
    "active_users": 8,
    "total_branches": 3,
    "recent_activity": [...],
    "user_role": "admin"
}
```

**For Normal User:**
```python
{
    "organization": {...},
    "user_info": {...},
    "user_role": "normal_user"
}
```

### Frontend Dashboard Layout

**Admin Dashboard:**
- Header with organization name
- Stats cards: Total Users, Active Users, Branches
- Recent Activity section
- Quick links to admin pages

**Normal User Dashboard:**
- Welcome message with user name
- Organization info
- Personal info card
- Limited stats (view-only)

### Files to Create/Modify

**Backend:**
- `InteriorDesign/user_accounts/dashboard_views.py` (new)
- `InteriorDesign/user_accounts/dashboard_service.py` (new)
- `InteriorDesign/user_accounts/urls.py` (modify - add dashboard route)
- `InteriorDesign/create_dashboard_users.py` (new - user creation script)

**Frontend:**
- `my-app/src/pages/Dashboard/DashboardPage.jsx` (new)
- `my-app/src/pages/Dashboard/DashboardPage.module.css` (new)
- `my-app/src/hooks/useDashboardAPI.js` (new)
- `my-app/src/routes/RouteConfig.jsx` (modify - update dashboard route)
- `my-app/src/utils/enums.js` (modify - add dashboard endpoint constant)

## Permission Checks

- Backend: Use `HasPermission(PermissionCode.DASHBOARD_VIEW)` for basic access
- Backend: Use `HasPermission(PermissionCode.DASHBOARD_ADMIN)` for admin stats
- Frontend: Check `user.roles.includes('admin')` to show admin features

## Testing

1. Run user creation script to create test users
2. Login as org admin and verify admin dashboard displays
3. Login as normal user and verify normal user dashboard displays
4. Verify tenant isolation (users only see their org's data)