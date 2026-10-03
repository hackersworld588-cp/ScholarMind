import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.database import get_connection
from backend.services.pdf_publisher import PDFPublisher
from backend.services.docx_publisher import DocxPublisher

router = APIRouter(prefix="/api/projects", tags=["export"])

@router.post("/{project_id}/export/pdf")
def export_chapter_pdf(project_id: str):
    try:
        result = PDFPublisher.generate_chapter_pdf(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.get("/{project_id}/export/pdf")
def download_chapter_pdf(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT file_path FROM export_jobs
    WHERE project_id = ? AND export_type = 'pdf'
    ORDER BY created_at DESC LIMIT 1
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not Path(row["file_path"]).exists():
        # Try generating on the fly
        try:
            res = PDFPublisher.generate_chapter_pdf(project_id)
            pdf_path = res["file_path"]
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"PDF not generated yet: {e}")
    else:
        pdf_path = row["file_path"]

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=Path(pdf_path).name,
        headers={"Content-Disposition": f"inline; filename={Path(pdf_path).name}"}
    )

@router.post("/{project_id}/export/docx")
def export_chapter_docx(project_id: str):
    try:
        result = DocxPublisher.generate_chapter_docx(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")

@router.get("/{project_id}/export/docx")
def download_chapter_docx(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT file_path FROM export_jobs
    WHERE project_id = ? AND export_type = 'docx'
    ORDER BY created_at DESC LIMIT 1
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not Path(row["file_path"]).exists():
        try:
            res = DocxPublisher.generate_chapter_docx(project_id)
            docx_path = res["file_path"]
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"DOCX not generated yet: {e}")
    else:
        docx_path = row["file_path"]

    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=Path(docx_path).name
    )

@router.get("/{project_id}/export/validation")
def get_pdf_validation(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT validation_report_json FROM export_jobs
    WHERE project_id = ? AND export_type = 'pdf'
    ORDER BY created_at DESC LIMIT 1
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["validation_report_json"]:
        return {"passed": False, "summary": "No export generated yet"}
    return json.loads(row["validation_report_json"])
