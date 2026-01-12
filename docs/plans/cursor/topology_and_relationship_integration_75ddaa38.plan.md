---
name: Topology and Relationship Integration
overview: Integrate the topology endpoint with the relationship model by updating the topology service to fetch and return actual relationship edges instead of an empty array, ensuring proper edge formatting and testing the complete flow.
todos:
  - id: update-topology-service
    content: Update get_family_topology() in topology_service.py to fetch Relationship objects and convert them to edge format
    status: completed
  - id: verify-edge-format
    content: Verify edge format matches EdgeSerializer expectations and test with sample relationships
    status: completed
    dependencies:
      - update-topology-service
---

# Topology and Relationship Integration Plan

## Overview
Both the topology endpoint and relationship model are already implemented, but they're not yet integrated. The topology service currently returns an empty edges array. This plan integrates them by updating the topology service to fetch and return actual relationship edges from the Relationship model.

## Current State Analysis

**Already Implemented:**
- ✅ Topology endpoint (`GET /api/graph/topology/`) with `TopologyView`
- ✅ Topology service (`get_family_topology()`) - but returns empty edges array
- ✅ Relationship model with `PARENT_OF` and `SPOUSE_OF` types
- ✅ Relationship services (`add_parent()`, `add_spouse()`)
- ✅ Relationship validators (cycle detection, max parents, etc.)
- ✅ Relationship endpoint (`POST /api/graph/relationships/`)
- ✅ EdgeSerializer for formatting edges
- ✅ All URLs configured

**Missing Integration:**
- ❌ Topology service doesn't fetch Relationship objects
- ❌ Edges array is hardcoded as empty in [family-app/backend/apps/graph/services/topology_service.py](family-app/backend/apps/graph/services/topology_service.py)

## Implementation Steps

### 1. Update Topology Service to Fetch Relationships
**File:** [family-app/backend/apps/graph/services/topology_service.py](family-app/backend/apps/graph/services/topology_service.py)

Update `get_family_topology()` to:
- Fetch all `Relationship` objects for the family
- Convert each relationship to edge format: `{from: person_id, to: person_id, type: relationship_type}`
- Return edges array with actual data instead of empty array

**Edge Format:**
- `from`: ID of `from_person`
- `to`: ID of `to_person`  
- `type`: Relationship type string (e.g., "PARENT_OF", "SPOUSE_OF")

**Note on Spouse Relationships:**
- Since `SPOUSE_OF` relationships are stored bidirectionally (A→B and B→A), both edges will appear in the topology
- This is expected behavior per requirements (no deduplication)

### 2. Verify Edge Serialization
**File:** [family-app/backend/apps/graph/serializers.py](family-app/backend/apps/graph/serializers.py)

The `EdgeSerializer` already exists and handles the `from` field correctly (converting from `from_`). Ensure the topology service returns edges in the format expected by this serializer.

### 3. Test Integration
Verify that:
- Creating relationships via `POST /api/graph/relationships/` works
- Topology endpoint returns those relationships in the edges array
- Both `PARENT_OF` and `SPOUSE_OF` relationships appear correctly
- Spouse relationships appear bidirectionally (both A→B and B→A)

## Implementation Details

### Topology Service Update

The service should:
1. Query `Relationship.objects.filter(family=family)`
2. For each relationship, create an edge dict:
   ```python
   {
       'from': relationship.from_person_id,
       'to': relationship.to_person_id,
       'type': relationship.type
   }
   ```
3. Return edges as a list

### Edge Format Example

```json
{
  "family_id": 1,
  "viewer_person_id": 5,
  "nodes": [...],
  "edges": [
    {"from": 1, "to": 2, "type": "PARENT_OF"},
    {"from": 3, "to": 2, "type": "PARENT_OF"},
    {"from": 1, "to": 3, "type": "SPOUSE_OF"},
    {"from": 3, "to": 1, "type": "SPOUSE_OF"}
  ]
}
```

## Files to Modify

1. [family-app/backend/apps/graph/services/topology_service.py](family-app/backend/apps/graph/services/topology_service.py) - Update to fetch and return relationship edges

## Testing Checklist

After implementation:
- ✅ Create a family and persons
- ✅ Create PARENT_OF relationships
- ✅ Create SPOUSE_OF relationships  
- ✅ Call topology endpoint and verify edges array contains all relationships
- ✅ Verify spouse relationships appear bidirectionally
- ✅ Verify edge format matches EdgeSerializer expectations

## Dependencies

- Relationship model must be migrated (should already be done)
- Topology endpoint must be accessible (already configured)
- Relationship creation endpoint must work (already implemented)

## Notes

- No deduplication needed for spouse relationships - both directions will appear
- Edge format uses `from` (not `from_`) in the output JSON
- All relationships for the family are returned, regardless of viewer_person_id (viewer_person_id is only used for validation)