# Family App Frontend

React + Vite frontend application for the Family App.

## Prerequisites

- Node.js 18+ and npm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── context/              # React contexts
│   ├── AuthContext.jsx   # Authentication context
│   └── FamilyContext.jsx # Active family context
├── services/             # API service layer
│   ├── api.js           # Unified axios instance
│   ├── families.js      # Family API calls
│   ├── feed.js          # Feed API calls
│   ├── graph.js          # Graph/topology API calls
│   └── admin.js         # Superadmin API calls
├── components/           # Reusable components
│   ├── Layout/
│   │   ├── AppShell.jsx      # Main layout with navbar
│   │   └── FamilySwitcher.jsx # Family selector in navbar
├── pages/                # Page components
│   ├── Login.jsx        # Login page
│   ├── Families.jsx     # Family selection page
│   ├── Feed.jsx         # Feed wrapper (renders HomeFeed)
│   ├── HomeFeed/        # Feed display component
│   ├── Post.jsx         # Post wrapper (renders CreatePost)
│   ├── CreatePost/      # Post creation component
│   ├── Topology.jsx     # Topology visualization
│   └── Superadmin/      # Superadmin pages
│       ├── Dashboard.jsx    # System dashboard
│       ├── Health.jsx        # System health
│       ├── Users.jsx         # User management
│       ├── Families.jsx      # Family management
│       ├── ErrorLogs.jsx     # Error logs
│       ├── AuditLogs.jsx     # Audit logs
│       └── Feedback.jsx      # Feedback management
├── routes/
│   ├── ProtectedRoute.jsx    # Route protection wrapper
│   └── SuperadminGuard.jsx  # Superadmin authorization guard
├── components/
│   └── SuperadminLayout.jsx  # Superadmin layout with sidebar
├── App.jsx               # Main app with routing
└── main.jsx              # Entry point
```

## Features

- **Authentication**: JWT-based authentication with token persistence
- **Family Selection**: Select and switch between families
- **Feed**: View and create posts for the active family
- **Topology**: Visualize family relationships and graph structure
- **Protected Routes**: Automatic redirects for unauthenticated users
- **Superadmin Panel**: Administrative interface for system management (requires superadmin privileges)

## API Integration

All API calls use the unified `services/api.js` axios instance which:
- Automatically attaches JWT token from localStorage
- Handles 401 errors by redirecting to login
- Uses environment variable for base URL configuration

## Superadmin UI Routes

The superadmin panel is accessible at `/superadmin` and includes the following routes:

- `/superadmin` - Dashboard with system statistics and health status
- `/superadmin/health` - System health monitoring
- `/superadmin/users` - User management (disable, grant/revoke superadmin)
- `/superadmin/families` - Family management (suspend/unsuspend)
- `/superadmin/logs/errors` - System error logs with detailed traceback
- `/superadmin/logs/audit` - Audit trail of system actions
- `/superadmin/feedback` - User feedback management

**Access Control:**
- All superadmin routes are protected by `SuperadminGuard` which verifies superadmin privileges via health check endpoint
- Non-superadmin users see a "Not Authorized" page when accessing these routes
- The "Superadmin" link is visible in the main navigation for all users; unauthorized access is blocked by the guard
- All admin API calls use the shared axios instance from `services/api.js` which automatically includes authentication tokens

## Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL (default: `http://127.0.0.1:8000`)

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```
