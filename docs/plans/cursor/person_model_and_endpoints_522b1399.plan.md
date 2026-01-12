---
name: Person Model and Endpoints
overview: Implement Person model with family relationship, personal details, and gender enum. Create POST and GET endpoints with permission checks using FamilyMembership. Add URL routes in graph/urls.py.
todos:
  - id: "1"
    content: Create Person model in models.py with family FK, first_name, last_name, dob (nullable), gender choices, and timestamps
    status: completed
  - id: "2"
    content: Create PersonSerializer in serializers.py with all Person fields
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Implement permission helper functions to check ADMIN role and membership via FamilyMembership
    status: completed
  - id: "4"
    content: Implement PersonCreateView (POST) with ADMIN permission check
    status: completed
    dependencies:
      - "1"
      - "2"
      - "3"
  - id: "5"
    content: Implement PersonListView (GET) with family member permission check and family_id filtering
    status: completed
    dependencies:
      - "1"
      - "2"
      - "3"
  - id: "6"
    content: Add URL routes in urls.py for both endpoints
    status: completed
    dependencies:
      - "4"
      - "5"
  - id: "7"
    content: Output URL patterns and integrator notes
    status: completed
    dependencies:
      - "6"
---

# Person Model and Endpo

ints Implementation

## Overview

Implement the Person model in `backend/apps/graph/models.py` and create two endpoints with proper permission checks:

- POST `/api/graph/persons/` - Create person (ADMIN only)

- GET `/api/graph/persons/?family_id=...` - List persons (family members)

## Assumptions

- `families.Family` model exists (will be created by another agent)

- `families.FamilyMembership` model exists with structure:

- `family` (ForeignKey to Family)

- `user` (ForeignKey to User)

- `role` (CharField with choices including 'ADMIN', 'MEMBER', etc.)

## Implementation Details

### 1. Person Model (`family-app/backend/apps/graph/models.py`)

- Add `Person` model with:

- `family` - ForeignKey to `families.Family` using string reference `"families.Family"`

- `first_name` - CharField

- `last_name` - CharField

- `dob` - DateField (nullable=True)

- `gender` - CharField with choices: MALE, FEMALE, OTHER, UNKNOWN

- `created_at`, `updated_at` - DateTimeField with auto_now_add/auto_now

- Use Django's standard model patterns

### 2. Person Serializer (`family-app/backend/apps/graph/serializers.py`)

- Create `PersonSerializer` with all Person fields

- Use for both create and list operations

- Include family field in serializer

### 3. Permission Logic

- Create helper function to check if user is ADMIN of a family:

- Query `families.FamilyMembership` for user and family
- Check if role is 'ADMIN'

- Create helper function to check if user is a member of a family:

- Query `families.FamilyMembership` for user and family
- Return True if membership exists

### 4. Views (`family-app/backend/apps/graph/views.py`)

- `PersonCreateView` (POST):

- Check user is authenticated (default DRF permission)

- Validate family_id from request data

- Check user is ADMIN of that family via FamilyMembership

- Create Person instance

- Return 201 with created person data
- `PersonListView` (GET):

- Check user is authenticated

- Get family_id from query parameter

- Check user is a member of that family via FamilyMembership
- Filter Person queryset by family_id

- Return list of persons

### 5. URL Routes (`family-app/backend/apps/graph/urls.py`)

- Add route: `path('persons/', PersonCreateView.as_view(), name='person-create')`

- Add route: `path('persons/', PersonListView.as_view(), name='person-list')`

- Note: Both use same path but different HTTP methods

### 6. Error Handling

- Return 403 if user lacks required permissions
- Return 400 for invalid family_id or missing required fields
- Return 404 if family doesn't exist

## Files to Modify

- `family-app/backend/apps/graph/models.py` - Add Person model

- `family-app/backend/apps/graph/serializers.py` - Add PersonSerializer

- `family-app/backend/apps/graph/views.py` - Add PersonCreateView and PersonListView

- `family-app/backend/apps/graph/urls.py` - Add URL patterns

## Integration Notes

- URL patterns will be: `/api/graph/persons/` (POST and GET)

- Root URL config (`config/urls.py`) needs to include graph URLs (but not editing per instructions)

- Requires Family and FamilyMembership models to exist first

- Uses JWT authentication (default DRF setting)

- Follows service pattern convention (can add services later if needed)

## Output Requirements

At end of implementation, output:

1. URL patterns that were created