import traceback
from apps.admin_panel.models import SystemErrorLog


def sanitize_payload(data):
    """
    Recursively sanitize data by removing sensitive keys.
    
    Removes keys matching: password, token, refresh, authorization (case-insensitive)
    
    Args:
        data: Dictionary, list, or primitive value to sanitize
    
    Returns:
        Sanitized copy of data structure
    """
    # List of sensitive keys to remove (case-insensitive)
    SENSITIVE_KEYS = {'password', 'token', 'refresh', 'authorization'}
    
    if data is None:
        return None
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # Check if key (case-insensitive) is in sensitive keys
            if key.lower() not in SENSITIVE_KEYS:
                # Recursively sanitize nested structures
                sanitized[key] = sanitize_payload(value)
            # Otherwise, skip this key
        return sanitized
    
    elif isinstance(data, list):
        # Recursively sanitize each item in the list
        return [sanitize_payload(item) for item in data]
    
    else:
        # Primitive types (str, int, float, bool, etc.) are returned as-is
        return data


def log_error(exc, request=None, status_code=None, payload=None):
    """
    Log a system error safely.
    
    Args:
        exc: Exception instance
        request: Optional Django request object
        status_code: Optional HTTP status code
        payload: Optional request payload/data to sanitize and log
    
    Returns:
        SystemErrorLog instance or None if creation failed
    """
    try:
        # Extract exception message
        message = str(exc) if exc else 'Unknown error'
        if len(message) > 255:
            message = message[:252] + '...'
        
        # Extract traceback
        tb = None
        if exc:
            try:
                tb = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))
            except Exception:
                # If traceback extraction fails, continue without it
                pass
        
        # Extract request information
        endpoint = None
        method = None
        user_id = None
        family_id = None
        request_id = None
        
        if request is not None:
            try:
                # Extract endpoint (path)
                endpoint = getattr(request, 'path', None)
                if endpoint and len(endpoint) > 255:
                    endpoint = endpoint[:252] + '...'
                
                # Extract HTTP method
                method = getattr(request, 'method', None)
                if method and len(method) > 10:
                    method = method[:10]
                
                # Extract user_id if user is authenticated
                user = getattr(request, 'user', None)
                if user and hasattr(user, 'is_authenticated'):
                    if user.is_authenticated:
                        user_id = getattr(user, 'id', None) or getattr(user, 'pk', None)
                
                # Try to extract family_id from various sources
                # Check query params (GET requests)
                if hasattr(request, 'query_params'):
                    family_id_str = request.query_params.get('family_id')
                    if family_id_str:
                        try:
                            family_id = int(family_id_str)
                        except (ValueError, TypeError):
                            pass
                
                # Check request data (POST/PUT requests)
                if family_id is None and hasattr(request, 'data'):
                    family_id_value = request.data.get('family_id')
                    if family_id_value:
                        try:
                            family_id = int(family_id_value)
                        except (ValueError, TypeError):
                            pass
                
                # Check request.GET (fallback for non-DRF requests)
                if family_id is None and hasattr(request, 'GET'):
                    family_id_str = request.GET.get('family_id')
                    if family_id_str:
                        try:
                            family_id = int(family_id_str)
                        except (ValueError, TypeError):
                            pass
                
                # Extract request_id from headers (common pattern: X-Request-ID)
                if hasattr(request, 'META'):
                    request_id = request.META.get('HTTP_X_REQUEST_ID') or request.META.get('X-Request-ID')
                    if request_id and len(request_id) > 64:
                        request_id = request_id[:64]
            
            except Exception:
                # If request extraction fails, continue with None values
                pass
        
        # Sanitize payload
        payload_sanitized = None
        if payload is not None:
            try:
                payload_sanitized = sanitize_payload(payload)
            except Exception:
                # If sanitization fails, don't log payload
                pass
        
        # Create error log entry
        error_log = SystemErrorLog.objects.create(
            level='ERROR',
            message=message,
            traceback=tb,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            user_id=user_id,
            family_id=family_id,
            request_id=request_id,
            payload_sanitized=payload_sanitized
        )
        
        return error_log
    
    except Exception:
        # Silently fail to prevent logging failures from breaking application flow
        # In production, you might want to log this to a separate error handler
        return None
