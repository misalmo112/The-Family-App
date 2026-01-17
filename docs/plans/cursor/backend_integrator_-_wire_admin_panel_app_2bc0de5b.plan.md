---
name: Backend Integrator - Wire Admin Panel App
overview: Wire up the admin_panel app by adding it to INSTALLED_APPS (already done), adding error logging middleware to MIDDLEWARE, including admin URLs in config/urls.py, running migrations, creating tests, and updating README with superadmin documentation.
todos:
  - id: fix_middleware_import
    content: Fix middleware import path from admin_panel to apps.admin_panel
    status: completed
  - id: add_middleware
    content: Add ErrorLoggingMiddleware to MIDDLEWARE in settings.py
    status: completed
  - id: add_urls
    content: Include admin_panel.urls in config/urls.py with path('api/admin/', include('apps.admin_panel.urls'))
    status: completed
  - id: run_migrations
    content: Run makemigrations and migrate to ensure all admin_panel models are created
    status: completed
  - id: create_tests
    content: Create tests/test_admin_panel.py with tests for /api/admin/health/ endpoint (superadmin only)
    status: completed
  - id: update_readme
    content: Update README.md with superadmin grant instructions and endpoints summary
    status: completed
---

# Backend Integrator - Wire Admin Panel App

## Overview

Complete the integration of the `admin_panel` app by wiring it into Django settings, adding middleware, including URLs, running migrations, creating tests, and documenting superadmin functionality.

## Current State

- ✅ `apps.admin_panel` already in `INSTALLED_APPS` (line 55 of settings.py)
- ❌ Error logging middleware not in `MIDDLEWARE`
- ❌ Admin panel URLs not included in `config/urls.py`
- ❌ Middleware has incorrect import path (`admin_panel` instead of `apps.admin_panel`)
- ❌ Tests not created yet
- ❌ README missing superadmin documentation

## Tasks

### 1. Fix Middleware Import Path

**File**: `family-app/backend/apps/core/middleware/error_log_middleware.py`

Fix the import on line 139:
- Change: `from admin_panel.services import error_logging`
- To: `from apps.admin_panel.services import error_logging`

### 2. Add Error Logging Middleware to MIDDLEWARE

**File**: `family-app/backend/config/settings.py`

Add middleware after `AuthenticationMiddleware`:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.error_log_middleware.ErrorLoggingMiddleware',  # Add here
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 3. Include Admin Panel URLs

**File**: `family-app/backend/config/urls.py`

Add admin panel URLs:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.core.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/families/', include('apps.families.urls')),
    path('api/graph/', include('apps.graph.urls')),
    path('api/feed/', include('apps.feed.urls')),
    path('api/admin/', include('apps.admin_panel.urls')),  # Add here
]
```

### 4. Run Migrations

Run migrations to ensure all admin_panel models are created:
```bash
cd family-app/backend
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Tests

**File**: `family-app/backend/tests/test_admin_panel.py` (NEW)

Create comprehensive tests for admin panel:
- Test `/api/admin/health/` endpoint (superadmin only)
- Test that non-superadmin users are blocked
- Test that superadmin users can access health endpoint
- Test permission enforcement

**Test Structure**:
- Use pytest and pytest-django
- Follow existing test patterns from `tests/test_phase*.py`
- Use `conftest.py` fixtures for user creation
- Test both authenticated and unauthenticated access
- Test superadmin vs regular user access

### 6. Update README

**File**: `README.md`

Add new section after "Development Notes":

**Superadmin Management**

**Granting Superadmin Status:**

To grant superadmin status to a user, you can use Django shell or admin panel:

**Option 1: Django Shell**
```bash
python manage.py shell
```
```python
from apps.accounts.models import User
user = User.objects.get(username='your_username')
user.is_superadmin = True
user.save()
```

**Option 2: Django Admin Panel**
1. Navigate to `http://127.0.0.1:8000/admin/`
2. Go to Users
3. Select the user
4. Check the "Is superadmin" checkbox
5. Save

**Superadmin Endpoints Summary:**

All endpoints under `/api/admin/` require superadmin status (`is_superadmin=True`).

**Health Check:**
- `GET /api/admin/health/` - System health check (returns status, time, db status)

**Statistics:**
- `GET /api/admin/stats/?days=30` - System statistics (users, families, posts, join requests)

**User Management:**
- `GET /api/admin/users/?q=&page=` - List users with search and pagination
- `POST /api/admin/users/<id>/disable/` - Disable a user
- `POST /api/admin/users/<id>/make-superadmin/` - Grant superadmin status
- `POST /api/admin/users/<id>/revoke-superadmin/` - Revoke superadmin status

**Family Management:**
- `GET /api/admin/families/?q=&page=` - List families with search and pagination
- `POST /api/admin/families/<id>/suspend/` - Suspend a family
- `POST /api/admin/families/<id>/unsuspend/` - Unsuspend a family

**Error Logs:**
- `GET /api/admin/logs/errors/?q=&page=&since_hours=` - List error logs
- `GET /api/admin/logs/errors/<id>/` - Get error log detail

**Audit Logs:**
- `GET /api/admin/logs/audit/?page=&action_type=&entity_type=&family_id=` - List audit logs

**Feedback Management:**
- `GET /api/admin/feedback/?page=&status=&type=` - List feedback
- `POST /api/admin/feedback/<id>/status/` - Update feedback status

**Note:** All admin endpoints require JWT authentication with a superadmin user token.

## Acceptance Criteria

- ✅ `/api/admin/health/` works only for superadmin users
- ✅ Non-superadmin users receive 403 Forbidden
- ✅ Error logging middleware is active and doesn't break app startup
- ✅ All migrations applied successfully
- ✅ Tests pass (`pytest` runs successfully)
- ✅ README updated with superadmin documentation

## Files to Modify

1. `family-app/backend/apps/core/middleware/error_log_middleware.py` - Fix import path
2. `family-app/backend/config/settings.py` - Add middleware
3. `family-app/backend/config/urls.py` - Add admin URLs
4. `family-app/backend/README.md` - Add superadmin documentation

## Files to Create

1. `family-app/backend/tests/test_admin_panel.py` - Admin panel tests

## Testing Checklist

- [ ] Middleware doesn't break app startup
- [ ] `/api/admin/health/` returns 200 for superadmin
- [ ] `/api/admin/health/` returns 403 for non-superadmin
- [ ] `/api/admin/health/` returns 401 for unauthenticated
- [ ] All migrations apply successfully
- [ ] Tests pass with `pytest`
- [ ] README documentation is clear and accurate