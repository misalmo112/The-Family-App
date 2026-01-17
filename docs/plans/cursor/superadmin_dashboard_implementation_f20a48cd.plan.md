---
name: Superadmin Dashboard Implementation
overview: Create a superadmin dashboard page at `/superadmin` that displays system statistics and health status. The dashboard will fetch data from existing backend endpoints and display metrics in card format with proper loading and error handling.
todos: []
---

# Superadmin Dashboard Implementation Plan

## Overview
Create a dashboard page for superadmins at `/superadmin` route that displays system statistics and health monitoring. The page will fetch data from existing backend endpoints (`/api/admin/stats/` and `/api/admin/health/`) and display metrics in a card-based layout.

## Backend Endpoints (Already Exist)
- `GET /api/admin/stats/` - Returns statistics:
  - `users_total`
  - `users_active_24h`
  - `users_active_7d`
  - `families_total`
  - `families_created_last_7d`
  - `posts_last_7d`
  - `join_requests_pending`
- `GET /api/admin/health/` - Returns health status:
  - `status` (ok)
  - `time` (ISO timestamp)
  - `db` (ok/down)

**Note:** These endpoints require `IsSuperAdmin` permission and are located in `apps.admin_panel`. Ensure `/api/admin/` is included in `config/urls.py` if not already present.

## Implementation Steps

### 1. Create Admin Service (`family-app/frontend/src/services/admin.js`)
- Create service file following the pattern of `families.js` and `feed.js`
- Export functions:
  - `getDashboardStats()` - Fetch from `/api/admin/stats/`
  - `getHealthStatus()` - Fetch from `/api/admin/health/`
- Use the existing `api.js` axios instance (handles auth tokens automatically)

### 2. Create Dashboard Component (`family-app/frontend/src/pages/Superadmin/Dashboard.jsx`)
- Create the Superadmin folder and Dashboard.jsx file
- Component structure:
  - State management for stats, health, loading, and error
  - `useEffect` to fetch data on mount
  - Fetch both stats and health in parallel or sequentially
  - Display cards using Material-UI components:
    - **API/DB Status Card**: Show status from health endpoint (green for ok, red for down)
    - **Users Total Card**: Display `users_total`
    - **Active Users (7d) Card**: Display `users_active_7d`
    - **Families Total Card**: Display `families_total`
    - **Pending Join Requests Card**: Display `join_requests_pending`
    - **Posts Last 7d Card**: Display `posts_last_7d`
  - Loading state: Show CircularProgress while fetching
  - Error state: Show Alert with retry button
  - Use Grid layout for responsive card arrangement (similar to other pages)

### 3. Add Route (`family-app/frontend/src/App.jsx`)
- Add route for `/superadmin` inside the ProtectedRoute/AppShell
- Import Dashboard component
- Route should be: `<Route path="superadmin" element={<Dashboard />} />`

### 4. Optional: Add Navigation Link
- Consider adding superadmin dashboard link to AppShell navigation (only visible to superadmins)
- This is optional as the user didn't explicitly request it

## Component Design Patterns
- Follow patterns from existing pages like `Families.jsx` and `AdminJoinRequests/index.jsx`
- Use Material-UI components: Card, CardContent, Typography, Grid, CircularProgress, Alert, Button
- Handle errors gracefully with user-friendly messages
- Use consistent spacing and styling with the rest of the app

## Files to Create/Modify

### New Files:
1. `family-app/frontend/src/pages/Superadmin/Dashboard.jsx`
2. `family-app/frontend/src/services/admin.js`

### Files to Modify:
1. `family-app/frontend/src/App.jsx` - Add route

## Acceptance Criteria
- Dashboard accessible at `/superadmin`
- Dashboard displays real data from backend endpoints
- All required stat cards are visible
- Loading state works correctly
- Error state works correctly with retry functionality
- API/DB status card shows correct health status