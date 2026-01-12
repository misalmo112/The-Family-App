---
name: Frontend React Setup
overview: Initialize a React+Vite frontend project with MUI, authentication context, protected routing, and axios integration for the Family App backend API.
todos:
  - id: init-vite
    content: Initialize React+Vite project in /frontend directory
    status: completed
  - id: install-deps
    content: Install MUI, react-router-dom, axios, and MUI icons
    status: completed
  - id: create-axios
    content: Create axios instance with auth interceptor in src/api/axios.js
    status: completed
  - id: create-auth-context
    content: Create AuthContext with login/logout and token persistence
    status: completed
  - id: create-protected-route
    content: Create ProtectedRoute component for route protection
    status: completed
  - id: create-appshell
    content: Create AppShell component with navbar and logout button
    status: completed
  - id: create-pages
    content: Create all page components (Login, Families, Feed, Topology, Post)
    status: completed
  - id: setup-routing
    content: Set up routing in App.jsx with public and protected routes
    status: completed
---

# Frontend React Setup Plan

## Overview

Create a new React+Vite frontend application in `/frontend` directory with authentication, protected routing, and integration with the Django DRF backend API.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.js              # Axios instance with auth interceptor
│   ├── contexts/
│   │   └── AuthContext.jsx       # Auth context with login/logout & token persistence
│   ├── components/
│   │   └── AppShell.jsx          # Layout component with navbar & logout
│   ├── pages/
│   │   ├── Login.jsx             # Login page (public)
│   │   ├── Families.jsx          # Families page (protected)
│   │   ├── Feed.jsx              # Feed page (protected)
│   │   ├── Topology.jsx          # Topology page (protected)
│   │   └── Post.jsx              # Post page (protected)
│   ├── routes/
│   │   └── ProtectedRoute.jsx    # Route wrapper for protected routes
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # Entry point
├── package.json
├── vite.config.js
└── index.html
```

## Implementation Steps

### 1. Initialize React+Vite Project

- Create `/frontend` directory
- Run `npm create vite@latest . -- --template react` to initialize Vite React project
- Configure `vite.config.js` with proxy settings for API calls (optional, for development)

### 2. Install Dependencies

- Install core dependencies: `@mui/material @emotion/react @emotion/styled`
- Install routing: `react-router-dom`
- Install HTTP client: `axios`
- Install MUI icons: `@mui/icons-material`

### 3. Create Axios Instance (`src/api/axios.js`)

- Create axios instance with base URL: `http://127.0.0.1:8000`
- Add request interceptor to attach `Authorization: Bearer <token>` header from localStorage
- Add response interceptor to handle 401 errors (logout on unauthorized)

### 4. Create AuthContext (`src/contexts/AuthContext.jsx`)

- Implement `AuthProvider` component with:
  - State management for `token` and `isAuthenticated`
  - `login(username, password)` function that:
    - Calls `POST /api/auth/token/` with credentials
    - Stores `access` token in localStorage
    - Updates context state
  - `logout()` function that:
    - Clears token from localStorage
    - Resets context state
  - `useAuth()` hook for consuming context
- Initialize token from localStorage on mount

### 5. Create Protected Route Component (`src/routes/ProtectedRoute.jsx`)

- Wrapper component that checks authentication status
- Redirects to `/login` if not authenticated
- Renders children if authenticated

### 6. Create AppShell Component (`src/components/AppShell.jsx`)

- MUI `AppBar` with navigation links
- Logout button in the navbar
- Uses `Outlet` from react-router-dom for nested routes
- Responsive layout with MUI `Container`

### 7. Create Page Components

- **Login.jsx**: Form with username/password fields, calls `login()` from AuthContext
- **Families.jsx**: Placeholder page (will fetch families later)
- **Feed.jsx**: Placeholder page (will fetch feed later)
- **Topology.jsx**: Placeholder page (will display topology later)
- **Post.jsx**: Placeholder page (will create posts later)

### 8. Set Up Routing (`src/App.jsx`)

- Use `react-router-dom` `BrowserRouter`, `Routes`, `Route`
- Public route: `/login`
- Protected routes wrapped in `AppShell`:
  - `/families`
  - `/feed`
  - `/topology`
  - `/post`
- Default redirect: `/` → `/login` (or `/families` if authenticated)

### 9. Configure Vite (`vite.config.js`)

- Set up development server on port 5173 (matches backend CORS config)
- Optionally add proxy for API calls

## API Integration Details

### Authentication

- **Login Endpoint**: `POST http://127.0.0.1:8000/api/auth/token/`
  - Request body: `{ username, password }`
  - Response: `{ access, refresh }`
  - Store `access` token in localStorage

### Protected Routes

All protected routes require `Authorization: Bearer <token>` header:

- `GET /api/families/` - List families
- `GET /api/feed/?family_id=<id>` - List posts
- `GET /api/graph/topology/?family_id=<id>&viewer_person_id=<id>` - Get topology
- `POST /api/feed/posts/` - Create post

## Acceptance Criteria

- ✅ Can login with username/password and token is stored in localStorage
- ✅ Protected routes redirect to `/login` when user is not authenticated
- ✅ Authenticated users can navigate between protected routes
- ✅ Logout button clears token and redirects to login
- ✅ Axios automatically attaches Authorization header to all requests
- ✅ 401 responses trigger logout and redirect to login

## Files to Create/Modify

- `frontend/package.json` - Dependencies and scripts
- `frontend/vite.config.js` - Vite configuration
- `frontend/index.html` - HTML entry point
- `frontend/src/main.jsx` - React entry point
- `frontend/src/App.jsx` - Main app with routing
- `frontend/src/api/axios.js` - Axios instance
- `frontend/src/contexts/AuthContext.jsx` - Authentication context
- `frontend/src/routes/ProtectedRoute.jsx` - Protected route wrapper
- `frontend/src/components/AppShell.jsx` - Layout component
- `frontend/src/pages/Login.jsx` - Login page
- `frontend/src/pages/Families.jsx` - Families page (placeholder)
- `frontend/src/pages/Feed.jsx` - Feed page (placeholder)
- `frontend/src/pages/Topology.jsx` - Topology page (placeholder)
- `frontend/src/pages/Post.jsx` - Post page (placeholder)