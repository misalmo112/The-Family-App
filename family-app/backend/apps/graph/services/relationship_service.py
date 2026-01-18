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
    deleted_relationships = []
    
    # For SPOUSE_OF, we need to delete both directions
    if relationship.type == RelationshipTypeChoices.SPOUSE_OF:
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
        with transaction.atomic():
            if relationship_ab:
                deleted_relationships.append(relationship_ab)
                relationship_ab.delete()
            if relationship_ba and (not relationship_ab or relationship_ba.id != relationship_ab.id):
                deleted_relationships.append(relationship_ba)
                relationship_ba.delete()
    else:
        # For PARENT_OF, just delete the single relationship
        with transaction.atomic():
            deleted_relationships.append(relationship)
            relationship.delete()
    
    return deleted_relationships