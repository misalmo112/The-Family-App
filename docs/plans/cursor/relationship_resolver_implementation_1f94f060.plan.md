---
name: Relationship Resolver Implementation
overview: Implement relationship_resolver.py with BFS-based pathfinding to determine family relationships between two persons, supporting all MVP relationship labels (self, spouse, parent/child, sibling, grandparent/grandchild, aunt/uncle, niece/nephew, cousin).
todos: []
---

# Relationship Resolver Implementation Plan

## Overview
Implement `relationship_resolver.py` in `backend/apps/graph/services/` that uses BFS to find the shortest path between two persons and determines their relationship label based on the path structure.

## Key Components

### 1. Graph Traversal Logic
- **BFS Implementation**: Use breadth-first search to find shortest path from `viewer_person_id` to `target_person_id`
- **Bidirectional Traversal**:
  - `PARENT_OF`: Traverse both directions (parent→child stored, but allow child→parent reverse traversal)
  - `SPOUSE_OF`: Traverse both directions (bidirectional by design)
- **Loop Prevention**: Use visited set to avoid cycles, optionally dedupe spouse pairs
- **Path Tracking**: Store path (list of person IDs) for each node during BFS

### 2. Relationship Label Determination
Based on the shortest path found, determine relationship label:

- **self**: `viewer_person_id == target_person_id`
- **spouse**: Direct `SPOUSE_OF` relationship (path length 1)
- **father/mother**: Direct reverse `PARENT_OF` (target is parent of viewer) - use target's gender
- **son/daughter**: Direct forward `PARENT_OF` (target is child of viewer) - use target's gender
- **sibling** (brother/sister): Share same parent(s) - path through common parent, use target's gender
- **grandfather/grandmother**: 2 steps up via `PARENT_OF` - use target's gender
- **grandson/granddaughter**: 2 steps down via `PARENT_OF` - use target's gender
- **aunt/uncle**: Parent's sibling (parent → sibling) - use target's gender
- **niece/nephew**: Sibling's child (sibling → child) - use target's gender
- **cousin**: Share same grandparent but not same parent (2 steps up, then 2 steps down, or vice versa)

### 3. File Structure

**File**: `backend/apps/graph/services/relationship_resolver.py`

**Function Signature**:
```python
def resolve_relationship(family_id, viewer_person_id, target_person_id) -> dict:
    """
    Resolve the relationship between viewer and target person.
    
    Returns:
        {
            "label": str,  # e.g., "father", "sister", "cousin"
            "path": List[int],  # List of person IDs from viewer to target
            "debug": dict  # Optional debug information
        }
    """
```

### 4. Implementation Details

**Helper Functions**:
- `_get_neighbors(person_id, family_id)`: Get all adjacent persons (via PARENT_OF and SPOUSE_OF, both directions)
- `_determine_label(path, viewer_person, target_person)`: Analyze path structure and determine relationship label
- `_get_person_gender(person_id)`: Helper to get gender for gendered labels

**BFS Algorithm**:
1. Initialize queue with `(viewer_person_id, [viewer_person_id])`
2. Initialize visited set
3. While queue not empty:
   - Dequeue current person and path
   - If current == target: return path
   - Get neighbors (bidirectional traversal)
   - For each unvisited neighbor: enqueue with extended path
4. If no path found: return appropriate label (e.g., "unrelated" or None)

**Label Determination Logic**:
- Check path length and relationship types
- For gendered labels, use `target_person.gender`
- Handle special cases (sibling detection via common parents, cousin detection)

### 5. Test File

**File**: `backend/tests/test_phase5_relationship_resolver.py`

**Test Cases**:
- `test_resolve_self`: Same person
- `test_resolve_spouse`: Direct spouse relationship
- `test_resolve_parent_child`: Parent and child (both directions)
- `test_resolve_sibling`: Siblings via common parent
- `test_resolve_grandparent`: Grandparent relationship
- `test_resolve_grandchild`: Grandchild relationship
- `test_resolve_aunt_uncle`: Aunt/uncle relationship
- `test_resolve_niece_nephew`: Niece/nephew relationship
- `test_resolve_cousin`: Cousin relationship
- `test_resolve_gendered_labels`: Verify correct gender-specific labels (father/mother, son/daughter, etc.)
- `test_resolve_no_path`: Unrelated persons
- `test_resolve_complex_paths`: Multi-step relationships

**Test Setup**:
- Use direct model creation (similar to existing tests)
- Create Family, Persons, and Relationships
- Call `resolve_relationship` directly (not via API)

## Implementation Notes

1. **Graph Traversal**: Query relationships efficiently using `select_related` for person lookups
2. **Gender Handling**: Use `Person.gender` field for gendered labels (MALE/FEMALE/OTHER/UNKNOWN)
3. **Path Format**: Return list of person IDs `[viewer_id, ..., target_id]`
4. **Debug Info**: Include visited nodes count, path exploration details, relationship types in path
5. **Error Handling**: Validate that persons exist and belong to the family
6. **Performance**: Consider limiting BFS depth for very large families (optional optimization)

## Dependencies

- `apps.graph.models.Person`
- `apps.graph.models.Relationship`
- `apps.graph.models.RelationshipTypeChoices`
- `apps.graph.models.GenderChoices`
- `apps.families.models.Family`
- `django.shortcuts.get_object_or_404`