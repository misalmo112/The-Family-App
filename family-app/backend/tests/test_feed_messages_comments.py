import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.families.models import FamilyMembership
from apps.feed.models import Post, PostComment, PostTypeChoices


@pytest.mark.django_db
def test_create_message_rejects_image_url():
    """Test that creating MESSAGE with image_url is rejected"""
    User = get_user_model()
    user = User.objects.create_user(username="msguser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"msguser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"MsgFam"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Message",
        "last_name": "User",
        "gender": "MALE"
    }, format="json").json()
    
    # Try to create MESSAGE with image_url - should be rejected
    response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Test message",
        "author_person_id": person["id"],
        "image_url": "https://example.com/image.jpg"
    }, format="json")
    
    assert response.status_code == 400
    assert "image_url" in response.json()
    assert "MESSAGE type posts cannot have an image_url" in str(response.json()["image_url"])


@pytest.mark.django_db
def test_create_message_ignores_empty_image_url():
    """Test that creating MESSAGE with empty string image_url succeeds and stores null"""
    User = get_user_model()
    user = User.objects.create_user(username="msguser2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"msguser2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"MsgFam2"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Message",
        "last_name": "User2",
        "gender": "MALE"
    }, format="json").json()
    
    # Create MESSAGE with empty string image_url - should succeed
    response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Test message",
        "author_person_id": person["id"],
        "image_url": ""
    }, format="json")
    
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["type"] == "MESSAGE"
    assert data["image_url"] is None


@pytest.mark.django_db
def test_create_message_success():
    """Test that creating MESSAGE without image_url succeeds"""
    User = get_user_model()
    user = User.objects.create_user(username="msguser3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"msguser3","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"MsgFam3"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Message",
        "last_name": "User3",
        "gender": "MALE"
    }, format="json").json()
    
    # Create MESSAGE without image_url - should succeed
    response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Test message",
        "author_person_id": person["id"]
    }, format="json")
    
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["type"] == "MESSAGE"
    assert data["text"] == "Test message"
    assert data["image_url"] is None


@pytest.mark.django_db
def test_filter_feed_by_type_message():
    """Test filtering feed by type=MESSAGE returns only MESSAGE posts"""
    User = get_user_model()
    user = User.objects.create_user(username="filteruser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"filteruser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"FilterFam"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Filter",
        "last_name": "User",
        "gender": "MALE"
    }, format="json").json()
    
    # Create one MESSAGE and one POST
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "This is a message",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "This is a post",
        "author_person_id": person["id"]
    }, format="json")
    
    # Filter by type=MESSAGE
    response = c.get(f"/api/feed/?family_id={family_id}&type=MESSAGE")
    assert response.status_code == 200
    items = response.json().get("results", [])
    
    # All items should be MESSAGE type
    assert len(items) >= 1
    assert all(item["type"] == "MESSAGE" for item in items)
    assert any(item["text"] == "This is a message" for item in items)
    assert not any(item["text"] == "This is a post" for item in items)


@pytest.mark.django_db
def test_filter_feed_by_type_post():
    """Test filtering feed by type=POST returns only POST posts"""
    User = get_user_model()
    user = User.objects.create_user(username="filteruser2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"filteruser2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"FilterFam2"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Filter",
        "last_name": "User2",
        "gender": "MALE"
    }, format="json").json()
    
    # Create one MESSAGE and one POST
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "This is a message",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "This is a post",
        "author_person_id": person["id"]
    }, format="json")
    
    # Filter by type=POST
    response = c.get(f"/api/feed/?family_id={family_id}&type=POST")
    assert response.status_code == 200
    items = response.json().get("results", [])
    
    # All items should be POST type
    assert len(items) >= 1
    assert all(item["type"] == "POST" for item in items)
    assert any(item["text"] == "This is a post" for item in items)
    assert not any(item["text"] == "This is a message" for item in items)


@pytest.mark.django_db
def test_filter_feed_mixed_types():
    """Test filtering with mixed types (POST, MESSAGE, ANNOUNCEMENT)"""
    User = get_user_model()
    user = User.objects.create_user(username="filteruser3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"filteruser3","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"FilterFam3"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Filter",
        "last_name": "User3",
        "gender": "MALE"
    }, format="json").json()
    
    # Create one of each type
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Post content",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Message content",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "ANNOUNCEMENT",
        "text": "Announcement content",
        "author_person_id": person["id"]
    }, format="json")
    
    # Test each filter
    for post_type in ["POST", "MESSAGE", "ANNOUNCEMENT"]:
        response = c.get(f"/api/feed/?family_id={family_id}&type={post_type}")
        assert response.status_code == 200
        items = response.json().get("results", [])
        assert all(item["type"] == post_type for item in items)


@pytest.mark.django_db
def test_filter_by_author_person_id_same_family():
    """Test filtering by author_person_id within same family succeeds"""
    User = get_user_model()
    user = User.objects.create_user(username="authoruser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"authoruser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"AuthorFam"}, format="json").json()
    family_id = fam["id"]
    
    person1 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Person",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    person2 = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Person",
        "last_name": "Two",
        "gender": "FEMALE"
    }, format="json").json()
    
    # Create posts by different persons
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Post by person 1",
        "author_person_id": person1["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Post by person 2",
        "author_person_id": person2["id"]
    }, format="json")
    
    # Filter by person1
    response = c.get(f"/api/feed/?family_id={family_id}&author_person_id={person1['id']}")
    assert response.status_code == 200
    items = response.json().get("results", [])
    assert len(items) >= 1
    assert all(item["author_person_id"] == person1["id"] for item in items)
    assert any(item["text"] == "Post by person 1" for item in items)
    assert not any(item["text"] == "Post by person 2" for item in items)


@pytest.mark.django_db
def test_filter_by_author_person_id_different_family():
    """Test filtering by author_person_id from different family returns 404"""
    User = get_user_model()
    user1 = User.objects.create_user(username="user1", email="user1@test.com", password="pass12345")
    user2 = User.objects.create_user(username="user2", email="user2@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"user1","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"user2","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Create two families
    fam1 = c1.post("/api/families/", {"name":"Family1"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"Family2"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Create person in family 2
    person2 = c2.post("/api/graph/persons/", {
        "family_id": family_id2,
        "first_name": "Person",
        "last_name": "Two",
        "gender": "MALE"
    }, format="json").json()
    
    # Try to filter by person2 from family1 - should return 404
    response = c1.get(f"/api/feed/?family_id={family_id1}&author_person_id={person2['id']}")
    assert response.status_code == 404
    assert "Person does not exist in this family" in response.json()["error"]


@pytest.mark.django_db
def test_filter_by_author_person_id_requires_family_membership():
    """Test that user not in family cannot filter by person"""
    User = get_user_model()
    user1 = User.objects.create_user(username="memberuser", email="memberuser@test.com", password="pass12345")
    user2 = User.objects.create_user(username="nonmemberuser", email="nonmemberuser@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"memberuser","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"nonmemberuser","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # User1 creates family and person
    fam = c1.post("/api/families/", {"name":"MemberFam"}, format="json").json()
    family_id = fam["id"]
    
    person = c1.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Person",
        "last_name": "One",
        "gender": "MALE"
    }, format="json").json()
    
    # User2 (not a member) tries to filter by person - should return 403
    response = c2.get(f"/api/feed/?family_id={family_id}&author_person_id={person['id']}")
    assert response.status_code == 403
    assert "not a member of this family" in response.json()["error"]


@pytest.mark.django_db
def test_profile_view_returns_only_posts():
    """Test that profile view (author_person_id without type) defaults to type=POST only"""
    User = get_user_model()
    user = User.objects.create_user(username="profileuser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"profileuser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"ProfileFam"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Profile",
        "last_name": "User",
        "gender": "MALE"
    }, format="json").json()
    
    # Create POST, MESSAGE, and ANNOUNCEMENT by same person
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Profile post",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Profile message",
        "author_person_id": person["id"]
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "ANNOUNCEMENT",
        "text": "Profile announcement",
        "author_person_id": person["id"]
    }, format="json")
    
    # Profile view (author_person_id without type) should return only POSTs
    response = c.get(f"/api/feed/?family_id={family_id}&author_person_id={person['id']}")
    assert response.status_code == 200
    items = response.json().get("results", [])
    assert len(items) >= 1
    assert all(item["type"] == "POST" for item in items)
    assert any(item["text"] == "Profile post" for item in items)
    assert not any(item["text"] == "Profile message" for item in items)
    assert not any(item["text"] == "Profile announcement" for item in items)


@pytest.mark.django_db
def test_profile_view_same_family_success():
    """Test profile view for person in same family succeeds"""
    User = get_user_model()
    user = User.objects.create_user(username="profileuser2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"profileuser2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"ProfileFam2"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Profile",
        "last_name": "User2",
        "gender": "MALE"
    }, format="json").json()
    
    # Create a post
    c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "My post",
        "author_person_id": person["id"]
    }, format="json")
    
    # View profile - should succeed
    response = c.get(f"/api/feed/?family_id={family_id}&author_person_id={person['id']}")
    assert response.status_code == 200
    items = response.json().get("results", [])
    assert len(items) >= 1


@pytest.mark.django_db
def test_profile_view_different_family_forbidden():
    """Test profile view for person in different family returns 403"""
    User = get_user_model()
    user1 = User.objects.create_user(username="profileuser3", email="profileuser3@test.com", password="pass12345")
    user2 = User.objects.create_user(username="profileuser4", email="profileuser4@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"profileuser3","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"profileuser4","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Create two families
    fam1 = c1.post("/api/families/", {"name":"ProfileFam3"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"ProfileFam4"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Create person in family 2
    person2 = c2.post("/api/graph/persons/", {
        "family_id": family_id2,
        "first_name": "Person",
        "last_name": "Two",
        "gender": "MALE"
    }, format="json").json()
    
    # User1 tries to view person2's profile from family1 - should return 404 (person not in family)
    response = c1.get(f"/api/feed/?family_id={family_id1}&author_person_id={person2['id']}")
    assert response.status_code == 404
    assert "Person does not exist in this family" in response.json()["error"]


@pytest.mark.django_db
def test_scope_all_families_author_user_success():
    """Test user viewing own posts with scope=all_families succeeds across families"""
    User = get_user_model()
    user = User.objects.create_user(username="scopeuser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"scopeuser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Create two families
    fam1 = c.post("/api/families/", {"name":"ScopeFam1"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c.post("/api/families/", {"name":"ScopeFam2"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Get the person created automatically for user in each family (from membership)
    # We need to find the person linked to user's membership
    from apps.families.models import FamilyMembership
    membership1 = FamilyMembership.objects.filter(user=user, family_id=family_id1).first()
    membership2 = FamilyMembership.objects.filter(user=user, family_id=family_id2).first()
    person_id1 = membership1.person.id
    person_id2 = membership2.person.id
    
    # Create posts in both families
    c.post("/api/feed/posts/", {
        "family_id": family_id1,
        "type": "POST",
        "text": "Post in family 1",
        "author_person_id": person_id1
    }, format="json")
    
    c.post("/api/feed/posts/", {
        "family_id": family_id2,
        "type": "POST",
        "text": "Post in family 2",
        "author_person_id": person_id2
    }, format="json")
    
    # View own posts across all families using person_id1
    response = c.get(f"/api/feed/?scope=all_families&author_person_id={person_id1}")
    assert response.status_code == 200
    items = response.json().get("results", [])
    # Should see at least the post from family 1
    assert len(items) >= 1
    assert any(item["text"] == "Post in family 1" for item in items)


@pytest.mark.django_db
def test_scope_all_families_requires_author_person_id():
    """Test that scope=all_families without author_person_id returns 400"""
    User = get_user_model()
    user = User.objects.create_user(username="scopeuser2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"scopeuser2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    # Try scope=all_families without author_person_id
    response = c.get("/api/feed/?scope=all_families")
    assert response.status_code == 400
    assert "author_person_id is required when scope=all_families" in response.json()["error"]


@pytest.mark.django_db
def test_scope_all_families_rejects_other_users():
    """Test that user trying to view another user's posts with scope=all_families returns 403"""
    User = get_user_model()
    user1 = User.objects.create_user(username="scopeuser3", email="scopeuser3@test.com", password="pass12345")
    user2 = User.objects.create_user(username="scopeuser4", email="scopeuser4@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"scopeuser3","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"scopeuser4","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # User2 creates family and person
    fam2 = c2.post("/api/families/", {"name":"ScopeFam3"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Get user2's person from membership
    from apps.families.models import FamilyMembership
    membership2 = FamilyMembership.objects.filter(user=user2, family_id=family_id2).first()
    person_id2 = membership2.person.id
    
    # User1 tries to view user2's posts with scope=all_families - should return 403
    response = c1.get(f"/api/feed/?scope=all_families&author_person_id={person_id2}")
    assert response.status_code == 403
    assert "You can only view your own posts across all families" in response.json()["error"]


@pytest.mark.django_db
def test_scope_all_families_only_shows_own_posts():
    """Test that scope=all_families only shows posts by the requesting user"""
    User = get_user_model()
    user1 = User.objects.create_user(username="scopeuser5", email="scopeuser5@test.com", password="pass12345")
    user2 = User.objects.create_user(username="scopeuser6", email="scopeuser6@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"scopeuser5","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"scopeuser6","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Both users create families
    fam1 = c1.post("/api/families/", {"name":"ScopeFam4"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"ScopeFam5"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Get persons from memberships
    from apps.families.models import FamilyMembership
    membership1 = FamilyMembership.objects.filter(user=user1, family_id=family_id1).first()
    membership2 = FamilyMembership.objects.filter(user=user2, family_id=family_id2).first()
    person_id1 = membership1.person.id
    person_id2 = membership2.person.id
    
    # User1 creates post in family1
    c1.post("/api/feed/posts/", {
        "family_id": family_id1,
        "type": "POST",
        "text": "User1's post",
        "author_person_id": person_id1
    }, format="json")
    
    # User2 creates post in family2
    c2.post("/api/feed/posts/", {
        "family_id": family_id2,
        "type": "POST",
        "text": "User2's post",
        "author_person_id": person_id2
    }, format="json")
    
    # User1 views own posts with scope=all_families
    response = c1.get(f"/api/feed/?scope=all_families&author_person_id={person_id1}")
    assert response.status_code == 200
    items = response.json().get("results", [])
    # Should only see user1's posts, not user2's
    assert all(item["text"] == "User1's post" for item in items)
    assert not any(item["text"] == "User2's post" for item in items)


@pytest.mark.django_db
def test_comment_allowed_on_post():
    """Test that commenting on POST type succeeds"""
    User = get_user_model()
    user = User.objects.create_user(username="commentuser", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"commentuser","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"CommentFam"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Comment",
        "last_name": "User",
        "gender": "MALE"
    }, format="json").json()
    
    # Create a POST
    post_response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Test post",
        "author_person_id": person["id"]
    }, format="json")
    post_id = post_response.json()["id"]
    
    # Add a comment - should succeed
    comment_response = c.post(f"/api/feed/posts/{post_id}/comments/", {
        "text": "This is a comment",
        "author_person_id": person["id"]
    }, format="json")
    
    assert comment_response.status_code in (200, 201)
    assert comment_response.json()["text"] == "This is a comment"


@pytest.mark.django_db
def test_comment_allowed_on_announcement():
    """Test that commenting on ANNOUNCEMENT type succeeds"""
    User = get_user_model()
    user = User.objects.create_user(username="commentuser2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"commentuser2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"CommentFam2"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Comment",
        "last_name": "User2",
        "gender": "MALE"
    }, format="json").json()
    
    # Create an ANNOUNCEMENT
    post_response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "ANNOUNCEMENT",
        "text": "Test announcement",
        "author_person_id": person["id"]
    }, format="json")
    post_id = post_response.json()["id"]
    
    # Add a comment - should succeed
    comment_response = c.post(f"/api/feed/posts/{post_id}/comments/", {
        "text": "This is a comment on announcement",
        "author_person_id": person["id"]
    }, format="json")
    
    assert comment_response.status_code in (200, 201)
    assert comment_response.json()["text"] == "This is a comment on announcement"


@pytest.mark.django_db
def test_comment_blocked_on_message():
    """Test that commenting on MESSAGE type returns 403"""
    User = get_user_model()
    user = User.objects.create_user(username="commentuser3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"commentuser3","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"CommentFam3"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Comment",
        "last_name": "User3",
        "gender": "MALE"
    }, format="json").json()
    
    # Create a MESSAGE
    post_response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Test message",
        "author_person_id": person["id"]
    }, format="json")
    post_id = post_response.json()["id"]
    
    # Try to add a comment - should be blocked
    comment_response = c.post(f"/api/feed/posts/{post_id}/comments/", {
        "text": "This comment should be blocked",
        "author_person_id": person["id"]
    }, format="json")
    
    assert comment_response.status_code == 403
    assert "Comments are not allowed on MESSAGE type posts" in comment_response.json()["error"]


@pytest.mark.django_db
def test_list_comments_blocked_on_message():
    """Test that listing comments on MESSAGE type returns 403"""
    User = get_user_model()
    user = User.objects.create_user(username="commentuser4", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"commentuser4","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"CommentFam4"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {
        "family_id": family_id,
        "first_name": "Comment",
        "last_name": "User4",
        "gender": "MALE"
    }, format="json").json()
    
    # Create a MESSAGE
    post_response = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "MESSAGE",
        "text": "Test message",
        "author_person_id": person["id"]
    }, format="json")
    post_id = post_response.json()["id"]
    
    # Try to list comments - should be blocked
    comment_response = c.get(f"/api/feed/posts/{post_id}/comments/")
    
    assert comment_response.status_code == 403
    assert "Comments are not allowed on MESSAGE type posts" in comment_response.json()["error"]


@pytest.mark.django_db
def test_cross_family_feed_access_forbidden():
    """Test that user from Family A cannot access feed of Family B"""
    User = get_user_model()
    user1 = User.objects.create_user(username="crossuser1", email="crossuser1@test.com", password="pass12345")
    user2 = User.objects.create_user(username="crossuser2", email="crossuser2@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"crossuser1","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"crossuser2","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Create two families
    fam1 = c1.post("/api/families/", {"name":"CrossFam1"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"CrossFam2"}, format="json").json()
    family_id2 = fam2["id"]
    
    # User1 tries to access Family2's feed - should return 403
    response = c1.get(f"/api/feed/?family_id={family_id2}")
    assert response.status_code == 403
    assert "not a member of this family" in response.json()["error"]


@pytest.mark.django_db
def test_cross_family_comment_access_forbidden():
    """Test that user from Family A cannot comment on post from Family B"""
    User = get_user_model()
    user1 = User.objects.create_user(username="crossuser3", email="crossuser3@test.com", password="pass12345")
    user2 = User.objects.create_user(username="crossuser4", email="crossuser4@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"crossuser3","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"crossuser4","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Create two families
    fam1 = c1.post("/api/families/", {"name":"CrossFam3"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"CrossFam4"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Get persons from memberships
    from apps.families.models import FamilyMembership
    person2 = FamilyMembership.objects.filter(user=user2, family_id=family_id2).first().person
    
    # User2 creates a POST in Family2
    post_response = c2.post("/api/feed/posts/", {
        "family_id": family_id2,
        "type": "POST",
        "text": "Post in family 2",
        "author_person_id": person2.id
    }, format="json")
    post_id = post_response.json()["id"]
    
    # User1 tries to comment on User2's post - should return 403
    comment_response = c1.post(f"/api/feed/posts/{post_id}/comments/", {
        "text": "Unauthorized comment"
    }, format="json")
    
    assert comment_response.status_code == 403
    assert "not a member of this post's family" in comment_response.json()["error"]


@pytest.mark.django_db
def test_cross_family_profile_access_forbidden():
    """Test that user from Family A cannot view profile of person from Family B"""
    User = get_user_model()
    user1 = User.objects.create_user(username="crossuser5", email="crossuser5@test.com", password="pass12345")
    user2 = User.objects.create_user(username="crossuser6", email="crossuser6@test.com", password="pass12345")
    
    c1 = APIClient()
    token1 = c1.post("/api/auth/token/", {"username":"crossuser5","password":"pass12345"}, format="json").json()["access"]
    c1.credentials(HTTP_AUTHORIZATION=f"Bearer {token1}")
    
    c2 = APIClient()
    token2 = c2.post("/api/auth/token/", {"username":"crossuser6","password":"pass12345"}, format="json").json()["access"]
    c2.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")
    
    # Create two families
    fam1 = c1.post("/api/families/", {"name":"CrossFam5"}, format="json").json()
    family_id1 = fam1["id"]
    
    fam2 = c2.post("/api/families/", {"name":"CrossFam6"}, format="json").json()
    family_id2 = fam2["id"]
    
    # Get person2 from membership
    from apps.families.models import FamilyMembership
    person2 = FamilyMembership.objects.filter(user=user2, family_id=family_id2).first().person
    
    # User1 tries to view person2's profile from family1 - should return 404 (person not in family)
    response = c1.get(f"/api/feed/?family_id={family_id1}&author_person_id={person2.id}")
    assert response.status_code == 404
    assert "Person does not exist in this family" in response.json()["error"]
