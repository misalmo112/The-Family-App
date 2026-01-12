---
name: Relationship Model Implementation
overview: Implement the Relationship model with PARENT_OF and SPOUSE_OF types, including validation services, relationship service with bidirectional spouse handling, and a POST endpoint for creating relationships (admin only).
todos: []
---

# Relationshi

p Model Implementation

## Overview

Implement the Relationship model in the graph app to represent family relationships between Person nodes, with support for PARENT_OF (unidirectional) and SPOUSE_OF (bidirectional) relationship types.

## Files to Create/Modify

### 1. Model: `family-app/backend/apps/graph/models.py`

- Add `RelationshipTypeChoices` enum with `PARENT_OF` and `SPOUSE_OF`
- Add `Relationship` model with:
- `family` (ForeignKey to `families.Family`)
- `from_person` (ForeignKey to `graph.Person`)
- `to_person` (ForeignKey to `graph.Person`)
- `type` (CharField with choices)
- Unique constraint on `(family, from_person, to_person, type)`
- Timestamps (`created_at`, `updated_at`)

### 2. Validator Service: `family-app/backend/apps/graph/services/relationship_validator.py`

Create validation functions:

- `validate_not_self(from_person, to_person)`: Ensure from_person ≠ to_person
- `validate_same_family(from_person, to_person)`: Ensure both persons belong to same family
- `validate_parent_cycle(family, from_person, to_person)`: Prevent cycles in parent relationships (e.g., A->B->A)
- `validate_max_parents(family, to_person, max_parents=2)`: Optional validation for max 2 parents per person
- `validate_relationship(family, from_person, to_person, relationship_type)`: Main validation orchestrator

### 3. Relationship Service: `family-app/backend/apps/graph/services/relationship_service.py`

Create service functions:

- `add_parent(family, parent_person, child_person)`: Create PARENT_OF relationship (unidirectional)
- Validates using relationship_validator
- Creates single Relationship instance
- Uses transaction.atomic()
- `add_spouse(family, person_a, person_b)`: Create SPOUSE_OF relationship (bidirectional)
- Validates using relationship_validator (for both directions)
- Creates TWO Relationship instances in one transaction:
    - person_a -> person_b (SPOUSE_OF)
    - person_b -> person_a (SPOUSE_OF)
- Uses transaction.atomic() to ensure both or neither

### 4. Serializer: `family-app/backend/apps/graph/serializers.py`

- Add `RelationshipSerializer`:
- Fields: `family`, `type`, `from_person_id`, `to_person_id`
- Validation for relationship type enum
- Custom validation to ensure persons exist and belong to family

### 5. View: `family-app/backend/apps/graph/views.py`

- Add `RelationshipView` (APIView):
- `POST` method only
- Permission: `IsAuthenticated`
- Check user is ADMIN of the family (using existing `is_family_admin` helper)
- Deserialize request data
- Route to appropriate service method based on `type`:
    - `PARENT_OF` → `relationship_service.add_parent()`
    - `SPOUSE_OF` → `relationship_service.add_spouse()`
- Return created relationship(s) with appropriate status code

### 6. URLs: `family-app/backend/apps/graph/urls.py`

- Add route: `path('relationships/', RelationshipView.as_view(), name='relationship-create')`

### 7. Migration

- Run `python manage.py makemigrations graph` to create migration for Relationship model

## Implementation Details

### Relationship Type Handling

- **PARENT_OF**: Stored unidirectionally (parent → child only)
- **SPOUSE_OF**: Stored bidirectionally (A→B and B→A created in single transaction)

### Validation Rules

1. Cannot create relationship to self (`from_person != to_person`)
2. Both persons must belong to same family
3. For PARENT_OF: Prevent cycles (no A→B→A paths)
4. For PARENT_OF: Optional max 2 parents per child (configurable)

### Spouse Mirroring

The `add_spouse()` function handles bidirectional creation:

```python
with transaction.atomic():
    Relationship.objects.create(family=family, from_person=person_a, to_person=person_b, type=SPOUSE_OF)
    Relationship.objects.create(family=family, from_person=person_b, to_person=person_a, type=SPOUSE_OF)
```

Both relationships are created atomically - if either fails, both are rolled back.

### Endpoint Details

- **URL**: `POST /api/graph/relationships/`
- **Request Body**: `{family_id, type, from_person_id, to_person_id}`
- **Response**: Created relationship object(s) with 201 status
- **Permissions**: User must be ADMIN of the specified family

## URL Pattern Output

After implementation, the URL patterns will be:

- `GET /api/graph/persons/` - List/create persons (existing)
- `POST /api/graph/relationships/` - Create relationships (new)

## Testing Considerations

- Test PARENT_OF creates single relationship
- Test SPOUSE_OF creates two relationships