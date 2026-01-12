---
name: Family Models and Endpoints
overview: Implement Family, FamilyMembership, and JoinRequest models with DRF endpoints for family creation, listing, join requests, and approval/rejection workflows. All business logic will be in services following the project's conventions.
todos:
  - id: models
    content: Create Family, FamilyMembership, and JoinRequest models with all required fields, constraints, and choices
    status: completed
  - id: services
    content: "Implement service functions: create_family_with_membership, create_join_request, approve_join_request, reject_join_request"
    status: completed
    dependencies:
      - models
  - id: serializers
    content: "Create all serializers: FamilySerializer, FamilyMembershipSerializer, JoinRequestSerializer, JoinRequestCreateSerializer, JoinRequestListSerializer"
    status: completed
    dependencies:
      - models
  - id: views
    content: Implement all 6 view classes with proper authentication and permission handling
    status: completed
    dependencies:
      - services
      - serializers
  - id: urls
    content: Configure URL patterns in families/urls.py for all endpoints
    status: completed
    dependencies:
      - views
---

# Family Models and Endpoints Implementation

## Overview
Implement three models (Family, FamilyMembership, JoinRequest) and six DRF endpoints in `backend/apps/families` for family management, membership, and join request workflows.

## Models Implementation

### 1. Family Model (`family-app/backend/apps/families/models.py`)
- Fields: `name` (CharField), `code` (CharField, unique, auto-generated 8-char hex), `created_by` (ForeignKey to AUTH_USER_MODEL), `created_at`, `updated_at` (DateTimeField with auto_now/auto_now_add)
- Generate unique code using `uuid.uuid4().hex[:8]` in `save()` method

### 2. FamilyMembership Model (`family-app/backend/apps/families/models.py`)
- Fields: `user` (ForeignKey to AUTH_USER_MODEL), `family` (ForeignKey to Family), `person` (ForeignKey to "graph.Person"), `role` (CharField with choices: ADMIN, MEMBER), `status` (CharField with choices: ACTIVE, default=ACTIVE)
- Meta: `unique_together = [('user', 'family')]`

### 3. JoinRequest Model (`family-app/backend/apps/families/models.py`)
- Fields: `family` (ForeignKey to Family), `requested_by` (ForeignKey to AUTH_USER_MODEL), `chosen_person` (ForeignKey to "graph.Person", nullable), `new_person_payload` (JSONField, nullable), `status` (CharField with choices: PENDING, APPROVED, REJECTED, default=PENDING), `reviewed_by` (ForeignKey to AUTH_USER_MODEL, nullable), `created_at`, `updated_at` (DateTimeField)

## Services Implementation

### Service Module (`family-app/backend/apps/families/services/family_service.py`)
Create service functions following the project's business logic pattern:

1. **`create_family_with_membership(name, creator)`**
   - Generate unique family code
   - Create Family instance
   - Create Person node for creator (derive first_name/last_name from username if needed)
   - Create FamilyMembership with role=ADMIN
   - Return family instance

2. **`create_join_request(family_code, user, chosen_person_id=None, new_person_payload=None)`**
   - Validate family exists by code
   - Validate user not already a member
   - Validate either chosen_person_id OR new_person_payload provided
   - Create JoinRequest
   - Return join request instance

3. **`approve_join_request(join_request_id, reviewer)`**
   - Get JoinRequest, validate reviewer is ADMIN of the family
   - If chosen_person: use existing Person
   - If new_person_payload: create new Person with first_name/last_name
   - Create FamilyMembership
   - Update JoinRequest status to APPROVED
   - Return membership instance

4. **`reject_join_request(join_request_id, reviewer)`**
   - Get JoinRequest, validate reviewer is ADMIN
   - Update status to REJECTED
   - Return join request instance

## Serializers Implementation

### Serializers (`family-app/backend/apps/families/serializers.py`)

1. **FamilySerializer**: name, code (read-only), created_by (read-only), timestamps
2. **FamilyMembershipSerializer**: user, family, person, role, status
3. **JoinRequestSerializer**: family, requested_by, chosen_person_id, new_person_payload, status, reviewed_by, timestamps
4. **JoinRequestCreateSerializer**: code, chosen_person_id (optional), new_person_payload (optional) - for POST /join/
5. **JoinRequestListSerializer**: Full details for admin listing

## Views Implementation

### Views (`family-app/backend/apps/families/views.py`)

1. **FamilyCreateView** (POST /api/families/)
   - Use FamilyCreateSerializer
   - Call `create_family_with_membership` service
   - Return 201 with FamilySerializer

2. **FamilyListView** (GET /api/families/)
   - Filter families where user has FamilyMembership
   - Return list with FamilySerializer

3. **JoinRequestCreateView** (POST /api/families/join/)
   - Use JoinRequestCreateSerializer
   - Call `create_join_request` service
   - Return 201 with JoinRequestSerializer

4. **JoinRequestListView** (GET /api/families/join-requests/)
   - Filter JoinRequests where user is ADMIN of the family
   - Filter status=PENDING
   - Return list with JoinRequestListSerializer

5. **JoinRequestApproveView** (POST /api/families/join-requests/<id>/approve/)
   - Call `approve_join_request` service
   - Return 200 with success message

6. **JoinRequestRejectView** (POST /api/families/join-requests/<id>/reject/)
   - Call `reject_join_request` service
   - Return 200 with success message

## URL Configuration

### URLs (`family-app/backend/apps/families/urls.py`)
```python
urlpatterns = [
    path('', FamilyListView.as_view(), name='family-list'),
    path('', FamilyCreateView.as_view(), name='family-create'),  # Same path, different methods
    path('join/', JoinRequestCreateView.as_view(), name='join-request-create'),
    path('join-requests/', JoinRequestListView.as_view(), name='join-request-list'),
    path('join-requests/<int:pk>/approve/', JoinRequestApproveView.as_view(), name='join-request-approve'),
    path('join-requests/<int:pk>/reject/', JoinRequestRejectView.as_view(), name='join-request-reject'),
]
```

Note: Family list and create share the same path but use different HTTP methods (GET vs POST).

## Dependencies and Imports

- Use `from django.conf import settings` and `settings.AUTH_USER_MODEL` for user references
- Use `from apps.graph.models import Person` (with string reference "graph.Person" in ForeignKey)
- Import `uuid` for code generation
- Use `rest_framework.views.APIView` or `ViewSet` as appropriate
- Use `rest_framework.permissions.IsAuthenticated` (default from settings)
- Create custom permission class for admin-only endpoints if needed

## Integration Notes

- The Person model in `apps.graph` is assumed to have `first_name` and `last_name` fields
- When creating Person from username, split on space or use username as first_name if no space
- All endpoints require authentication (default DRF setting)
- Join request approval/rejection endpoints require user to be ADMIN of the family
- The root URL config (`config/urls.py`) will need to include families URLs (but this is outside scope per instructions)