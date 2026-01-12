---
name: Full Django Scaffold Implementation
overview: Reorganize Django project structure under backend/, implement all required configuration files, set up pytest, and ensure all endpoints and settings are properly configured.
todos:
  - id: reorganize-structure
    content: "Move Django project structure: config/, apps/, manage.py, requirements.txt to backend/ directory"
    status: completed
  - id: update-imports
    content: Update all import paths in moved files (manage.py, settings.py, urls.py, app files)
    status: completed
    dependencies:
      - reorganize-structure
  - id: create-env-example
    content: Create backend/.env.example with all required environment variables
    status: completed
    dependencies:
      - reorganize-structure
  - id: verify-settings
    content: "Verify and fix settings.py: CORS for localhost:5173, env loading, database config, timezone, AUTH_USER_MODEL"
    status: completed
    dependencies:
      - reorganize-structure
  - id: verify-endpoints
    content: Verify health endpoint and JWT endpoints are correctly routed
    status: completed
    dependencies:
      - reorganize-structure
  - id: setup-pytest
    content: Create pytest.ini and tests/conftest.py for pytest-django configuration
    status: completed
    dependencies:
      - reorganize-structure
  - id: update-readme
    content: Update README.md with correct paths (backend/ directory structure)
    status: completed
    dependencies:
      - reorganize-structure
  - id: create-phase0-tests
    content: Create basic Phase 0 tests to verify setup (health endpoint, database connection)
    status: completed
    dependencies:
      - setup-pytest
---

# Full Django Scaffold Implementation



## Overview

Reorganize the Django project structure to match the required layout (backend/config/ and backend/apps/), create missing configuration files, set up pytest, and ensure all requirements are met.

## Current State Analysis

- Docker compose already configured correctly

- Django project exists at `family-app/config/` (needs to move to `backend/config/`)

- Apps exist at `family-app/apps/` (needs to move to `backend/apps/`)

- Custom User model exists in accounts app

- Health endpoint exists

- JWT endpoints exist

- Settings mostly configured (needs CORS fix for localhost:5173)

- Missing: `.env.example`, `pytest.ini`, `conftest.py`
- README exists but paths need updating

## Implementation Tasks

### 1. Reorganize Project Structure

- Move `family-app/config/` → `family-app/backend/config/`

- Move `family-app/apps/` → `family-app/backend/apps/`

- Move `family-app/manage.py` → `family-app/backend/manage.py`
- Move `family-app/requirements.txt` → `family-app/backend/requirements.txt`

- Update `manage.py` to reference correct settings path

- Update all import paths in moved files

### 2. Create Environment Configuration

- Create `family-app/backend/.env.example` with:

- `DEBUG=True`

- `SECRET_KEY` (placeholder)

- `DB_NAME=family_app`

- `DB_USER=family_user`

- `DB_PASSWORD=family_pass`

- `DB_HOST=localhost`

- `DB_PORT=5432`

- `ALLOWED_HOSTS=127.0.0.1,localhost`

- `CORS_ALLOWED_ORIGINS=http://localhost:5173`

### 3. Update Settings Configuration

- Verify `family-app/backend/config/settings.py`:

- Loads env vars via dotenv (already done)

- Database config from env vars (already done)

- `TIME_ZONE = 'Asia/Dubai'` (already set)

- `AUTH_USER_MODEL = 'accounts.User'` (already set)

- CORS allows `http://localhost:5173` (needs verification/fix)

- JWT authentication configured (already done)

### 4. Verify Endpoints

- Health endpoint: `GET /health/` → `apps.core.views.health_check` (already exists)

- JWT endpoints: `/api/auth/token/` and `/api/auth/token/refresh/` (already exist)

- Ensure URL routing in `config/urls.py` is correct

### 5. Set Up Pytest

- Create `family-app/backend/pytest.ini` with Django test configuration

- Create `family-app/backend/tests/conftest.py` with pytest-django setup
- Ensure pytest can discover and run tests

### 6. Update Documentation

- Update `README.md` with correct paths (backend/ instead of root)

- Update `CODE_STRUCTURE.md` if needed to reflect actual structure

- Ensure setup commands are accurate

### 7. Verify All Requirements

- Docker compose: Postgres 16, correct credentials, volume (already done)
- Requirements.txt: All specified packages (already done)

- Custom User model: AbstractUser extension (already exists)

- All acceptance criteria met

## Files to Create/Modify

**New Files:**

- `family-app/backend/.env.example`

- `family-app/backend/pytest.ini`

- `family-app/backend/tests/conftest.py`

**Files to Move:**

- `family-app/config/` → `family-app/backend/config/`

- `family-app/apps/` → `family-app/backend/apps/`

- `family-app/manage.py` → `family-app/backend/manage.py`

- `family-app/requirements.txt` → `family-app/backend/requirements.txt`

**Files to Update:**

- `family-app/backend/manage.py` (settings module path)

- `family-app/backend/config/settings.py` (CORS verification)

- `family-app/backend/config/urls.py` (verify routing)

- `README.md` (update paths)

- All app `__init__.py` files if needed for imports

## Key Configuration Details

**CORS Settings:**

- Must allow `http://localhost:5173` explicitly

- Current default includes it but should verify exact format

**Pytest Configuration:**

- `pytest.ini`: Set Django settings module, test discovery patterns

- `conftest.py`: Configure pytest-django, set up test database

**Environment Variables:**

- All database config from env

- All security settings from env

- CORS origins from env with default

## Acceptance Criteria Verification

After implementation:

1. `docker compose up -d` works

2. `cd backend && python manage.py migrate` works

3. `GET /health/` returns `{"status":"ok"}`
4. JWT token obtain works after `createsuperuser`