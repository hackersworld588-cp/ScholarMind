import os
import re
import logging
from pathlib import Path
from typing import Dict, Any
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from backend.config import EXPORTS_DIR
from backend.database import get_connection
from backend.services.citation_manager import CitationManager

logger = logging.getLogger("scholarmind.docx_publisher")

class DocxPublisher:
    """
    Generates professionally formatted Microsoft Word (.docx) documents.
    """

    @staticmethod
    def generate_chapter_docx(project_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = dict(cursor.fetchone())

        cursor.execute("""
        SELECT * FROM chapter_sections
        WHERE project_id = ?
        ORDER BY section_order ASC
        """, (project_id,))
        sections = [dict(r) for r in cursor.fetchall()]
        conn.close()

        doc = Document()

        # Title
        p_title = doc.add_paragraph()
        run_title = p_title.add_run(project["title"])
        run_title.font.size = Pt(22)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(15, 23, 42)
        p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT

        # Subtitle
        p_sub = doc.add_paragraph()
        run_sub = p_sub.add_run(f"Academic Book Chapter — {project['discipline']}")
        run_sub.font.size = Pt(12)
        run_sub.font.italic = True
        run_sub.font.color.rgb = RGBColor(79, 70, 229)

        # Meta table
        p_meta = doc.add_paragraph()
        p_meta.add_run(f"Target Audience: {project['audience']} | Academic Level: {project['academic_level']}\nCitation Standard: {project['citation_style'].title()}")

        doc.add_heading("Abstract", level=1)
        p_abs = doc.add_paragraph(
            f"This academic book chapter synthesizes verified clinical and pathological literature regarding {project['topic']}. "
            f"Focusing on evidence-based diagnostic criteria, histopathologic differentiation, staging systems, and precision biomarkers."
        )
        p_abs.style = 'Intense Quote'

        # Main sections
        for idx, sec in enumerate(sections, start=1):
            doc.add_heading(f"{idx}.0 {sec['title']}", level=1)
            paragraphs = [p.strip() for p in sec["content_markdown"].split("\n\n") if p.strip()]
            for p in paragraphs:
                clean_p = re.sub(r"^#+\s*", "", p)
                doc.add_paragraph(clean_p)

        # Bibliography
        doc.add_heading("References", level=1)
        bibliography = CitationManager.compile_project_bibliography(project_id, style=project["citation_style"])
        for ref in bibliography:
            p_ref = doc.add_paragraph()
            p_ref.add_run(f"[{ref['number']}] ").bold = True
            p_ref.add_run(ref["formatted_entry"])

        # Disclaimer
        doc.add_heading("Medical Disclaimer", level=2)
        doc.add_paragraph(
            "This document is an academic and educational synthesis for research and instructional purposes only. "
            "It does not substitute for independent professional medical judgment."
        )

        out_filename = f"ScholarMind_{project_id[:8]}_{re.sub(r'[^a-zA-Z0-9]', '_', project['title'][:25])}.docx"
        out_path = EXPORTS_DIR / out_filename
        doc.save(str(out_path))

        return {
            "success": True,
            "file_name": out_filename,
            "file_path": str(out_path),
            "file_size": out_path.stat().st_size
        }
