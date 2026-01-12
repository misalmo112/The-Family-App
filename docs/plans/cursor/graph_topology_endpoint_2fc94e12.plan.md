---
name: Graph Topology Endpoint
overview: Implement GET /api/graph/topology/ endpoint that returns family graph topology with nodes (persons) and edges (relationships). Returns empty edges array for now since Relationship model doesn't exist yet.
todos:
  - id: create_topology_service
    content: Create topology_service.py with get_family_topology() function that fetches persons and returns structured topology data
    status: completed
  - id: create_topology_serializer
    content: Add TopologyResponseSerializer to serializers.py for response formatting
    status: completed
  - id: create_topology_view
    content: Add TopologyView class to views.py with permission checks and query param validation
    status: completed
    dependencies:
      - create_topology_service
  - id: add_topology_route
    content: Add 'topology/' route to urls.py pointing to TopologyView
    status: completed
    dependencies:
      - create_topology_view
---

# Graph Topology Endpoint Implementation

## Overview
Implement a GET endpoint `/api/graph/topology/` that returns the family graph topology including all person nodes and relationship edges. The endpoint will validate that the user is a family member and that the viewer_person_id belongs to the specified family.

## Implementation Details

### 1. Create Topology Service (`apps/graph/services/topology_service.py`)
- Create a service function `get_family_topology(family_id, viewer_person_id)` that:
  - Validates the family exists
  - Validates viewer_person_id belongs to the family
  - Fetches all Person objects for the family
  - Returns structured data: `{family_id, viewer_person_id, nodes, edges}`
  - Returns empty edges array for now (no Relationship model exists yet)

### 2. Create Topology Serializer (`apps/graph/serializers.py`)
- Add `TopologyResponseSerializer` to format the response:
  - `family_id` (integer)
  - `viewer_person_id` (integer)
  - `nodes` (list of PersonSerializer instances)
  - `edges` (list of edge objects with `from`, `to`, `type` fields)

### 3. Create Topology View (`apps/graph/views.py`)
- Add `TopologyView` class extending `APIView`:
  - Requires `IsAuthenticated` permission
  - Validates required query params: `family_id` and `viewer_person_id`
  - Uses `is_family_member()` helper to verify user is family member
  - Validates viewer_person_id belongs to the family
  - Calls topology service to get data
  - Returns serialized response

### 4. Add URL Route (`apps/graph/urls.py`)
- Add route: `path('topology/', TopologyView.as_view(), name='topology')`
- This creates endpoint: `GET /api/graph/topology/?family_id=...&viewer_person_id=...`

### 5. Response Format
```json
{
  "family_id": 1,
  "viewer_person_id": 5,
  "nodes": [
    {
      "id": 1,
      "family": 1,
      "first_name": "John",
      "last_name": "Doe",
      "dob": "1990-01-01",
      "gender": "MALE",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "edges": []
}
```

## Files to Modify
- `family-app/backend/apps/graph/services/topology_service.py` (new file)
- `family-app/backend/apps/graph/serializers.py` (add TopologyResponseSerializer)
- `family-app/backend/apps/graph/views.py` (add TopologyView)
- `family-app/backend/apps/graph/urls.py` (add topology route)

## Permissions & Validation
- User must be authenticated
- User must be a member of the specified family (using existing `is_family_member()` helper)
- `viewer_person_id` must belong to the specified family
- Return 400 for missing query params
- Return 403 for permission violations
- Return 404 for not found family/person

## Notes
- Edges array will be empty initially since Relationship model doesn't exist
- Spouse edges will NOT be deduplicated when relationships are added later (as per requirements)
- Reuses existing `is_family_member()` helper from views.py