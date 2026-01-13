from apps.admin_panel.models import AuditLog


def log_action(actor_user, action_type, entity_type, entity_id, family_id=None, before=None, after=None, meta=None):
    """
    Log an audit action safely.
    
    Args:
        actor_user: User instance or None
        action_type: String describing the action (e.g., 'CREATE', 'UPDATE', 'DELETE')
        entity_type: String describing the entity type (e.g., 'Family', 'Person')
        entity_id: String or integer ID of the entity
        family_id: Optional integer family ID
        before: Optional JSON-serializable dict/object representing state before action
        after: Optional JSON-serializable dict/object representing state after action
        meta: Optional JSON-serializable dict with additional metadata
    
    Returns:
        AuditLog instance or None if creation failed
    """
    try:
        # Safely extract actor_user_id
        actor_user_id = None
        actor_is_superadmin = False
        
        if actor_user is not None:
            # Handle both User objects and None
            try:
                actor_user_id = getattr(actor_user, 'id', None) or getattr(actor_user, 'pk', None)
                actor_is_superadmin = getattr(actor_user, 'is_superadmin', False)
            except (AttributeError, TypeError):
                # If actor_user is not a proper user object, leave as None
                pass
        
        # Ensure entity_id is a string
        if entity_id is not None:
            entity_id = str(entity_id)
        
        # Create audit log entry
        audit_log = AuditLog.objects.create(
            actor_user_id=actor_user_id,
            actor_is_superadmin=actor_is_superadmin,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            family_id=family_id,
            before=before,
            after=after,
            meta=meta
        )
        
        return audit_log
    except Exception:
        # Silently fail to prevent logging failures from breaking application flow
        # In production, you might want to log this to a separate error handler
        return None
