# Relationship service for creating relationships
from django.db import transaction
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from apps.graph.models import Relationship, RelationshipTypeChoices, Person
from apps.families.models import Family
from apps.graph.services.relationship_validator import validate_relationship


def add_parent(family, parent_person, child_person):
    """
    Create a PARENT_OF relationship (unidirectional: parent -> child).
    
    Args:
        family: Family instance
        parent_person: Person instance (the parent)
        child_person: Person instance (the child)
        
    Returns:
        Relationship instance
        
    Raises:
        ValidationError: If validation fails
    """
    # Validate the relationship
    validate_relationship(family, parent_person, child_person, RelationshipTypeChoices.PARENT_OF)
    
    # Check if relationship already exists
    if Relationship.objects.filter(
        family=family,
        from_person=parent_person,
        to_person=child_person,
        type=RelationshipTypeChoices.PARENT_OF
    ).exists():
        raise ValidationError("This parent-child relationship already exists.")
    
    # Create the relationship in a transaction
    with transaction.atomic():
        relationship = Relationship.objects.create(
            family=family,
            from_person=parent_person,
            to_person=child_person,
            type=RelationshipTypeChoices.PARENT_OF
        )
    
    return relationship


def add_spouse(family, person_a, person_b):
    """
    Create a SPOUSE_OF relationship (bidirectional: A->B and B->A).
    Both relationships are created in a single transaction.
    
    Args:
        family: Family instance
        person_a: Person instance (first spouse)
        person_b: Person instance (second spouse)
        
    Returns:
        Tuple of (Relationship, Relationship) - both created relationships
        
    Raises:
        ValidationError: If validation fails
    """
    # Validate both directions
    validate_relationship(family, person_a, person_b, RelationshipTypeChoices.SPOUSE_OF)
    validate_relationship(family, person_b, person_a, RelationshipTypeChoices.SPOUSE_OF)
    
    # Check if relationships already exist
    existing_ab = Relationship.objects.filter(
        family=family,
        from_person=person_a,
        to_person=person_b,
        type=RelationshipTypeChoices.SPOUSE_OF
    ).exists()
    
    existing_ba = Relationship.objects.filter(
        family=family,
        from_person=person_b,
        to_person=person_a,
        type=RelationshipTypeChoices.SPOUSE_OF
    ).exists()
    
    if existing_ab or existing_ba:
        raise ValidationError("Spouse relationship already exists between these persons.")
    
    # Create both relationships in a single transaction
    with transaction.atomic():
        relationship_ab = Relationship.objects.create(
            family=family,
            from_person=person_a,
            to_person=person_b,
            type=RelationshipTypeChoices.SPOUSE_OF
        )
        
        relationship_ba = Relationship.objects.create(
            family=family,
            from_person=person_b,
            to_person=person_a,
            type=RelationshipTypeChoices.SPOUSE_OF
        )
    
    return relationship_ab, relationship_ba


def delete_relationship(relationship):
    """
    Delete a relationship. For SPOUSE_OF relationships, deletes both directions.
    
    Args:
        relationship: Relationship instance to delete
        
    Returns:
        List of deleted Relationship instances (1 for PARENT_OF, 2 for SPOUSE_OF)
        
    Raises:
        ValidationError: If relationship doesn't exist or deletion fails
    """
    import json
    import os
    DEBUG_LOG_PATH = r'c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\.cursor\debug.log'
    def _log_debug(location, message, data, hypothesis_id):
        try:
            log_entry = {
                'location': location,
                'message': message,
                'data': data,
                'timestamp': __import__('time').time() * 1000,
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': hypothesis_id
            }
            with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
        except:
            pass
    _log_debug('relationship_service.py:106', 'delete_relationship called', {'relationship_id': relationship.id, 'type': relationship.type, 'family_id': relationship.family.id}, 'E')
    deleted_relationships = []
    
    # For SPOUSE_OF, we need to delete both directions
    if relationship.type == RelationshipTypeChoices.SPOUSE_OF:
        _log_debug('relationship_service.py:123', 'Deleting SPOUSE_OF relationship', {'relationship_id': relationship.id}, 'E')
        # Find both directions
        person_a = relationship.from_person
        person_b = relationship.to_person
        
        # Get both relationships
        relationship_ab = Relationship.objects.filter(
            family=relationship.family,
            from_person=person_a,
            to_person=person_b,
            type=RelationshipTypeChoices.SPOUSE_OF
        ).first()
        
        relationship_ba = Relationship.objects.filter(
            family=relationship.family,
            from_person=person_b,
            to_person=person_a,
            type=RelationshipTypeChoices.SPOUSE_OF
        ).first()
        
        # Delete both in a transaction
        try:
            with transaction.atomic():
                if relationship_ab:
                    _log_debug('relationship_service.py:144', 'Deleting relationship_ab', {'relationship_id': relationship_ab.id}, 'E')
                    deleted_relationships.append(relationship_ab)
                    relationship_ab.delete()
                if relationship_ba and (not relationship_ab or relationship_ba.id != relationship_ab.id):
                    _log_debug('relationship_service.py:148', 'Deleting relationship_ba', {'relationship_id': relationship_ba.id}, 'E')
                    deleted_relationships.append(relationship_ba)
                    relationship_ba.delete()
        except Exception as e:
            _log_debug('relationship_service.py:151', 'Exception deleting SPOUSE_OF', {'error': str(e), 'error_type': type(e).__name__}, 'E')
            raise
    else:
        # For PARENT_OF, just delete the single relationship
        _log_debug('relationship_service.py:154', 'Deleting PARENT_OF relationship', {'relationship_id': relationship.id}, 'E')
        try:
            with transaction.atomic():
                deleted_relationships.append(relationship)
                relationship.delete()
                _log_debug('relationship_service.py:157', 'PARENT_OF deleted successfully', {'relationship_id': relationship.id}, 'E')
        except Exception as e:
            _log_debug('relationship_service.py:159', 'Exception deleting PARENT_OF', {'error': str(e), 'error_type': type(e).__name__}, 'E')
            raise
    
    _log_debug('relationship_service.py:162', 'delete_relationship completed', {'deleted_count': len(deleted_relationships)}, 'E')
    return deleted_relationships