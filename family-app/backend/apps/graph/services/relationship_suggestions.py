# Relationship suggestions service
from apps.graph.models import Person, Relationship, RelationshipTypeChoices, GenderChoices


def get_inlaw_label(gender):
    """Get in-law label based on gender"""
    if gender == GenderChoices.MALE:
        return 'father-in-law'
    elif gender == GenderChoices.FEMALE:
        return 'mother-in-law'
    else:
        return 'parent-in-law'


def get_related_suggestions(family_id, from_person_id, to_person_id, relationship_type):
    """
    Analyze the graph and suggest related relationships that would
    logically follow from the just-created relationship.
    
    Returns list of suggestion dicts with:
    - type: suggestion category
    - from_person_id, to_person_id: relationship to create
    - relationship_type: PARENT_OF or SPOUSE_OF
    - reason: human-readable explanation
    - confidence: 'high' | 'medium' | 'low'
    """
    suggestions = []
    
    if relationship_type == RelationshipTypeChoices.PARENT_OF:
        # If adding a parent, check if they have a spouse
        # Suggest adding spouse as the other parent
        try:
            parent = Person.objects.get(id=from_person_id, family_id=family_id)
            child = Person.objects.get(id=to_person_id, family_id=family_id)
            
            # Check if parent has a spouse
            spouse_rels = Relationship.objects.filter(
                family_id=family_id,
                from_person=parent,
                type=RelationshipTypeChoices.SPOUSE_OF
            )
            if spouse_rels.exists():
                spouse = spouse_rels.first().to_person
                # Check if spouse is already a parent of the child
                if not Relationship.objects.filter(
                    family_id=family_id,
                    from_person=spouse,
                    to_person=child,
                    type=RelationshipTypeChoices.PARENT_OF
                ).exists():
                    suggestions.append({
                        'type': 'parent_spouse',
                        'from_person_id': spouse.id,
                        'to_person_id': child.id,
                        'relationship_type': RelationshipTypeChoices.PARENT_OF,
                        'reason': f'{spouse.first_name} is {parent.first_name}\'s spouse. Add as the other parent?',
                        'confidence': 'high'
                    })
        except Person.DoesNotExist:
            pass
    
    elif relationship_type == RelationshipTypeChoices.SPOUSE_OF:
        # If adding a spouse, suggest adding their parents as in-laws
        try:
            person_a = Person.objects.get(id=from_person_id, family_id=family_id)
            person_b = Person.objects.get(id=to_person_id, family_id=family_id)
            
            # Get person_b's parents
            person_b_parents = Relationship.objects.filter(
                family_id=family_id,
                to_person=person_b,
                type=RelationshipTypeChoices.PARENT_OF
            ).select_related('from_person')
            
            for parent_rel in person_b_parents:
                parent = parent_rel.from_person
                # Note: In-law relationships are derived, not stored
                # We suggest creating a PARENT_OF relationship from parent to person_b
                # which would make person_a's relationship to parent resolvable as in-law
                # However, since in-laws are derived, we'll note this is informational
                suggestions.append({
                    'type': 'spouse_parent_inlaw',
                    'from_person_id': parent.id,
                    'to_person_id': person_b.id,
                    'relationship_type': 'IN_LAW_INFO',  # Special type for informational suggestion
                    'reason': f'{parent.first_name} is {person_b.first_name}\'s parent. They will be your {get_inlaw_label(parent.gender)}.',
                    'confidence': 'high'
                })
        except Person.DoesNotExist:
            pass
    
    return suggestions
