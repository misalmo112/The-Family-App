# Bulk relationship service
from django.db import transaction
from apps.graph.models import Person, Relationship
from apps.families.models import Family
from apps.graph.services.relationship_service import add_parent, add_spouse


def create_family_unit(family, parent1_id, parent2_id, children_ids):
    """
    Create a family unit with parents and children.
    
    Creates:
    - parent1 PARENT_OF each child
    - parent2 PARENT_OF each child
    - parent1 SPOUSE_OF parent2 (if both provided)
    
    Returns dict with created relationships and any errors.
    """
    created = []
    errors = []
    
    with transaction.atomic():
        # Create spouse relationship if both parents provided
        if parent1_id and parent2_id:
            try:
                parent1 = Person.objects.get(id=parent1_id, family=family)
                parent2 = Person.objects.get(id=parent2_id, family=family)
                rel1, rel2 = add_spouse(family, parent1, parent2)
                created.extend([rel1, rel2])
            except Exception as e:
                errors.append(f'Failed to create spouse relationship: {str(e)}')
        
        # Create parent-child relationships
        for child_id in children_ids:
            if parent1_id:
                try:
                    parent1 = Person.objects.get(id=parent1_id, family=family)
                    child = Person.objects.get(id=child_id, family=family)
                    rel = add_parent(family, parent1, child)
                    created.append(rel)
                except Exception as e:
                    errors.append(f'Failed to create parent1-child relationship for child {child_id}: {str(e)}')
            
            if parent2_id:
                try:
                    parent2 = Person.objects.get(id=parent2_id, family=family)
                    child = Person.objects.get(id=child_id, family=family)
                    rel = add_parent(family, parent2, child)
                    created.append(rel)
                except Exception as e:
                    errors.append(f'Failed to create parent2-child relationship for child {child_id}: {str(e)}')
    
    return {
        'created': created,
        'errors': errors,
        'success': len(errors) == 0
    }
