import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_project_crud():
    # Create project
    create_payload = {
        "title": "Oncology Principles in Clinical Practice",
        "topic": "Cancer Staging and Diagnosis",
        "discipline": "Medical Oncology",
        "audience": "Physicians & Residents",
        "academic_level": "Postgraduate",
        "language": "English (US Academic)",
        "target_word_count": 4500,
        "citation_style": "vancouver"
    }
    res = client.post("/api/projects", json=create_payload)
    assert res.status_code == 200
    data = res.json()
    project_id = data["id"]
    assert project_id.startswith("proj_")
    assert data["title"] == create_payload["title"]

    # List projects
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json())

    # Get single project
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # Update project
    update_res = client.put(f"/api/projects/{project_id}", json={"status": "in_progress", "current_step": 2})
    assert update_res.status_code == 200
    assert update_res.json()["current_step"] == 2

    # Duplicate project
    dup_res = client.post(f"/api/projects/{project_id}/duplicate")
    assert dup_res.status_code == 200
    dup_id = dup_res.json()["id"]
    assert dup_id != project_id
    assert "(Copy)" in dup_res.json()["title"]

    # Clean up duplicate
    client.delete(f"/api/projects/{dup_id}")

def test_load_sample_corpus_and_outline():
    # 1. Create project
    res = client.post("/api/projects", json={
        "title": "Comprehensive Cancer Diagnosis Chapter",
        "topic": "Diagnosis of Various Types of Cancer",
        "discipline": "Clinical Oncology",
        "audience": "Medical Fellows",
        "academic_level": "Specialist",
        "language": "English",
        "target_word_count": 5000,
        "citation_style": "vancouver"
    })
    project_id = res.json()["id"]

    # 2. Load sample corpus
    load_res = client.post(f"/api/projects/{project_id}/documents/load-sample-corpus")
    assert load_res.status_code == 200
    docs = load_res.json()
    assert len(docs) == 5

    # 3. Generate outline
    outline_res = client.post(f"/api/projects/{project_id}/outline/generate", json={"project_id": project_id})
    assert outline_res.status_code == 200
    outline = outline_res.json()
    assert len(outline["sections"]) >= 5

    # 4. Coverage Matrix
    cov_res = client.get(f"/api/projects/{project_id}/coverage-matrix")
    assert cov_res.status_code == 200
    cov = cov_res.json()
    assert cov["total_sources"] == 5
    assert len(cov["sections"]) == len(outline["sections"])

    # 5. Draft first section
    first_sec_id = outline["sections"][0]["id"]
    draft_res = client.post(f"/api/projects/{project_id}/sections/{first_sec_id}/draft", json={})
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["word_count"] > 100
    assert len(draft["citations"]) > 0

    # 6. Revise first section
    revise_res = client.post(f"/api/projects/{project_id}/sections/{first_sec_id}/revise", json={
        "action": "expand",
        "instructions": "Add clinical details"
    })
    assert revise_res.status_code == 200

    # 7. Check settings & test connection
    settings_res = client.get("/api/settings")
    assert settings_res.status_code == 200
    assert "available_providers" in settings_res.json()

    conn_res = client.post("/api/settings/test-connection", json={
        "provider": "local_deterministic"
    })
    assert conn_res.status_code == 200
    assert conn_res.json()["success"] is True
