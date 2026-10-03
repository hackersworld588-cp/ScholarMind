import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Body
from backend.database import get_connection
from backend.models.schemas import (
    SectionDraftRequest, SectionReviseRequest, SectionResponse,
    ChapterFullResponse, FactCheckReport
)
from backend.services.academic_writer import AcademicWriter
from backend.services.medical_validator import MedicalValidator
from backend.services.citation_manager import CitationManager

router = APIRouter(prefix="/api/projects", tags=["chapter"])

@router.post("/{project_id}/sections/{section_id}/draft", response_model=SectionResponse)
async def draft_section(project_id: str, section_id: str, req: Optional[SectionDraftRequest] = None):
    guidance = req.custom_guidance if req else None
    result = await AcademicWriter.draft_section(project_id, section_id, custom_guidance=guidance)
    return SectionResponse(**result)

@router.post("/{project_id}/sections/{section_id}/revise", response_model=SectionResponse)
async def revise_section(project_id: str, section_id: str, req: SectionReviseRequest):
    result = await AcademicWriter.revise_section(
        project_id=project_id,
        section_id=section_id,
        action=req.action,
        instructions=req.instructions,
        selected_text=req.selected_text
    )
    return SectionResponse(**result)

@router.put("/{project_id}/sections/{section_id}", response_model=SectionResponse)
def update_section_text(project_id: str, section_id: str, payload: Dict[str, Any] = Body(...)):
    new_text = payload.get("content_markdown", "")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapter_sections WHERE project_id = ? AND section_id = ?", (project_id, section_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Section not found")

    word_count = len(new_text.split())
    validation = MedicalValidator.validate_section(
        section_id=section_id,
        title=row["title"],
        content=new_text,
        project_id=project_id
    )

    cursor.execute("""
    UPDATE chapter_sections
    SET content_markdown = ?, word_count = ?, fact_check_status = ?,
        review_warnings_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE project_id = ? AND section_id = ?
    """, (
        new_text, word_count, validation["status"],
        json.dumps([i["message"] for i in validation["issues"]]),
        project_id, section_id
    ))
    conn.commit()

    cursor.execute("SELECT * FROM chapter_sections WHERE project_id = ? AND section_id = ?", (project_id, section_id))
    updated_row = dict(cursor.fetchone())
    conn.close()

    return SectionResponse(
        id=updated_row["id"],
        project_id=updated_row["project_id"],
        section_id=updated_row["section_id"],
        title=updated_row["title"],
        level=updated_row["level"],
        section_order=updated_row["section_order"],
        content_markdown=updated_row["content_markdown"],
        word_count=updated_row["word_count"],
        citations=json.loads(updated_row["citations_json"] or "[]"),
        fact_check_status=updated_row["fact_check_status"],
        review_warnings=json.loads(updated_row["review_warnings_json"] or "[]"),
        updated_at=str(updated_row["updated_at"])
    )

@router.post("/{project_id}/generate-all")
async def generate_all_sections(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT sections_json FROM chapter_outlines WHERE project_id = ?", (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Outline must be generated before drafting.")

    sections = json.loads(row["sections_json"])
    conn.close()

    drafted = []
    for s in sections:
        res = await AcademicWriter.draft_section(project_id, s["id"])
        drafted.append(res)

    # Update project current_step to 5 (Review & Export)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET status = 'completed_draft', current_step = 5 WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()

    return {"success": True, "drafted_count": len(drafted), "sections": drafted}

@router.get("/{project_id}/chapter", response_model=ChapterFullResponse)
def get_full_chapter(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title, status FROM projects WHERE id = ?", (project_id,))
    proj_row = cursor.fetchone()
    if not proj_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    cursor.execute("""
    SELECT * FROM chapter_sections
    WHERE project_id = ?
    ORDER BY section_order ASC
    """, (project_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    section_responses = []
    total_words = 0
    all_citations = []

    for r in rows:
        total_words += r["word_count"]
        cites = json.loads(r["citations_json"] or "[]")
        all_citations.extend(cites)
        section_responses.append(SectionResponse(
            id=r["id"],
            project_id=r["project_id"],
            section_id=r["section_id"],
            title=r["title"],
            level=r["level"],
            section_order=r["section_order"],
            content_markdown=r["content_markdown"],
            word_count=r["word_count"],
            citations=cites,
            fact_check_status=r["fact_check_status"],
            review_warnings=json.loads(r["review_warnings_json"] or "[]"),
            updated_at=str(r["updated_at"])
        ))

    return ChapterFullResponse(
        project_id=project_id,
        title=proj_row["title"],
        total_words=total_words,
        sections=section_responses,
        citations=all_citations,
        status=proj_row["status"]
    )

@router.get("/{project_id}/medical-validation", response_model=FactCheckReport)
def get_medical_validation_report(project_id: str):
    rep = MedicalValidator.validate_full_chapter(project_id)
    return FactCheckReport(**rep)

@router.get("/{project_id}/citations")
def get_citations(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT citation_style FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    style = row["citation_style"] if row else "vancouver"
    conn.close()

    bib = CitationManager.compile_project_bibliography(project_id, style=style)
    return {"project_id": project_id, "style": style, "references": bib}

@router.get("/{project_id}/citations/{citation_number}/provenance")
def get_citation_provenance(project_id: str, citation_number: int):
    res = CitationManager.resolve_citation_provenance(project_id, citation_number)
    if not res:
        raise HTTPException(status_code=404, detail="Citation provenance record not found")
    return res
