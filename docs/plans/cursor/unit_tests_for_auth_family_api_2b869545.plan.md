---
name: Unit Tests for Auth Family API
overview: Create three unit test files in `family-app/frontend/src/tests/unit/` to test AuthContext (login/logout token storage), FamilyContext (localStorage persistence), and apiClient (Authorization header injection).
todos:
  - id: create-unit-dir
    content: Create src/tests/unit/ directory if it doesn't exist
    status: completed
  - id: auth-context-test
    content: Create authContext.test.jsx with tests for login token storage, logout token clearing, and initialization from localStorage
    status: completed
  - id: family-context-test
    content: Create familyContext.test.jsx with tests for setActiveFamily persistence and localStorage loading on init
    status: completed
  - id: api-client-test
    content: Create apiClient.test.jsx with tests for Authorization header injection when token exists
    status: completed
---

# Unit Tests Implementation Plan

## Overview
Create unit tests in `family-app/frontend/src/tests/unit/` to catch regressions in authentication, family context, and API client functionality.

## Test Files to Create

### 1. `authContext.test.jsx`
**Location**: `family-app/frontend/src/tests/unit/authContext.test.jsx`

**Tests**:
- `login()` stores token in localStorage after successful API call
  - Mock `api.post` to return `{ data: { access: 'test-token' } }`
  - Call `login('user', 'pass')`
  - Assert token is stored in localStorage with key 'token'
  - Assert `isAuthenticated` becomes true
- `logout()` clears token from localStorage
  - Set token in localStorage and state
  - Call `logout()`
  - Assert token is removed from localStorage
  - Assert `isAuthenticated` becomes false
- Initialization loads token from localStorage on mount
  - Set token in localStorage before rendering
  - Render `AuthProvider`
  - Assert token is loaded and `isAuthenticated` is true

**Implementation notes**:
- Use `@testing-library/react` to render `AuthProvider`
- Mock `../services/api` module
- Use `localStorage` mock (Vitest/jsdom provides this)
- Test both success and error cases for login

### 2. `familyContext.test.jsx`
**Location**: `family-app/frontend/src/tests/unit/familyContext.test.jsx`

**Tests**:
- `setActiveFamily()` persists to localStorage
  - Render `FamilyProvider`
  - Call `setActiveFamily(1, 'Test Family')`
  - Assert localStorage contains JSON with `activeFamilyId: 1` and `activeFamilyName: 'Test Family'`
  - Assert state updates correctly
- Loads from localStorage on initialization
  - Set localStorage item 'activeFamily' with valid JSON before rendering
  - Render `FamilyProvider`
  - Assert `activeFamilyId` and `activeFamilyName` are loaded from localStorage
- Clearing active family removes from localStorage
  - Set active family, then call `clearActiveFamily()`
  - Assert localStorage item is removed

**Implementation notes**:
- Use `@testing-library/react` to render `FamilyProvider`
- Use `useFamily` hook in a test component to access context
- Test localStorage key 'activeFamily' (STORAGE_KEY constant)

### 3. `apiClient.test.jsx`
**Location**: `family-app/frontend/src/tests/unit/apiClient.test.jsx`

**Tests**:
- Authorization header is added when token exists in localStorage
  - Set token in localStorage
  - Make a request using the api client
  - Assert request config includes `Authorization: Bearer <token>` header
- No Authorization header when token doesn't exist
  - Clear localStorage
  - Make a request
  - Assert request config does not include Authorization header

**Implementation notes**:
- Mock axios to capture request interceptor behavior
- Use `axios.create` mock or spy on interceptor
- Alternative: Use MSW to intercept requests and verify headers
- Test the request interceptor directly by calling it with a config object

## File Structure
```
family-app/frontend/src/tests/unit/
├── authContext.test.jsx
├── familyContext.test.jsx
└── apiClient.test.jsx
```

## Dependencies
- `@testing-library/react` - Already in package.json
- `@testing-library/user-event` - Already in package.json
- `vitest` - Already configured
- `msw` - Available in devDependencies (optional for authContext)
- `jsdom` - Already configured in vitest.config.js

## Testing Approach
- Use Vitest's built-in mocking capabilities
- Mock `localStorage` using Vitest's `vi.stubGlobal` or rely on jsdom's implementation
- Mock axios/API calls using `vi.mock()`
- Use React Testing Library's `render` and hooks testing utilities
- Clean up localStorage between tests using `beforeEach` or `afterEach`

## Acceptance Criteria
- All tests pass when running `npm run test:unit`
- Tests are isolated (no side effects between tests)
- Tests use proper mocking to avoid actual API calls
- Tests verify both positive and negative cases where applicable