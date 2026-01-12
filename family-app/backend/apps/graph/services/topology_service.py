# Topology service for graph app
from django.shortcuts import get_object_or_404
from apps.graph.models import Person, Relationship
from apps.families.models import Family
from apps.graph.services.relationship_resolver import resolve_relationship


def get_family_topology(family_id, viewer_person_id):
    """
    Get family graph topology including all person nodes and relationship edges.
    
    Args:
        family_id: ID of the family
        viewer_person_id: ID of the person viewing the topology
        
    Returns:
        dict with keys: family_id, viewer_person_id, nodes, edges
        nodes: list of dicts with Person data and relation_to_viewer field
        
    Raises:
        Http404: If family or viewer_person not found
        ValueError: If viewer_person doesn't belong to the family
    """
    # Validate family exists
    family = get_object_or_404(Family, id=family_id)
    
    # Validate viewer_person_id exists and belongs to the family
    viewer_person = get_object_or_404(Person, id=viewer_person_id)
    if viewer_person.family_id != family_id:
        raise ValueError(f"Person {viewer_person_id} does not belong to family {family_id}")
    
    # Fetch all persons for the family
    persons = Person.objects.filter(family=family)
    
    # Fetch all relationships for the family
    relationships = Relationship.objects.filter(family=family).select_related('from_person', 'to_person')
    
    # Convert relationships to edge format
    edges = []
    for relationship in relationships:
        edge = {
            'from': relationship.from_person_id,
            'to': relationship.to_person_id,
            'type': relationship.type
        }
        edges.append(edge)
    
    # Build nodes with relation_to_viewer
    nodes = []
    for person in persons:
        relation_result = resolve_relationship(family_id, viewer_person_id, person.id)
        relation_label = relation_result.get('label', 'unknown')
        # Store person object and relation_to_viewer for serializer
        node_data = {
            'person': person,
            'relation_to_viewer': relation_label
        }
        nodes.append(node_data)
    
    return {
        'family_id': family_id,
        'viewer_person_id': viewer_person_id,
        'nodes': nodes,  # List of dicts with person and relation_to_viewer
        'edges': edges
    }

