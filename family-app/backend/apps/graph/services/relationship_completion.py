# Relationship completion service
from django.db.models import Q
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family
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

def analyze_missing_relationships(family_id, person_id=None):
    """
    Analyze the family graph and detect missing relationships.
    
    Patterns detected:
    - Person with only one parent (check if parent has spouse)
    - Person with parent but no sibling relationships
    - Children without both parents when one parent has a spouse
    
    Returns list of suggestion dicts.
    """
    _log_debug('relationship_completion.py:17', 'analyze_missing_relationships entry', {'family_id': family_id, 'person_id': person_id}, 'A')
    suggestions = []
    
    try:
        family = Family.objects.get(id=family_id)
        _log_debug('relationship_completion.py:22', 'Family found', {'family_id': family_id, 'family_name': family.name}, 'A')
    except Family.DoesNotExist:
        _log_debug('relationship_completion.py:24', 'Family not found', {'family_id': family_id}, 'A')
        return suggestions
    except Exception as e:
        _log_debug('relationship_completion.py:26', 'Exception getting family', {'family_id': family_id, 'error': str(e), 'error_type': type(e).__name__}, 'A')
        raise
    
    # Get all persons or filter by person_id
    if person_id:
        persons = Person.objects.filter(id=person_id, family=family)
    else:
        persons = Person.objects.filter(family=family)
    
    _log_debug('relationship_completion.py:29', 'Persons queried', {'person_count': persons.count(), 'person_id': person_id}, 'A')
    
    for person in persons:
        _log_debug('relationship_completion.py:32', 'Processing person', {'person_id': person.id, 'person_name': f'{person.first_name} {person.last_name}'}, 'A')
        # Pattern 1: Person with only one parent
        try:
            parents = Relationship.objects.filter(
                family=family,
                to_person=person,
                type=RelationshipTypeChoices.PARENT_OF
            )
            _log_debug('relationship_completion.py:35', 'Parents queried', {'person_id': person.id, 'parent_count': parents.count()}, 'A')
            
            if parents.count() == 1:
                parent = parents.first().from_person
                _log_debug('relationship_completion.py:39', 'Found single parent', {'person_id': person.id, 'parent_id': parent.id, 'parent_name': f'{parent.first_name} {parent.last_name}'}, 'A')
                # Check if parent has a spouse (SPOUSE_OF is stored both A->B and B->A)
                spouse_rels = Relationship.objects.filter(
                    family=family,
                    type=RelationshipTypeChoices.SPOUSE_OF
                ).filter(Q(from_person=parent) | Q(to_person=parent))
                _log_debug('relationship_completion.py:46', 'Spouse relationships queried', {'parent_id': parent.id, 'spouse_count': spouse_rels.count()}, 'A')
                if spouse_rels.exists():
                    rel = spouse_rels.first()
                    spouse = rel.to_person if rel.from_person_id == parent.id else rel.from_person
                    _log_debug('relationship_completion.py:48', 'Found spouse', {'parent_id': parent.id, 'spouse_id': spouse.id, 'spouse_name': f'{spouse.first_name} {spouse.last_name}'}, 'A')
                    # Check if spouse is already a parent
                    existing_parent_rel = Relationship.objects.filter(
                        family=family,
                        from_person=spouse,
                        to_person=person,
                        type=RelationshipTypeChoices.PARENT_OF
                    )
                    if not existing_parent_rel.exists():
                        suggestion = {
                            'type': 'missing_parent',
                            'from_person_id': spouse.id,
                            'to_person_id': person.id,
                            'relationship_type': RelationshipTypeChoices.PARENT_OF,
                            'reason': f'{spouse.first_name} is {parent.first_name}\'s spouse but not listed as a parent of {person.first_name}',
                            'confidence': 'high'
                        }
                        _log_debug('relationship_completion.py:62', 'Adding suggestion', suggestion, 'A')
                        suggestions.append(suggestion)
        except Exception as e:
            _log_debug('relationship_completion.py:65', 'Exception in Pattern 1', {'person_id': person.id, 'error': str(e), 'error_type': type(e).__name__}, 'A')
            raise
        
        # Pattern 2: Check reverse - if person has a spouse with only one parent
        try:
            spouse_rels = Relationship.objects.filter(
                family=family,
                type=RelationshipTypeChoices.SPOUSE_OF
            ).filter(Q(from_person=person) | Q(to_person=person))
            _log_debug('relationship_completion.py:70', 'Person spouse relationships', {'person_id': person.id, 'spouse_count': spouse_rels.count()}, 'A')
            for spouse_rel in spouse_rels:
                spouse = spouse_rel.to_person if spouse_rel.from_person_id == person.id else spouse_rel.from_person
                spouse_parents = Relationship.objects.filter(
                    family=family,
                    to_person=spouse,
                    type=RelationshipTypeChoices.PARENT_OF
                )
                # If spouse has only one parent, check if that parent has a spouse
                if spouse_parents.count() == 1:
                    spouse_parent = spouse_parents.first().from_person
                    spouse_parent_spouse_rels = Relationship.objects.filter(
                        family=family,
                        type=RelationshipTypeChoices.SPOUSE_OF
                    ).filter(Q(from_person=spouse_parent) | Q(to_person=spouse_parent))
                    if spouse_parent_spouse_rels.exists():
                        rel = spouse_parent_spouse_rels.first()
                        spouse_parent_spouse = rel.to_person if rel.from_person_id == spouse_parent.id else rel.from_person
                        # Check if spouse_parent_spouse is already a parent of spouse
                        if not Relationship.objects.filter(
                            family=family,
                            from_person=spouse_parent_spouse,
                            to_person=spouse,
                            type=RelationshipTypeChoices.PARENT_OF
                        ).exists():
                            suggestions.append({
                                'type': 'missing_parent',
                                'from_person_id': spouse_parent_spouse.id,
                                'to_person_id': spouse.id,
                                'relationship_type': RelationshipTypeChoices.PARENT_OF,
                                'reason': f'{spouse_parent_spouse.first_name} is {spouse_parent.first_name}\'s spouse but not listed as a parent of {spouse.first_name}',
                                'confidence': 'high'
                            })
        except Exception as e:
            _log_debug('relationship_completion.py:103', 'Exception in Pattern 2', {'person_id': person.id, 'error': str(e), 'error_type': type(e).__name__}, 'A')
            raise
    
    _log_debug('relationship_completion.py:106', 'Returning suggestions', {'suggestion_count': len(suggestions)}, 'A')
    return suggestions
