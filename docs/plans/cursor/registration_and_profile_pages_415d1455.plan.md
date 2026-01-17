---
name: Registration and Profile Pages
overview: Add user registration and profile management pages with auth service, following existing MUI patterns and services architecture. Registration will auto-login users after successful signup.
todos:
  - id: create-auth-service
    content: Create auth.js service with register, getProfile, updateProfile, changePassword functions
    status: completed
  - id: create-register-page
    content: Create Register.jsx page with form for username, email, password, first/last name, dob, gender
    status: completed
  - id: create-profile-page
    content: Create Profile.jsx page with editable profile section and change password section
    status: completed
  - id: update-routes
    content: Add /register and /profile routes to App.jsx
    status: completed
  - id: update-navigation
    content: Add Profile to navigationItems and user menu in AppShell.jsx
    status: completed
  - id: update-auth-context
    content: Optionally add register function to AuthContext for auto-login flow
    status: completed
---

# Registration and Profile Pages Implementation

## Overview

Add user registration and profile management functionality to the frontend, following existing MUI design patterns and the services architecture. Registration will automatically log users in after successful signup.

## Architecture

```
Frontend Flow:
Register.jsx → auth.js (register) → Backend API → Auto-login → Navigate to /families
Profile.jsx → auth.js (getProfile, updateProfile, changePassword) → Backend API
```

## Backend Requirements

The backend already has serializers (`RegisterSerializer`, `UserProfileSerializer`, `PasswordChangeSerializer`) but needs views and URL routes:

- `POST /api/auth/register/` - User registration (public endpoint)
- `GET /api/auth/profile/` - Get current user profile (authenticated)
- `PUT /api/auth/profile/` - Update user profile (authenticated)
- `POST /api/auth/change-password/` - Change password (authenticated)

**Note:** These backend endpoints need to be implemented. The plan focuses on frontend implementation assuming these endpoints will exist.

## Implementation Details

### 1. Create Auth Service (`family-app/frontend/src/services/auth.js`)

**File:** `family-app/frontend/src/services/auth.js` (NEW)

Create service functions following the pattern in `services/families.js`:

- `register(username, email, password, passwordConfirm, firstName, lastName, dob, gender)` - Register new user
  - POST to `/api/auth/register/`
  - Returns user data and tokens (if backend provides) or just success
  - Throws errors for validation failures

- `getProfile()` - Get current user profile
  - GET `/api/auth/profile/`
  - Returns user profile object

- `updateProfile(profileData)` - Update user profile
  - PUT `/api/auth/profile/`
  - Accepts: `{ email, first_name, last_name, dob, gender }`
  - Returns updated profile

- `changePassword(oldPassword, newPassword, newPasswordConfirm)` - Change password
  - POST `/api/auth/change-password/`
  - Returns success message

All functions use the `api` instance from `services/api.js` which handles JWT tokens automatically.

### 2. Create Register Page (`family-app/frontend/src/pages/Register.jsx`)

**File:** `family-app/frontend/src/pages/Register.jsx` (NEW)

Follow the pattern from `Login.jsx` and `JoinFamily/index.jsx`:

**Form Fields:**
- Username (required, TextField)
- Email (required, TextField type="email")
- Password (required, TextField type="password")
- Confirm Password (required, TextField type="password")
- First Name (optional, TextField)
- Last Name (optional, TextField)
- Date of Birth (optional, TextField type="date" with InputLabelProps)
- Gender (optional, TextField select with MenuItem options: MALE, FEMALE, OTHER, UNKNOWN)

**UI Components:**
- Container maxWidth="sm"
- Paper elevation={3} with padding
- Typography h4 for title
- Alert for errors (severity="error")
- Form with TextField components
- Button type="submit" variant="contained"
- Link to Login page ("Already have an account? Login")

**Behavior:**
- Form validation (client-side for required fields)
- On submit: call `register()` from auth service
- On success: auto-login using `login()` from AuthContext, then navigate to `/families`
- On error: display error message in Alert
- Loading state during submission

**Gender Options:**
```jsx
<MenuItem value="">Not specified</MenuItem>
<MenuItem value="MALE">Male</MenuItem>
<MenuItem value="FEMALE">Female</MenuItem>
<MenuItem value="OTHER">Other</MenuItem>
<MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
```

### 3. Create Profile Page (`family-app/frontend/src/pages/Profile.jsx`)

**File:** `family-app/frontend/src/pages/Profile.jsx` (NEW)

Two sections: Profile Edit and Change Password.

**Profile Edit Section:**
- Load profile data on mount using `getProfile()`
- Editable fields: Email, First Name, Last Name, Date of Birth, Gender
- Read-only: Username, Date Joined
- Save button to call `updateProfile()`
- Success/error alerts

**Change Password Section:**
- Separate form with: Old Password, New Password, Confirm New Password
- Submit button to call `changePassword()`
- Success/error alerts

**UI Structure:**
- Container maxWidth="md"
- Paper or Card components for sections
- Typography for section headers
- Divider between sections
- Consistent spacing (sx={{ mb: 3 }})

**State Management:**
- Profile data state
- Form field states
- Loading states for each operation
- Error/success messages

### 4. Update AuthContext (`family-app/frontend/src/context/AuthContext.jsx`)

**File:** `family-app/frontend/src/context/AuthContext.jsx` (MODIFY)

Add `register` function to AuthContext (optional - can also call auth service directly from Register component):

```jsx
const register = async (username, email, password, passwordConfirm, firstName, lastName, dob, gender) => {
  // Call auth service register
  // On success, auto-login
  // Return { success: true } or { success: false, error: ... }
}
```

Alternatively, Register component can call auth service directly and then call `login()` from context.

### 5. Update Routes (`family-app/frontend/src/App.jsx`)

**File:** `family-app/frontend/src/App.jsx` (MODIFY)

Add routes:
- `/register` - Public route (like `/login`), renders `<Register />`
- `/profile` - Protected route inside AppShell, renders `<Profile />`

```jsx
<Route path="/register" element={<Register />} />
<Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
  ...
  <Route path="profile" element={<Profile />} />
</Route>
```

### 6. Update Navigation (`family-app/frontend/src/components/AppShell.jsx`)

**File:** `family-app/frontend/src/components/AppShell.jsx` (MODIFY)

**Add to navigationItems array:**
```jsx
{ path: '/profile', label: 'Profile', icon: <PersonIcon /> }
```

**Update user menu:**
Add "Profile" MenuItem before "Logout" in the user menu dropdown:
```jsx
<MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
  <ListItemIcon>
    <PersonIcon fontSize="small" />
  </ListItemIcon>
  Profile
</MenuItem>
```

## Files to Create

1. `family-app/frontend/src/services/auth.js` - Auth service functions
2. `family-app/frontend/src/pages/Register.jsx` - Registration page
3. `family-app/frontend/src/pages/Profile.jsx` - Profile management page

## Files to Modify

1. `family-app/frontend/src/App.jsx` - Add routes
2. `family-app/frontend/src/components/AppShell.jsx` - Add Profile navigation
3. `family-app/frontend/src/context/AuthContext.jsx` - Optionally add register function

## Design Consistency

- Use same MUI components as existing pages (Paper, Container, TextField, Button, Alert)
- Follow spacing patterns (sx={{ mb: 2 }}, sx={{ mt: 3 }})
- Use same color scheme and typography
- Match form layout from Login.jsx and JoinFamily
- Use same error handling pattern (Alert with error message)
- Loading states with CircularProgress or disabled buttons

## Registration Auto-Login Flow

After successful registration:
1. Call `register()` from auth service
2. On success, call `login(username, password)` from AuthContext
3. Navigate to `/families` (or check for superadmin and redirect accordingly)

## Backend Endpoint Assumptions

The frontend assumes these backend endpoints exist:
- `POST /api/auth/register/` - Returns user data (may include tokens)
- `GET /api/auth/profile/` - Returns `{ id, username, email, first_name, last_name, dob, gender, date_joined }`
- `PUT /api/auth/profile/` - Accepts `{ email, first_name, last_name, dob, gender }`
- `POST /api/auth/change-password/` - Accepts `{ old_password, new_password, new_password_confirm }`

If backend endpoints don't exist yet, they need to be implemented using the existing serializers.