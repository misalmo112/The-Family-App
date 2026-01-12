# Relationship validation service
from django.core.exceptions import ValidationError
from apps.graph.models import Relationship, RelationshipTypeChoices


def validate_not_self(from_person, to_person):
    """Ensure from_person is not the same as to_person"""
    if from_person.id == to_person.id:
        raise ValidationError("Cannot create relationship to self.")


def validate_same_family(from_person, to_person):
    """Ensure both persons belong to the same family"""
    if from_person.family_id != to_person.family_id:
        raise ValidationError("Both persons must belong to the same family.")


def validate_parent_cycle(family, from_person, to_person):
    """
    Prevent cycles in parent relationships.
    Check if creating from_person -> to_person (PARENT_OF) would create a cycle.
    A cycle exists if to_person is an ancestor of from_person.
    """
    # Check if to_person is an ancestor of from_person
    visited = set()
    stack = [from_person]
    
    while stack:
        current = stack.pop()
        if current.id == to_person.id:
            raise ValidationError("Creating this relationship would create a cycle in the parent-child graph.")
        
        if current.id in visited:
            continue
        visited.add(current.id)
        
        # Get all parents of current person
        parent_relationships = Relationship.objects.filter(
            family=family,
            to_person=current,
            type=RelationshipTypeChoices.PARENT_OF
        ).select_related('from_person')
        
        for rel in parent_relationships:
            stack.append(rel.from_person)


def validate_max_parents(family, to_person, max_parents=2):
    """
    Validate that to_person doesn't already have max_parents parents.
    Only applies to PARENT_OF relationships.
    """
    parent_count = Relationship.objects.filter(
        family=family,
        to_person=to_person,
        type=RelationshipTypeChoices.PARENT_OF
    ).count()
    
    if parent_count >= max_parents:
        raise ValidationError(f"Person already has {max_parents} parent(s). Maximum allowed is {max_parents}.")


def validate_relationship(family, from_person, to_person, relationship_type):
    """
    Main validation orchestrator for relationships.
    
    Args:
        family: Family instance
        from_person: Person instance (source)
        to_person: Person instance (target)
        relationship_type: RelationshipTypeChoices value
        
    Raises:
        ValidationError: If validation fails
    """
    # Basic validations for all relationship types
    validate_not_self(from_person, to_person)
    validate_same_family(from_person, to_person)
    
    # Type-specific validations
    if relationship_type == RelationshipTypeChoices.PARENT_OF:
        validate_parent_cycle(family, from_person, to_person)
        validate_max_parents(family, to_person, max_parents=2)
    elif relationship_type == RelationshipTypeChoices.SPOUSE_OF:
        # Additional spouse validations could go here if needed
        pass

