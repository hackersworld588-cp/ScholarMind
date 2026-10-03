import os
import pytest
from pathlib import Path
from backend.database import init_db, get_connection
from backend.services.sample_corpus import SAMPLE_BOOKS, generate_sample_pdfs_if_needed
from backend.services.pdf_extractor import PDFExtractor
from backend.services.rag_engine import RAGEngine
from backend.services.research_agent import ResearchAgent
from backend.services.academic_writer import AcademicWriter
from backend.services.medical_validator import MedicalValidator
from backend.services.citation_manager import CitationManager
from backend.services.pdf_publisher import PDFPublisher
from backend.services.docx_publisher import DocxPublisher
from backend.config import UPLOADS_DIR, EXPORTS_DIR

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

def test_sample_pdf_generation_and_extraction():
    generate_sample_pdfs_if_needed(UPLOADS_DIR)
    book_file = UPLOADS_DIR / SAMPLE_BOOKS[0]["filename"]
    assert book_file.exists(), f"Sample PDF was not created: {book_file}"

    # Test PDF extraction
    data = PDFExtractor.extract_from_file(str(book_file))
    assert data["success"] is True
    assert data["page_count"] >= 3
    assert len(data["pages"]) >= 3
    assert "Biopsy Selection" in data["extracted_text"] or "Cancer Diagnosis" in data["extracted_text"]
    assert data["confidence"] > 0.5

def test_full_pipeline_end_to_end():
    # 1. Create a project in DB
    conn = get_connection()
    cursor = conn.cursor()
    project_id = "proj_test_pipeline"
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    cursor.execute("""
    INSERT INTO projects (
        id, title, topic, discipline, audience, academic_level,
        language, target_word_count, citation_style, status, current_step
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)
    """, (
        project_id,
        "Diagnosis of Various Types of Cancer: Modern Principles and Practice",
        "Diagnosis of Various Types of Cancer",
        "Clinical Oncology & Pathology",
        "Medical Fellows & Oncologists",
        "Postgraduate Specialist",
        "English (US Academic)",
        5000,
        "vancouver"
    ))
    conn.commit()

    # 2. Ingest 5 reference books
    for book in SAMPLE_BOOKS:
        doc_id = f"doc_test_{book['filename'][:10]}"
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        pages_data = []
        full_text_list = []
        for p in book["pages"]:
            pages_data.append({
                "page_number": p["page_number"],
                "text": p["text"],
                "char_count": len(p["text"]),
                "headings": [p["heading"]],
                "is_sparse": False
            })
            full_text_list.append(f"--- [Page {p['page_number']}] ---\n{p['text']}")

        cursor.execute("""
        INSERT INTO documents (
            id, project_id, filename, original_name, file_path, file_size,
            page_count, title, authors, edition, publication_year, publisher,
            isbn, doi, extraction_status, confidence, ocr_used, extracted_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 1.0, 0, ?)
        """, (
            doc_id, project_id, book["filename"], book["filename"],
            str(UPLOADS_DIR / book["filename"]), 100000, len(book["pages"]),
            book["title"], book["authors"], book["edition"], book["publication_year"],
            book["publisher"], book.get("isbn"), book.get("doi"), "\n\n".join(full_text_list)
        ))
        conn.commit()

        # Chunk into RAG
        RAGEngine.chunk_document(doc_id, project_id, pages_data)

    conn.close()

    # 3. Test RAG Retrieval
    chunks = RAGEngine.retrieve_relevant_chunks(project_id, "HER2 receptor breast cancer diagnostic criteria", top_k=4)
    assert len(chunks) > 0
    assert any("HER2" in c["text"] for c in chunks)
    assert chunks[0]["document_title"] != ""
    assert chunks[0]["page_number"] > 0

    # 4. Generate Outline
    import asyncio
    outline = asyncio.run(ResearchAgent.generate_outline(project_id))
    assert outline["id"] is not None
    assert len(outline["sections"]) >= 5

    # 5. Compute Coverage Matrix
    cov_matrix = ResearchAgent.compute_coverage_matrix(project_id)
    assert cov_matrix["total_sources"] == 5
    assert len(cov_matrix["sections"]) == len(outline["sections"])
    assert cov_matrix["overall_health"] in ["excellent", "good"]

    # 6. Draft All Sections
    for sec in outline["sections"]:
        draft = asyncio.run(AcademicWriter.draft_section(project_id, sec["id"]))
        assert draft["word_count"] > 100
        assert draft["content_markdown"] != ""
        assert len(draft["citations"]) > 0

    # 7. Medical Validation
    med_val = MedicalValidator.validate_full_chapter(project_id)
    assert med_val["total_claims_analyzed"] > 5
    assert med_val["status"] in ["passed", "review_required"]

    # 8. Test Citation Provenance
    prov = CitationManager.resolve_citation_provenance(project_id, 1)
    assert prov is not None
    assert prov["citation_number"] == 1
    assert "DeVita" in prov["authors"] or "Cancer" in prov["document_title"]

    # 9. Test PDF Generation and Automated Validation
    pdf_res = PDFPublisher.generate_chapter_pdf(project_id)
    assert pdf_res["success"] is True
    assert Path(pdf_res["file_path"]).exists()
    assert pdf_res["file_size"] > 10000

    val = pdf_res["validation"]
    assert val["passed"] is True
    assert val["total_pages"] >= 5
    assert val["word_count"] > 1000

    # 10. Test DOCX Generation
    docx_res = DocxPublisher.generate_chapter_docx(project_id)
    assert docx_res["success"] is True
    assert Path(docx_res["file_path"]).exists()
    assert docx_res["file_size"] > 5000
