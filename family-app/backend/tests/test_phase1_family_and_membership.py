import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_create_family_creates_admin_membership(api_client, user):
    # login
    token = api_client.post("/api/auth/token/", {"username":"testuser","password":"testpass123"}, format="json").json()["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    resp = api_client.post("/api/families/", {"name":"K Family"}, format="json")
    assert resp.status_code in (200, 201), resp.content
    data = resp.json()
    assert "id" in data
    assert "code" in data
    
    # list families
    resp2 = api_client.get("/api/families/")
    assert resp2.status_code == 200
    assert len(resp2.json()) >= 1


@pytest.mark.django_db
def test_join_request_and_approve_flow(api_client):
    User = get_user_model()
    admin = User.objects.create_user(username="admin", password="adminpass123")
    joiner = User.objects.create_user(username="joiner", password="joinerpass123")
    
    # admin token
    admin_client = APIClient()
    admin_token = admin_client.post("/api/auth/token/", {"username":"admin","password":"adminpass123"}, format="json").json()["access"]
    admin_client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    
    # create family
    fam = admin_client.post("/api/families/", {"name":"TestFam"}, format="json").json()
    code = fam["code"]
    
    # joiner token
    joiner_client = APIClient()
    joiner_token = joiner_client.post("/api/auth/token/", {"username":"joiner","password":"joinerpass123"}, format="json").json()["access"]
    joiner_client.credentials(HTTP_AUTHORIZATION=f"Bearer {joiner_token}")
    
    # submit join request with new person payload
    jr = joiner_client.post("/api/families/join/", {
        "code": code,
        "new_person_payload": {"first_name":"Ali","last_name":"Joiner","gender":"MALE"}
    }, format="json")
    assert jr.status_code in (200, 201), jr.content
    jr_id = jr.json()["id"]
    
    # admin sees pending requests
    pending = admin_client.get("/api/families/join-requests/")
    assert pending.status_code == 200
    assert any(r["id"] == jr_id for r in pending.json())
    
    # approve
    appr = admin_client.post(f"/api/families/join-requests/{jr_id}/approve/", {}, format="json")
    assert appr.status_code in (200, 201), appr.content

