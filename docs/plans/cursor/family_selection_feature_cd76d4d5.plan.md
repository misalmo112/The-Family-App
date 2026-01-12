---
name: Family Selection Feature
overview: Create a family selection system with context management, a family selection page, and a navbar switcher component. The system will persist the active family in localStorage and integrate with the feed page.
todos:
  - id: create-family-context
    content: Create FamilyContext.jsx with state management and localStorage persistence
    status: completed
  - id: create-family-select-page
    content: Create FamilySelect page component with API integration and navigation
    status: completed
  - id: create-family-switcher
    content: Create FamilySwitcher component for navbar with dropdown selection
    status: completed
  - id: integrate-feed
    content: Update feed page to use activeFamilyId from FamilyContext
    status: completed
---

# Family Selection Feature Implementation

## Overview

Implement family selection functionality with context-based state management, a dedicated selection page, and a quick-switch component in the navbar. The active family will be persisted in localStorage and used by the feed page.

## Architecture

### Data Flow

```
FamilyContext (localStorage) 
  ↓
FamilySelect Page → Select Family → Update Context → Navigate to /feed
  ↓
FamilySwitcher (Navbar) → Switch Family → Update Context → Stay on current page
  ↓
Feed Page → Read activeFamilyId from Context → Fetch posts
```

## Implementation Details

### 1. FamilyContext (`/frontend/src/context/FamilyContext.jsx`)

Create a React context provider that:

- Stores `activeFamilyId` and `activeFamilyName` in state
- Persists to localStorage on changes
- Loads from localStorage on mount
- Provides `setActiveFamily(familyId, familyName)` function
- Exports `useFamily` hook for consuming components

**Key implementation points:**

- Use `useEffect` to sync state with localStorage
- Store as JSON: `{activeFamilyId: number, activeFamilyName: string}`
- Handle localStorage errors gracefully (fallback to null)
- Provide default values when no family is selected

### 2. FamilySelect Page (`/frontend/src/pages/FamilySelect/`)

Create a page component that:

- Fetches families from `GET /api/families/` using axios
- Displays list of families (name, code, created_at)
- Allows clicking/selecting a family
- Updates FamilyContext with selected family
- Navigates to `/feed` after selection

**File structure:**

- `/frontend/src/pages/FamilySelect/index.jsx` - Main page component

**Key implementation points:**

- Use axios with Authorization header (JWT from localStorage)
- Handle loading and error states
- Show empty state if no families
- Use React Router's `useNavigate` for navigation
- Call `setActiveFamily(id, name)` from context

### 3. FamilySwitcher Component (`/frontend/src/components/Layout/FamilySwitcher.jsx`)

Create a navbar component that:

- Displays current active family name
- Shows dropdown/select with all available families
- Allows quick switching between families
- Updates FamilyContext on selection
- Stays on current page after switch

**Key implementation points:**

- Fetch families list (can cache or fetch on mount)
- Display current family name from context
- Use dropdown/select UI component
- Call `setActiveFamily` on change
- Handle case when no family is selected (show "Select Family" or similar)

### 4. Integration Points

**Feed Page Integration:**

- Feed page should read `activeFamilyId` from `useFamily()` hook
- Pass `family_id` as query parameter to `GET /api/feed/?family_id={activeFamilyId}`
- Handle case when no active family is selected (redirect to `/families` or show message)

**API Configuration:**

- Base URL: `http://127.0.0.1:8000` (or from env variable)
- JWT token: Retrieved from localStorage (key: `access_token` or similar)
- Axios interceptor: Add Authorization header to all requests

## File Structure

```
frontend/src/
├── context/
│   └── FamilyContext.jsx          # Context provider and hook
├── pages/
│   └── FamilySelect/
│       └── index.jsx               # Family selection page
└── components/
    └── Layout/
        └── FamilySwitcher.jsx     # Navbar family switcher
```

## API Endpoints Used

- `GET /api/families/` - List user's families
  - Response: `[{id, name, code, created_by, created_at, updated_at}, ...]`
  - Auth: Bearer token required

- `GET /api/feed/?family_id={id}` - Get feed posts (existing, will use activeFamilyId)
  - Auth: Bearer token required

## localStorage Keys

- `activeFamily` - JSON string: `{"activeFamilyId": number, "activeFamilyName": string}`
- `access_token` - JWT access token (assumed existing)

## Error Handling

- API errors: Display user-friendly error messages
- No families: Show empty state with message
- No active family: Redirect to `/families` or show selection prompt
- localStorage errors: Gracefully degrade (state only, no persistence)