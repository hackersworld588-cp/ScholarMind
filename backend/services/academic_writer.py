import re
import json
import logging
from typing import Dict, Any, List, Optional
from backend.database import get_connection
from backend.services.research_agent import ResearchAgent
from backend.services.llm_service import LLMService
from backend.services.medical_validator import MedicalValidator
from backend.services.citation_manager import CitationManager

logger = logging.getLogger("scholarmind.academic_writer")

class AcademicWriter:
    """
    Original Academic Writing Engine:
    Produces fluent, source-grounded academic text with verified terminology,
    precise numerical thresholds, and active in-text citations.
    Supports section-level generation, expansion, condensation, and revision.
    """

    @staticmethod
    async def draft_section(
        project_id: str,
        section_id: str,
        custom_guidance: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a complete, original section based on its Research Brief.
        """
        # 1. Fetch project metadata
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = dict(cursor.fetchone())

        # 2. Fetch or build Research Brief
        cursor.execute("SELECT sections_json FROM chapter_outlines WHERE project_id = ?", (project_id,))
        outline_row = cursor.fetchone()
        sections = json.loads(outline_row["sections_json"])
        sec_info = next((s for s in sections if s["id"] == section_id), None)
        if not sec_info:
            conn.close()
            raise ValueError(f"Section {section_id} not found in outline")

        cursor.execute("SELECT * FROM research_briefs WHERE project_id = ? AND section_id = ?", (project_id, section_id))
        brief_row = cursor.fetchone()
        conn.close()

        if brief_row:
            brief = {
                "objective": brief_row["objective"],
                "key_facts": json.loads(brief_row["key_facts_json"]),
                "source_passages": json.loads(brief_row["source_passages_json"])
            }
        else:
            brief = ResearchAgent.build_research_brief(project_id, section_id)

        # 3. Compile sources and in-text citation map
        sources = CitationManager.get_project_sources(project_id)
        source_reference_legend = []
        doc_id_to_num = {}
        for idx, doc in enumerate(sources, start=1):
            doc_id_to_num[doc["id"]] = idx
            source_reference_legend.append(
                f"[{idx}] {doc['title']} by {doc['authors']} ({doc['publication_year']})"
            )

        evidence_blocks = []
        for p in brief.get("source_passages", []):
            d_num = doc_id_to_num.get(p.get("document_id"), 1)
            evidence_blocks.append(
                f"Reference [{d_num}] (Page {p.get('page_number')}): {p.get('excerpt')}"
            )

        evidence_text = "\n\n".join(evidence_blocks)

        prompt = f"""
ROLE: Senior Academic Medical Author and Editor.
TASK: Write an original, comprehensive academic section for a medical book chapter.

Book Chapter Topic: {project['topic']}
Academic Discipline: {project['discipline']}
Target Audience: {project['audience']} ({project['academic_level']})
Section Title: {sec_info['title']}
Target Word Count: ~{sec_info.get('target_word_count', 700)} words

CORE SCIENTIFIC EVIDENCE FROM REFERENCE DOCUMENTS:
{evidence_text}

CITATION LEGEND:
{chr(10).join(source_reference_legend)}

WRITING DIRECTIVES:
1. Write in fluent, scholarly, professional academic English with elegant paragraph transitions.
2. Synthesize facts across multiple references into a single coherent narrative.
3. Every factual claim, diagnostic threshold, percentage, or recommendation must be properly cited with bracketed numbers like [1] or [1,2].
4. Maintain exact medical precision: distinguish screening vs diagnostic confirmation; preserve sensitivity/specificity context; retain precise thresholds (e.g. TPS ≥50%, HER2 FISH ratio ≥2.0, BI-RADS criteria).
5. DO NOT copy phrases verbatim; independently organize, explain, and synthesize the knowledge in original prose.
6. Custom author guidance: {custom_guidance or "None provided. Maintain rigorous academic depth."}

OUTPUT: The drafted section text in Markdown format.
"""
        raw_text = await LLMService.generate_text(
            prompt,
            system_instruction="You are a distinguished medical researcher writing an academic book chapter. Write directly with scholarly depth and rigor."
        )

        word_count = len(raw_text.split())

        # Extract citations present in text
        cited_numbers = set()
        for match in re.finditer(r"\[(\d+(?:,\s*\d+)*)\]", raw_text):
            nums = [int(n.strip()) for n in match.group(1).split(",")]
            cited_numbers.update(nums)

        citations_list = []
        for num in sorted(cited_numbers):
            prov = CitationManager.resolve_citation_provenance(project_id, num)
            if prov:
                citations_list.append(prov)

        # 4. Medical Fact Validation
        validation = MedicalValidator.validate_section(
            section_id=section_id,
            title=sec_info["title"],
            content=raw_text,
            project_id=project_id
        )

        # 5. Persist section
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO chapter_sections (
            id, project_id, section_id, title, level, section_order,
            content_markdown, word_count, citations_json, fact_check_status,
            review_warnings_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(project_id, section_id) DO UPDATE SET
            title = excluded.title,
            content_markdown = excluded.content_markdown,
            word_count = excluded.word_count,
            citations_json = excluded.citations_json,
            fact_check_status = excluded.fact_check_status,
            review_warnings_json = excluded.review_warnings_json,
            updated_at = CURRENT_TIMESTAMP
        """, (
            f"sec_rec_{project_id}_{section_id}",
            project_id,
            section_id,
            sec_info["title"],
            sec_info.get("level", 1),
            sec_info.get("order", 1),
            raw_text,
            word_count,
            json.dumps(citations_list),
            validation["status"],
            json.dumps([i["message"] for i in validation["issues"]])
        ))
        conn.commit()
        conn.close()

        return {
            "id": f"sec_rec_{project_id}_{section_id}",
            "project_id": project_id,
            "section_id": section_id,
            "title": sec_info["title"],
            "level": sec_info.get("level", 1),
            "section_order": sec_info.get("order", 1),
            "content_markdown": raw_text,
            "word_count": word_count,
            "citations": citations_list,
            "fact_check_status": validation["status"],
            "review_warnings": [i["message"] for i in validation["issues"]],
            "updated_at": "Just now"
        }

    @staticmethod
    async def revise_section(
        project_id: str,
        section_id: str,
        action: str,
        instructions: Optional[str] = None,
        selected_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refines, expands, condenses, or polishes an existing section
        without touching unrelated sections.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM chapter_sections WHERE project_id = ? AND section_id = ?
        """, (project_id, section_id))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return await AcademicWriter.draft_section(project_id, section_id, instructions)

        current_content = row["content_markdown"]

        if action == "expand":
            guidance = f"Expand this section with additional clinical mechanisms, diagnostic algorithms, and evidence. {instructions or ''}"
        elif action == "condense":
            guidance = f"Condense this section by 25%, making the academic prose tighter while strictly preserving all clinical values and citations. {instructions or ''}"
        elif action == "improve_transitions":
            guidance = f"Improve logical paragraph flow and explanatory academic transitions between concepts. {instructions or ''}"
        elif action == "academic_polish":
            guidance = f"Elevate scholarly tone and terminology. Remove repetitive phrasing. {instructions or ''}"
        else:
            guidance = instructions or "Regenerate section with fresh academic synthesis."

        return await AcademicWriter.draft_section(project_id, section_id, guidance)
