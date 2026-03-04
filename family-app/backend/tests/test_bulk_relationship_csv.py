"""
Tests for bulk relationship creation with CSV-style names (resolve_or_create_person).
- Only admin can create.
- Names split on first space; match existing person to avoid duplication.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family, FamilyMembership
from apps.graph.services.bulk_relationship_service import resolve_or_create_person


# --- resolve_or_create_person (unit) ---


@pytest.mark.django_db
def test_resolve_or_create_person_matches_existing():
    """Match existing person by normalized full name (case-insensitive)."""
    User = get_user_model()
    user = User.objects.create_user(username="resolver1", email="resolver1@test.com", password="pass")
    family = Family.objects.create(name="TestFam", created_by=user)
    Person.objects.create(family=family, first_name="John", last_name="Doe")
    person = resolve_or_create_person(family, "John Doe")
    assert person.first_name == "John"
    assert person.last_name == "Doe"
    assert Person.objects.filter(family=family).count() == 1
    # Case-insensitive match
    person2 = resolve_or_create_person(family, "JOHN DOE")
    assert person2.id == person.id
    assert Person.objects.filter(family=family).count() == 1


@pytest.mark.django_db
def test_resolve_or_create_person_creates_new():
    """Create new person when no match; split on first space."""
    User = get_user_model()
    user = User.objects.create_user(username="resolver2", email="resolver2@test.com", password="pass")
    family = Family.objects.create(name="TestFam", created_by=user)
    person = resolve_or_create_person(family, "Jane Smith")
    assert person.first_name == "Jane"
    assert person.last_name == "Smith"
    assert person.family_id == family.id


@pytest.mark.django_db
def test_resolve_or_create_person_split_first_space():
    """Single word -> first_name only; multiple -> first space split."""
    User = get_user_model()
    user = User.objects.create_user(username="resolver3", email="resolver3@test.com", password="pass")
    family = Family.objects.create(name="TestFam", created_by=user)
    p1 = resolve_or_create_person(family, "Madonna")
    assert p1.first_name == "Madonna"
    assert p1.last_name == ""
    p2 = resolve_or_create_person(family, "John Paul Jones")
    assert p2.first_name == "John"
    assert p2.last_name == "Paul Jones"


@pytest.mark.django_db
def test_resolve_or_create_person_no_duplicate_same_name():
    """Second call with same name returns same person, does not create duplicate."""
    User = get_user_model()
    user = User.objects.create_user(username="resolver4", email="resolver4@test.com", password="pass")
    family = Family.objects.create(name="TestFam", created_by=user)
    p1 = resolve_or_create_person(family, "Alice Brown")
    p2 = resolve_or_create_person(family, "alice brown")
    assert p1.id == p2.id
    assert Person.objects.filter(family=family).count() == 1


@pytest.mark.django_db
def test_resolve_or_create_person_empty_name_raises():
    """Empty or whitespace-only name raises ValidationError."""
    User = get_user_model()
    user = User.objects.create_user(username="resolver5", email="resolver5@test.com", password="pass")
    family = Family.objects.create(name="TestFam", created_by=user)
    with pytest.raises(ValidationError) as exc_info:
        resolve_or_create_person(family, "")
    assert "empty" in str(exc_info.value).lower()
    with pytest.raises(ValidationError):
        resolve_or_create_person(family, "   ")
    assert Person.objects.filter(family=family).count() == 0


# --- Bulk relationship API with viewer_name / target_name ---


@pytest.mark.django_db
def test_bulk_relationship_with_names_creates_missing_persons():
    """POST with viewer_name/target_name creates missing persons and relationship."""
    User = get_user_model()
    admin = User.objects.create_user(username="bulkrel1", password="pass12345")
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulkrel1", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    fam = c.post("/api/families/", {"name": "BulkRelFam1"}, format="json").json()
    family_id = fam["id"]
    # One existing person
    existing = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Existing",
        "last_name": "Person",
        "gender": "MALE",
    }, format="json").json()
    # Request relationship: existing person -> new person (by name)
    resp = c.post("/api/graph/relationships/bulk/", {
        "family_id": family_id,
        "relationships": [
            {
                "viewer_name": "Existing Person",
                "target_name": "New Child",
                "label": "son",
            },
        ],
    }, format="json")
    assert resp.status_code == 201, resp.json()
    data = resp.json()
    assert data["created_count"] >= 1
    # New person should exist
    new_person = Person.objects.filter(family_id=family_id, first_name="New", last_name="Child").first()
    assert new_person is not None
    # Relationship should exist (parent-of: Existing -> New Child)
    assert Relationship.objects.filter(family_id=family_id).exists()


@pytest.mark.django_db
def test_bulk_relationship_with_names_admin_only():
    """Only family admin can create relationships (and thus create persons)."""
    User = get_user_model()
    admin = User.objects.create_user(username="bulkrel_admin", email="bulkrel_admin@test.com", password="pass12345")
    member = User.objects.create_user(username="bulkrel_member", email="bulkrel_member@test.com", password="pass12345")
    c_admin = APIClient()
    token_admin = c_admin.post("/api/auth/token/", {"username": "bulkrel_admin", "password": "pass12345"}, format="json").json()["access"]
    c_admin.credentials(HTTP_AUTHORIZATION=f"Bearer {token_admin}")
    fam = c_admin.post("/api/families/", {"name": "BulkRelFam2"}, format="json").json()
    family_id = fam["id"]
    member_person = c_admin.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Member",
        "last_name": "User",
        "gender": "MALE",
    }, format="json").json()
    FamilyMembership.objects.create(
        user=member,
        family_id=family_id,
        person_id=member_person["id"],
        role=FamilyMembership.Role.MEMBER,
        status=FamilyMembership.Status.ACTIVE,
    )
    c_member = APIClient()
    token_member = c_member.post("/api/auth/token/", {"username": "bulkrel_member", "password": "pass12345"}, format="json").json()["access"]
    c_member.credentials(HTTP_AUTHORIZATION=f"Bearer {token_member}")
    resp = c_member.post("/api/graph/relationships/bulk/", {
        "family_id": family_id,
        "relationships": [
            {"viewer_name": "Member User", "target_name": "Some New", "label": "son"},
        ],
    }, format="json")
    assert resp.status_code == 403
    assert "admin" in resp.json().get("error", "").lower()
    # No new person created by non-admin
    assert not Person.objects.filter(family_id=family_id, first_name="Some", last_name="New").exists()


@pytest.mark.django_db
def test_bulk_relationship_same_person_rejected():
    """viewer_name and target_name same person -> validation error."""
    User = get_user_model()
    admin = User.objects.create_user(username="bulkrel3", password="pass12345")
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulkrel3", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    fam = c.post("/api/families/", {"name": "BulkRelFam3"}, format="json").json()
    family_id = fam["id"]
    resp = c.post("/api/graph/relationships/bulk/", {
        "family_id": family_id,
        "relationships": [
            {"viewer_name": "John Doe", "target_name": "John Doe", "label": "father"},
        ],
    }, format="json")
    assert resp.status_code == 400
    assert "same" in str(resp.json()).lower() or "viewer" in str(resp.json()).lower()


@pytest.mark.django_db
def test_bulk_relationship_still_accepts_ids():
    """Backend still accepts viewer_id/target_id for manual tab."""
    User = get_user_model()
    admin = User.objects.create_user(username="bulkrel4", password="pass12345")
    c = APIClient()
    token = c.post("/api/auth/token/", {"username": "bulkrel4", "password": "pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    fam = c.post("/api/families/", {"name": "BulkRelFam4"}, format="json").json()
    family_id = fam["id"]
    p1 = c.post("/api/graph/persons/", {"family_id": family_id, "first_name": "A", "last_name": "One", "gender": "MALE"}, format="json").json()
    p2 = c.post("/api/graph/persons/", {"family_id": family_id, "first_name": "B", "last_name": "Two", "gender": "FEMALE"}, format="json").json()
    resp = c.post("/api/graph/relationships/bulk/", {
        "family_id": family_id,
        "relationships": [
            {"viewer_id": p1["id"], "target_id": p2["id"], "label": "spouse"},
        ],
    }, format="json")
    assert resp.status_code == 201
    assert resp.json()["created_count"] >= 1
