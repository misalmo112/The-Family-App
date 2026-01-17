---
name: Error Logging Middleware
overview: Create Django middleware to log unhandled exceptions by calling admin_panel.services.error_logging.log_error, with graceful fallback if admin_panel is not installed.
todos: []
---

# Error Logging Middleware Implementation

## Overview
Create middleware at `apps/core/middleware/error_log_middleware.py` that catches unhandled exceptions during request processing and logs them via `admin_panel.services.error_logging.log_error()`. The middleware must fail silently if admin_panel is not installed and never crash due to logging failures.

## Implementation Details

### File Structure
- Create directory: `family-app/backend/apps/core/middleware/`
- Create file: `family-app/backend/apps/core/middleware/__init__.py`
- Create file: `family-app/backend/apps/core/middleware/error_log_middleware.py`

### Middleware Implementation

**File: `apps/core/middleware/error_log_middleware.py`**

The middleware class will:
1. Implement Django's middleware interface (`__init__(get_response)` and `__call__(request)`)
2. Wrap the request/response cycle in a try/except block
3. On exception:
   - Attempt to import `admin_panel.services.error_logging`
   - If import succeeds, call `log_error(exc, request, status_code=500, payload=sanitized_data)`
   - Handle all errors (ImportError, AttributeError, etc.) silently
   - Re-raise the original exception
4. Sanitize request data:
   - Check if request has `data` attribute (DRF request)
   - Create a safe copy, removing sensitive fields (password, token, secret, etc.)
   - Limit payload size to prevent memory issues

### Key Safety Features
- Import wrapped in try/except ImportError
- Logging call wrapped in try/except to catch any errors
- Sanitization wrapped in try/except to handle edge cases
- Original exception always re-raised regardless of logging success/failure

### Integration Notes for Integrator

**Middleware Import Path:**
```
apps.core.middleware.error_log_middleware.ErrorLoggingMiddleware
```

**Recommended Placement in MIDDLEWARE:**
Add after authentication middleware but before view processing:
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

**Testing:**
- Middleware should not break app startup if admin_panel is not installed
- Middleware should not break app startup if admin_panel is installed but log_error function doesn't exist
- Original exceptions should still propagate normally