---
name: Add Basic Family Labels Test
overview: Add a test to verify basic family relationship labels (father, mother, son, spouse) are correctly computed and returned in the topology endpoint response for a simple family structure.
todos:
  - id: add-basic-family-test
    content: Add test_resolver_basic_family_labels test function to test_phase2_relationships_and_topology.py
    status: completed
---

# Add Basic Family Labels Test Plan

## Overview

Add a test `test_resolver_basic_family_labels` to verify that basic family relationship labels are correctly computed and returned in the topology endpoint. This test validates the integration between the relationship resolver and topology endpoint for a simple family structure.

## Test Structure

**File:** [family-app/backend/tests/test_phase2_relationships_and_topology.py](family-app/backend/tests/test_phase2_relationships_and_topology.py)

### Test: `test_resolver_basic_family_labels`

**Family Structure:**

- Dad (MALE) and Mom (FEMALE) - spouses
- Child (MALE) - child of both parents

**Relationships:**

- Dad → Child (PARENT_OF)
- Mom → Child (PARENT_OF)
- Dad ↔ Mom (SPOUSE_OF bidirectional)

**Test Cases:**

1. **Viewer = Child:**

- Child sees self as "self"
- Child sees Dad as "father"
- Child sees Mom as "mother"

2. **Viewer = Dad:**

- Dad sees self as "self"
- Dad sees Mom as "spouse"
- Dad sees Child as "son"

## Implementation Details

The test will:

1. Create admin user and authenticate
2. Create family
3. Create three persons: Dad (MALE), Mom (FEMALE), Kid (MALE)
4. Create relationships:

- SPOUSE_OF between Dad and Mom
- PARENT_OF from Dad to Kid
- PARENT_OF from Mom to Kid

5. Call topology endpoint with viewer=Kid and verify relationship labels
6. Call topology endpoint with viewer=Dad and verify relationship labels

## Files to Modify

1. [family-app/backend/tests/test_phase2_relationships_and_topology.py](family-app/backend/tests/test_phase2_relationships_and_topology.py) - Add new test function

## Test Assertions

- Verify `relation_to_viewer` field exists in all nodes
- Verify correct labels based on viewer perspective
- Use flexible assertions (e.g., `in ("father", "parent")`) to handle gender-based or generic labels