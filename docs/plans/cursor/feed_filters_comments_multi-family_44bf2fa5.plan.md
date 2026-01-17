---
name: Feed Filters Comments Multi-Family
overview: Add feed filtering (type, author_person_id, scope=all_families), comment endpoints (GET/POST), and multi-family profile access rules with proper membership validation.
todos:
  - id: update-post-list-view
    content: Update PostListView.get() to support type, author_person_id, and scope=all_families query parameters with proper validation
    status: completed
  - id: add-comment-list-view
    content: Create PostCommentListView for GET /api/feed/posts/<id>/comments/ with membership and post type validation
    status: completed
  - id: add-comment-create-view
    content: Create PostCommentCreateView for POST /api/feed/posts/<id>/comments/ with membership and post type validation
    status: completed
  - id: update-urls
    content: Add comment routes to urls.py for both GET and POST endpoints
    status: completed
  - id: optional-services
    content: Create services layer (optional) to extract business logic from views
    status: completed
---

# Feed Filters, Comments, and Multi-Family Profile Rules

## Overview
Enhance the feed API with filtering capabilities, add comment endpoints, and implement multi-family profile access rules. All changes enforce family membership checks and respect privacy boundaries.

## Implementation Details

### 1. Update PostListView (`family-app/backend/apps/feed/views.py`)

**Query Parameters:**
- `family_id` (required) - Already implemented
- `type` (optional) - Filter by `MESSAGE|POST|ANNOUNCEMENT`
- `author_person_id` (optional) - Filter by person who authored posts
- `scope` (optional) - When set to `all_families`, returns posts across all families (only if viewer is author)

**Filtering Logic:**
- Always require `family_id` and verify user has ACTIVE membership (existing check at lines 48-58)
- If `author_person_id` is provided:
  - Validate that the person belongs to the specified `family_id` (query `Person.objects.filter(id=author_person_id, family_id=family_id).exists()`)
  - If `type` is not provided, default to `type=POST` (for profile page use case)
  - Filter posts: `Post.objects.filter(family_id=family_id, author_person_id=author_person_id, type=type)`
- If `scope=all_families`:
  - Verify `request.user` matches `post.author_user` for all returned posts
  - If `author_person_id` is provided, verify the person belongs to the user (check if user has a membership with that person)
  - Remove `family_id` filter and return posts from all families
  - Include `family_id` and `family_name` in response (already in `PostSerializer`)

**Implementation Location:**
- Modify `PostListView.get()` method starting at line 29
- Add query parameter extraction after line 30
- Add filtering logic before line 73 where posts are queried
- Apply filters to the queryset at line 73

### 2. Add Comment Views (`family-app/backend/apps/feed/views.py`)

**New View Classes:**

#### PostCommentListView
- Endpoint: `GET /api/feed/posts/<id>/comments/`
- Permission: `IsAuthenticated`
- Logic:
  - Get post by ID
  - Verify post exists (404 if not)
  - Check user is ACTIVE member of post's family
  - Verify post type is POST or ANNOUNCEMENT (403 if MESSAGE)
  - Return paginated comments ordered by `-created_at`
  - Use `PostCommentSerializer` (already exists in serializers.py)

#### PostCommentCreateView
- Endpoint: `POST /api/feed/posts/<id>/comments/`
- Permission: `IsAuthenticated`
- Logic:
  - Get post by ID from URL
  - Verify post exists (404 if not)
  - Check user is ACTIVE member of post's family
  - Verify post type is POST or ANNOUNCEMENT (403 if MESSAGE)
  - Use `PostCommentCreateSerializer` with `post_id` from URL (serializer already validates family membership and person)
  - Return created comment with `PostCommentSerializer`

**Note:** `PostCommentCreateSerializer` already exists (lines 120-176 in serializers.py) and handles validation, but it expects `post_id` in the request data. We'll need to pass it from the URL parameter.

### 3. Update URLs (`family-app/backend/apps/feed/urls.py`)

Add comment routes:
```python
path('posts/<int:post_id>/comments/', views.PostCommentListView.as_view(), name='post-comment-list'),
path('posts/<int:post_id>/comments/', views.PostCommentCreateView.as_view(), name='post-comment-create'),
```

**Note:** Both GET and POST use the same URL pattern. Django REST Framework will route based on HTTP method.

### 4. Optional: Create Services Layer (`family-app/backend/apps/feed/services/`)

**Structure:**
- Create `family-app/backend/apps/feed/services/__init__.py`
- Create `family-app/backend/apps/feed/services/feed_service.py`

**Functions to Extract:**
- `validate_family_membership(user, family_id)` - Reusable membership check
- `validate_person_in_family(person_id, family_id)` - Validate person belongs to family
- `get_filtered_posts(family_id, user, filters)` - Centralize post filtering logic
- `can_view_all_families(user, author_person_id)` - Check if user can view cross-family posts

This keeps views thin and logic testable.

## Access Control Rules

### Profile View Rules
- When `author_person_id` is provided without `scope=all_families`:
  - Only return posts within the active `family_id`
  - Default `type=POST` if not specified
- When `scope=all_families` is provided:
  - Only allowed if `request.user` is the author (check `post.author_user == request.user`)
  - Return posts across all families
  - Include `family_id` and `family_name` in each post response

### Comment Rules
- Comments only allowed on POST and ANNOUNCEMENT types
- Block comments on MESSAGE type (return 403)
- Enforce same-family membership (already in `PostCommentCreateSerializer.validate()`)

### Membership Validation
- All endpoints verify ACTIVE `FamilyMembership` status
- Non-members receive 403 Forbidden
- Use existing pattern: `FamilyMembership.objects.filter(user=request.user, family_id=family_id, status=FamilyMembership.Status.ACTIVE).first()`

## Files to Modify

1. `family-app/backend/apps/feed/views.py`
   - Update `PostListView.get()` method
   - Add `PostCommentListView` class
   - Add `PostCommentCreateView` class

2. `family-app/backend/apps/feed/urls.py`
   - Add comment route patterns

3. `family-app/backend/apps/feed/serializers.py` (if needed)
   - May need to adjust `PostCommentCreateSerializer` to accept `post_id` from context instead of request data

## Optional Files to Create

4. `family-app/backend/apps/feed/services/__init__.py`
5. `family-app/backend/apps/feed/services/feed_service.py`

## Testing Considerations

- Test `scope=all_families` with non-author user (should fail)
- Test `scope=all_families` with author user (should succeed)
- Test comments on MESSAGE type (should return 403)
- Test comments on POST/ANNOUNCEMENT (should succeed)
- Test `author_person_id` with person from different family (should fail)
- Test non-member access (should return 403)