---
name: Django DRF Family App Scaffold
overview: Scaffold a Django DRF backend with JWT auth, PostgreSQL via Docker, custom user model, health endpoint, and comprehensive documentation including CODE_STRUCTURE.md for future development.
todos:
  - id: docker-setup
    content: Create docker-compose.yml with PostgreSQL 16 service
    status: completed
  - id: django-project
    content: Initialize Django project (config) and create all apps (core, accounts, families, graph, feed)
    status: completed
  - id: requirements
    content: Create requirements.txt with all necessary dependencies
    status: completed
  - id: settings-config
    content: Configure settings.py with env vars, Postgres, DRF, JWT, CORS
    status: completed
    dependencies:
      - django-project
  - id: env-example
    content: Create .env.example with all required environment variables
    status: completed
  - id: custom-user
    content: Implement custom user model in accounts app and configure AUTH_USER_MODEL
    status: completed
    dependencies:
      - django-project
  - id: health-endpoint
    content: Create health check endpoint in core app (/health/)
    status: completed
    dependencies:
      - django-project
  - id: jwt-endpoints
    content: Add JWT authentication endpoints (/api/auth/token/ and /api/auth/token/refresh/)
    status: completed
    dependencies:
      - custom-user
  - id: gitignore
    content: Create .gitignore with common Python/Django/Node ignores
    status: completed
  - id: readme
    content: Create README.md with setup and run instructions
    status: completed
  - id: code-structure
    content: Create CODE_STRUCTURE.md documenting folder layout, app responsibilities, and conventions
    status: completed
  - id: frontend-folder
    content: Create empty frontend/ folder for future use
    status: completed
---

# Django DRF Family Social Networ

k - Initial Scaffold

## Overview

Create a complete Django DRF project scaffold with PostgreSQL, JWT authentication, and a well-documented structure for a family social network application.

## Implementation Plan

### 1. Docker Compose Setup

Create `docker-compose.yml` at repo root:

- PostgreSQL 16 service
- Container name: `family_postgres`

- Port: 5432

- Volume for data persistence

- Environment variables: POSTGRES_DB=family_app, POSTGRES_USER=family_user, POSTGRES_PASSWORD=family_pass

### 2. Project Structure

Create the following directory structure:

```javascript
family-app/
  backend/
    manage.py
    config/ (Django project)
    apps/ (Django apps)
      core/
      accounts/
      families/
      graph/
      feed/
    requirements.txt
    .env.example
  frontend/ (empty folder)
  docker-compose.yml
  README.md
  CODE_STRUCTURE.md
  .gitignore
```



### 3. Django Project Initialization

- Create Django project named `config` in `backend/`

- Create Django apps: `core`, `accounts`, `families`, `graph`, `feed` under `backend/apps/`

- Ensure apps are importable as `apps.<appname>`

- Update `INSTALLED_APPS` in settings

### 4. Backend Configuration

**File: `backend/config/settings.py`**

- Load environment variables using `python-dotenv`

- Configure PostgreSQL database connection using env vars

- Add Django REST Framework with JWT authentication as default

- Configure SimpleJWT settings (access/refresh tokens)

- Add CORS headers (allow localhost:5173, localhost:3000)

- Set TIME_ZONE = "Asia/Dubai"

- Set AUTH_USER_MODEL = "accounts.User"

**File: `backend/.env.example`**

- DEBUG=True

- SECRET_KEY=dev-secret-key

- DB_NAME=family_app

- DB_USER=family_user
- DB_PASSWORD=family_pass
- DB_HOST=localhost
- DB_PORT=5432

- ALLOWED_HOSTS=127.0.0.1,localhost

- CORS_ALLOWED_ORIGINS=http://localhost:5173

### 5. Custom User Model

**File: `backend/apps/accounts/models.py`**

- Extend `AbstractUser` from `django.contrib.auth.models`

- Keep username and email fields
- Create and run migrations before any other models

### 6. Health Check Endpoint

**File: `backend/apps/core/views.py`**

- Create `HealthCheckView` returning `{"status": "ok"}`

**File: `backend/apps/core/urls.py`**

- Route: `GET /health/`

**File: `backend/config/urls.py`**

- Include `core.urls` for health endpoint

### 7. JWT Authentication Endpoints

**File: `backend/apps/accounts/urls.py`**

- POST `/api/auth/token/` - TokenObtainPairView

- POST `/api/auth/token/refresh/` - TokenRefreshView

**File: `backend/config/urls.py`**

- Include `accounts.urls` under `/api/auth/`

### 8. Requirements File

**File: `backend/requirements.txt`**

- Django (5.x)

- djangorestframework

- djangorestframework-simplejwt

- django-cors-headers
- python-dotenv

- psycopg[binary] (or psycopg2-binary)
- pytest

- pytest-django

### 9. Documentation

**File: `README.md`**

- Prerequisites

- Step-by-step setup instructions

- Docker commands
- Virtual environment setup

- Migration commands

- Run server instructions
- Optional testing instructions

**File: `CODE_STRUCTURE.md`**

- Complete folder layout documentation

- App responsibilities:

- `core`: shared utilities, health checks, base mixins

- `accounts`: authentication, user model, JWT endpoints

- `families`: family entities, memberships, join codes (future)

- `graph`: person nodes, relationships, topology (future)

- `feed`: posts, announcements (future)

- Conventions:

- Business logic in `services/` modules

- Serializers as request/response boundaries

- URL routing patterns (`/api/<app>/...`)

- Environment variable usage

- Testing structure

- API routing conventions:

- `/health/` - health check

- `/api/auth/...` - authentication

- Future: `/api/families/...`, `/api/graph/...`, `/api/feed/...`

### 10. Git Configuration

**File: `.gitignore`**

- Python: `venv/`, `__pycache__/`, `*.pyc`, `.env`

- Node: `node_modules/`

- System: `.DS_Store`

- IDE: `.vscode/`, `.idea/`

- Django: `*.log`, `db.sqlite3`

## Validation Steps

1. `docker compose up -d` - starts PostgreSQL

2. `cd backend && python -m venv venv` - create virtual environment

3. `pip install -r requirements.txt` - install dependencies

4. `cp .env.example .env` - create environment file

5. `python manage.py makemigrations` - create migrations

6. `python manage.py migrate` - run migrations

7. `python manage.py createsuperuser` - create admin user

8. `python manage.py runserver` - start server

9. Test `GET http://127.0.0.1:8000/health/` - returns `{"status": "ok"}`

10. Test `POST http://127.0.0.1:8000/api/auth/token/` - returns JWT tokens

## Key Files to Create/Modify

- `docker-compose.yml` - PostgreSQL service

- `backend/manage.py` - Django management script

- `backend/config/settings.py` - Main configuration

- `backend/config/urls.py` - Root URL configuration

- `backend/apps/accounts/models.py` - Custom user model

- `backend/apps/core/views.py` - Health check view

- `backend/apps/accounts/urls.py` - Auth endpoints

- `backend/requirements.txt` - Python dependencies

- `backend/.env.example` - Environment template
- `README.md` - Setup instructions

- `CODE_STRUCTURE.md` - Architecture documentation

- `.gitignore` - Git ignore rules

## Notes

- All apps will have minimal structure (empty models, views, serializers, urls)

- No business logic beyond authentication and health check

- Custom user model must be created first to avoid migration conflicts