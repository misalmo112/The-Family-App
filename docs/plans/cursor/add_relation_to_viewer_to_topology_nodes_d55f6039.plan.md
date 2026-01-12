---
name: Add relation_to_viewer to topology nodes
overview: Update GET /api/graph/topology/ response to include "relation_to_viewer" field for each node, computed using a new relationship_resolver service that determines family relationships (father, mother, spouse, sibling, self, etc.) based on the graph structure.
todos:
  - id: create_resolver
    content: Create relationship_resolver.py service with resolve_relationship function that computes family relationships
    status: completed
  - id: update_topology_service
    content: Update get_family_topology to compute relation_to_viewer for each node using the resolver
    status: completed
  - id: update_serializer
    content: Update PersonSerializer or TopologyResponseSerializer to include relation_to_viewer field in node output
    status: completed
  - id: add_tests
    content: Add test cases to verify relation_to_viewer is correctly computed and included in topology response
    status: completed
---

# Add relation_to_viewer to Topology Response

## Overview
Update the topology endpoint to include a `relation_to_viewer` field in each node of the response. This field will be computed using a relationship resolver that traverses the family graph to determine the relationship between the viewer and each node.

## Changes Required

### 1. Create Relationship Resolver Service
**File:** `family-app/backend/apps/graph/services/relationship_resolver.py` (new file)

Create a new service module with a `resolve_relationship` function that:
- Takes `viewer_person` and `target_person` as Person instances
- Returns relationship strings: "self", "father", "mother", "son", "daughter", "spouse", "brother", "sister", or "unknown"
- Handles basic relationships:
  - "self" when viewer == target
  - Direct parent relationships (father/mother based on gender)
  - Direct child relationships (son/daughter based on gender)
  - Spouse relationships
  - Sibling relationships (through shared parents)
- Uses the existing Relationship model to traverse the graph

### 2. Update Topology Service
**File:** `family-app/backend/apps/graph/services/topology_service.py`

Modify `get_family_topology` to:
- Import and use `relationship_resolver.resolve_relationship`
- For each person node, compute `relation_to_viewer` using the viewer_person
- Add `relation_to_viewer` to the node data structure
- Pass Person objects to the serializer (already done)

### 3. Update Person Serializer for Topology
**File:** `family-app/backend/apps/graph/serializers.py`

Update `PersonSerializer` or create a custom serializer method to:
- Include `relation_to_viewer` as a read-only field
- Handle the case where `relation_to_viewer` is provided in the context or as an additional field
- Ensure it's included in the topology response nodes

Alternatively, modify `TopologyResponseSerializer` to use a custom node serializer that includes `relation_to_viewer`.

### 4. Update Tests
**File:** `family-app/backend/tests/test_phase2_relationships_and_topology.py`

Add test cases to verify:
- Viewer node returns "self" as `relation_to_viewer`
- Parent relationships return "father" or "mother" based on gender
- Child relationships return "son" or "daughter" based on gender
- Spouse relationships return "spouse"
- Sibling relationships return "brother" or "sister" based on gender
- All nodes in topology response include `relation_to_viewer` field

## Implementation Details

### Relationship Resolution Logic
The resolver will:
1. Check if viewer == target → return "self"
2. Check direct PARENT_OF relationships → return "father"/"mother" based on target's gender
3. Check reverse PARENT_OF (target is parent of viewer) → return "son"/"daughter" based on target's gender
4. Check SPOUSE_OF relationships → return "spouse"
5. Check for shared parents to determine siblings → return "brother"/"sister" based on target's gender
6. Return "unknown" if no relationship can be determined

### Data Flow
```
TopologyView.get() 
  → get_family_topology() 
    → For each person: resolve_relationship(viewer_person, person)
    → Add relation_to_viewer to node data
  → TopologyResponseSerializer
    → PersonSerializer (with relation_to_viewer)
  → Response
```

## Notes
- No deduplication of spouse edges in backend (already handled - both directions are included)
- The resolver should handle cases where relationships might not be directly connected (e.g., cousins, aunts/uncles) but for basic relationships only, we'll focus on direct and sibling relationships
- Gender-based relationship names (father/mother, son/daughter, brother/sister) require checking the target person's gender field