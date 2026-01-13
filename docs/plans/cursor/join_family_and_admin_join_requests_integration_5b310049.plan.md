---
name: Join Family and Admin Join Requests Integration
overview: Merge the Join Family page and Admin Join Requests features by updating the service function signature, adding the missing /join route, and adding the "Join Family" navbar link. Both pages already exist and work, but need proper routing and service integration.
todos:
  - id: fix-service-signature
    content: Update submitJoinRequest in families.js to accept object parameter matching JoinFamily page usage
    status: completed
  - id: add-join-route
    content: Add /join route in App.jsx inside AppShell routes
    status: completed
  - id: add-join-navbar-link
    content: Add 'Join Family' navbar link in AppShell.jsx before 'Join Requests'
    status: completed
  - id: verify-routes
    content: Verify both routes work, pages render, and no import errors
    status: completed
    dependencies:
      - fix-service-signature
      - add-join-route
      - add-join-navbar-link
---

# Join Family and Admin Join Requests Integration Plan

## Overview

Both pages (`JoinFamily` and `AdminJoinRequests`) already exist and are functional. This plan integrates them into the routing system and fixes the service function signature to match how the JoinFamily page calls it.

## Current State

### What Exists

- ✅ `JoinFamily` page component (`src/pages/JoinFamily/index.jsx`) - fully implemented
- ✅ `AdminJoinRequests` page component (`src/pages/AdminJoinRequests/index.jsx`) - fully implemented
- ✅ Service functions: `getJoinRequests`, `approveJoinRequest`, `rejectJoinRequest` exist
- ✅ `/admin/join-requests` route exists in App.jsx
- ✅ "Join Requests" navbar link exists in AppShell.jsx

### What's Missing

- ❌ `/join` route in App.jsx
- ❌ "Join Family" navbar link in AppShell.jsx
- ❌ `submitJoinRequest` service function signature mismatch (page calls it with object, service expects separate params)

## Implementation Steps

### 1. Fix Service Function Signature

**File:** [family-app/frontend/src/services/families.js](family-app/frontend/src/services/families.js)

Update `submitJoinRequest` to accept an object parameter matching how JoinFamily page calls it:

```javascript
export const submitJoinRequest = async ({ code, chosen_person_id, new_person_payload }) => {
  const payload = { code };
  if (chosen_person_id) payload.chosen_person_id = chosen_person_id;
  if (new_person_payload) payload.new_person_payload = new_person_payload;
  
  const response = await api.post('/api/families/join/', payload);
  return response.data;
};
```

**Current issue:** JoinFamily page calls `submitJoinRequest(payload)` with an object, but service expects `(code, newPersonPayload)`.

### 2. Add /join Route

**File:** [family-app/frontend/src/App.jsx](family-app/frontend/src/App.jsx)

Add the `/join` route inside the protected AppShell routes (same level as other routes):

```jsx
<Route path="join" element={<JoinFamily />} />
```

**Note:** The route should be inside the AppShell wrapper since it's a protected route that benefits from the navbar.

### 3. Add "Join Family" Navbar Link

**File:** [family-app/frontend/src/components/AppShell.jsx](family-app/frontend/src/components/AppShell.jsx)

Add "Join Family" button before "Join Requests" in the navbar:

```jsx
<Button color="inherit" component={Link} to="/join">
  Join Family
</Button>
<Button color="inherit" component={Link} to="/admin/join-requests">
  Join Requests
</Button>
```

### 4. Verify Protected Routes

Both routes are already protected:

- `/join` will be inside AppShell which is wrapped in ProtectedRoute
- `/admin/join-requests` is already inside AppShell (protected)

No additional route protection changes needed.

## Files to Modify

1. [family-app/frontend/src/services/families.js](family-app/frontend/src/services/families.js) - Update `submitJoinRequest` signature
2. [family-app/frontend/src/App.jsx](family-app/frontend/src/App.jsx) - Add `/join` route
3. [family-app/frontend/src/components/AppShell.jsx](family-app/frontend/src/components/AppShell.jsx) - Add "Join Family" navbar link

## Acceptance Criteria

- [ ] `submitJoinRequest` accepts object parameter `{ code, chosen_person_id?, new_person_payload? }`
- [ ] `/join` route works and renders JoinFamily page
- [ ] `/admin/join-requests` route works (already exists)
- [ ] "Join Family" link appears in navbar
- [ ] "Join Requests" link appears in navbar (already exists)
- [ ] Both routes require authentication (via ProtectedRoute wrapper)
- [ ] No import errors
- [ ] Pages render correctly
- [ ] Service uses shared `api` client from `services/api.js` (already correct)