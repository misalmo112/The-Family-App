---
name: Add Relationship UI
overview: Add a form to the Topology page that allows family admins to create relationships (PARENT_OF, SPOUSE_OF) between persons. The backend already supports this via POST /api/graph/relationships/.
todos:
  - id: graph-service
    content: Add createRelationship function to frontend/src/services/graph.js
    status: completed
  - id: topology-form
    content: Add "Add Relationship" form Card to Topology.jsx with from/to/type dropdowns and submit button
    status: completed
  - id: state-handlers
    content: Add state and handlers for form fields, loading, and error display in Topology.jsx
    status: completed
  - id: refetch-logic
    content: Refetch topology after successful relationship creation to update the UI
    status: completed
---

# Add Relationship UI to Topology Page

## Summary

The backend already has the `POST /api/graph/relationships/` endpoint ready. This plan adds frontend support: a service function and a collapsible form on the Topology page.

## Architecture

```mermaid
sequenceDiagram
    participant User
    participant TopologyPage
    participant GraphService
    participant Backend
    
    User->>TopologyPage: Fill form and click Add
    TopologyPage->>GraphService: createRelationship(data)
    GraphService->>Backend: POST /api/graph/relationships/
    Backend-->>GraphService: 201 Created or 403 Forbidden
    GraphService-->>TopologyPage: Response
    TopologyPage->>TopologyPage: Refresh topology or show error
```

## Implementation

### 1. Add `createRelationship` to graph service

**File:** [family-app/frontend/src/services/graph.js](family-app/frontend/src/services/graph.js)

Add a new function:

```javascript
export const createRelationship = async ({ familyId, fromPersonId, toPersonId, type }) => {
  const response = await api.post('/api/graph/relationships/', {
    family: familyId,
    from_person: fromPersonId,
    to_person: toPersonId,
    type: type,  // 'PARENT_OF' or 'SPOUSE_OF'
  });
  return response.data;
};
```

### 2. Add relationship form to Topology page

**File:** [family-app/frontend/src/pages/Topology.jsx](family-app/frontend/src/pages/Topology.jsx)

Add a new Card with:

- "From Person" dropdown (select from existing persons)
- "To Person" dropdown (select from existing persons)
- "Relationship Type" dropdown (PARENT_OF, SPOUSE_OF)
- "Add Relationship" button
- Success/error handling with snackbar or alert
- On success: refetch topology to show the new relationship

Key UI behaviors:

- Disable "to_person" dropdown until "from_person" is selected
- Prevent selecting the same person for both
- Show loading spinner while submitting
- If backend returns 403, show "Only family admins can create relationships"

### 3. Imports to add

Add to Topology.jsx imports:

- `Button` from MUI
- `createRelationship` from services/graph