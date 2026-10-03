import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from backend.database import get_connection
from backend.models.schemas import (
    OutlineGenerateRequest, OutlineUpdateRequest, OutlineResponse,
    CoverageMatrixResponse, ResearchBriefResponse
)
from backend.services.research_agent import ResearchAgent

router = APIRouter(prefix="/api/projects", tags=["outline"])

@router.post("/{project_id}/outline/generate", response_model=OutlineResponse)
async def generate_outline(project_id: str, req: Optional[OutlineGenerateRequest] = None):
    instructions = req.custom_instructions if req else None
    result = await ResearchAgent.generate_outline(project_id, custom_instructions=instructions)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapter_outlines WHERE project_id = ?", (project_id,))
    row = dict(cursor.fetchone())
    conn.close()

    return OutlineResponse(
        id=row["id"],
        project_id=row["project_id"],
        title=row["title"],
        sections=json.loads(row["sections_json"]),
        approved=bool(row["approved"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("/{project_id}/outline", response_model=OutlineResponse)
def get_outline(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapter_outlines WHERE project_id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Outline not generated yet")

    r = dict(row)
    return OutlineResponse(
        id=r["id"],
        project_id=r["project_id"],
        title=r["title"],
        sections=json.loads(r["sections_json"]),
        approved=bool(r["approved"]),
        created_at=r["created_at"],
        updated_at=r["updated_at"]
    )

@router.put("/{project_id}/outline", response_model=OutlineResponse)
def update_outline(project_id: str, data: OutlineUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM chapter_outlines WHERE project_id = ?", (project_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Outline not found")

    sections_json = json.dumps([s.model_dump() for s in data.sections])
    cursor.execute("""
    UPDATE chapter_outlines
    SET title = ?, sections_json = ?, approved = ?, updated_at = CURRENT_TIMESTAMP
    WHERE project_id = ?
    """, (data.title, sections_json, 1 if data.approved else 0, project_id))

    # Update project status if approved
    if data.approved:
        cursor.execute("UPDATE projects SET status = 'in_progress', current_step = 4 WHERE id = ?", (project_id,))

    conn.commit()

    cursor.execute("SELECT * FROM chapter_outlines WHERE project_id = ?", (project_id,))
    row = dict(cursor.fetchone())
    conn.close()

    return OutlineResponse(
        id=row["id"],
        project_id=row["project_id"],
        title=row["title"],
        sections=json.loads(row["sections_json"]),
        approved=bool(row["approved"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("/{project_id}/coverage-matrix", response_model=CoverageMatrixResponse)
def get_coverage_matrix(project_id: str):
    return ResearchAgent.compute_coverage_matrix(project_id)

@router.get("/{project_id}/briefs/{section_id}", response_model=ResearchBriefResponse)
def get_section_brief(project_id: str, section_id: str):
    brief = ResearchAgent.build_research_brief(project_id, section_id)
    return ResearchBriefResponse(**brief)
