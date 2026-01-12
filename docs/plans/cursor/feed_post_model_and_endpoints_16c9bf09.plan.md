---
name: Feed Post Model and Endpoints
overview: Implement Post model with family, author, type, text, and image fields, plus create and list endpoints with membership validation and pagination.
todos:
  - id: "1"
    content: Create Post model in feed/models.py with all required fields and PostTypeChoices
    status: completed
  - id: "2"
    content: Create PostSerializer and PostCreateSerializer in feed/serializers.py with membership validation
    status: completed
  - id: "3"
    content: Create PostCreateView and PostListView in feed/views.py with authentication and pagination
    status: completed
  - id: "4"
    content: Update feed/urls.py with URL patterns for create and list endpoints
    status: completed
  - id: "5"
    content: Generate and document migration file
    status: completed
---

# Feed Post Model and Endpoints Implementation

## Overview
Implement a Post model for the feed app with endpoints to create and list posts. Posts are associated with families and require membership validation.

## Files to Modify/Create

### 1. `backend/apps/feed/models.py`
- Create `PostTypeChoices` enum with `POST` and `ANNOUNCEMENT`
- Create `Post` model with fields:
  - `family` (ForeignKey to `families.Family`)
  - `author_user` (ForeignKey to `accounts.User`)
  - `author_person` (ForeignKey to `graph.Person`, null=True, blank=True)
  - `type` (CharField with choices)
  - `text` (TextField)
  - `image_url` (URLField, null=True, blank=True)
  - `created_at` (DateTimeField, auto_now_add=True)
- Add Meta class with ordering by `-created_at`

### 2. `backend/apps/feed/serializers.py`
- Create `PostSerializer` (ModelSerializer) for listing/retrieval
- Create `PostCreateSerializer` (Serializer) for creation with validation:
  - Validate user is a member of the specified family
  - Validate `author_person` belongs to the same family if provided
  - Include fields: `family_id`, `author_person_id` (optional), `type`, `text`, `image_url` (optional)

### 3. `backend/apps/feed/views.py`
- Create `PostCreateView` (APIView):
  - Permission: `IsAuthenticated`
  - POST method: validate membership, create post
  - Return 201 on success, 400/403 on validation/permission errors
- Create `PostListView` (APIView):
  - Permission: `IsAuthenticated`
  - GET method: filter by `family_id` query param, order by `-created_at`
  - Implement pagination with page size 20
  - Return paginated results

### 4. `backend/apps/feed/urls.py`
- Add URL patterns:
  - `posts/` → `PostCreateView` (POST)
  - `?family_id=...` → `PostListView` (GET)
- Note: Both endpoints can share the same path since they use different HTTP methods, or use separate paths for clarity

### 5. Migration
- Generate migration file after model creation

## Implementation Details

### Membership Validation
- Check `FamilyMembership` with `user=request.user`, `family_id=family_id`, `status=ACTIVE`
- Raise 403 if user is not a member

### Pagination
- Use Django REST Framework's pagination
- Page size: 20
- Order: newest first (`-created_at`)

### URL Structure
- POST `/api/feed/posts/` - Create post
- GET `/api/feed/?family_id=<id>` - List posts

## Notes for Integrator

The feed URLs need to be included in `config/urls.py`:
```python
path('api/feed/', include('apps.feed.urls')),
```

This will make the endpoints available at:
- `POST /api/feed/posts/`
- `GET /api/feed/?family_id=<id>`