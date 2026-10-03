import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from backend.config import UPLOADS_DIR
from backend.database import get_connection
from backend.models.schemas import DocumentResponse, DocumentMetadataUpdate
from backend.services.pdf_extractor import PDFExtractor
from backend.services.rag_engine import RAGEngine
from backend.services.sample_corpus import SAMPLE_BOOKS, generate_sample_pdfs_if_needed

router = APIRouter(tags=["documents"])

@router.post("/api/projects/{project_id}/documents/upload", response_model=List[DocumentResponse])
async def upload_documents(project_id: str, files: List[UploadFile] = File(...)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    responses: List[DocumentResponse] = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue

        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        safe_filename = f"{doc_id}_{file.filename}"
        dest_path = UPLOADS_DIR / safe_filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text and metadata
        extraction = PDFExtractor.extract_from_file(str(dest_path))

        cursor.execute("""
        INSERT INTO documents (
            id, project_id, filename, original_name, file_path, file_size,
            page_count, title, authors, edition, publication_year, publisher,
            isbn, doi, extraction_status, confidence, ocr_used, extracted_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, project_id, safe_filename, file.filename, str(dest_path),
            extraction["file_size"], extraction["page_count"], extraction["title"],
            extraction["authors"], extraction["edition"], extraction["publication_year"],
            extraction["publisher"], extraction.get("isbn"), extraction.get("doi"),
            "completed" if extraction["success"] else "failed",
            extraction["confidence"], 1 if extraction["ocr_used"] else 0,
            extraction["extracted_text"]
        ))
        conn.commit()

        # Chunk document into RAG engine
        chunks = RAGEngine.chunk_document(doc_id, project_id, extraction["pages"])

        responses.append(DocumentResponse(
            id=doc_id,
            project_id=project_id,
            filename=safe_filename,
            original_name=file.filename,
            file_size=extraction["file_size"],
            page_count=extraction["page_count"],
            title=extraction["title"],
            authors=extraction["authors"],
            edition=extraction["edition"],
            publication_year=extraction["publication_year"],
            publisher=extraction["publisher"],
            isbn=extraction.get("isbn"),
            doi=extraction.get("doi"),
            extraction_status="completed" if extraction["success"] else "failed",
            confidence=extraction["confidence"],
            ocr_used=extraction["ocr_used"],
            created_at="Just now",
            chunk_count=len(chunks)
        ))

    conn.close()
    return responses

@router.post("/api/projects/{project_id}/documents/load-sample-corpus", response_model=List[DocumentResponse])
def load_sample_corpus(project_id: str):
    """
    Provisions the 5 authentic cancer reference books into the project.
    Generates sample physical PDFs and builds RAG chunks immediately.
    """
    generate_sample_pdfs_if_needed(UPLOADS_DIR)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    responses: List[DocumentResponse] = []

    for book in SAMPLE_BOOKS:
        pdf_path = UPLOADS_DIR / book["filename"]
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"

        # Check if already in project
        cursor.execute("SELECT id FROM documents WHERE project_id = ? AND original_name = ?", (project_id, book["filename"]))
        existing = cursor.fetchone()
        if existing:
            continue

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

        combined_text = "\n\n".join(full_text_list)
        file_size = pdf_path.stat().st_size if pdf_path.exists() else 150000

        cursor.execute("""
        INSERT INTO documents (
            id, project_id, filename, original_name, file_path, file_size,
            page_count, title, authors, edition, publication_year, publisher,
            isbn, doi, extraction_status, confidence, ocr_used, extracted_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 1.0, 0, ?)
        """, (
            doc_id, project_id, book["filename"], book["filename"], str(pdf_path),
            file_size, len(book["pages"]), book["title"], book["authors"],
            book["edition"], book["publication_year"], book["publisher"],
            book.get("isbn"), book.get("doi"), combined_text
        ))
        conn.commit()

        # Chunk into RAG
        chunks = RAGEngine.chunk_document(doc_id, project_id, pages_data)

        responses.append(DocumentResponse(
            id=doc_id,
            project_id=project_id,
            filename=book["filename"],
            original_name=book["filename"],
            file_size=file_size,
            page_count=len(book["pages"]),
            title=book["title"],
            authors=book["authors"],
            edition=book["edition"],
            publication_year=book["publication_year"],
            publisher=book["publisher"],
            isbn=book.get("isbn"),
            doi=book.get("doi"),
            extraction_status="completed",
            confidence=1.0,
            ocr_used=False,
            created_at="Just now",
            chunk_count=len(chunks)
        ))

    conn.close()
    return responses

@router.get("/api/projects/{project_id}/documents", response_model=List[DocumentResponse])
def list_documents(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT d.*,
           (SELECT COUNT(*) FROM document_chunks WHERE document_id = d.id) as chunk_count
    FROM documents d
    WHERE d.project_id = ?
    ORDER BY d.created_at ASC
    """, (project_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    for r in rows:
        r["ocr_used"] = bool(r["ocr_used"])
    return [DocumentResponse(**r) for r in rows]

@router.get("/api/documents/{document_id}")
def get_document_details(document_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (document_id,))
    doc = cursor.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    cursor.execute("""
    SELECT id, page_number, section_heading, text, token_count
    FROM document_chunks
    WHERE document_id = ?
    ORDER BY page_number ASC, chunk_index ASC
    """, (document_id,))
    chunks = [dict(r) for r in cursor.fetchall()]
    conn.close()

    doc_dict = dict(doc)
    doc_dict["chunks"] = chunks
    doc_dict["ocr_used"] = bool(doc_dict["ocr_used"])
    return doc_dict

@router.put("/api/documents/{document_id}/metadata")
def update_document_metadata(document_id: str, data: DocumentMetadataUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM documents WHERE id = ?", (document_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    updates = []
    values = []
    for field, val in data.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        values.append(val)

    if updates:
        values.append(document_id)
        cursor.execute(f"UPDATE documents SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()

    cursor.execute("SELECT * FROM documents WHERE id = ?", (document_id,))
    row = dict(cursor.fetchone())
    conn.close()
    row["ocr_used"] = bool(row["ocr_used"])
    return DocumentResponse(**row)

@router.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Document removed"}

@router.get("/api/projects/{project_id}/documents/search")
def search_documents(project_id: str, q: str = Query(..., min_length=2)):
    chunks = RAGEngine.retrieve_relevant_chunks(project_id, q, top_k=10)
    return {"query": q, "results_count": len(chunks), "results": chunks}
