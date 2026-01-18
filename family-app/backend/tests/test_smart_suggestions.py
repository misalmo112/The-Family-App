"""
Tests for Smart Suggestions feature
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family, FamilyMembership


@pytest.mark.django_db
def test_suggestions_after_adding_parent_with_spouse():
    """Test that adding a parent with a spouse suggests adding the spouse as the other parent"""
    User = get_user_model()
    admin = User.objects.create_user(username="suggestions1", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "suggestions1", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "SuggestionsFam1"}, format="json").json()
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
    
    # Create spouse relationship between parents
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": parent1["id"],
        "to_person_id": parent2["id"],
    }, format="json")
    
    # Add parent1-child relationship
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
    }, format="json")
    
    # Get suggestions
    suggestions_resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": family_id,
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
        "relationship_type": "PARENT_OF"
    })
    
    assert suggestions_resp.status_code == 200
    suggestions = suggestions_resp.json()["suggestions"]
    
    # Should suggest adding parent2 as parent of child
    assert len(suggestions) > 0
    parent_suggestion = next((s for s in suggestions if s["type"] == "parent_spouse"), None)
    assert parent_suggestion is not None
    assert parent_suggestion["from_person_id"] == parent2["id"]
    assert parent_suggestion["to_person_id"] == child["id"]
    assert parent_suggestion["relationship_type"] == "PARENT_OF"
    assert parent_suggestion["confidence"] == "high"


@pytest.mark.django_db
def test_suggestions_after_adding_spouse_with_parents():
    """Test that adding a spouse suggests adding their parents as in-laws"""
    User = get_user_model()
    admin = User.objects.create_user(username="suggestions2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "suggestions2", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "SuggestionsFam2"}, format="json").json()
    family_id = fam["id"]
    
    # Create persons: personA, personB, personB's parent
    person_a = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Person",
        "last_name": "A",
        "gender": "MALE"
    }, format="json").json()
    
    person_b = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Person",
        "last_name": "B",
        "gender": "FEMALE"
    }, format="json").json()
    
    person_b_parent = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Parent",
        "last_name": "OfB",
        "gender": "MALE"
    }, format="json").json()
    
    # Create parent relationship
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": person_b_parent["id"],
        "to_person_id": person_b["id"],
    }, format="json")
    
    # Add spouse relationship
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": person_a["id"],
        "to_person_id": person_b["id"],
    }, format="json")
    
    # Get suggestions
    suggestions_resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": family_id,
        "from_person_id": person_a["id"],
        "to_person_id": person_b["id"],
        "relationship_type": "SPOUSE_OF"
    })
    
    assert suggestions_resp.status_code == 200
    suggestions = suggestions_resp.json()["suggestions"]
    
    # Should suggest in-law relationships (informational)
    assert len(suggestions) > 0
    inlaw_suggestion = next((s for s in suggestions if s["type"] == "spouse_parent_inlaw"), None)
    assert inlaw_suggestion is not None


@pytest.mark.django_db
def test_suggestions_no_suggestions_when_spouse_already_parent():
    """Test that no duplicate suggestions are made when spouse is already a parent"""
    User = get_user_model()
    admin = User.objects.create_user(username="suggestions3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "suggestions3", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create family
    fam = c.post("/api/families/", {"name": "SuggestionsFam3"}, format="json").json()
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
    
    # Get suggestions - should not suggest parent2 again
    suggestions_resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": family_id,
        "from_person_id": parent1["id"],
        "to_person_id": child["id"],
        "relationship_type": "PARENT_OF"
    })
    
    assert suggestions_resp.status_code == 200
    suggestions = suggestions_resp.json()["suggestions"]
    
    # Should not have parent_spouse suggestion since parent2 is already a parent
    parent_suggestions = [s for s in suggestions if s["type"] == "parent_spouse"]
    assert len(parent_suggestions) == 0


@pytest.mark.django_db
def test_suggestions_endpoint_requires_authentication():
    """Test that suggestions endpoint requires authentication"""
    c = APIClient()
    
    # Call without token
    resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": 1,
        "from_person_id": 1,
        "to_person_id": 2,
        "relationship_type": "PARENT_OF"
    })
    
    assert resp.status_code == 401


@pytest.mark.django_db
def test_suggestions_endpoint_requires_family_membership():
    """Test that suggestions endpoint requires family membership"""
    User = get_user_model()
    user1 = User.objects.create_user(username="user1_membership", email="user1_membership@test.com", password="pass12345")
    user2 = User.objects.create_user(username="user2_membership", email="user2_membership@test.com", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "user2_membership", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # User1 creates family
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username": "user1_membership", "password": "pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    fam = c1.post("/api/families/", {"name": "Fam1"}, format="json").json()
    family_id = fam["id"]
    
    # User2 tries to access suggestions (not a member)
    resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": family_id,
        "from_person_id": 1,
        "to_person_id": 2,
        "relationship_type": "PARENT_OF"
    })
    
    assert resp.status_code == 403


@pytest.mark.django_db
def test_suggestions_invalid_parameters():
    """Test that suggestions endpoint validates required parameters"""
    User = get_user_model()
    admin = User.objects.create_user(username="suggestions4", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "suggestions4", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Missing family_id
    resp = c.get("/api/graph/relationships/suggestions/", {
        "from_person_id": 1,
        "to_person_id": 2,
        "relationship_type": "PARENT_OF"
    })
    assert resp.status_code == 400
    
    # Missing from_person_id
    resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": 1,
        "to_person_id": 2,
        "relationship_type": "PARENT_OF"
    })
    assert resp.status_code == 400
    
    # Invalid relationship_type
    fam = c.post("/api/families/", {"name": "Fam"}, format="json").json()
    resp = c.get("/api/graph/relationships/suggestions/", {
        "family_id": fam["id"],
        "from_person_id": 1,
        "to_person_id": 2,
        "relationship_type": "INVALID_TYPE"
    })
    assert resp.status_code == 400
