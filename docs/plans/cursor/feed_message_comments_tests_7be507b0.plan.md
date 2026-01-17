---
name: Feed Message Comments Tests
overview: Add comprehensive pytest tests for MESSAGE type posts, comment restrictions, feed filtering, profile views, multi-family scope rules, and cross-family access controls in `family-app/backend/tests/test_feed_messages_comments.py`.
todos: []
---

# Test Plan: Feed Messages, Comments, Filters, and Multi-Family Rules

## Overview
Create a new test file `family-app/backend/tests/test_feed_messages_comments.py` following patterns from `test_phase3_feed.py` to test MESSAGE type posts, comment restrictions, filtering, profile views, and multi-family access rules.

## Test File Structure

### File: `family-app/backend/tests/test_feed_messages_comments.py`

The test file will include the following test functions:

### 1. MESSAGE Creation Tests
- **`test_create_message_rejects_image_url`**: Create MESSAGE via `/api/feed/posts/` with `image_url` provided; expect 400 error with validation message
- **`test_create_message_ignores_empty_image_url`**: Create MESSAGE with empty string `image_url`; should succeed and store `null`
- **`test_create_message_success`**: Create MESSAGE without `image_url`; should succeed

### 2. Feed Type Filtering Tests
- **`test_filter_feed_by_type_message`**: GET `/api/feed/?family_id=X&type=MESSAGE` returns only MESSAGE posts
- **`test_filter_feed_by_type_post`**: GET `/api/feed/?family_id=X&type=POST` returns only POST posts
- **`test_filter_feed_mixed_types`**: Create POST, MESSAGE, ANNOUNCEMENT; verify type filter works for each

### 3. Author Person ID Filtering Tests
- **`test_filter_by_author_person_id_same_family`**: Filter by `author_person_id` within same family; should return posts
- **`test_filter_by_author_person_id_different_family`**: Filter by `author_person_id` from different family; should return 404 error
- **`test_filter_by_author_person_id_requires_family_membership`**: User not in family cannot filter by person; should return 403

### 4. Profile View Tests (type=POST only)
- **`test_profile_view_returns_only_posts`**: GET `/api/feed/?family_id=X&author_person_id=Y` (no type param) defaults to `type=POST` only
- **`test_profile_view_same_family_success`**: Profile view for person in same family succeeds
- **`test_profile_view_different_family_forbidden`**: Profile view for person in different family returns 403

### 5. Scope=all_families Tests
- **`test_scope_all_families_author_user_success`**: User viewing own posts with `scope=all_families&author_person_id=X` succeeds across families
- **`test_scope_all_families_requires_author_person_id`**: `scope=all_families` without `author_person_id` returns 400
- **`test_scope_all_families_rejects_other_users`**: User trying to view another user's posts with `scope=all_families` returns 403
- **`test_scope_all_families_only_shows_own_posts`**: Verify only posts by the requesting user are returned

### 6. Comment Restrictions Tests
- **`test_comment_allowed_on_post`**: POST `/api/feed/posts/<post_id>/comments/` on POST type succeeds
- **`test_comment_allowed_on_announcement`**: POST comment on ANNOUNCEMENT type succeeds
- **`test_comment_blocked_on_message`**: POST comment on MESSAGE type returns 403 with error message
- **`test_list_comments_blocked_on_message`**: GET comments on MESSAGE type returns 403

### 7. Cross-Family Access Tests
- **`test_cross_family_feed_access_forbidden`**: User from Family A cannot access feed of Family B (403)
- **`test_cross_family_comment_access_forbidden`**: User from Family A cannot comment on post from Family B (403)
- **`test_cross_family_profile_access_forbidden`**: User from Family A cannot view profile of person from Family B (403)

## Test Setup Pattern

Each test will follow this pattern:
1. Create users using `get_user_model()`
2. Authenticate via `/api/auth/token/` endpoint
3. Create families via `/api/families/`
4. Create persons via `/api/graph/persons/`
5. Use `APIClient` with Bearer token authentication
6. Assert status codes and response content

## Key Test Scenarios

### Multi-User Setup
Tests requiring multiple users/families will:
- Create User A, Family A, Person A1, Person A2
- Create User B, Family B, Person B1
- Create memberships linking users to families
- Test cross-family restrictions

### Validation Assertions
- Status codes: 200, 201, 400, 403, 404
- Error messages in response JSON
- Response data structure matches expected format
- Filter results contain only expected items

## Files to Create

- `family-app/backend/tests/test_feed_messages_comments.py` - Main test file with all test functions

## Dependencies

- Uses existing models: `Post`, `PostComment`, `Family`, `Person`, `FamilyMembership`
- Uses existing serializers and views from `apps.feed`
- Follows pytest patterns from `test_phase3_feed.py`
- Uses `APIClient` from `rest_framework.test`
- Uses `@pytest.mark.django_db` decorator for database access