# Relationship resolver service for determining family relationships
from collections import deque
from django.shortcuts import get_object_or_404
from apps.graph.models import Person, Relationship, RelationshipTypeChoices, GenderChoices
from apps.families.models import Family


def _get_neighbors(person_id, family_id):
    """
    Get all adjacent persons (neighbors) for a given person.
    Handles bidirectional traversal:
    - PARENT_OF: Traverse both directions (parent->child and child->parent)
    - SPOUSE_OF: Traverse both directions (bidirectional by design)
    
    Args:
        person_id: ID of the person
        family_id: ID of the family
        
    Returns:
        List of tuples: [(neighbor_person_id, relationship_type, direction), ...]
        direction: 'forward' (from_person->to_person) or 'reverse' (to_person->from_person)
    """
    neighbors = []
    
    # Get outgoing relationships (forward direction)
    outgoing = Relationship.objects.filter(
        family_id=family_id,
        from_person_id=person_id
    ).select_related('to_person')
    
    for rel in outgoing:
        neighbors.append((rel.to_person_id, rel.type, 'forward'))
    
    # Get incoming relationships (reverse direction)
    incoming = Relationship.objects.filter(
        family_id=family_id,
        to_person_id=person_id
    ).select_related('from_person')
    
    for rel in incoming:
        # For PARENT_OF, reverse means child->parent traversal
        # For SPOUSE_OF, both directions are valid
        neighbors.append((rel.from_person_id, rel.type, 'reverse'))
    
    return neighbors


def _get_relationship_types_in_path(path, family_id):
    """
    Get the relationship types between consecutive persons in the path.
    
    Args:
        path: List of person IDs
        family_id: ID of the family
        
    Returns:
        List of tuples: [(relationship_type, direction), ...]
    """
    if len(path) < 2:
        return []
    
    relationship_types = []
    
    for i in range(len(path) - 1):
        from_id = path[i]
        to_id = path[i + 1]
        
        # Check forward direction
        rel = Relationship.objects.filter(
            family_id=family_id,
            from_person_id=from_id,
            to_person_id=to_id
        ).first()
        
        if rel:
            relationship_types.append((rel.type, 'forward'))
        else:
            # Check reverse direction
            rel = Relationship.objects.filter(
                family_id=family_id,
                from_person_id=to_id,
                to_person_id=from_id
            ).first()
            
            if rel:
                relationship_types.append((rel.type, 'reverse'))
    
    return relationship_types


def _determine_label(path, viewer_person, target_person, family_id):
    """
    Determine the relationship label based on the path structure.
    
    Args:
        path: List of person IDs from viewer to target
        viewer_person: Person instance of the viewer
        target_person: Person instance of the target
        family_id: ID of the family
        
    Returns:
        str: Relationship label (e.g., "father", "sister", "cousin")
    """
    path_length = len(path) - 1  # Number of edges
    
    # Self relationship
    if path_length == 0:
        return "self"
    
    # Get relationship types in the path
    rel_types = _get_relationship_types_in_path(path, family_id)
    
    if path_length == 1:
        rel_type, direction = rel_types[0]
        
        # Spouse relationship
        if rel_type == RelationshipTypeChoices.SPOUSE_OF:
            return "spouse"
        
        # Parent/Child relationship
        if rel_type == RelationshipTypeChoices.PARENT_OF:
            if direction == 'forward':
                # Viewer is parent, target is child
                if target_person.gender == GenderChoices.MALE:
                    return "son"
                elif target_person.gender == GenderChoices.FEMALE:
                    return "daughter"
                else:
                    return "child"
            else:
                # Viewer is child, target is parent
                if target_person.gender == GenderChoices.MALE:
                    return "father"
                elif target_person.gender == GenderChoices.FEMALE:
                    return "mother"
                else:
                    return "parent"
    
    if path_length == 2:
        rel_type1, dir1 = rel_types[0]
        rel_type2, dir2 = rel_types[1]
        
        # Sibling relationship: share same parent
        # Path: viewer -> parent -> sibling
        # Pattern: reverse PARENT_OF -> forward PARENT_OF
        # The middle person is the common parent, and target is a child of that parent
        if (rel_type1 == RelationshipTypeChoices.PARENT_OF and dir1 == 'reverse' and
            rel_type2 == RelationshipTypeChoices.PARENT_OF and dir2 == 'forward'):
            # Verify that target is indeed a child of the middle person (common parent)
            middle_person_id = path[1]
            is_target_child_of_middle = Relationship.objects.filter(
                family_id=family_id,
                from_person_id=middle_person_id,
                to_person_id=target_person.id,
                type=RelationshipTypeChoices.PARENT_OF
            ).exists()
            
            if is_target_child_of_middle:
                # Sibling case
                if target_person.gender == GenderChoices.MALE:
                    return "brother"
                elif target_person.gender == GenderChoices.FEMALE:
                    return "sister"
                else:
                    return "sibling"
        
        # Grandparent relationship: 2 steps up
        # Path: viewer -> parent -> grandparent
        # Pattern: reverse PARENT_OF -> reverse PARENT_OF
        if (rel_type1 == RelationshipTypeChoices.PARENT_OF and dir1 == 'reverse' and
            rel_type2 == RelationshipTypeChoices.PARENT_OF and dir2 == 'reverse'):
            if target_person.gender == GenderChoices.MALE:
                return "grandfather"
            elif target_person.gender == GenderChoices.FEMALE:
                return "grandmother"
            else:
                return "grandparent"
        
        # Grandchild relationship: 2 steps down
        # Path: viewer -> child -> grandchild
        # Pattern: forward PARENT_OF -> forward PARENT_OF
        if (rel_type1 == RelationshipTypeChoices.PARENT_OF and dir1 == 'forward' and
            rel_type2 == RelationshipTypeChoices.PARENT_OF and dir2 == 'forward'):
            if target_person.gender == GenderChoices.MALE:
                return "grandson"
            elif target_person.gender == GenderChoices.FEMALE:
                return "granddaughter"
            else:
                return "grandchild"
    
    if path_length == 3:
        rel_type1, dir1 = rel_types[0]
        rel_type2, dir2 = rel_types[1]
        rel_type3, dir3 = rel_types[2]
        
        # Aunt/Uncle relationship: parent's sibling
        # Path: viewer -> parent -> grandparent -> parent's sibling (aunt/uncle)
        # Pattern: reverse PARENT_OF -> reverse PARENT_OF -> forward PARENT_OF
        if (rel_type1 == RelationshipTypeChoices.PARENT_OF and dir1 == 'reverse' and
            rel_type2 == RelationshipTypeChoices.PARENT_OF and dir2 == 'reverse' and
            rel_type3 == RelationshipTypeChoices.PARENT_OF and dir3 == 'forward'):
            # Check if the target is a sibling of the middle person (parent)
            middle_person_id = path[1]  # parent
            middle_parents = Relationship.objects.filter(
                family_id=family_id,
                to_person_id=middle_person_id,
                type=RelationshipTypeChoices.PARENT_OF
            ).values_list('from_person_id', flat=True)
            
            target_parents = Relationship.objects.filter(
                family_id=family_id,
                to_person_id=target_person.id,
                type=RelationshipTypeChoices.PARENT_OF
            ).values_list('from_person_id', flat=True)
            
            common_parents = set(middle_parents) & set(target_parents)
            if len(common_parents) > 0:
                # Target is sibling of parent, so it's aunt/uncle
                if target_person.gender == GenderChoices.MALE:
                    return "uncle"
                elif target_person.gender == GenderChoices.FEMALE:
                    return "aunt"
                else:
                    return "aunt/uncle"
        
        # Niece/Nephew relationship: sibling's child
        # Path: viewer -> parent -> sibling -> sibling's child
        # Pattern: reverse PARENT_OF -> forward PARENT_OF -> forward PARENT_OF
        if (rel_type1 == RelationshipTypeChoices.PARENT_OF and dir1 == 'reverse' and
            rel_type2 == RelationshipTypeChoices.PARENT_OF and dir2 == 'forward' and
            rel_type3 == RelationshipTypeChoices.PARENT_OF and dir3 == 'forward'):
            # Check if middle person (path[1]) is a sibling of viewer
            middle_person_id = path[1]
            viewer_parents = Relationship.objects.filter(
                family_id=family_id,
                to_person_id=viewer_person.id,
                type=RelationshipTypeChoices.PARENT_OF
            ).values_list('from_person_id', flat=True)
            
            middle_parents = Relationship.objects.filter(
                family_id=family_id,
                to_person_id=middle_person_id,
                type=RelationshipTypeChoices.PARENT_OF
            ).values_list('from_person_id', flat=True)
            
            common_parents = set(viewer_parents) & set(middle_parents)
            if len(common_parents) > 0:
                # Middle person is sibling of viewer, and target is child of sibling
                if target_person.gender == GenderChoices.MALE:
                    return "nephew"
                elif target_person.gender == GenderChoices.FEMALE:
                    return "niece"
                else:
                    return "niece/nephew"
    
    if path_length == 4:
        # Cousin relationship: share same grandparent but not same parent
        # Path: viewer -> parent -> grandparent -> parent's sibling -> cousin
        # Or: viewer -> parent -> grandparent -> another child -> cousin
        # Actually, simpler: 2 steps up, then 2 steps down (or vice versa)
        # Path structure: up-up-down-down or down-down-up-up
        
        # Check if path goes: up (reverse PARENT_OF) -> up (reverse PARENT_OF) -> down (forward PARENT_OF) -> down (forward PARENT_OF)
        if (len(rel_types) == 4 and
            all(rt[0] == RelationshipTypeChoices.PARENT_OF for rt in rel_types)):
            # Check pattern: reverse, reverse, forward, forward (up-up-down-down)
            if (rel_types[0][1] == 'reverse' and rel_types[1][1] == 'reverse' and
                rel_types[2][1] == 'forward' and rel_types[3][1] == 'forward'):
                return "cousin"
            # Check pattern: forward, forward, reverse, reverse (down-down-up-up)
            if (rel_types[0][1] == 'forward' and rel_types[1][1] == 'forward' and
                rel_types[2][1] == 'reverse' and rel_types[3][1] == 'reverse'):
                return "cousin"
    
    # Default: return generic relationship or "unrelated"
    return "unrelated"


def resolve_relationship(family_id, viewer_person_id, target_person_id):
    """
    Resolve the relationship between viewer and target person using BFS.
    
    Args:
        family_id: ID of the family
        viewer_person_id: ID of the person viewing
        target_person_id: ID of the target person
        
    Returns:
        dict with keys:
            - "label": str - Relationship label (e.g., "father", "sister", "cousin")
            - "path": List[int] - List of person IDs from viewer to target
            - "debug": dict - Debug information (visited count, etc.)
    """
    # Validate family exists
    family = get_object_or_404(Family, id=family_id)
    
    # Validate persons exist and belong to the family
    viewer_person = get_object_or_404(Person, id=viewer_person_id)
    target_person = get_object_or_404(Person, id=target_person_id)
    
    if viewer_person.family_id != family_id:
        raise ValueError(f"Viewer person {viewer_person_id} does not belong to family {family_id}")
    
    if target_person.family_id != family_id:
        raise ValueError(f"Target person {target_person_id} does not belong to family {family_id}")
    
    # Self relationship
    if viewer_person_id == target_person_id:
        return {
            "label": "self",
            "path": [viewer_person_id],
            "debug": {
                "visited_count": 0,
                "path_length": 0
            }
        }
    
    # BFS to find shortest path
    queue = deque([(viewer_person_id, [viewer_person_id])])
    visited = set([viewer_person_id])
    visited_count = 1
    
    # Optional: dedupe spouse pairs to avoid loops
    spouse_pairs_visited = set()
    
    while queue:
        current_id, path = queue.popleft()
        
        # Get neighbors
        neighbors = _get_neighbors(current_id, family_id)
        
        for neighbor_id, rel_type, direction in neighbors:
            # Skip if already visited
            if neighbor_id in visited:
                continue
            
            # For SPOUSE_OF, optionally dedupe pairs to avoid loops
            if rel_type == RelationshipTypeChoices.SPOUSE_OF:
                pair = tuple(sorted([current_id, neighbor_id]))
                if pair in spouse_pairs_visited:
                    continue
                spouse_pairs_visited.add(pair)
            
            # Found target
            if neighbor_id == target_person_id:
                final_path = path + [neighbor_id]
                label = _determine_label(final_path, viewer_person, target_person, family_id)
                
                return {
                    "label": label,
                    "path": final_path,
                    "debug": {
                        "visited_count": visited_count,
                        "path_length": len(final_path) - 1,
                        "relationship_types": _get_relationship_types_in_path(final_path, family_id)
                    }
                }
            
            # Add to queue
            visited.add(neighbor_id)
            visited_count += 1
            queue.append((neighbor_id, path + [neighbor_id]))
    
    # No path found
    return {
        "label": "unrelated",
        "path": [],
        "debug": {
            "visited_count": visited_count,
            "path_length": None
        }
    }
