---
name: Update Family Create/Join Flows to Use User Profile
overview: Remove personal detail fields (name/DOB/gender) from family create and join flows in both onboarding and JoinFamily pages. Update backend to automatically use user profile data instead of requiring it in the request payload. Add profile link/note in UI.
todos:
  - id: onboarding-create
    content: "Update Onboarding create flow: remove step 2 (profile), update stepper, remove person fields, update API call"
    status: completed
  - id: onboarding-join
    content: "Update Onboarding join flow: remove step 2 (profile), update stepper, remove person fields, update API call"
    status: completed
  - id: joinfamily-create
    content: "Update JoinFamily 'create me' mode: remove all person fields, update validation and API call"
    status: completed
  - id: frontend-service
    content: "Update families.js service: remove personData from createFamily, handle empty new_person_payload"
    status: completed
  - id: backend-family-service
    content: Update create_family_with_membership to use request.user profile data instead of parameters
    status: completed
  - id: backend-join-service
    content: Update create_join_request and approve_join_request to use user profile when new_person_payload is empty
    status: completed
  - id: backend-serializers
    content: Remove person fields from FamilySerializer, update JoinRequestCreateSerializer validation
    status: completed
  - id: backend-views
    content: Update FamilyView.post to not pass person fields
    status: completed
  - id: ui-profile-link
    content: Add profile link/note in Onboarding and JoinFamily components
    status: completed
---

# Update Family Create/Join Flows to Use User Profile Data

## Overview
Remove personal detail fields from family creation and joining flows. The backend will automatically use the authenticated user's profile data (first_name, last_name, dob, gender) instead of requiring it in the request payload.

## Frontend Changes

### 1. Onboarding Component (`family-app/frontend/src/pages/Onboarding/Onboarding.jsx`)

**Create Family Flow:**
- Remove step 2 ("Your Profile") entirely - only keep step 1 (Family Name) and step 2 (Success)
- Update stepper labels: `['Family Name', 'Success']`
- Remove state variables: `firstName`, `lastName`, `dob`, `gender`
- Remove validation for personal fields in `handleNext`
- Update `handleSubmit` to call `createFamily` with only family name (no personData)
- Add note/link to profile page after family creation

**Join Family Flow:**
- Remove step 2 ("Your Profile") entirely - only keep step 1 (Family Code) and step 2 (Request Submitted)
- Update stepper labels: `['Family Code', 'Request Submitted']`
- Remove state variables: `joinFirstName`, `joinLastName`, `joinDob`, `joinGender`
- Remove validation for personal fields in `handleNext`
- Update `handleSubmit` to call `submitJoinRequest` without `new_person_payload` (or with empty object)
- Add note/link to profile page after join request submission

### 2. JoinFamily Component (`family-app/frontend/src/pages/JoinFamily/index.jsx`)

**"Create me" Mode:**
- Remove all personal detail fields (first name, last name, DOB, gender)
- Remove state variables: `firstName`, `lastName`, `dob`, `gender`
- Remove validation requiring at least one person detail
- Update `handleSubmit` to not include `new_person_payload` in the request (or send empty object)
- Add note/link to profile page explaining that profile data will be used

**"I'm listed already" Mode:**
- No changes needed (already uses `chosen_person_id`)

### 3. Families Service (`family-app/frontend/src/services/families.js`)

- Update `createFamily` function to not accept or send `personData` parameter
- Update `submitJoinRequest` to handle case where `new_person_payload` is not provided (backend will use user profile)

## Backend Changes

### 4. Family Service (`family-app/backend/apps/families/services/family_service.py`)

**`create_family_with_membership` function:**
- Remove `first_name`, `last_name`, `dob`, `gender` parameters
- Use `creator.first_name`, `creator.last_name`, `creator.dob`, `creator.gender` from the User model
- Fallback to username parsing only if user profile fields are empty

**`create_join_request` function:**
- Update validation to allow `new_person_payload` to be `None` or empty dict
- When `new_person_payload` is not provided, store `None` (will use user profile on approval)

**`approve_join_request` function:**
- When `new_person_payload` is `None` or empty, use `requested_by.first_name`, `requested_by.last_name`, `requested_by.dob`, `requested_by.gender` from User model
- Fallback to defaults if user profile fields are empty

### 5. Family Serializer (`family-app/backend/apps/families/serializers.py`)

**`FamilySerializer`:**
- Remove `first_name`, `last_name`, `dob`, `gender` fields (no longer needed in request)
- These fields were write-only and optional, so removing them is safe

### 6. Join Request Serializer (`family-app/backend/apps/families/serializers.py`)

**`JoinRequestCreateSerializer`:**
- Update validation to allow `new_person_payload` to be `None` or empty dict
- Remove requirement that `new_person_payload` must contain at least first_name or last_name
- Update validation logic: if neither `chosen_person_id` nor `new_person_payload` is provided, backend will use user profile data

### 7. Family View (`family-app/backend/apps/families/views.py`)

**`FamilyView.post`:**
- Remove passing of `first_name`, `last_name`, `dob`, `gender` to `create_family_with_membership`
- Function will now automatically use `request.user` profile data

## UI Enhancements

### 8. Add Profile Link/Note

In both Onboarding and JoinFamily components:
- Add a small note after form submission or in success messages
- Include a link to `/profile` (or `/api/auth/me/` if frontend profile page doesn't exist yet)
- Text: "Your profile information will be used. You can update your details in your [profile settings](/profile)."

## Files to Modify

1. `family-app/frontend/src/pages/Onboarding/Onboarding.jsx` - Remove personal fields, update flows
2. `family-app/frontend/src/pages/JoinFamily/index.jsx` - Remove personal fields from create mode
3. `family-app/frontend/src/services/families.js` - Update API calls
4. `family-app/backend/apps/families/services/family_service.py` - Use user profile data
5. `family-app/backend/apps/families/serializers.py` - Remove person fields from FamilySerializer, update JoinRequestCreateSerializer validation
6. `family-app/backend/apps/families/views.py` - Remove person field passing

## Notes

- The backend will automatically use user profile data from `request.user` (User model fields: first_name, last_name, dob, gender)
- If user profile fields are empty, backend will use fallback logic (username parsing, UNKNOWN gender)
- The `/profile` route may need to be created if it doesn't exist, or we can link to the API endpoint `/api/auth/me/` for now