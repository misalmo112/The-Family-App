---
name: Create Phase 1 Test File
overview: Create the Phase 1 test file for family and membership functionality, and add required pytest fixtures to conftest.py
todos:
  - id: update-conftest
    content: Add api_client and user fixtures to conftest.py
    status: completed
  - id: create-test-file
    content: Create test_phase1_family_and_membership.py with the two test functions
    status: completed
    dependencies:
      - update-conftest
---

# Create Phase 1 Test

File

## Overview

Create `test_phase1_family_and_membership.py` in [`family-app/backend/tests/`](family-app/backend/tests/) with tests for family creation and join request/approval flow. Also update [`family-app/backend/tests/conftest.py`](family-app/backend/tests/conftest.py) to add the required `api_client` and `user` fixtures.

## Implementation Details

### 1. Update conftest.py

Add two pytest fixtures to [`family-app/backend/tests/conftest.py`](family-app/backend/tests/conftest.py):

- `api_client`: Returns an `APIClient` instance for making API requests

- `user`: Creates and returns a test user with username "testuser" and password "testpass123"

These fixtures will be used by the Phase 1 tests.

### 2. Create test_phase1_family_and_membership.py

Create the new test file at [`family-app/backend/tests/test_phase1_family_and_membership.py`](family-app/backend/tests/test_phase1_family_and_membership.py) with:

- `test_create_family_creates_admin_membership`: Tests that creating a family creates an admin membership and the family can be listed

- `test_join_request_and_approve_flow`: Tests the complete flow of joining a family via join request and approval

The tests use:

- `@pytest.mark.django_db` decorator for database access

- JWT authentication via `/api/auth/token/` endpoint

- Family creation via `POST /api/families/`

- Join request submission via `POST /api/families/join/`
- Join request listing via `GET /api/families/join-requests/`

- Join request approval via `POST /api/families/join-requests/{id}/approve/`

## Files to Modify

1. **`family-app/backend/tests/conftest.py`** - Add `api_client` and `user` fixtures

2. **`family-app/backend/tests/test_phase1_family_and_membership.py`** - Create new test file with provided test code

## Notes

- The families API endpoints are already implemented in the codebase

- pytest-django is already configured in requirements.txt

- The test file follows pytest conventions (not Django TestCase like test_phase0.py)