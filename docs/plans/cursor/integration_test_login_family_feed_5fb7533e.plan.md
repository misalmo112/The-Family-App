---
name: Integration Test Login Family Feed
overview: "Create an integration test using Testing Library and MSW that verifies the complete user flow: Login → Families page → Select family → Feed page displays posts."
todos:
  - id: "1"
    content: Create MSW server setup file (src/tests/integration/msw/server.js)
    status: completed
  - id: "2"
    content: Create MSW handlers file with login, families, and feed mocks (src/tests/integration/msw/handlers.js)
    status: completed
  - id: "3"
    content: Create test helper with renderWithProviders function (src/tests/integration/test-utils.jsx)
    status: completed
  - id: "4"
    content: Create main integration test file (src/tests/integration/login_family_feed.msw.test.jsx)
    status: completed
  - id: "5"
    content: Update setupTests.js to initialize MSW server if needed
    status: completed
---

# Integration Test Implementation Plan

## Overview
Create the first integration test that verifies the main user flow using MSW to mock API responses. The test will be located in `family-app/frontend/src/tests/integration/`.

## Files to Create

### 1. MSW Server Setup
**File:** `src/tests/integration/msw/server.js`
- Initialize MSW server with handlers
- Export server instance for use in tests

### 2. MSW Handlers
**File:** `src/tests/integration/msw/handlers.js`
- Mock handlers for:
  - `POST /api/auth/token/` - Returns JWT token response `{access: "mock-token", refresh: "mock-refresh"}`
  - `GET /api/families/` - Returns array with at least one family (e.g., `{id: 1, name: "K Family", code: "KFAM", created_at: "2024-01-01T00:00:00Z"}`)
  - `GET /api/feed/?family_id=1` - Returns paginated feed response with at least one post containing text like "Hello family!" or similar

### 3. Test Helper
**File:** `src/tests/integration/test-utils.jsx`
- `renderWithProviders` function that:
  - Wraps component with `AuthProvider` and `FamilyProvider`
  - Uses `MemoryRouter` with initial route (defaults to `/login`)
  - Clears localStorage before rendering
  - Returns render result with router history for navigation assertions

### 4. Integration Test
**File:** `src/tests/integration/login_family_feed.msw.test.jsx`
- Test structure:
  1. Setup MSW server before all tests
  2. Clear localStorage in beforeEach
  3. Render app starting at `/login`
  4. Fill username and password fields (using `getByLabelText` or `getByRole`)
  5. Click submit button
  6. Wait for navigation to `/families` (check URL or presence of "Families" heading)
  7. Find and click on family card (look for "K Family" text or clickable card)
  8. Wait for navigation to `/feed`
  9. Assert that post text is visible in the DOM

## Implementation Details

### API Response Formats
Based on the codebase:
- **Login:** `POST /api/auth/token/` → `{access: string, refresh: string}`
- **Families:** `GET /api/families/` → `Array<{id: number, name: string, code: string, created_at?: string}>`
- **Feed:** `GET /api/feed/?family_id=1&page=1` → `{results: Array<Post>, count: number, page: number, page_size: number, total_pages: number, has_next: boolean, has_previous: boolean}`
  - Post object: `{id: number, text: string, type: string, author_user: string, created_at: string, ...}`

### Test Assertions
- Use `screen.getByText` or `screen.getByRole` for finding elements
- Use `waitFor` or `findBy*` queries for async operations
- Check URL changes using router history or `window.location.pathname`
- Assert post text is visible using `expect(screen.getByText(/Hello family!/i)).toBeInTheDocument()`

### Material-UI Considerations
- Login page uses Material-UI `TextField` components with labels
- Families page uses Material-UI `Card` components
- Use `getByLabelText` for form inputs, `getByRole` for buttons
- Material-UI components may require specific query strategies

### Router Setup
- Use `MemoryRouter` instead of `BrowserRouter` for testing
- Pass `initialEntries={['/login']}` to start at login route
- Access router history via `createMemoryHistory` or use `useNavigate` hook in test helpers

## Dependencies
All required packages are already installed:
- `@testing-library/react` (v14.1.2)
- `@testing-library/user-event` (v14.5.1)
- `msw` (v2.0.0)
- `vitest` (v1.0.4)

## Test Command
The test will run with: `npm run test:integration`

## Notes
- The test should be resilient to empty feed responses by ensuring mocked handlers always return at least one post
- localStorage clearing is critical since both AuthContext and FamilyContext use it
- The test should handle async navigation and data fetching properly