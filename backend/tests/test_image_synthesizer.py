import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_sample_book_images():
    res = client.get("/api/sample-book-images")
    assert res.status_code == 200
    data = res.json()
    assert "samples" in data
    assert len(data["samples"]) == 3
    assert any("devita" in s["filename"] for s in data["samples"])

def test_synthesize_from_sample_images():
    res = client.post("/api/synthesize-from-images", data={
        "topic": "Diagnosis of Various Types of Cancer",
        "writing_style": "Natural Academic / Clinical Specialist",
        "use_sample_corpus": "true"
    })
    assert res.status_code == 200
    data = res.json()
    assert "chapter_markdown" in data
    assert data["word_count"] > 1000
    assert "Diagnosis of Various Types of Cancer" in data["title"]
    assert len(data["references"]) == 3
    assert "raw_extracts" in data
    assert len(data["raw_extracts"]) == 3

def test_download_pdf_and_docx():
    chapter_sample = {
        "title": "Diagnosis of Various Types of Cancer: Modern Synthesis",
        "topic": "Diagnosis of Various Types of Cancer",
        "chapter_markdown": """# Diagnosis of Cancer: A Multi-Source Synthesis

## 1.0 Foundational Diagnostic Principles
Definitive oncologic therapy requires histologic tissue confirmation prior to initiating treatment [1].

## 2.0 Comparative Modalities
| Modality | Sensitivity | Role |
| :--- | :--- | :--- |
| Core Needle Biopsy | >95% | Gold Standard [1,2] |
| ctDNA Liquid Biopsy | 70% | Adjunctive [3] |

## References
[1] DeVita et al. 2019.
[2] Robbins & Cotran 2020.
[3] NCCN Guidelines 2024.
"""
    }

    # Test PDF download
    pdf_res = client.post("/api/download-chapter-pdf", json=chapter_sample)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # Test DOCX download
    docx_res = client.post("/api/download-chapter-docx", json=chapter_sample)
    assert docx_res.status_code == 200
    assert "wordprocessingml" in docx_res.headers["content-type"]
    assert len(docx_res.content) > 1000

def test_all_four_writing_styles_are_distinct():
    styles = [
        "Natural Academic / Clinical Specialist",
        "Comprehensive Nursing Textbook Style",
        "Clear & Engaging Student Reference",
        "Concise High-Yield Clinical Summary"
    ]
    results = {}
    for style in styles:
        res = client.post("/api/synthesize-from-images", data={
            "topic": "Clinical Oncology Diagnostics",
            "writing_style": style,
            "use_sample_corpus": "true"
        })
        assert res.status_code == 200
        data = res.json()
        results[style] = data

    # Verify each style generated a unique title
    titles = [r["title"] for r in results.values()]
    assert len(set(titles)) == 4, f"Expected 4 distinct titles, got {titles}"

    # Verify each style generated distinct markdown and sections
    markdowns = [r["chapter_markdown"] for r in results.values()]
    assert len(set(markdowns)) == 4, "Expected 4 distinct markdown contents"

    # Specific stylistic checks
    assert "Student" in results["Clear & Engaging Student Reference"]["title"]
    assert any("Vignette" in s or "Rule" in s for s in results["Clear & Engaging Student Reference"]["sections"])

    assert "High-Yield" in results["Concise High-Yield Clinical Summary"]["title"]
    assert any("Checklist" in s or "Red Flags" in s or "Cheat Sheet" in s for s in results["Concise High-Yield Clinical Summary"]["sections"])

    assert "Specialist" in results["Natural Academic / Clinical Specialist"]["title"]
    assert any("Dilemmas" in s or "MDT" in s or "Tumor Board" in s for s in results["Natural Academic / Clinical Specialist"]["sections"])

    assert "Nursing" in results["Comprehensive Nursing Textbook Style"]["title"]
    assert any("ADPIE" in s or "Nursing" in s or "Interventions" in s for s in results["Comprehensive Nursing Textbook Style"]["sections"])


def test_chapter_copilot_chat_edit():
    sample_text = "# Test Chapter\n\nInitial diagnostic content about oncology."
    # 1. Expand request
    res = client.post("/api/chat-edit-chapter", json={
        "current_chapter": sample_text,
        "topic": "Oncology Diagnostics",
        "user_instruction": "Is chapter ko aur detail me expand kro, extra clinical nursing points add kro",
        "writing_style": "Comprehensive Nursing Textbook Style"
    })
    assert res.status_code == 200
    data = res.json()
    assert "expanded" in data["assistant_reply"].lower() or "section" in data["assistant_reply"].lower()
    assert data["updated_chapter"] is not None
    assert len(data["updated_chapter"]) > len(sample_text)
    assert data["suggested_action"] == "replace_chapter"

    # 2. Condense request
    res_condense = client.post("/api/chat-edit-chapter", json={
        "current_chapter": sample_text,
        "topic": "Oncology Diagnostics",
        "user_instruction": "Is chapter ko concise aur short bullet summary me convert kro",
        "writing_style": "Comprehensive Nursing Textbook Style"
    })
    assert res_condense.status_code == 200
    data_c = res_condense.json()
    assert "condensed" in data_c["assistant_reply"].lower() or "summary" in data_c["assistant_reply"].lower()
    assert data_c["updated_chapter"] is not None

    # 3. Nursing Care Plan request
    res_nursing = client.post("/api/chat-edit-chapter", json={
        "current_chapter": sample_text,
        "topic": "Oncology Diagnostics",
        "user_instruction": "Add complete ADPIE nursing care plan with NANDA diagnoses",
        "writing_style": "Comprehensive Nursing Textbook Style"
    })
    assert res_nursing.status_code == 200
    data_n = res_nursing.json()
    assert "ADPIE" in data_n["updated_chapter"]
    assert "NANDA" in data_n["updated_chapter"]


