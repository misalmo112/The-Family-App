---
name: Join Family Page
overview: Create a dedicated `/join` page with a form for joining a family by code, with toggle for "I'm listed already" vs "Create me" options, reusing existing service patterns.
todos:
  - id: update-service
    content: Update submitJoinRequest in families.js to accept { code, chosen_person_id?, new_person_payload? }
    status: completed
  - id: create-page
    content: "Create JoinFamily/index.jsx with form: code input, mode toggle, person fields, submit handler"
    status: completed
  - id: add-route
    content: Add /join route in App.jsx with ProtectedRoute wrapper
    status: completed
---

# Join Family Page Implementation

## Current State
- Service `submitJoinRequest` already exists in [families.js](family-app/frontend/src/services/families.js) but only accepts `new_person_payload`
- Onboarding page has similar join logic we can reference for UI patterns

## Changes Required

### 1. Update Service Function
In [families.js](family-app/frontend/src/services/families.js), update `submitJoinRequest` to support both `chosen_person_id` and `new_person_payload`:

```javascript
export const submitJoinRequest = async ({ code, chosen_person_id, new_person_payload }) => {
  const payload = { code };
  if (chosen_person_id) payload.chosen_person_id = chosen_person_id;
  if (new_person_payload) payload.new_person_payload = new_person_payload;
  
  const response = await api.post('/api/families/join/', payload);
  return response.data;
};
```

### 2. Create JoinFamily Page Component
Create new directory and component: `frontend/src/pages/JoinFamily/index.jsx`

**Structure:**
- Family code input (8-character, uppercase)
- Toggle switch/radio: "I'm listed already" vs "Create me"
- **If "Create me":** Show person fields (first_name, last_name, gender, dob - all optional)
- **If "Listed":** Show helper text note (no person lookup for now)
- Submit button with loading state
- Success alert: "Request submitted for approval"
- Error handling with Alert component

**UI Components (from MUI, matching existing patterns):**
- `Container`, `Paper`, `Typography`, `Box`
- `TextField`, `MenuItem`, `Button`
- `Alert`, `CircularProgress`
- `ToggleButtonGroup` or `RadioGroup` for mode selection

### 3. Add Route
In [App.jsx](family-app/frontend/src/App.jsx), add the `/join` route:

```jsx
import JoinFamily from './pages/JoinFamily';
// ...
<Route
  path="/join"
  element={
    <ProtectedRoute>
      <JoinFamily />
    </ProtectedRoute>
  }
/>
```

## Implementation Notes
- For "I'm listed already" path: Since there's no persons-by-code endpoint, show a helper note: "Contact a family admin to get your person ID, or use 'Create me' option"
- Keep the form simple (single page, no stepper like Onboarding)
- After success, optionally navigate to `/pending` to check request status