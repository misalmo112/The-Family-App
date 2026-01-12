import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_spouse_is_bidirectional_and_topology_includes_both_edges():
    User = get_user_model()
    admin = User.objects.create_user(username="admin2", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin2","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam2"}, format="json").json()
    family_id = fam["id"]
    
    # create two persons
    p1 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"A","last_name":"One","gender":"MALE"}, format="json").json()
    p2 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"B","last_name":"Two","gender":"FEMALE"}, format="json").json()
    
    # add spouse
    r = c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": p1["id"],
        "to_person_id": p2["id"],
    }, format="json")
    assert r.status_code in (200, 201), r.content
    
    # topology
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={p1['id']}")
    assert topo.status_code == 200
    edges = topo.json()["edges"]
    
    # spouse should exist both ways
    assert any(e["type"]=="SPOUSE_OF" and e["from"]==p1["id"] and e["to"]==p2["id"] for e in edges)
    assert any(e["type"]=="SPOUSE_OF" and e["from"]==p2["id"] and e["to"]==p1["id"] for e in edges)


@pytest.mark.django_db
def test_parent_is_directional_only():
    User = get_user_model()
    admin = User.objects.create_user(username="admin3", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin3","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam3"}, format="json").json()
    family_id = fam["id"]
    
    parent = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"P","last_name":"Rent","gender":"MALE"}, format="json").json()
    child  = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"C","last_name":"Hild","gender":"FEMALE"}, format="json").json()
    
    r = c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent["id"],
        "to_person_id": child["id"],
    }, format="json")
    assert r.status_code in (200, 201), r.content
    
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={parent['id']}")
    edges = topo.json()["edges"]
    
    assert any(e["type"]=="PARENT_OF" and e["from"]==parent["id"] and e["to"]==child["id"] for e in edges)
    assert not any(e["type"]=="PARENT_OF" and e["from"]==child["id"] and e["to"]==parent["id"] for e in edges)


@pytest.mark.django_db
def test_topology_includes_relation_to_viewer_self():
    """Test that viewer node has relation_to_viewer='self'"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin4", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin4","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam4"}, format="json").json()
    family_id = fam["id"]
    
    person = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Viewer","last_name":"Person","gender":"MALE"}, format="json").json()
    
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={person['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    viewer_node = next((n for n in nodes if n["id"] == person["id"]), None)
    assert viewer_node is not None
    assert viewer_node["relation_to_viewer"] == "self"


@pytest.mark.django_db
def test_topology_includes_relation_to_viewer_parent():
    """Test that parent relationships return 'father' or 'mother'"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin5", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin5","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam5"}, format="json").json()
    family_id = fam["id"]
    
    father = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Father","last_name":"Dad","gender":"MALE"}, format="json").json()
    mother = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Mother","last_name":"Mom","gender":"FEMALE"}, format="json").json()
    child = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Child","last_name":"Kid","gender":"MALE"}, format="json").json()
    
    # Create parent relationships
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": father["id"],
        "to_person_id": child["id"],
    }, format="json")
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": mother["id"],
        "to_person_id": child["id"],
    }, format="json")
    
    # Get topology from child's perspective
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={child['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    father_node = next((n for n in nodes if n["id"] == father["id"]), None)
    mother_node = next((n for n in nodes if n["id"] == mother["id"]), None)
    
    assert father_node is not None
    assert father_node["relation_to_viewer"] == "father"
    assert mother_node is not None
    assert mother_node["relation_to_viewer"] == "mother"


@pytest.mark.django_db
def test_topology_includes_relation_to_viewer_child():
    """Test that child relationships return 'son' or 'daughter'"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin6", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin6","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam6"}, format="json").json()
    family_id = fam["id"]
    
    parent = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Parent","last_name":"Dad","gender":"MALE"}, format="json").json()
    son = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Son","last_name":"Kid","gender":"MALE"}, format="json").json()
    daughter = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Daughter","last_name":"Kid","gender":"FEMALE"}, format="json").json()
    
    # Create parent relationships
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent["id"],
        "to_person_id": son["id"],
    }, format="json")
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent["id"],
        "to_person_id": daughter["id"],
    }, format="json")
    
    # Get topology from parent's perspective
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={parent['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    son_node = next((n for n in nodes if n["id"] == son["id"]), None)
    daughter_node = next((n for n in nodes if n["id"] == daughter["id"]), None)
    
    assert son_node is not None
    assert son_node["relation_to_viewer"] == "son"
    assert daughter_node is not None
    assert daughter_node["relation_to_viewer"] == "daughter"


@pytest.mark.django_db
def test_topology_includes_relation_to_viewer_spouse():
    """Test that spouse relationships return 'spouse'"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin7", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin7","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam7"}, format="json").json()
    family_id = fam["id"]
    
    spouse1 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Spouse","last_name":"One","gender":"MALE"}, format="json").json()
    spouse2 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Spouse","last_name":"Two","gender":"FEMALE"}, format="json").json()
    
    # Create spouse relationship
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "SPOUSE_OF",
        "from_person_id": spouse1["id"],
        "to_person_id": spouse2["id"],
    }, format="json")
    
    # Get topology from spouse1's perspective
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={spouse1['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    spouse2_node = next((n for n in nodes if n["id"] == spouse2["id"]), None)
    
    assert spouse2_node is not None
    assert spouse2_node["relation_to_viewer"] == "spouse"


@pytest.mark.django_db
def test_topology_includes_relation_to_viewer_sibling():
    """Test that sibling relationships return 'brother' or 'sister'"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin8", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin8","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam8"}, format="json").json()
    family_id = fam["id"]
    
    parent = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Parent","last_name":"Dad","gender":"MALE"}, format="json").json()
    child1 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Child","last_name":"One","gender":"MALE"}, format="json").json()
    child2 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Child","last_name":"Two","gender":"FEMALE"}, format="json").json()
    
    # Create parent relationships (shared parent makes them siblings)
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent["id"],
        "to_person_id": child1["id"],
    }, format="json")
    c.post("/api/graph/relationships/", {
        "family_id": family_id,
        "type": "PARENT_OF",
        "from_person_id": parent["id"],
        "to_person_id": child2["id"],
    }, format="json")
    
    # Get topology from child1's perspective
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={child1['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    child2_node = next((n for n in nodes if n["id"] == child2["id"]), None)
    
    assert child2_node is not None
    assert child2_node["relation_to_viewer"] == "sister"
    
    # Get topology from child2's perspective
    topo2 = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={child2['id']}")
    assert topo2.status_code == 200
    
    nodes2 = topo2.json()["nodes"]
    child1_node = next((n for n in nodes2 if n["id"] == child1["id"]), None)
    
    assert child1_node is not None
    assert child1_node["relation_to_viewer"] == "brother"


@pytest.mark.django_db
def test_topology_all_nodes_have_relation_to_viewer():
    """Test that all nodes in topology response include relation_to_viewer field"""
    User = get_user_model()
    admin = User.objects.create_user(username="admin9", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"admin9","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"Fam9"}, format="json").json()
    family_id = fam["id"]
    
    # Create multiple persons
    p1 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Person","last_name":"One","gender":"MALE"}, format="json").json()
    p2 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Person","last_name":"Two","gender":"FEMALE"}, format="json").json()
    p3 = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Person","last_name":"Three","gender":"MALE"}, format="json").json()
    
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={p1['id']}")
    assert topo.status_code == 200
    
    nodes = topo.json()["nodes"]
    assert len(nodes) >= 3  # At least the 3 persons we created
    
    # Find our created persons in the nodes
    p1_node = next((n for n in nodes if n["id"] == p1["id"]), None)
    p2_node = next((n for n in nodes if n["id"] == p2["id"]), None)
    p3_node = next((n for n in nodes if n["id"] == p3["id"]), None)
    
    assert p1_node is not None
    assert p2_node is not None
    assert p3_node is not None
    
    # All nodes should have relation_to_viewer field
    for node in nodes:
        assert "relation_to_viewer" in node
        assert node["relation_to_viewer"] in ["self", "unknown", "unrelated", "father", "mother", "son", "daughter", "spouse", "brother", "sister", "parent", "child", "sibling", "grandfather", "grandmother", "grandparent", "grandson", "granddaughter", "grandchild", "uncle", "aunt", "aunt/uncle", "nephew", "niece", "niece/nephew", "cousin"]


@pytest.mark.django_db
def test_resolver_basic_family_labels():
    """
    Creates:
      Dad (M) + Mom (F) spouses
      Child (M)
    Relations:
      Dad -> Child (PARENT_OF)
      Mom -> Child (PARENT_OF)
      Dad <-> Mom (SPOUSE_OF bidirectional)
    Expect:
      viewer=Child sees Dad=father, Mom=mother
      viewer=Dad sees Child=son
      viewer=Dad sees Mom=spouse
    """
    User = get_user_model()
    admin = User.objects.create_user(username="reladmin", password="pass12345")
    
    c = APIClient()
    token = c.post("/api/auth/token/", {"username":"reladmin","password":"pass12345"}, format="json").json()["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    fam = c.post("/api/families/", {"name":"RelFam"}, format="json").json()
    family_id = fam["id"]
    
    dad = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Dad","last_name":"X","gender":"MALE"}, format="json").json()
    mom = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Mom","last_name":"X","gender":"FEMALE"}, format="json").json()
    kid = c.post("/api/graph/persons/", {"family_id":family_id,"first_name":"Kid","last_name":"X","gender":"MALE"}, format="json").json()
    
    # spouse (creates both edges)
    c.post("/api/graph/relationships/", {"family_id":family_id,"type":"SPOUSE_OF","from_person_id":dad["id"],"to_person_id":mom["id"]}, format="json")
    # parents
    c.post("/api/graph/relationships/", {"family_id":family_id,"type":"PARENT_OF","from_person_id":dad["id"],"to_person_id":kid["id"]}, format="json")
    c.post("/api/graph/relationships/", {"family_id":family_id,"type":"PARENT_OF","from_person_id":mom["id"],"to_person_id":kid["id"]}, format="json")
    
    # Topology now should include relation_to_viewer after Phase 5
    topo = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={kid['id']}")
    assert topo.status_code == 200
    nodes = topo.json()["nodes"]
    rel_map = {n["id"]: n.get("relation_to_viewer") for n in nodes}
    
    assert rel_map[kid["id"]] == "self"
    assert rel_map[dad["id"]] in ("father", "parent")  # depending on how you implement gender naming
    assert rel_map[mom["id"]] in ("mother", "parent")
    
    topo2 = c.get(f"/api/graph/topology/?family_id={family_id}&viewer_person_id={dad['id']}")
    nodes2 = topo2.json()["nodes"]
    rel_map2 = {n["id"]: n.get("relation_to_viewer") for n in nodes2}
    
    assert rel_map2[dad["id"]] == "self"
    assert rel_map2[mom["id"]] == "spouse"
    assert rel_map2[kid["id"]] in ("son", "child")

