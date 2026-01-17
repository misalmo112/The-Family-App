---
name: User Account Module Implementation
overview: Implement user registration and profile management endpoints, extend User model with email/dob/gender, update family service to use User profile defaults, and make join flow use User profile when new_person_payload is missing.
todos:
  - id: "1"
    content: Extend User model in apps/accounts/models.py with email (unique), dob, gender fields
    status: completed
  - id: "2"
    content: Create RegisterSerializer, UserProfileSerializer, PasswordChangeSerializer in apps/accounts/serializers.py
    status: completed
  - id: "3"
    content: Create RegisterView, UserProfileView, PasswordChangeView in apps/accounts/views.py
    status: completed
  - id: "4"
    content: Add URL routes in apps/accounts/urls.py for register, me, change-password
    status: completed
  - id: "5"
    content: Update create_family_with_membership to use User profile defaults when fields are None
    status: completed
  - id: "6"
    content: Update create_join_request to make new_person_payload optional
    status: completed
  - id: "7"
    content: Update approve_join_request to use User profile defaults when new_person_payload fields are missing
    status: completed
  - id: "8"
    content: Create and run database migrations for User model changes
    status: completed
---

# User Account Module Implementation

## Overview

This plan implements a complete user account module with registration, profile management, and password change functionality. It also updates the family service to automatically use User profile data when creating Person nodes.

## Files to Modify/Create

### 1. Model Extension
**File:** `family-app/backend/apps/accounts/models.py`

- Extend `User` model (currently extends `AbstractUser`) with:
  - `email` field: `EmailField(unique=True)` - override AbstractUser's email to make it unique and required
  - `dob` field: `DateField(null=True, blank=True)` - date of birth
  - `gender` field: `CharField(max_length=10, choices=GenderChoices.choices, default=GenderChoices.UNKNOWN)` - import from `apps.graph.models`
- Use existing `first_name` and `last_name` from `AbstractUser`

### 2. Serializers
**File:** `family-app/backend/apps/accounts/serializers.py`

Create three serializers:

- **RegisterSerializer**: For user registration
  - Fields: `username`, `email`, `password`, `password_confirm`, `first_name`, `last_name`, `dob`, `gender`
  - Validation: password confirmation match, email uniqueness
  - Create method: hash password, create user

- **UserProfileSerializer**: For profile read/update
  - Fields: `id`, `username`, `email`, `first_name`, `last_name`, `dob`, `gender`, `date_joined`
  - Read-only: `id`, `username`, `date_joined`
  - Update method: allow partial updates

- **PasswordChangeSerializer**: For password changes
  - Fields: `old_password`, `new_password`, `new_password_confirm`
  - Validation: old password check, new password confirmation match
  - Update method: set new password

### 3. Views
**File:** `family-app/backend/apps/accounts/views.py`

Create four APIView classes following existing patterns:

- **RegisterView** (POST `/api/auth/register/`)
  - Permission: `AllowAny`
  - Use `RegisterSerializer`
  - Return user data + JWT tokens on success

- **UserProfileView** (GET/PATCH `/api/auth/me/`)
  - Permission: `IsAuthenticated`
  - GET: return current user profile
  - PATCH: update profile (partial updates allowed)
  - Use `UserProfileSerializer`

- **PasswordChangeView** (POST `/api/auth/change-password/`)
  - Permission: `IsAuthenticated`
  - Use `PasswordChangeSerializer`
  - Validate old password, set new password
  - Return success message

### 4. URL Routing
**File:** `family-app/backend/apps/accounts/urls.py`

Add routes:
- `path('register/', RegisterView.as_view(), name='register')`
- `path('me/', UserProfileView.as_view(), name='profile')`
- `path('change-password/', PasswordChangeView.as_view(), name='change-password')`

Keep existing token routes.

### 5. Family Service Updates
**File:** `family-app/backend/apps/families/services/family_service.py`

Update `create_family_with_membership`:
- When `first_name`, `last_name`, `dob`, or `gender` are `None`, default to `creator.first_name`, `creator.last_name`, `creator.dob`, `creator.gender`
- Remove username parsing logic (lines 31-36)
- Use User profile fields directly

Update `create_join_request`:
- Make `new_person_payload` optional (remove validation requiring it)
- If `new_person_payload` is missing or partial, allow it (will be filled from User profile in approval)

Update `approve_join_request`:
- When creating Person from `new_person_payload`, if fields are missing, default to `join_request.requested_by` User profile values:
  - `first_name` → `user.first_name`
  - `last_name` → `user.last_name`
  - `dob` → `user.dob`
  - `gender` → `user.gender`

### 6. Database Migration
**File:** `family-app/backend/apps/accounts/migrations/XXXX_add_user_profile_fields.py` (auto-generated)

- Add `email` field (unique constraint)
- Add `dob` field (nullable)
- Add `gender` field (with default)

## Response Shapes

### POST `/api/auth/register/`
**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-01-15",
  "gender": "MALE"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-15",
    "gender": "MALE"
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

### GET `/api/auth/me/`
**Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-01-15",
  "gender": "MALE",
  "date_joined": "2024-01-01T12:00:00Z"
}
```

### PATCH `/api/auth/me/`
**Request:**
```json
{
  "first_name": "Jane",
  "dob": "1992-05-20"
}
```

**Response (200):** Same shape as GET

### POST `/api/auth/change-password/`
**Request:**
```json
{
  "old_password": "oldpass123",
  "new_password": "newpass456",
  "new_password_confirm": "newpass456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

## Implementation Notes

1. **Email Field**: AbstractUser already has an email field, but it's not unique by default. We'll override it to add `unique=True` constraint.

2. **Gender Field**: Use `GenderChoices` from `apps.graph.models` to maintain consistency with Person model.

3. **Password Hashing**: Use Django's `set_password()` method in RegisterSerializer.

4. **JWT Tokens**: For registration, generate tokens using `rest_framework_simplejwt.tokens.RefreshToken`.

5. **Service Pattern**: Follow existing pattern - views are thin, business logic in services (though registration/profile are simple enough to keep in views).

6. **Validation**: Email uniqueness checked in serializer. Password confirmation in serializer validation.

7. **Partial Updates**: UserProfileSerializer supports PATCH with partial data.

8. **Backward Compatibility**: Existing users will have `dob=None` and `gender='UNKNOWN'` by default, which is acceptable.

## Migration Strategy

1. Create migration: `python manage.py makemigrations accounts`
2. Review migration file
3. Apply migration: `python manage.py migrate accounts`
4. Existing users will have default values (dob=None, gender=UNKNOWN)

## Testing Considerations

- Test registration with valid/invalid data
- Test email uniqueness validation
- Test profile update (full and partial)
- Test password change with correct/incorrect old password
- Test family creation uses User profile defaults
- Test join request with missing new_person_payload uses User profile