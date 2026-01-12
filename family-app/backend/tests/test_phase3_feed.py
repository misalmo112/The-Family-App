import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_member_can_create_and_read_feed():
    User = get_user_model()
    admin = User.objects.create_user(username="feedadmin", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"feedadmin","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"FeedFam"}, format="json").json()
    family_id = fam["id"]
    
    # create a person for author (if not already linked; safe to create)
    person = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Feed","last_name":"Admin","gender":"MALE"}, format="json").json()
    
    post = c.post("/api/feed/posts/", {
        "family_id": family_id,
        "type": "POST",
        "text": "Hello family!",
        "author_person_id": person["id"],
    }, format="json")
    assert post.status_code in (200, 201), post.content
    
    feed = c.get(f"/api/feed/?family_id={family_id}")
    assert feed.status_code == 200
    items = feed.json().get("results", feed.json())
    assert any(i.get("text") == "Hello family!" for i in items)
