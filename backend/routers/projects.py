import uuid
from typing import List
from fastapi import APIRouter, HTTPException
from backend.database import get_connection
from backend.models.schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate):
    conn = get_connection()
    cursor = conn.cursor()
    proj_id = f"proj_{uuid.uuid4().hex[:10]}"
    cursor.execute("""
    INSERT INTO projects (
        id, title, topic, discipline, audience, academic_level,
        language, target_word_count, citation_style, formatting_guidelines,
        status, current_step
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)
    """, (
        proj_id, data.title, data.topic, data.discipline, data.audience,
        data.academic_level, data.language, data.target_word_count,
        data.citation_style, data.formatting_guidelines
    ))
    conn.commit()

    cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return ProjectResponse(**row, document_count=0, section_count=0, total_words=0)

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT p.*,
           (SELECT COUNT(*) FROM documents WHERE project_id = p.id) as document_count,
           (SELECT COUNT(*) FROM chapter_sections WHERE project_id = p.id) as section_count,
           (SELECT COALESCE(SUM(word_count), 0) FROM chapter_sections WHERE project_id = p.id) as total_words
    FROM projects p
    ORDER BY p.updated_at DESC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return [ProjectResponse(**r) for r in rows]

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT p.*,
           (SELECT COUNT(*) FROM documents WHERE project_id = p.id) as document_count,
           (SELECT COUNT(*) FROM chapter_sections WHERE project_id = p.id) as section_count,
           (SELECT COALESCE(SUM(word_count), 0) FROM chapter_sections WHERE project_id = p.id) as total_words
    FROM projects p
    WHERE p.id = ?
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**dict(row))

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, data: ProjectUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    updates = []
    values = []
    for field, val in data.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        values.append(val)

    if updates:
        values.append(project_id)
        sql = f"UPDATE projects SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(sql, values)
        conn.commit()

    cursor.execute("""
    SELECT p.*,
           (SELECT COUNT(*) FROM documents WHERE project_id = p.id) as document_count,
           (SELECT COUNT(*) FROM chapter_sections WHERE project_id = p.id) as section_count,
           (SELECT COALESCE(SUM(word_count), 0) FROM chapter_sections WHERE project_id = p.id) as total_words
    FROM projects p
    WHERE p.id = ?
    """, (project_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return ProjectResponse(**row)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Project deleted successfully"}

@router.post("/{project_id}/duplicate", response_model=ProjectResponse)
def duplicate_project(project_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    orig = dict(row)
    new_id = f"proj_{uuid.uuid4().hex[:10]}"
    new_title = f"{orig['title']} (Copy)"
    cursor.execute("""
    INSERT INTO projects (
        id, title, topic, discipline, audience, academic_level,
        language, target_word_count, citation_style, formatting_guidelines,
        status, current_step
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)
    """, (
        new_id, new_title, orig["topic"], orig["discipline"], orig["audience"],
        orig["academic_level"], orig["language"], orig["target_word_count"],
        orig["citation_style"], orig["formatting_guidelines"]
    ))
    conn.commit()

    cursor.execute("SELECT * FROM projects WHERE id = ?", (new_id,))
    new_row = dict(cursor.fetchone())
    conn.close()
    return ProjectResponse(**new_row, document_count=0, section_count=0, total_words=0)
