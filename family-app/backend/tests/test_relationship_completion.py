"""
Tests for Relationship Completion Assistant feature
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family, FamilyMembership


@pytest.mark.django_db
def test_completion_detects_missing_parent():
    """Test that completion assistant detects when a child has only one parent but parent has a spouse"""
    User = get_user_model()
    admin = User.objects.create_user(username="completion1", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "completion1", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "CompletionFam1"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons: parent1, parent2 (spouses), child
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
    
    child = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    # Create spouse relationship
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent1["id"],
        "to_person_id": parent2["id"],
    }, format="json")
    
    # Add only parent1-child relationship (missing parent2)
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
    }, format="json")
    
    # Get completion suggestions
    completion_resp = c.get("/api/graph/relationships/completion/", {
        "family_id": family_id
    })
    
    assert completion_resp.status_code == 200
    suggestions = completion_resp.json()["suggestions"]
    
    # Should suggest adding parent2 as parent of child
    assert len(suggestions) > 0
    missing_parent_suggestion = next((s for s in suggestions if s["type"] == "missing_parent"), None)
    assert missing_parent_suggestion is not None
    assert missing_parent_suggestion["from_person_id"] == parent2["id"]
    assert missing_parent_suggestion["to_person_id"] == child["id"]
    assert missing_parent_suggestion["relationship_type"] == "PARENT_OF"
    assert missing_parent_suggestion["confidence"] == "high"


@pytest.mark.django_db
def test_completion_detects_missing_parent_reverse_spouse_order():
    """Test that completion detects missing parent when spouse relationship is stored as (parent2 -> parent1)"""
    User = get_user_model()
    admin = User.objects.create_user(username="completion1b", password="pass12345")

    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "completion1b", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    fam = c.post("/api/families/", {"name": "CompletionFam1b"}, format="json").json()
    family_id = fam["id"]

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

    child = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()

    # Create spouse relationship in reverse order (parent2 -> parent1)
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent2["id"],
        "to_person_id": parent1["id"],
    }, format="json")

    # Add only parent1-child (missing parent2)
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
    }, format="json")

    completion_resp = c.get("/api/graph/relationships/completion/", {"family_id": family_id})
    assert completion_resp.status_code == 200
    suggestions = completion_resp.json()["suggestions"]
    assert len(suggestions) > 0
    missing_parent_suggestion = next((s for s in suggestions if s["type"] == "missing_parent"), None)
    assert missing_parent_suggestion is not None
    assert missing_parent_suggestion["from_person_id"] == parent2["id"]
    assert missing_parent_suggestion["to_person_id"] == child["id"]


@pytest.mark.django_db
def test_completion_no_suggestions_when_complete():
    """Test that completion assistant returns no suggestions when family structure is complete"""
    User = get_user_model()
    admin = User.objects.create_user(username="completion2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "completion2", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "CompletionFam2"}, format="json").json()
    family_id = fam["id"]
    
    # Create complete family: parent1, parent2 (spouses), child
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
    
    child = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    # Create all relationships
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent1["id"],
        "to_person_id": parent2["id"],
    }, format="json")
    
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
    }, format="json")
    
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent2["id"],
        "to_person_id": child["id"],
    }, format="json")
    
    # Get completion suggestions
    completion_resp = c.get("/api/graph/relationships/completion/", {
        "family_id": family_id
    })
    
    assert completion_resp.status_code == 200
    suggestions = completion_resp.json()["suggestions"]
    
    # Should have no suggestions for missing parents (family is complete)
    missing_parent_suggestions = [s for s in suggestions if s["type"] == "missing_parent"]
    assert len(missing_parent_suggestions) == 0


@pytest.mark.django_db
def test_completion_with_person_id_filter():
    """Test that completion endpoint can filter by person_id"""
    User = get_user_model()
    admin = User.objects.create_user(username="completion3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "completion3", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "CompletionFam3"}, format="json").json()
    family_id = fam["id"]
    
    # Create two incomplete families
    parent1a = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "1A",
        "gender": "MALE"
    }, format="json").json()
    
    parent2a = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "2A",
        "gender": "FEMALE"
    }, format="json").json()
    
    child1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "1",
        "gender": "MALE"
    }, format="json").json()
    
    parent1b = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "1B",
        "gender": "MALE"
    }, format="json").json()
    
    parent2b = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "2B",
        "gender": "FEMALE"
    }, format="json").json()
    
    child2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Child",
        "last_name": "2",
        "gender": "MALE"
    }, format="json").json()
    
    # Create spouse relationships
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent1a["id"],
        "to_person_id": parent2a["id"],
    }, format="json")
    
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent1b["id"],
        "to_person_id": parent2b["id"],
    }, format="json")
    
    # Add only one parent for each child
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1a["id"],
        "to_person_id": child1["id"],
    }, format="json")
    
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1b["id"],
        "to_person_id": child2["id"],
    }, format="json")
    
    # Get completion suggestions for child1 only
    completion_resp = c.get("/api/graph/relationships/completion/", {
        "family_id": family_id,
        "person_id": child1["id"]
    })
    
    assert completion_resp.status_code == 200
    suggestions = completion_resp.json()["suggestions"]
    
    # Should only suggest for child1
    child1_suggestions = [s for s in suggestions if s["to_person_id"] == child1["id"]]
    child2_suggestions = [s for s in suggestions if s["to_person_id"] == child2["id"]]
    
    assert len(child1_suggestions) > 0
    assert len(child2_suggestions) == 0  # Should not include child2 when filtered


@pytest.mark.django_db
def test_completion_endpoint_requires_authentication():
    """Test that completion endpoint requires authentication"""
    c = APIClient()
    
    # Call without token
    resp = c.get("/api/graph/relationships/completion/", {
        "family_id": 1
    })
    
    assert resp.status_code == 401


@pytest.mark.django_db
def test_completion_endpoint_requires_family_membership():
    """Test that completion endpoint requires family membership"""
    User = get_user_model()
    user1 = User.objects.create_user(username="user1_comp", email="user1_comp@test.com", password="pass12345")
    user2 = User.objects.create_user(username="user2_comp", email="user2_comp@test.com", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "user2_comp", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # User1 creates family
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username": "user1_comp", "password": "pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    fam = c1.post("/api/families/", {"name": "Fam1"}, format="json").json()
    family_id = fam["id"]
    
    # User2 tries to access completion (not a member)
    resp = c.get("/api/graph/relationships/completion/", {
        "family_id": family_id
    })
    
    assert resp.status_code == 403


@pytest.mark.django_db
def test_completion_endpoint_validation():
    """Test that completion endpoint validates required parameters"""
    User = get_user_model()
    admin = User.objects.create_user(username="completion4", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "completion4", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Missing family_id
    resp = c.get("/api/graph/relationships/completion/")
    assert resp.status_code == 400
    
    # Invalid family_id
    resp = c.get("/api/graph/relationships/completion/", {
        "family_id": "invalid"
    })
    assert resp.status_code == 400
