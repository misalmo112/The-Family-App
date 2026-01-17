---
name: Admin Panel App with Models and Services
overview: Create a new Django app `admin_panel` with three models (SystemErrorLog, AuditLog, Feedback) and two service modules (audit.py and error_logging.py) for logging and auditing functionality.
todos:
  - id: create-app-structure
    content: Create admin_panel app directory structure with __init__.py, apps.py, and services/ directory
    status: completed
  - id: create-models
    content: Create models.py with SystemErrorLog, AuditLog, and Feedback models with all specified fields
    status: completed
  - id: create-audit-service
    content: Create services/audit.py with log_action function that safely creates AuditLog records
    status: completed
  - id: create-error-logging-service
    content: Create services/error_logging.py with sanitize_payload and log_error functions
    status: completed
  - id: register-app
    content: Register admin_panel app in config/settings.py INSTALLED_APPS
    status: completed
  - id: create-migrations
    content: Generate and verify migrations work correctly
    status: completed
---

# Admin Panel App - Models and Services

## Overview
Create a new Django app `admin_panel` in `backend/apps/admin_panel/` with models for error logging, audit trails, and user feedback, along with service modules to handle logging operations safely.

## File Structure
```
backend/apps/admin_panel/
├── __init__.py
├── apps.py
├── models.py
└── services/
    ├── __init__.py
    ├── audit.py
    └── error_logging.py
```

## Implementation Details

### 1. App Configuration
- Create `apps.py` following the pattern from `[apps/families/apps.py](family-app/backend/apps/families/apps.py)`
- Register app in `[config/settings.py](family-app/backend/config/settings.py)` under `INSTALLED_APPS`

### 2. Models (`models.py`)

#### SystemErrorLog
- `created_at`: DateTimeField with `auto_now_add=True`
- `level`: CharField with choices `ERROR`, `WARN` (max_length=10)
- `message`: CharField (max_length=255)
- `traceback`: TextField (null=True, blank=True)
- `endpoint`: CharField (max_length=255, null=True, blank=True)
- `method`: CharField (max_length=10, null=True, blank=True)
- `status_code`: IntegerField (null=True, blank=True)
- `user_id`: IntegerField (null=True, blank=True)
- `family_id`: IntegerField (null=True, blank=True)
- `request_id`: CharField (max_length=64, null=True, blank=True)
- `payload_sanitized`: JSONField (null=True, blank=True)
- Meta: ordering by `-created_at`

#### AuditLog
- `created_at`: DateTimeField with `auto_now_add=True`
- `actor_user_id`: IntegerField (null=True, blank=True)
- `actor_is_superadmin`: BooleanField (default=False)
- `action_type`: CharField (max_length=64)
- `entity_type`: CharField (max_length=64)
- `entity_id`: CharField (max_length=64)
- `family_id`: IntegerField (null=True, blank=True)
- `before`: JSONField (null=True, blank=True)
- `after`: JSONField (null=True, blank=True)
- `meta`: JSONField (null=True, blank=True)
- Meta: ordering by `-created_at`

#### Feedback
- `created_at`: DateTimeField with `auto_now_add=True`
- `user_id`: IntegerField (null=True, blank=True)
- `family_id`: IntegerField (null=True, blank=True)
- `type`: CharField with choices `BUG`, `FEATURE`, `ABUSE`, `GENERAL` (max_length=20)
- `title`: CharField (max_length=120)
- `description`: TextField
- `status`: CharField with choices `NEW`, `IN_PROGRESS`, `RESOLVED` (max_length=20, default='NEW')
- `page`: CharField (max_length=120, null=True, blank=True)
- `meta`: JSONField (null=True, blank=True)
- Meta: ordering by `-created_at`

### 3. Services

#### `services/audit.py`
Function: `log_action(actor_user, action_type, entity_type, entity_id, family_id=None, before=None, after=None, meta=None)`
- Safely extract `actor_user_id` from user object (handle None)
- Determine `actor_is_superadmin` from user (default False)
- Create AuditLog instance with all provided parameters
- Handle None values gracefully
- Use try/except to prevent logging failures from breaking application flow

#### `services/error_logging.py`
Function: `sanitize_payload(data)`
- Recursively sanitize dictionary/list data
- Remove keys matching: `password`, `token`, `refresh`, `authorization` (case-insensitive)
- Return sanitized copy of data structure
- Handle None, dict, list, and primitive types

Function: `log_error(exc, request, status_code=None, payload=None)`
- Extract exception message and traceback
- Extract endpoint, method from request (handle None)
- Extract user_id from request.user if authenticated
- Extract family_id from request if available (may need to check context)
- Generate or extract request_id if available
- Sanitize payload using `sanitize_payload`
- Create SystemErrorLog with level='ERROR'
- Use try/except to prevent logging failures from breaking application flow

### 4. Import Strategy
- Services should import models using `from apps.admin_panel.models import ...`
- Avoid importing services in models to prevent circular imports
- Services can be imported by views/middleware without circular dependency issues

### 5. Migrations
- Run `python manage.py makemigrations admin_panel` after creating models
- Verify migrations are created successfully
- Test migration with `python manage.py migrate`

## Testing Checklist
- [ ] App registered in settings.py
- [ ] Models can be imported without errors
- [ ] Services can be imported without circular import errors
- [ ] `makemigrations` creates migration files
- [ ] `migrate` runs successfully
- [ ] `sanitize_payload` removes sensitive keys correctly
- [ ] `log_action` creates AuditLog records safely
- [ ] `log_error` creates SystemErrorLog records safely

## Notes
- All nullable fields should allow None values
- Services should be defensive and not raise exceptions
- Follow Django model conventions from existing apps (e.g., `[apps/families/models.py](family-app/backend/apps/families/models.py)`)
- Use TextChoices for model field choices where appropriate
- JSONField is available in Django 5.2.6 (already used in families app)