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
│   └── graph.js         # Graph/topology API calls
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
│   └── Topology.jsx     # Topology visualization
├── routes/
│   └── ProtectedRoute.jsx # Route protection wrapper
├── App.jsx               # Main app with routing
└── main.jsx              # Entry point
```

## Features

- **Authentication**: JWT-based authentication with token persistence
- **Family Selection**: Select and switch between families
- **Feed**: View and create posts for the active family
- **Topology**: Visualize family relationships and graph structure
- **Protected Routes**: Automatic redirects for unauthenticated users

## API Integration

All API calls use the unified `services/api.js` axios instance which:
- Automatically attaches JWT token from localStorage
- Handles 401 errors by redirecting to login
- Uses environment variable for base URL configuration

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
