---
name: Phase 2 Test Implementation
overview: Create Phase 2 test file to verify relationship creation (bidirectional SPOUSE_OF and unidirectional PARENT_OF) and topology endpoint integration.
todos:
  - id: create-test-file
    content: Create test_phase2_relationships_and_topology.py with both test functions
    status: completed
---

# Ph

ase 2 Test Implementation Plan

## Overview

Create test file `test_phase2_relationships_and_topology.py` with tests that verify:

1. SPOUSE_OF relationships are bidirectional (both A→B and B→A edges appear in topology)

2. PARENT_OF relationships are unidirectional (only parent→child edge appears)

## Test File Structure

**File:** [family-app/backend/tests/test_phase2_relationships_and_topology.py](family-app/backend/tests/test_phase2_relationships_and_topology.py)

### Test 1: `test_spouse_is_bidirectional_and_topology_includes_both_edges`

- Creates admin user and authenticates
- Creates a family

- Creates two persons (A and B)

- Creates SPOUSE_OF relationship from A to B

- Calls topology endpoint

- Verifies both A→B and B→A SPOUSE_OF edges exist in topology

### Test 2: `test_parent_is_directional_only`

- Creates admin user and authenticates
- Creates a family

- Creates parent and child persons

- Creates PARENT_OF relationship from parent to child

- Calls topology endpoint

- Verifies parent→child edge exists

- Verifies child→parent edge does NOT exist

## Implementation Details

Both tests follow the same pattern:

1. Use `@pytest.mark.django_db` decorator

2. Create user and authenticate via JWT

3. Create family and persons via API
4. Create relationship via API

5. Call topology endpoint

6. Assert edge presence/absence in topology response

## Files to Create

1. [family-app/backend/tests/test_phase2_relationships_and_topology.py](family-app/backend/tests/test_phase2_relationships_and_topology.py) - New test file with both test functions

## Test Dependencies

- Phase 1 functionality (families, persons, authentication) must be working

- Relationship creation endpoint must be working

- Topology endpoint must be working

- Integration between relationships and topology must be complete (already done)

## Notes

- Tests use pytest style (function-based) rather than Django TestCase class style

- Tests verify the complete flow: create relationships → check topology