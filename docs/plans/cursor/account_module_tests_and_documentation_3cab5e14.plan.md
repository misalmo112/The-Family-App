---
name: Account Module Tests and Documentation
overview: Add comprehensive pytest tests for account module (register, profile read/update, password change), update README.md with new auth endpoints and registration flow, and update APP_DOCUMENTATION.md with User Profile module and profile-default behavior.
todos: []
---

# Account Module Tests and Documentation

## Overview

Add comprehensive tests for the account module endpoints and update documentation to reflect the new registration and profile management features, including the profile-default behavior in family creation and join flows.

## Test Implementation

### Test File Structure

**File:** `family-app/backend/tests/test_accounts.py` (NEW)

Follow the existing pytest structure from `test_phase0.py` and `test_phase1_family_and_membership.py`:
- Use `@pytest.mark.django_db` decorator
- Use `APIClient` from `rest_framework.test`
- Use fixtures from `conftest.py` (api_client, user)
- Test both success and error cases
- Test validation errors
- Test authentication requirements

### Test Cases to Implement

#### 1. Registration Tests (`test_register_*`)

- `test_register_success` - Successful registration with all fields
- `test_register_minimal_fields` - Registration with only required fields (username, email, password)
- `test_register_password_mismatch` - Password and password_confirm don't match
- `test_register_duplicate_email` - Email already exists
- `test_register_duplicate_username` - Username already exists
- `test_register_weak_password` - Password doesn't meet validation requirements
- `test_register_returns_tokens` - Registration returns JWT tokens
- `test_register_optional_fields` - Registration with optional fields (first_name, last_name, dob, gender)

#### 2. Profile Read Tests (`test_profile_get_*`)

- `test_profile_get_success` - GET /api/auth/me/ returns user profile
- `test_profile_get_requires_auth` - Unauthenticated request returns 401
- `test_profile_get_returns_all_fields` - Response includes all expected fields

#### 3. Profile Update Tests (`test_profile_update_*`)

- `test_profile_update_success` - PATCH /api/auth/me/ updates profile
- `test_profile_update_partial` - Partial update (only some fields)
- `test_profile_update_email_duplicate` - Email already taken by another user
- `test_profile_update_readonly_fields` - Cannot update username or date_joined
- `test_profile_update_requires_auth` - Unauthenticated request returns 401
- `test_profile_update_invalid_gender` - Invalid gender value
- `test_profile_update_invalid_date` - Invalid date format for dob

#### 4. Password Change Tests (`test_password_change_*`)

- `test_password_change_success` - Successful password change
- `test_password_change_wrong_old_password` - Incorrect old password
- `test_password_change_password_mismatch` - New password and confirm don't match
- `test_password_change_weak_password` - New password doesn't meet requirements
- `test_password_change_requires_auth` - Unauthenticated request returns 401
- `test_password_change_old_password_required` - Old password is required

### Test Implementation Details

**Test Structure:**
```python
@pytest.mark.django_db
def test_register_success(api_client):
    """Test successful user registration"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'dob': '1990-01-15',
            'gender': 'MALE'
        },
        format='json'
    )
    assert response.status_code == 201
    assert 'user' in response.json()
    assert 'tokens' in response.json()
    assert response.json()['user']['username'] == 'newuser'
    assert 'access' in response.json()['tokens']
```

**Fixtures Needed:**
- Use existing `api_client` fixture
- Use existing `user` fixture for authenticated tests
- May need authenticated client fixture for profile/password tests

## Documentation Updates

### 1. README.md Updates

**File:** `README.md`

Add new sections/update existing sections:

#### A. Update "Phase 0 (Basic Setup)" API Endpoints Section

Add new endpoints:
- `POST /api/auth/register/` - User registration
- `GET /api/auth/me/` - Get current user profile
- `PATCH /api/auth/me/` - Update user profile
- `POST /api/auth/change-password/` - Change password

#### B. Add "User Registration" Section

Add a new section after "JWT Authentication" with examples:

```markdown
### User Registration

Register a new user account:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-15",
    "gender": "MALE"
  }'
```

Expected response:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-15",
    "gender": "MALE",
    "date_joined": "2024-01-01T12:00:00Z"
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

**Note:** Registration automatically returns JWT tokens, so you can immediately use the access token for authenticated requests.
```

#### C. Add "User Profile Management" Section

Add examples for profile get/update and password change:

```markdown
### User Profile Management

**Get Profile:**
```bash
curl -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Profile:**
```bash
curl -X PATCH http://127.0.0.1:8000/api/auth/me/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "first_name": "Jane",
    "dob": "1992-05-20"
  }'
```

**Change Password:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/change-password/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "old_password": "oldpass123",
    "new_password": "newpass456",
    "new_password_confirm": "newpass456"
  }'
```
```

#### D. Update "Phase 1 API Usage" Section

Update the "Creating a Family" section to mention that user profile data is automatically used:

```markdown
### Creating a Family

Create a new family (you will automatically become the admin). Your user profile information (first_name, last_name, dob, gender) will be used to create your Person node in the family:

```bash
curl -X POST http://127.0.0.1:8000/api/families/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name": "The Smith Family"}'
```

**Note:** The Person node for the family creator is automatically created using the user's profile data. Make sure your profile is up to date in `/api/auth/me/`.
```

Update the "Submitting a Join Request" section:

```markdown
### Submitting a Join Request

Submit a request to join a family using the family code. You can either:
- Use an existing person: provide `chosen_person_id`
- Create a new person: provide `new_person_payload` (optional - if omitted, your user profile data will be used)
- Omit both: your user profile data will be used automatically

**Option 1: Join with existing person**
[... existing example ...]

**Option 2: Join with new person (custom data)**
[... existing example ...]

**Option 3: Join using profile data (no payload)**
```bash
curl -X POST http://127.0.0.1:8000/api/families/join/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "A1B2C3D4"
  }'
```

**Note:** If `new_person_payload` is not provided, your user profile data (first_name, last_name, dob, gender) will be used when the join request is approved.
```

### 2. APP_DOCUMENTATION.md Updates

**File:** `docs/APP_DOCUMENTATION.md`

#### A. Add "User Profile Module" Section

Add a new section after "Core Concepts" (section 3) or in "Backend Code Structure" (section 7):

```markdown
### User Profile Module

The User model extends AbstractUser with additional profile fields:
- `email` - Unique email address (required)
- `first_name` - First name (from AbstractUser)
- `last_name` - Last name (from AbstractUser)
- `dob` - Date of birth (optional)
- `gender` - Gender (MALE, FEMALE, OTHER, UNKNOWN, default: UNKNOWN)

**Profile Default Behavior:**
When creating a family or joining a family, if personal information is not explicitly provided, the system automatically uses the user's profile data:
- Family creation: The creator's Person node uses `user.first_name`, `user.last_name`, `user.dob`, and `user.gender`
- Join requests: If `new_person_payload` is not provided or is partial, missing fields are filled from the user's profile when the request is approved

This ensures consistency across families and reduces data entry for users who belong to multiple families.

**Endpoints:**
- `POST /api/auth/register/` - Register new user (public)
- `GET /api/auth/me/` - Get current user profile (authenticated)
- `PATCH /api/auth/me/` - Update user profile (authenticated, partial updates allowed)
- `POST /api/auth/change-password/` - Change password (authenticated)
```

#### B. Update "Flow Structure" Section

Update section 4 "Flow Structure (User Journeys)":

**Update "A) Authentication" subsection:**
```markdown
### A) Authentication
1. User registers via `/api/auth/register/` or logs in via JWT endpoint.
2. Registration automatically returns JWT tokens for immediate use.
3. Access token stored in browser localStorage.
4. Token attached to API calls.
```

**Add to "B) First-Time User (Onboarding)" subsection:**
```markdown
### B) First-Time User (Onboarding)
1. User registers account (or logs in if already registered).
2. User lands on onboarding if they have no families.
3. They can:
   - Create a new family (becomes admin, Person created from user profile).
   - Join an existing family using a code (Person created from user profile or provided data).
4. If joining, request stays pending until admin approval.
5. On approval, Person node is created using user profile data if not provided in join request.
```

#### C. Update "API Surface (Summary)" Section

Add to Auth section:
```markdown
Auth:
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/register/` - User registration
- `GET /api/auth/me/` - Get user profile
- `PATCH /api/auth/me/` - Update user profile
- `POST /api/auth/change-password/` - Change password
```

## Files to Create

1. `family-app/backend/tests/test_accounts.py` - Comprehensive test suite for account module

## Files to Modify

1. `README.md` - Add registration and profile management sections, update family creation/join examples
2. `docs/APP_DOCUMENTATION.md` - Add User Profile module section, update flows and API summary

## Test Coverage Goals

- All registration scenarios (success, validation errors, edge cases)
- All profile read/update scenarios
- All password change scenarios
- Authentication requirements for protected endpoints
- Profile-default behavior in family creation (can be tested via family tests, but account tests should verify the model fields work correctly)

## Notes

- Tests should follow existing pytest patterns
- Use `@pytest.mark.django_db` for database access
- Test both success and error paths
- Verify response shapes match API documentation
- Tests should be independent and can run in any order
- Consider adding fixtures for authenticated clients if needed