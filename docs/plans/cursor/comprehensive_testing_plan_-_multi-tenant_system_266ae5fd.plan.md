---
name: Comprehensive Testing Plan - Multi-Tenant System
overview: Create a comprehensive testing plan covering backend APIs, frontend UI components, E2E workflows, and manual testing scenarios. Includes fixing the critical URL building bug first, then systematic testing of all features.
todos: []
---

# Comprehensive Testing Plan - Multi-Tenant System

## Prerequisites: Critical Bug Fix

**Issue**: Double `/api/api/` in URLs causing 404 errors

- **Root Cause**: `useAPI()` already sets `baseURL: /api`, but `buildURL(urlBaseType.API, ...)` adds another `/api/` prefix
- **Fix Required**: Change all new API hooks to use `urlBaseType.SUPERADMIN` instead of `urlBaseType.API` (matching existing `useCountryAPI` pattern)
- **Files to Fix**:
  - `my-app/src/hooks/useOrganizationAPI.js`
  - `my-app/src/hooks/useBranchAPI.js`
  - `my-app/src/hooks/useUserAPI.js` (new methods)
  - `my-app/src/hooks/useAuditLogAPI.js`
  - `my-app/src/hooks/useSuperadminAPI.js`
  - `my-app/src/utils/enums.js` (update endpoint names to remove `admin/` prefix)

**Why Tests Passed But UI Fails**:

- Backend tests use `APIClient` which doesn't use the frontend URL building logic
- Tests call endpoints directly (e.g., `/api/admin/organizations/`) which work correctly
- Frontend uses `buildURL()` + axios `baseURL` which causes double prefix

---

## Test Plan Structure

### Phase 1: Backend API Tests (Automated - Pytest)

**Status**: ✅ Already implemented (64 tests passing)

**Location**: `InteriorDesign/Test/Phase1_Test/` through `Phase8_Test/`

**Coverage**:

- Model validation and relationships
- Tenant filtering and isolation
- RBAC permission enforcement
- User invite system
- Audit logging
- Superadmin console
- Frontend API integration
- End-to-end workflows

**Action**: Re-run all tests after URL fix to ensure no regressions

---

### Phase 2: Frontend Component Unit Tests (New - React Testing Library)

**Status**: ❌ Not implemented

**Tool**: React Testing Library + Jest/Vitest

**Test Files to Create**:

1. `my-app/src/pages/admin/Organization/OrganizationPage.test.jsx`
2. `my-app/src/pages/admin/Branch/BranchPage.test.jsx`
3. `my-app/src/pages/admin/User/UserListPage.test.jsx`
4. `my-app/src/pages/admin/UserInvite/UserInvitePage.test.jsx`
5. `my-app/src/pages/admin/AuditLog/AuditLogPage.test.jsx`
6. `my-app/src/pages/superadmin/TenantListPage.test.jsx`
7. `my-app/src/pages/superadmin/ImpersonatePage.test.jsx`
8. `my-app/src/hooks/useOrganizationAPI.test.js`
9. `my-app/src/hooks/useBranchAPI.test.js`
10. `my-app/src/hooks/useUserAPI.test.js`
11. `my-app/src/hooks/useAuditLogAPI.test.js`
12. `my-app/src/hooks/useSuperadminAPI.test.js`

**Test Scenarios per Component**:

- Component renders without errors
- Loading state displays correctly
- Data fetching works (mocked API calls)
- Form validation works
- Error handling displays correctly
- Success messages appear
- Grid displays data correctly
- CRUD operations trigger correct API calls

---

### Phase 3: Frontend Integration Tests (New - React Testing Library)

**Status**: ❌ Not implemented

**Test Files to Create**:

1. `my-app/src/__tests__/integration/auth-flow.test.jsx`
2. `my-app/src/__tests__/integration/organization-flow.test.jsx`
3. `my-app/src/__tests__/integration/branch-flow.test.jsx`
4. `my-app/src/__tests__/integration/user-invite-flow.test.jsx`
5. `my-app/src/__tests__/integration/audit-log-flow.test.jsx`
6. `my-app/src/__tests__/integration/superadmin-flow.test.jsx`

**Test Scenarios**:

- Complete user login → view data → create → update → delete flow
- Tenant isolation in UI (users see only their org data)
- RBAC enforcement in UI (403 errors display correctly)
- User invite creation → acceptance flow
- Audit log viewing and filtering
- Superadmin impersonation flow

---

### Phase 4: E2E Tests (New - Playwright or Cypress)

**Status**: ❌ Not implemented

**Recommended Tool**: Playwright (better for React apps)

**Test Files to Create**:

1. `my-app/e2e/auth.spec.js`
2. `my-app/e2e/organization-management.spec.js`
3. `my-app/e2e/branch-management.spec.js`
4. `my-app/e2e/user-management.spec.js`
5. `my-app/e2e/user-invite.spec.js`
6. `my-app/e2e/audit-logs.spec.js`
7. `my-app/e2e/superadmin-console.spec.js`
8. `my-app/e2e/tenant-isolation.spec.js`
9. `my-app/e2e/rbac-enforcement.spec.js`

**E2E Test Scenarios**:

#### Auth Flow (`auth.spec.js`)

- User can login with valid credentials
- User redirected to correct page after login
- Invalid credentials show error
- Logout clears session
- JWT token stored in localStorage
- Token refresh works

#### Organization Management (`organization-management.spec.js`)

- Superadmin can view organizations list
- Superadmin can create new organization
- Superadmin can update organization
- Organization grid displays correctly
- Validation errors show for invalid data
- Success toast appears on save

#### Branch Management (`branch-management.spec.js`)

- Admin can view branches (filtered by org)
- Admin can create branch (auto-sets organization)
- Admin can update branch
- Branch grid shows organization name
- Cannot see branches from other organizations

#### User Management (`user-management.spec.js`)

- Admin can view users (filtered by org)
- Admin can create user directly
- Admin can update user
- User grid displays correctly
- Cannot see users from other organizations

#### User Invite (`user-invite.spec.js`)

- Admin can create invite
- Invite form validates email
- Invite token generated
- Public invite acceptance page works
- User created after invite acceptance
- User can login with accepted invite credentials

#### Audit Logs (`audit-logs.spec.js`)

- Admin can view audit logs
- Logs filtered by organization
- Filters work (action type, model name)
- Logs display timestamp, user, action correctly
- New actions appear in logs

#### Superadmin Console (`superadmin-console.spec.js`)

- Superadmin can view tenant list
- Superadmin can view tenant details
- Superadmin can start impersonation
- JWT token includes impersonation context
- Superadmin can stop impersonation

#### Tenant Isolation (`tenant-isolation.spec.js`)

- User from Org 1 only sees Org 1 data
- User from Org 2 only sees Org 2 data
- Cross-tenant update attempts fail
- Cross-tenant data not visible in UI

#### RBAC Enforcement (`rbac-enforcement.spec.js`)

- User without permissions sees 403
- User with permissions can access
- Permission errors display correctly
- Superuser bypasses all checks

---

### Phase 5: Manual Testing Checklist

**Test Environment Setup**:

1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. Test database with sample data
4. Browser DevTools open (Network, Console, Application tabs)

**Manual Test Scenarios**:

#### A. Authentication & Authorization

- [ ] Login as superadmin → verify redirect to `/admin`
- [ ] Login as admin → verify redirect to `/admin`
- [ ] Login as regular user → verify appropriate redirect
- [ ] Logout → verify token cleared, redirect to login
- [ ] Invalid credentials → verify error message
- [ ] Token refresh → verify automatic refresh on 401
- [ ] JWT token in localStorage → verify contains `organization_id`, `is_impersonating`

#### B. Organization Management (Superadmin Only)

- [ ] Navigate to `/admin/admin/organizations` → verify page loads
- [ ] View organizations list → verify all organizations visible
- [ ] Create organization → verify success, appears in grid
- [ ] Update organization → verify changes saved
- [ ] Validation errors → verify required fields show errors
- [ ] Grid editing → verify inline editing works
- [ ] Pagination → verify pagination works
- [ ] Search/filter → verify if implemented

#### C. Branch Management

- [ ] Navigate to `/admin/admin/branches` → verify page loads
- [ ] View branches → verify only own organization's branches
- [ ] Create branch → verify `organization_id` auto-set
- [ ] Update branch → verify changes saved
- [ ] Organization name column → verify shows correct org (read-only)
- [ ] Tenant isolation → verify cannot see other org's branches
- [ ] Grid functionality → verify editing, pagination work

#### D. User Management

- [ ] Navigate to `/admin/admin/users` → verify page loads
- [ ] View users → verify only own organization's users
- [ ] Create user → verify `organization_id` auto-set
- [ ] Update user → verify changes saved
- [ ] Role assignment → verify roles can be assigned
- [ ] Branch assignment → verify branch can be assigned
- [ ] Validation → verify email, name required

#### E. User Invitation System

- [ ] Navigate to `/admin/users/invite` → verify page loads
- [ ] Create invite → verify success message, token generated
- [ ] Invite form → verify email validation
- [ ] Branch/role selection → verify optional fields work
- [ ] Accept invite (public) → verify user creation
- [ ] Login with invited user → verify successful login
- [ ] Invite expiration → verify expired invites rejected

#### F. Audit Log Viewer

- [ ] Navigate to `/admin/admin/audit-logs` → verify page loads
- [ ] View logs → verify only own organization's logs
- [ ] Filter by action type → verify filtering works
- [ ] Filter by model → verify filtering works
- [ ] Log details → verify timestamp, user, action displayed
- [ ] Real-time updates → verify new actions appear

#### G. Superadmin Console

- [ ] Navigate to `/admin/superadmin/tenants` → verify page loads
- [ ] View tenant list → verify all organizations visible
- [ ] Tenant details → verify stats displayed
- [ ] Navigate to `/admin/superadmin/impersonate` → verify page loads
- [ ] Start impersonation → verify success, page refresh
- [ ] Verify impersonation context → check JWT token
- [ ] Stop impersonation → verify session ended
- [ ] Audit logs → verify impersonation events logged

#### H. Tenant Isolation Verification

- [ ] Create Org 1 with User 1, Branch 1
- [ ] Create Org 2 with User 2, Branch 2
- [ ] Login as User 1 → verify only sees Org 1 data
- [ ] Login as User 2 → verify only sees Org 2 data
- [ ] Cross-tenant API calls → verify 403/404 errors
- [ ] Cross-tenant UI access → verify data not visible

#### I. RBAC Permission Verification

- [ ] User without permissions → verify 403 on all endpoints
- [ ] User with `BRANCH_VIEW` → verify can view branches
- [ ] User with `BRANCH_CREATE` → verify can create branches
- [ ] User with `USER_VIEW` → verify can view users
- [ ] Superuser → verify bypasses all checks
- [ ] Permission errors → verify user-friendly error messages

#### J. Error Handling & Edge Cases

- [ ] Network errors → verify error messages display
- [ ] 401 Unauthorized → verify redirect to login
- [ ] 403 Forbidden → verify error message
- [ ] 404 Not Found → verify error message
- [ ] 500 Server Error → verify error message
- [ ] Invalid form data → verify validation errors
- [ ] Empty data sets → verify "No data" message
- [ ] Large data sets → verify pagination works
- [ ] Concurrent updates → verify conflict handling

#### K. UI/UX Testing

- [ ] Responsive design → verify mobile/tablet views
- [ ] Loading states → verify spinners/loading indicators
- [ ] Toast notifications → verify success/error messages
- [ ] Form validation → verify real-time validation
- [ ] Grid editing → verify inline editing UX
- [ ] Navigation → verify sidebar/routing works
- [ ] Translations → verify i18n works (if applicable)
- [ ] Accessibility → verify keyboard navigation, screen readers

---

### Phase 6: Performance Testing

**Test Scenarios**:

- [ ] Load time for organization list (100+ orgs)
- [ ] Load time for branch list (100+ branches)
- [ ] Load time for user list (100+ users)
- [ ] Load time for audit logs (1000+ logs)
- [ ] API response times (< 500ms for list, < 200ms for detail)
- [ ] Frontend render performance
- [ ] Memory leaks (long-running sessions)
- [ ] Concurrent user load (10+ simultaneous users)

---

### Phase 7: Security Testing

**Test Scenarios**:

- [ ] JWT token tampering → verify rejection
- [ ] XSS attacks → verify input sanitization
- [ ] CSRF protection → verify CSRF tokens
- [ ] SQL injection → verify parameterized queries
- [ ] Authorization bypass attempts → verify all endpoints check permissions
- [ ] Tenant isolation bypass → verify cannot access other org data
- [ ] Session hijacking → verify token expiration
- [ ] Password security → verify password requirements

---

### Phase 8: Browser Compatibility Testing

**Browsers to Test**:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

**Test Scenarios**:

- [ ] All features work in each browser
- [ ] UI renders correctly
- [ ] API calls work
- [ ] LocalStorage works
- [ ] JWT tokens work

---

## Test Execution Strategy

### Automated Tests (CI/CD)

1. **Backend Tests**: Run on every commit
   ```bash
   pytest InteriorDesign/Test/ -v --cov
   ```

2. **Frontend Unit Tests**: Run on every commit
   ```bash
   npm test -- --coverage
   ```

3. **Frontend Integration Tests**: Run on every commit
   ```bash
   npm run test:integration
   ```

4. **E2E Tests**: Run on PR and nightly
   ```bash
   npm run test:e2e
   ```


### Manual Testing

- **Sprint Testing**: Before each release
- **Regression Testing**: After bug fixes
- **User Acceptance Testing**: With stakeholders

---

## Test Data Requirements

### Backend Test Data

- 2+ Organizations
- 5+ Branches per organization
- 10+ Users per organization
- Multiple roles with different permissions
- 100+ Audit log entries
- Active and expired user invites

### Frontend Test Data

- Mock API responses for unit tests
- Test fixtures for E2E tests
- Sample data for manual testing

---

## Success Criteria

### Backend

- ✅ All 64+ pytest tests passing
- ✅ 90%+ code coverage
- ✅ All API endpoints return correct status codes
- ✅ Tenant isolation enforced
- ✅ RBAC working correctly

### Frontend

- ✅ All components render without errors
- ✅ All API hooks work correctly
- ✅ All E2E tests passing
- ✅ No console errors
- ✅ All user flows work end-to-end

### Integration

- ✅ Frontend → Backend communication works
- ✅ JWT authentication works
- ✅ Tenant isolation in UI matches backend
- ✅ RBAC in UI matches backend
- ✅ Audit logging works across stack

---

## Test Tools & Setup

### Backend Testing

- **Framework**: pytest + pytest-django
- **Coverage**: pytest-cov
- **Location**: `InteriorDesign/Test/`

### Frontend Unit/Integration Testing

- **Framework**: Vitest + React Testing Library
- **Setup**: Add to `my-app/package.json`
- **Location**: `my-app/src/**/*.test.jsx`

### E2E Testing

- **Framework**: Playwright (recommended) or Cypress
- **Setup**: `npm install -D @playwright/test`
- **Location**: `my-app/e2e/`

### Manual Testing

- **Browser**: Chrome DevTools
- **Tools**: Postman/Insomnia for API testing
- **Database**: Django admin for data verification

---

## Test Execution Order

1. **Fix URL bug** (prerequisite)
2. **Re-run backend tests** (verify no regressions)
3. **Create frontend unit tests** (component-level)
4. **Create frontend integration tests** (hook-level)
5. **Create E2E tests** (user flows)
6. **Manual testing** (UI/UX verification)
7. **Performance testing** (load times)
8. **Security testing** (vulnerabilities)
9. **Browser compatibility** (cross-browser)

---

## Deliverables

1. ✅ Fixed URL building code
2. ✅ Frontend unit test suite (12+ test files)
3. ✅ Frontend integration test suite (6+ test files)
4. ✅ E2E test suite (9+ test files)
5. ✅ Manual testing checklist (completed)
6. ✅ Test execution report
7. ✅ Bug report (if any issues found)
8. ✅ Performance report
9. ✅ Security audit report

---

## Estimated Effort

- **URL Bug Fix**: 30 minutes
- **Frontend Unit Tests**: 8-12 hours
- **Frontend Integration Tests**: 4-6 hours
- **E2E Tests**: 12-16 hours
- **Manual Testing**: 4-6 hours
- **Performance Testing**: 2-4 hours
- **Security Testing**: 2-4 hours
- **Browser Testing**: 2-3 hours

**Total**: ~40-55 hours

---

## Risk Mitigation

1. **URL Bug**: Fix immediately before other testing
2. **Test Coverage**: Aim for 80%+ coverage
3. **E2E Flakiness**: Use retries and stable selectors
4. **Manual Testing**: Create detailed checklists
5. **Performance**: Monitor API response times
6. **Security**: Regular security audits