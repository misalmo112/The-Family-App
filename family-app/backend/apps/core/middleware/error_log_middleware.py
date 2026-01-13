"""
Error logging middleware for unhandled exceptions.

This middleware catches unhandled exceptions during request processing and
attempts to log them via admin_panel.services.error_logging.log_error().

The middleware fails silently if admin_panel is not installed or if logging
fails for any reason, ensuring it never breaks the application.
"""

import copy
import logging

logger = logging.getLogger(__name__)

# Sensitive field names to remove from request payload
SENSITIVE_FIELDS = {
    'password', 'passwd', 'pwd', 'secret', 'token', 'api_key', 'apikey',
    'access_token', 'refresh_token', 'authorization', 'auth', 'credentials',
    'private_key', 'privatekey', 'session_key', 'sessionid', 'csrf_token',
    'csrfmiddlewaretoken', 'credit_card', 'creditcard', 'card_number',
    'cvv', 'ssn', 'social_security_number'
}

# Maximum payload size in characters (to prevent memory issues)
MAX_PAYLOAD_SIZE = 10000


def _sanitize_payload(data):
    """
    Sanitize request payload by removing sensitive fields and limiting size.
    
    Args:
        data: Request data (dict, QueryDict, or similar)
        
    Returns:
        Sanitized dict or None if sanitization fails
    """
    try:
        if data is None:
            return None
            
        # Convert to dict if needed (handles DRF request.data, QueryDict, etc.)
        if hasattr(data, 'dict'):
            payload = data.dict()
        elif isinstance(data, dict):
            payload = copy.deepcopy(data)
        else:
            # Try to convert to dict
            try:
                payload = dict(data)
            except (TypeError, ValueError):
                return None
        
        # Remove sensitive fields (case-insensitive)
        sanitized = {}
        for key, value in payload.items():
            key_lower = str(key).lower()
            # Check if any sensitive field name is in the key
            if not any(sensitive in key_lower for sensitive in SENSITIVE_FIELDS):
                sanitized[key] = value
        
        # Limit payload size by converting to string and truncating
        payload_str = str(sanitized)
        if len(payload_str) > MAX_PAYLOAD_SIZE:
            # Truncate and add indicator
            sanitized = {
                '_truncated': True,
                '_original_size': len(payload_str),
                '_data': payload_str[:MAX_PAYLOAD_SIZE]
            }
        
        return sanitized
    except Exception:
        # Fail silently - return None if sanitization fails
        return None


def _get_sanitized_request_data(request):
    """
    Extract and sanitize request data if available.
    
    Args:
        request: Django or DRF request object
        
    Returns:
        Sanitized dict or None
    """
    try:
        # Check for DRF request.data
        if hasattr(request, 'data'):
            return _sanitize_payload(request.data)
        
        # Check for Django request.POST
        if hasattr(request, 'POST') and request.POST:
            return _sanitize_payload(request.POST)
        
        # Check for Django request.GET
        if hasattr(request, 'GET') and request.GET:
            return _sanitize_payload(request.GET)
        
        return None
    except Exception:
        return None


class ErrorLoggingMiddleware:
    """
    Middleware to log unhandled exceptions via admin_panel error logging service.
    
    This middleware wraps the request/response cycle and catches any unhandled
    exceptions. If admin_panel.services.error_logging is available, it attempts
    to log the error. All errors during logging are handled silently to ensure
    the middleware never breaks the application.
    """
    
    def __init__(self, get_response):
        """
        Initialize the middleware.
        
        Args:
            get_response: Callable that takes a request and returns a response
        """
        self.get_response = get_response
        self._error_logging_available = None
        self._log_error_func = None
        
        # Try to import error logging service (only once at startup)
        self._try_import_error_logging()
    
    def _try_import_error_logging(self):
        """
        Attempt to import admin_panel error logging service.
        
        Sets self._error_logging_available and self._log_error_func if successful.
        Fails silently if import fails.
        """
        try:
            from apps.admin_panel.services import error_logging
            if hasattr(error_logging, 'log_error'):
                self._log_error_func = error_logging.log_error
                self._error_logging_available = True
            else:
                self._error_logging_available = False
        except ImportError:
            # admin_panel not installed - this is expected and fine
            self._error_logging_available = False
        except Exception:
            # Any other error during import - fail silently
            self._error_logging_available = False
    
    def __call__(self, request):
        """
        Process the request and catch unhandled exceptions.
        
        Args:
            request: Django request object
            
        Returns:
            Response object
            
        Raises:
            Re-raises any exception that occurs during request processing
        """
        try:
            response = self.get_response(request)
            return response
        except Exception as exc:
            # Attempt to log the error
            self._log_error(exc, request)
            # Always re-raise the original exception
            raise
    
    def _log_error(self, exc, request):
        """
        Attempt to log the error via admin_panel error logging service.
        
        Args:
            exc: The exception that occurred
            request: The request object
        """
        # If error logging is not available, do nothing
        if not self._error_logging_available or self._log_error_func is None:
            return
        
        try:
            # Get sanitized request data
            sanitized_payload = _get_sanitized_request_data(request)
            
            # Call the error logging function
            # Expected signature: log_error(exc, request, status_code=500, payload=None)
            self._log_error_func(
                exc,
                request,
                status_code=500,
                payload=sanitized_payload
            )
        except Exception:
            # Fail silently - never let logging errors break the application
            # Optionally log to Django's logger for debugging (but don't raise)
            logger.debug(
                "Failed to log error via admin_panel error logging service",
                exc_info=True
            )
