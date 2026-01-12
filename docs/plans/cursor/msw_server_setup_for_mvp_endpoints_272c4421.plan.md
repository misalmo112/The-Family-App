---
name: MSW Server Setup for MVP Endpoints
overview: Set up MSW (Mock Service Worker) server with handlers for authentication, families, and feed endpoints. Create handlers.js, server.js, and update setupTests.js to manage MSW lifecycle.
todos: []
---

# MSW Server Setup for MVP Endpoints

## Overview
Set up MSW (Mock Service Worker) to mock API endpoints for testing. Create handlers for authentication token, families list, and feed endpoints with proper response formats matching the UI expectations.

## Current State
- No MSW installed in `package.json` (needs to be added as dev dependency)
- No `src/tests/` directory exists
- No `setupTests.js` exists
- API base URL: `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000`)
- API endpoints:
  - POST `/api/auth/token/` → returns `{ access, refresh }`
  - GET `/api/families/` → returns array of family objects
  - GET `/api/feed/` with `family_id` query param → returns paginated `{ results: [...] }`

## Implementation Plan

### 1. Create Directory Structure
- Create `family-app/frontend/src/tests/msw/` directory

### 2. Create `handlers.js`
Location: `family-app/frontend/src/tests/msw/handlers.js`

Handlers to implement:
- **POST `/api/auth/token/`**: 
  - Accept any username/password
  - Return `{ access: "fake-access", refresh: "fake-refresh" }`
  - Support both absolute URL (with `VITE_API_BASE_URL`) and relative path
  
- **GET `/api/families/`**:
  - Return array: `[{ id: 1, name: "K Family", code: "ABC123" }, { id: 2, name: "Rahman Family", code: "XYZ999" }]`
  
- **GET `/api/feed/`**:
  - Read `family_id` query parameter
  - Return paginated format: `{ results: [ ...posts ] }`
  - Each post has: `id`, `type`, `text`, `created_at`
  - Return different posts based on `family_id` if needed

**Implementation Notes:**
- Use MSW v2 syntax (`http.get()`, `http.post()`)
- Use `rest` from `msw` for Node.js environment (tests)
- Handle both absolute and relative URLs for auth endpoint
- Make handlers robust (accept any credentials for login)

### 3. Create `server.js`
Location: `family-app/frontend/src/tests/msw/server.js`

- Import `setupServer` from `msw/node`
- Import handlers from `handlers.js`
- Create and export server: `setupServer(...handlers)`

### 4. Create/Update `setupTests.js`
Location: `family-app/frontend/src/tests/setupTests.js`

- Import server from `./msw/server.js`
- Add `beforeAll`: `server.listen({ onUnhandledRequest: 'error' })`
- Add `afterEach`: `server.resetHandlers()`
- Add `afterAll`: `server.close()`

**Note:** This assumes a test framework that supports `beforeAll`, `afterEach`, `afterAll` (Vitest, Jest, etc.). The file will work with common test runners.

### 5. Dependencies Required
- `msw` package (needs to be installed - not currently in `package.json`)
- Version: Use latest v2.x (current stable)

## File Structure
```
family-app/frontend/src/tests/
├── msw/
│   ├── handlers.js    # MSW request handlers
│   └── server.js      # MSW server setup
└── setupTests.js      # Test setup with MSW lifecycle
```

## Key Implementation Details

### Handler Patterns
- Use `http.post()` and `http.get()` from `msw/http` (v2 syntax)
- For auth: match both absolute URL pattern and relative `/api/auth/token/`
- For feed: extract `family_id` from URL search params
- Return realistic mock data matching backend response structure

### Response Formats
- **Token**: `{ access: string, refresh: string }`
- **Families**: `Array<{ id: number, name: string, code: string }>`
- **Feed**: `{ results: Array<{ id: number, type: string, text: string, created_at: string }> }`

## Acceptance Criteria
- Running tests does not throw MSW setup errors
- Handlers respond correctly to matching requests
- Server lifecycle properly managed (listen, reset, close)