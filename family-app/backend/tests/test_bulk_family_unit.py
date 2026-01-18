"""
Tests for Bulk Family Unit Creation feature
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family, FamilyMembership


@pytest.mark.django_db
def test_create_family_unit_two_parents_children():
    """Test creating a complete family unit with two parents and multiple children"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk1", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulk1", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "BulkFam1"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons
    parent1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    parent2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    child1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    # Create family unit
    bulk_resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "parent2_id": parent2["id"],
        "children_ids": [child1["id"], child2["id"]]
    }, format="json")
    
    assert bulk_resp.status_code == 201
    result = bulk_resp.json()
    
    # Verify all relationships were created
    assert result["created_count"] == 6  # 2 spouse relationships + 4 parent-child relationships
    
    # Verify relationships exist
    relationships = Relationship.objects.filter(family_id=family_id)
    
    # Check spouse relationships (bidirectional)
    spouse_rels = relationships.filter(type=RelationshipTypeChoices.SPOUSE_OF)
    assert spouse_rels.count() == 2  # Both directions
    
    # Check parent-child relationships
    parent_child_rels = relationships.filter(type=RelationshipTypeChoices.PARENT_OF)
    assert parent_child_rels.count() == 4  # parent1->child1, parent1->child2, parent2->child1, parent2->child2
    
    # Verify specific relationships exist
    assert parent_child_rels.filter(from_person_id=parent1["id"], to_person_id=child1["id"]).exists()
    assert parent_child_rels.filter(from_person_id=parent1["id"], to_person_id=child2["id"]).exists()
    assert parent_child_rels.filter(from_person_id=parent2["id"], to_person_id=child1["id"]).exists()
    assert parent_child_rels.filter(from_person_id=parent2["id"], to_person_id=child2["id"]).exists()


@pytest.mark.django_db
def test_create_family_unit_single_parent():
    """Test creating a family unit with only one parent"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulk2", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "BulkFam2"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons
    parent1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    # Create family unit with only parent1
    bulk_resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "parent2_id": None,
        "children_ids": [child1["id"], child2["id"]]
    }, format="json")
    
    assert bulk_resp.status_code == 201
    result = bulk_resp.json()
    
    # Should create 2 parent-child relationships (no spouse relationship)
    assert result["created_count"] == 2
    
    # Verify relationships
    relationships = Relationship.objects.filter(family_id=family_id)
    parent_child_rels = relationships.filter(type=RelationshipTypeChoices.PARENT_OF)
    assert parent_child_rels.count() == 2
    
    # No spouse relationships should exist
    spouse_rels = relationships.filter(type=RelationshipTypeChoices.SPOUSE_OF)
    assert spouse_rels.count() == 0


@pytest.mark.django_db
def test_create_family_unit_partial_failure():
    """Test that bulk creation handles partial failures gracefully"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulk3", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "BulkFam3"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons
    parent1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    parent2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    child1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    # Manually create parent1-child1 relationship (duplicate)
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1["id"],
        "to_person_id": child1["id"],
    }, format="json")
    
    # Create family unit (should fail on parent1-child1 but succeed on others)
    bulk_resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "parent2_id": parent2["id"],
        "children_ids": [child1["id"], child2["id"]]
    }, format="json")
    
    # Should return 207 (Multi-Status) for partial success
    assert bulk_resp.status_code == 207
    result = bulk_resp.json()
    
    # Should have some relationships created
    assert result["created_count"] > 0
    # Should have errors
    assert "errors" in result
    assert len(result["errors"]) > 0
    
    # Verify that other relationships were still created
    relationships = Relationship.objects.filter(family_id=family_id)
    parent_child_rels = relationships.filter(type=RelationshipTypeChoices.PARENT_OF)
    # Should have at least parent1->child2, parent2->child1, parent2->child2
    assert parent_child_rels.count() >= 3


@pytest.mark.django_db
def test_bulk_endpoint_requires_admin():
    """Test that bulk endpoint requires admin permissions"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk_admin", email="bulk_admin@test.com", password="pass12345")
    member = User.objects.create_user(username="bulk_member", email="bulk_member@test.com", password="pass12345")
    
    # Admin creates family
    c_admin = APIClient()
    token_admin = c_admin.post("/api/auth/token/", {"username": "bulk_admin", "password": "pass12345"}, format="json").json()["access"]
    c_admin.credentials(HTTP_AUTHORIZATION=f"Bearer {token_admin}")
    
    fam = c_admin.post("/api/families/", {"name": "BulkFam4"}, format="json").json()
    family_id = fam["id"]
    
    # Create person for member
    member_person = c_admin.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Member",
        "last_name": "Person",
        "gender": "MALE"
    }, format="json").json()
    
    # Add member to family (not admin)
    FamilyMembership.objects.create(
        user=member,
        family_id=family_id,
        person_id=member_person["id"],
        role=FamilyMembership.Role.MEMBER,
        status=FamilyMembership.Status.ACTIVE
    )
    
    # Create persons
    parent1 = c_admin.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child1 = c_admin.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    # Member tries to create family unit
    c_member = APIClient()
    token_member = c_member.post("/api/auth/token/", {"username": "bulk_member", "password": "pass12345"}, format="json").json()["access"]
    c_member.credentials(HTTP_AUTHORIZATION=f"Bearer {token_member}")
    
    bulk_resp = c_member.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "children_ids": [child1["id"]]
    }, format="json")
    
    assert bulk_resp.status_code == 403
    assert "admin" in bulk_resp.json()["error"].lower()


@pytest.mark.django_db
def test_bulk_endpoint_validation():
    """Test that bulk endpoint validates required fields"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk5", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulk5", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "BulkFam5"}, format="json").json()
    family_id = fam["id"]
    
    # Test: no parents
    resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "children_ids": [1]
    }, format="json")
    assert resp.status_code == 400
    assert "parent" in resp.json().get("non_field_errors", [""])[0].lower()
    
    # Test: no children
    parent1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "children_ids": []
    }, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_bulk_endpoint_transaction_handling():
    """Test that bulk creation uses transactions properly"""
    User = get_user_model()
    admin = User.objects.create_user(username="bulk6", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulk6", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "BulkFam6"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons
    parent1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    parent2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    child1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    child2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    # Create family unit successfully
    bulk_resp = c.post("/api/graph/family-units/", {
        "family_id": family_id,
        "parent1_id": parent1["id"],
        "parent2_id": parent2["id"],
        "children_ids": [child1["id"], child2["id"]]
    }, format="json")
    
    assert bulk_resp.status_code == 201
    
    # Verify all relationships were created atomically
    relationships = Relationship.objects.filter(family_id=family_id)
    assert relationships.count() == 6  # 2 spouse + 4 parent-child
    
    # Verify spouse relationships exist
    spouse_count = relationships.filter(type=RelationshipTypeChoices.SPOUSE_OF).count()
    assert spouse_count == 2
    
    # Verify all parent-child relationships exist
    parent_child_count = relationships.filter(type=RelationshipTypeChoices.PARENT_OF).count()
    assert parent_child_count == 4
