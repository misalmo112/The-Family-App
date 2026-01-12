---
name: Feed App Integration
overview: Integrate the feed app by adding URL routing to config/urls.py, ensuring migrations are applied, and updating README with feed endpoint documentation.
todos:
  - id: add-feed-urls
    content: Add feed URL include to config/urls.py
    status: completed
  - id: verify-migrations
    content: Verify feed migrations are properly configured and can be applied
    status: completed
  - id: update-readme-feed
    content: Add feed API usage examples and endpoint documentation to README.md
    status: completed
    dependencies:
      - add-feed-urls
---

# Feed App Integration Plan

## Overview

Complete the integration of the feed app by adding URL routing, verifying migrations, and documenting the feed endpoints in the README.

## Current State Analysis

**Already Implemented:**

- ✅ Post model with all required fields
- ✅ PostSerializer and PostCreateSerializer with validation
- ✅ PostCreateView and PostListView with pagination
- ✅ feed/urls.py with URL patterns
- ✅ Migration file (0001_post.py) exists with proper dependencies

**Needs Integration:**

- ❌ Feed URLs not included in `config/urls.py`
- ❌ Migrations may not be applied to database
- ❌ README lacks feed endpoint documentation

## Implementation Steps

### 1. Add Feed URL Routing

**File:** [family-app/backend/config/urls.py](family-app/backend/config/urls.py)

Add URL include for feed app:

- Add `path('api/feed/', include('apps.feed.urls'))` to urlpatterns

This will make endpoints available at:

- `POST /api/feed/posts/` - Create post
- `GET /api/feed/?family_id=<id>` - List posts

### 2. Verify and Apply Migrations

**Action:** Ensure feed migrations are applied

The migration file `0001_post.py` exists and has correct dependencies:

- Depends on `families.0002_initial`
- Depends on `graph.0002_relationship`
- Depends on `AUTH_USER_MODEL`

Since `pytest.ini` no longer has `--nomigrations`, migrations should run automatically during tests. For manual setup, ensure `python manage.py migrate` is run.

### 3. Update README Documentation

**File:** [README.md](README.md)

Add a new "Feed API Usage" section with examples for:

- Creating a post (`POST /api/feed/posts/`)
- Listing posts (`GET /api/feed/?family_id=<id>&page=<page>`)
- Include curl examples with JWT authentication headers
- Document pagination response format
- Document post types (POST, ANNOUNCEMENT)
- Document optional fields (author_person_id, image_url)

Also update the "API Endpoints" section to include feed endpoints.

## Files to Modify

1. [family-app/backend/config/urls.py](family-app/backend/config/urls.py) - Add feed URL include
2. [README.md](README.md) - Add feed API documentation

## Migration Notes

The migration file is already created and has proper dependencies. It will be applied automatically when:

- Running `python manage.py migrate` manually
- Running pytest tests (since `--nomigrations` was removed)

No additional migration work is needed unless the database needs to be migrated manually.

## Documentation Structure

The README should include:

1. **Feed API Usage section** with:

- Creating posts (with and without author_person_id, with and without image_url)
- Listing posts with pagination
- Example request/response payloads

2. **Updated API Endpoints section** listing:

- `POST /api/feed/posts/` - Create a new post
- `GET /api/feed/?family_id=<id>` - List posts for a family

## Testing Verification

After implementation, verify:

- Feed URLs are accessible
- Can create posts via API
- Can list posts with pagination
- Migration is applied (check database or run migrate)