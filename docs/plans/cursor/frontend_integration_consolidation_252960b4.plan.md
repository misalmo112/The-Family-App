---
name: Frontend Integration Consolidation
overview: Consolidate and integrate all frontend components into a single coherent structure with unified API client, context providers, services, and routing. Fix all import paths and ensure proper provider wiring.
todos:
  - id: create-api-service
    content: Create src/services/api.js with env var support and unified axios instance
    status: completed
  - id: create-families-service
    content: Create src/services/families.js with getFamilies function
    status: completed
    dependencies:
      - create-api-service
  - id: consolidate-contexts
    content: Move contexts/AuthContext.jsx to context/AuthContext.jsx and update all imports
    status: completed
  - id: update-service-imports
    content: Update feed.js and graph.js to import from services/api.js
    status: completed
    dependencies:
      - create-api-service
  - id: fix-family-switcher
    content: Update FamilySwitcher to use services/api.js and services/families.js
    status: completed
    dependencies:
      - create-families-service
  - id: wire-providers
    content: Add FamilyProvider to main.jsx wrapping the app
    status: completed
    dependencies:
      - consolidate-contexts
  - id: integrate-family-switcher
    content: Add FamilySwitcher component to AppShell navbar
    status: completed
    dependencies:
      - fix-family-switcher
  - id: implement-families-page
    content: Implement Families page with family selection functionality
    status: in_progress
    dependencies:
      - create-families-service
  - id: create-env-example
    content: Create .env.example with VITE_API_BASE_URL
    status: pending
  - id: fix-all-imports
    content: Fix all import paths for contexts and services across all files
    status: pending
    dependencies:
      - consolidate-contexts
      - update-service-imports
  - id: test-integration
    content: "Test all flows: login, family selection, feed, create post, topology"
    status: pending
    dependencies:
      - wire-providers
      - integrate-family-switcher
      - implement-families-page
---

# Frontend Integration Consolidation Plan

## Overview

Consolidate multiple frontend implementations into one coherent structure with unified API client, context providers, services, and routing. Fix all import paths, provider wiring, and ensure environment variable support.

## Current State Analysis

### Issues Identified

1. **Duplicate context directories**: `context/` and `contexts/` - need to consolidate to `context/`
2. **API client location**: `api/axios.js` exists but should be `services/api.js` with env var support
3. **Inconsistent token storage**: AuthContext uses `token`, FamilySwitcher uses `access_token`
4. **Missing services**: `services/families.js` and `services/api.js` don't exist
5. **Missing provider**: FamilyProvider not wrapped in `main.jsx`
6. **AppShell missing FamilySwitcher**: Navbar doesn't include family switcher component
7. **Families page is placeholder**: Needs to integrate FamilySelect functionality
8. **Missing env file**: No `.env.example` for API base URL configuration
9. **Service imports**: All services import from `api/axios.js` instead of unified `services/api.js`

## Integration Steps

### 1. Consolidate Contexts

- **Move** `contexts/AuthContext.jsx` → `context/AuthContext.jsx`
- **Keep** `context/FamilyContext.jsx` (already in correct location)
- **Update** all imports from `../contexts/AuthContext` to `../context/AuthContext`
- **Files to update**: `main.jsx`, `AppShell.jsx`, `ProtectedRoute.jsx`, `Login.jsx`

### 2. Create Unified API Client

- **Create** `src/services/api.js`:
  - Use `import.meta.env.VITE_API_BASE_URL` (default: `http://127.0.0.1:8000`)
  - Read token from `localStorage.getItem('token')` (not `access_token`)
  - Add request interceptor for Authorization header
  - Add response interceptor for 401 handling (logout + redirect)
- **Delete** `src/api/axios.js` after migration
- **Update** all service files to import from `services/api.js`

### 3. Create Families Service

- **Create** `src/services/families.js`:
  - `getFamilies()` → `GET /api/families/`
  - Use unified `api` from `services/api.js`

### 4. Update All Services

- **Update** `src/services/feed.js`: Change import from `../api/axios` to `./api`
- **Update** `src/services/graph.js`: Change import from `../api/axios` to `./api`

### 5. Fix FamilySwitcher

- **Update** `src/components/Layout/FamilySwitcher.jsx`:
  - Use `api` from `services/api.js` instead of direct axios
  - Use `services/families.js` for fetching families
  - Remove hardcoded API_BASE_URL

### 6. Wire Providers in main.jsx

- **Update** `src/main.jsx`:
  - Import `FamilyProvider` from `./context/FamilyContext`
  - Wrap app: `<AuthProvider><FamilyProvider><App /></FamilyProvider></AuthProvider>`

### 7. Integrate FamilySwitcher in AppShell

- **Update** `src/components/AppShell.jsx`:
  - Import `FamilySwitcher` from `./Layout/FamilySwitcher`
  - Add FamilySwitcher to Toolbar (before navigation buttons)
  - Only show if families exist (handle empty state gracefully)

### 8. Implement Families Page

- **Update** `src/pages/Families.jsx`:
  - Integrate FamilySelect functionality (or import from `FamilySelect/index.jsx`)
  - Fetch families using `services/families.js`
  - Display list with selection capability
  - On selection: call `setActiveFamily()` and navigate to `/feed`
  - Handle loading/error states

### 9. Create Environment Configuration

- **Create** `frontend/.env.example`:
  ```
  VITE_API_BASE_URL=http://127.0.0.1:8000
  ```

- **Update** `vite.config.js` if needed (should already work with env vars)

### 10. Fix All Import Paths

- **Update** all files importing from old paths:
  - `../api/axios` → `../services/api` or `./api` (depending on location)
  - `../contexts/AuthContext` → `../context/AuthContext`
  - Ensure all relative paths are correct

### 11. Add Route Protection for Family-Dependent Routes

- **Update** `src/routes/ProtectedRoute.jsx` or create enhanced version:
  - Check if route requires activeFamilyId (feed, topology, post)
  - If no activeFamilyId and route requires it → redirect to `/families`
  - Keep existing authentication check

### 12. Verify Token Consistency

- **Ensure** all code uses `localStorage.getItem('token')` (not `access_token`)
- **Update** FamilySwitcher if it uses wrong key

## File Structure After Integration

```
frontend/
├── .env.example
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx      (moved from contexts/)
│   │   └── FamilyContext.jsx    (already correct)
│   ├── services/
│   │   ├── api.js               (new - unified API client)
│   │   ├── families.js          (new)
│   │   ├── feed.js              (update import)
│   │   └── graph.js             (update import)
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppShell.jsx     (add FamilySwitcher)
│   │   │   └── FamilySwitcher.jsx (update to use services)
│   │   └── AppShell.jsx         (if duplicate, remove)
│   ├── pages/
│   │   ├── Families.jsx          (implement with selection)
│   │   ├── Feed.jsx             (wrapper - keep)
│   │   ├── Post.jsx              (wrapper - keep)
│   │   └── ... (other pages)
│   └── main.jsx                 (add FamilyProvider)
```

## Acceptance Criteria

- [ ] All imports resolve correctly
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts without errors
- [ ] Login works and stores token in `localStorage` as `token`
- [ ] Protected routes redirect to `/login` when not authenticated
- [ ] Family selection persists across refresh
- [ ] FamilySwitcher appears in navbar and works
- [ ] Feed loads for active family (`GET /api/feed/?family_id=...`)
- [ ] Create post works (`POST /api/feed/posts/`)
- [ ] Topology loads after selecting viewer
- [ ] All API calls use unified `services/api.js` with env var support
- [ ] No duplicate context directories
- [ ] No duplicate API clients

## Implementation Order

1. Create unified API client (`services/api.js`)
2. Create families service (`services/families.js`)
3. Consolidate contexts (move AuthContext)
4. Update all service imports
5. Wire providers in main.jsx
6. Update FamilySwitcher to use services
7. Integrate FamilySwitcher in AppShell
8. Implement Families page
9. Create .env.example
10. Fix all remaining import paths
11. Test all flows