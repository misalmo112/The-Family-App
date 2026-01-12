---
name: Phase 1 Integration
overview: Integrate Phase 1 agents by adding URL routing for families and graph apps, resolving migration dependencies for cross-app foreign keys, fixing a URL conflict in graph app, and updating README with Phase 1 usage examples.
todos:
  - id: add-url-routing
    content: Add URL includes for /api/families/ and /api/graph/ in config/urls.py
    status: completed
  - id: fix-graph-urls
    content: Fix URL conflict in graph/urls.py - combine PersonCreateView and PersonListView or use proper routing
    status: completed
  - id: handle-migrations
    content: Run makemigrations and verify migration dependencies for cross-app FK references are correct
    status: completed
    dependencies:
      - add-url-routing
  - id: update-readme
    content: Add Phase 1 API usage examples to README.md with curl commands for all endpoints
    status: completed
---

# Phase 1 Integrati

on Plan

## Overview

Integrate the `families` and `graph` apps into the main URL configuration, resolve migration dependencies for cross-app foreign key references, fix a URL routing issue, and document Phase 1 API usage.

## Current State Analysis

**Already Complete:**

- `apps.families` and `apps.graph` are already in `INSTALLED_APPS` in [family-app/backend/config/settings.py](family-app/backend/config/settings.py)

**Needs Work:**

1. URL routing: [family-app/backend/config/urls.py](family-app/backend/config/urls.py) only includes `core` and `accounts` URLs

2. Migration dependencies: Cross-app FK references create circular dependency:

- `Person.family` → `families.Family` (graph depends on families)

- `FamilyMembership.person` → `graph.Person` (families depends on graph)

- `JoinRequest.chosen_person` → `graph.Person` (families depends on graph)

3. URL conflict: [family-app/backend/apps/graph/urls.py](family-app/backend/apps/graph/urls.py) has both views on same path `persons/`

4. Documentation: README.md lacks Phase 1 usage examples

## Implementation Steps

### 1. Add URL Routing

**File:** [family-app/backend/config/urls.py](family-app/backend/config/urls.py)

Add URL includes for families and graph apps:

- Add `path('api/families/', include('apps.families.urls'))`
- Add `path('api/graph/', include('apps.graph.urls'))`

### 2. Fix Graph URLs Conflict

**File:** [family-app/backend/apps/graph/urls.py](family-app/backend/apps/graph/urls.py)

Both `PersonCreateView` (POST) and `PersonListView` (GET) are mapped to `persons/`. Since they're different HTTP methods on the same view class pattern, this should work, but verify the views handle both methods or split them properly. Looking at the views:

- `PersonCreateView` only has `post()` method
- `PersonListView` only has `get()` method

These should work on the same URL with different methods, but the current setup has them as separate views. The proper fix is to use a single view class that handles both methods, or keep them separate but ensure the URL routing works. However, since DRF's `APIView` handles this automatically when both views are on the same path with different methods, we should combine them into one view class OR use different paths. The cleanest solution is to use a single view class with both methods.

Actually, wait - looking more carefully, they ARE separate view classes. In DRF, you can't have two separate view classes on the same path. We need to either:

- Combine into one view class with both `get()` and `post()` methods
- Use different URL paths

Given the views are already separate and have different logic, the cleanest approach is to use different paths or combine them. Let me check the views again... Actually, the standard REST pattern would be:

- `GET /api/graph/persons/` - list

- `POST /api/graph/persons/` - create

But with separate view classes, we need to combine them. However, since the user's acceptance criteria mentions "can create person as admin", I'll keep them separate but fix the URL routing to use a combined view or proper method-based routing.

**Solution:** Create a combined `PersonViewSet` or use a single `PersonView` class with both `get()` and `post()` methods, OR use different URL patterns. Given the existing code structure, I'll modify the views to be combined into a single view class.

### 3. Resolve Migration Dependencies

**Files:** Migration files (to be created)

The models use string references (`'graph.Person'`, `'families.Family'`) which helps, but we need to ensure proper migration dependencies:

1. **First migration:** `families` app - create `Family` model (no dependencies on graph)

2. **Second migration:** `graph` app - create `Person` model with FK to `families.Family`

3. **Third migration:** `families` app - add `FamilyMembership` and `JoinRequest` models with FKs to `graph.Person`

Django should handle this automatically when using string references, but we may need to explicitly set `dependencies` in migration files if Django doesn't detect them correctly.**Strategy:**

- Run `makemigrations` for `families` first (creates Family model)

- Run `makemigrations` for `graph` (creates Person with FK to Family)

- Run `makemigrations` for `families` again (creates FamilyMembership and JoinRequest with FKs to Person)

- If Django creates all migrations in one go, verify the dependencies are correct

### 4. Update README with Phase 1 Examples

**File:** [README.md](README.md)

Add a new "Phase 1 API Usage" section with examples for:

- Creating a family (`POST /api/families/`)

- Listing families (`GET /api/families/`)

- Submitting join request (`POST /api/families/join/`)

- Approving join request (`POST /api/families/join-requests/<id>/approve/`)

- Creating a person as admin (`POST /api/graph/persons/`)

- Listing persons (`GET /api/graph/persons/?family_id=<id>`)

Include curl examples with JWT authentication headers.

## Migration Order Strategy

Since models use string references for cross-app FKs, Django should handle dependencies automatically. However, to ensure clean migration order:

1. Ensure `families` app is listed before `graph` in `INSTALLED_APPS` (currently it is)

2. When running `makemigrations`, Django will create migrations in dependency order

3. If issues arise, we may need to manually set `dependencies` in migration files

## Testing Verification

After implementation, verify:

- `python manage.py migrate` runs successfully
- Can create family via API

- Can list families via API  

- Can submit join request via API

- Can approve join request via API

- Can create person as admin via API

- `pytest` passes Phase 1 tests (assuming they exist or will be created)

## Files to Modify

1. [family-app/backend/config/urls.py](family-app/backend/config/urls.py) - Add URL includes

2. [family-app/backend/apps/graph/urls.py](family-app/backend/apps/graph/urls.py) - Fix URL routing conflict

3. [family-app/backend/apps/graph/views.py](family-app/backend/apps/graph/views.py) - Potentially combine views or fix routing

4. [README.md](README.md) - Add Phase 1 usage examples