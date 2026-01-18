# Bulk relationship service
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family
from apps.graph.services.relationship_service import add_parent, add_spouse
from apps.graph.services.topology_service import get_family_topology


def _get_parents(person_id, edges):
    """Get parent IDs for a person from edges"""
    return [e['from'] for e in edges if e['to'] == person_id and e['type'] == RelationshipTypeChoices.PARENT_OF]


def _get_children(person_id, edges):
    """Get child IDs for a person from edges"""
    return [e['to'] for e in edges if e['from'] == person_id and e['type'] == RelationshipTypeChoices.PARENT_OF]


def _get_spouse(person_id, edges):
    """Get spouse ID for a person from edges"""
    for edge in edges:
        if edge['type'] == RelationshipTypeChoices.SPOUSE_OF:
            if edge['from'] == person_id:
                return edge['to']
            elif edge['to'] == person_id:
                return edge['from']
    return None


def _translate_label_to_edges(label, viewer_id, target_id, topology):
    """
    Translate a relationship label to edges.
    Similar to frontend relationshipTranslator.js logic.
    
    Returns: (edges_to_create, missing_persons, warnings)
    """
    edges = []
    missing_persons = []
    warnings = []
    normalized_label = label.lower()
    
    edges_list = topology.get('edges', [])
    nodes_list = topology.get('nodes', [])
    
    # Helper to get person name
    def get_person_name(person_id):
        for node in nodes_list:
            person = None
            if isinstance(node, dict):
                person = node.get('person')
            else:
                person = node
            
            if person:
                if isinstance(person, dict):
                    if person.get('id') == person_id:
                        return f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() or f"Person {person_id}"
                elif hasattr(person, 'id') and person.id == person_id:
                    return f"{person.first_name} {person.last_name}".strip() or f"Person {person_id}"
        return f"Person {person_id}"
    
    if normalized_label in ['father', 'mother']:
        # Target is parent of viewer
        edges.append({
            'from': target_id,
            'to': viewer_id,
            'type': RelationshipTypeChoices.PARENT_OF
        })
    
    elif normalized_label in ['son', 'daughter']:
        # Viewer is parent of target
        edges.append({
            'from': viewer_id,
            'to': target_id,
            'type': RelationshipTypeChoices.PARENT_OF
        })
    
    elif normalized_label in ['husband', 'wife', 'spouse']:
        # SPOUSE_OF (backend creates bidirectional)
        edges.append({
            'from': viewer_id,
            'to': target_id,
            'type': RelationshipTypeChoices.SPOUSE_OF
        })
    
    elif normalized_label in ['brother', 'sister']:
        # Requires: viewer and target share a parent
        viewer_parents = _get_parents(viewer_id, edges_list)
        if not viewer_parents:
            missing_persons.append({
                'role': 'viewer_parent',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need at least one parent. Please add your parent first.'
            })
        else:
            target_parents = _get_parents(target_id, edges_list)
            common_parents = [p for p in viewer_parents if p in target_parents]
            if not common_parents:
                # Need to make target a child of one of viewer's parents
                shared_parent = viewer_parents[0]
                edges.append({
                    'from': shared_parent,
                    'to': target_id,
                    'type': RelationshipTypeChoices.PARENT_OF
                })
    
    elif normalized_label in ['grandfather', 'grandmother']:
        # Requires: viewer -> parent -> grandparent
        viewer_parents = _get_parents(viewer_id, edges_list)
        if not viewer_parents:
            missing_persons.append({
                'role': 'viewer_parent',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need a parent first. Please add your parent.'
            })
        else:
            parent_id = viewer_parents[0]
            grandparent_parents = _get_parents(parent_id, edges_list)
            if target_id not in grandparent_parents:
                edges.append({
                    'from': target_id,
                    'to': parent_id,
                    'type': RelationshipTypeChoices.PARENT_OF
                })
    
    elif normalized_label in ['grandson', 'granddaughter']:
        # Requires: viewer -> child -> grandchild
        viewer_children = _get_children(viewer_id, edges_list)
        if not viewer_children:
            missing_persons.append({
                'role': 'viewer_child',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need a child first. Please add your child.'
            })
        else:
            child_id = viewer_children[0]
            child_children = _get_children(child_id, edges_list)
            if target_id not in child_children:
                edges.append({
                    'from': child_id,
                    'to': target_id,
                    'type': RelationshipTypeChoices.PARENT_OF
                })
    
    elif normalized_label in ['uncle', 'aunt']:
        # Requires: viewer -> parent -> grandparent -> parent's sibling
        viewer_parents = _get_parents(viewer_id, edges_list)
        if not viewer_parents:
            missing_persons.append({
                'role': 'viewer_parent',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need a parent first. Please add your parent.'
            })
        else:
            parent_id = viewer_parents[0]
            parent_parents = _get_parents(parent_id, edges_list)
            if not parent_parents:
                missing_persons.append({
                    'role': 'parent_parent',
                    'message': f'To add {get_person_name(target_id)} as your {label}, your parent needs a parent (your grandparent) first.'
                })
            else:
                grandparent_id = parent_parents[0]
                grandparent_children = _get_children(grandparent_id, edges_list)
                if target_id not in grandparent_children and target_id != parent_id:
                    edges.append({
                        'from': grandparent_id,
                        'to': target_id,
                        'type': RelationshipTypeChoices.PARENT_OF
                    })
    
    elif normalized_label in ['nephew', 'niece']:
        # Requires: viewer -> parent -> sibling -> sibling's child
        viewer_parents = _get_parents(viewer_id, edges_list)
        if not viewer_parents:
            missing_persons.append({
                'role': 'viewer_parent',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need a parent first. Please add your parent.'
            })
        else:
            parent_id = viewer_parents[0]
            parent_children = _get_children(parent_id, edges_list)
            siblings = [c for c in parent_children if c != viewer_id]
            if not siblings:
                missing_persons.append({
                    'role': 'sibling',
                    'message': f'To add {get_person_name(target_id)} as your {label}, you need a sibling first. Please add your sibling.'
                })
            else:
                sibling_id = siblings[0]
                sibling_children = _get_children(sibling_id, edges_list)
                if target_id not in sibling_children:
                    edges.append({
                        'from': sibling_id,
                        'to': target_id,
                        'type': RelationshipTypeChoices.PARENT_OF
                    })
    
    elif normalized_label == 'cousin':
        # Requires: viewer -> parent -> grandparent -> parent's sibling -> cousin
        viewer_parents = _get_parents(viewer_id, edges_list)
        if not viewer_parents:
            missing_persons.append({
                'role': 'viewer_parent',
                'message': f'To add {get_person_name(target_id)} as your cousin, you need a parent first. Please add your parent.'
            })
        else:
            parent_id = viewer_parents[0]
            parent_parents = _get_parents(parent_id, edges_list)
            if not parent_parents:
                missing_persons.append({
                    'role': 'parent_parent',
                    'message': f'To add {get_person_name(target_id)} as your cousin, your parent needs a parent (your grandparent) first.'
                })
            else:
                grandparent_id = parent_parents[0]
                grandparent_children = _get_children(grandparent_id, edges_list)
                parent_siblings = [c for c in grandparent_children if c != parent_id]
                if not parent_siblings:
                    missing_persons.append({
                        'role': 'parent_sibling',
                        'message': f'To add {get_person_name(target_id)} as your cousin, your parent needs a sibling (your uncle/aunt) first.'
                    })
                else:
                    parent_sibling_id = parent_siblings[0]
                    parent_sibling_children = _get_children(parent_sibling_id, edges_list)
                    if target_id not in parent_sibling_children:
                        edges.append({
                            'from': parent_sibling_id,
                            'to': target_id,
                            'type': RelationshipTypeChoices.PARENT_OF
                        })
    
    elif normalized_label in ['father-in-law', 'mother-in-law']:
        # Requires: viewer -> spouse -> spouse's parent
        spouse_id = _get_spouse(viewer_id, edges_list)
        if not spouse_id:
            missing_persons.append({
                'role': 'spouse',
                'message': f'To add {get_person_name(target_id)} as your {label}, you need a spouse first. Please add your spouse.'
            })
        else:
            spouse_parents = _get_parents(spouse_id, edges_list)
            if target_id not in spouse_parents:
                edges.append({
                    'from': target_id,
                    'to': spouse_id,
                    'type': RelationshipTypeChoices.PARENT_OF
                })
    
    else:
        warnings.append(f'Unknown relationship label: {label}')
    
    return edges, missing_persons, warnings


def create_bulk_relationships(family, relationship_requests):
    """
    Create multiple relationships from user-friendly labels.
    
    Args:
        family: Family instance
        relationship_requests: List of dicts with 'viewer_id', 'target_id', 'label'
    
    Returns:
        dict with:
        - created: List of created Relationship instances
        - failed: List of dicts with request info and error message
        - warnings: List of warning messages
    """
    created = []
    failed = []
    warnings = []
    
    # Get topology for translation (use first viewer as reference, or get full topology)
    # We'll get topology from the first viewer, but we need all persons
    if not relationship_requests:
        return {
            'created': [],
            'failed': [],
            'warnings': ['No relationships to create'],
            'success': False
        }
    
    # Get all unique viewer IDs to determine which topology to fetch
    viewer_ids = list(set(req['viewer_id'] for req in relationship_requests))
    primary_viewer_id = viewer_ids[0]
    
    # Get topology for translation
    try:
        topology_data = get_family_topology(family.id, primary_viewer_id)
    except Exception as e:
        return {
            'created': [],
            'failed': [{'request': req, 'error': f'Failed to get topology: {str(e)}'} for req in relationship_requests],
            'warnings': [],
            'success': False
        }
    
    # Convert topology nodes to a format we can work with
    topology = {
        'nodes': topology_data.get('nodes', []),
        'edges': topology_data.get('edges', [])
    }
    
    # Translate all labels to edges
    all_edges_to_create = []
    edge_metadata = {}  # Track which request each edge came from
    
    for req in relationship_requests:
        viewer_id = req['viewer_id']
        target_id = req['target_id']
        label = req['label']
        
        # Translate label to edges
        edges, missing_persons, req_warnings = _translate_label_to_edges(
            label, viewer_id, target_id, topology
        )
        
        warnings.extend(req_warnings)
        
        if missing_persons:
            failed.append({
                'request': req,
                'error': '; '.join(mp['message'] for mp in missing_persons)
            })
            continue
        
        if not edges:
            # Relationship already exists or no edges needed
            warnings.append(f'Relationship "{label}" between person {viewer_id} and {target_id} already exists or requires no new edges')
            continue
        
        # Track which request each edge came from
        for edge in edges:
            edge_key = (edge['from'], edge['to'], edge['type'])
            if edge_key not in edge_metadata:
                all_edges_to_create.append(edge)
                edge_metadata[edge_key] = req
    
    # Validate all edges before creating any
    validation_errors = []
    for edge in all_edges_to_create:
        try:
            from_person = Person.objects.get(id=edge['from'], family=family)
            to_person = Person.objects.get(id=edge['to'], family=family)
            
            # Check if relationship already exists
            if Relationship.objects.filter(
                family=family,
                from_person=from_person,
                to_person=to_person,
                type=edge['type']
            ).exists():
                # Skip duplicate, but don't fail
                continue
            
            # Basic validation (more detailed validation happens in add_parent/add_spouse)
            if from_person.id == to_person.id:
                validation_errors.append({
                    'edge': edge,
                    'error': 'Cannot create relationship to self'
                })
        except Person.DoesNotExist as e:
            validation_errors.append({
                'edge': edge,
                'error': f'Person not found: {str(e)}'
            })
    
    # If validation errors, mark corresponding requests as failed
    if validation_errors:
        for error_info in validation_errors:
            edge = error_info['edge']
            if (edge['from'], edge['to'], edge['type']) in edge_metadata:
                req = edge_metadata[(edge['from'], edge['to'], edge['type'])]
                failed.append({
                    'request': req,
                    'error': error_info['error']
                })
    
    # Remove edges that have validation errors
    valid_edges = [
        edge for edge in all_edges_to_create
        if not any(
            ve['edge'] == edge for ve in validation_errors
        )
    ]
    
    # Create all valid relationships in a transaction
    if valid_edges:
        try:
            with transaction.atomic():
                for edge in valid_edges:
                    try:
                        from_person = Person.objects.get(id=edge['from'], family=family)
                        to_person = Person.objects.get(id=edge['to'], family=family)
                        
                        # Check again (in case of race condition)
                        if Relationship.objects.filter(
                            family=family,
                            from_person=from_person,
                            to_person=to_person,
                            type=edge['type']
                        ).exists():
                            continue
                        
                        if edge['type'] == RelationshipTypeChoices.PARENT_OF:
                            rel = add_parent(family, from_person, to_person)
                            created.append(rel)
                        elif edge['type'] == RelationshipTypeChoices.SPOUSE_OF:
                            rel1, rel2 = add_spouse(family, from_person, to_person)
                            created.extend([rel1, rel2])
                    except ValidationError as e:
                        # Mark the request that led to this edge as failed
                        if (edge['from'], edge['to'], edge['type']) in edge_metadata:
                            req = edge_metadata[(edge['from'], edge['to'], edge['type'])]
                            failed.append({
                                'request': req,
                                'error': str(e)
                            })
                    except Exception as e:
                        # Mark the request that led to this edge as failed
                        if (edge['from'], edge['to'], edge['type']) in edge_metadata:
                            req = edge_metadata[(edge['from'], edge['to'], edge['type'])]
                            failed.append({
                                'request': req,
                                'error': f'Unexpected error: {str(e)}'
                            })
        except Exception as e:
            # Transaction failed - mark all as failed
            for edge in valid_edges:
                if (edge['from'], edge['to'], edge['type']) in edge_metadata:
                    req = edge_metadata[(edge['from'], edge['to'], edge['type'])]
                    failed.append({
                        'request': req,
                        'error': f'Transaction failed: {str(e)}'
                    })
    
    return {
        'created': created,
        'failed': failed,
        'warnings': warnings,
        'success': len(failed) == 0 and len(created) > 0
    }


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
