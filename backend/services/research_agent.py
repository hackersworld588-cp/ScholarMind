import json
import logging
from typing import List, Dict, Any, Optional
from backend.database import get_connection
from backend.services.rag_engine import RAGEngine
from backend.services.llm_service import LLMService
from backend.services.citation_manager import CitationManager

logger = logging.getLogger("scholarmind.research_agent")

class ResearchAgent:
    """
    Coordinated Multi-Stage Research & Planning Agent:
    - Stage A: Topic Understanding & Domain Concept Extraction
    - Stage B: Reference Mapping & Source Coverage Matrix
    - Stage C: Outline Generation & Customization
    - Stage D: Section Research Brief Builder
    - Stage E: Source-grounded Chapter Drafting
    """

    @staticmethod
    async def generate_outline(project_id: str, custom_instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Stage A & C: Analyzes project metadata and uploaded references to generate
        a tailored, non-repetitive chapter outline.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = dict(cursor.fetchone())

        cursor.execute("SELECT id, title, authors, publication_year FROM documents WHERE project_id = ?", (project_id,))
        docs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        doc_summary = "\n".join([f"- {d['title']} ({d['authors']}, {d['publication_year']})" for d in docs])

        prompt = f"""
You are ScholarMind AI, a senior academic research architect and medical editor.
TASK: Analyze the following chapter request and reference documents, then produce a comprehensive academic book chapter outline.
FLAG: GENERATE_OUTLINE_JSON

Project Title: {project['title']}
Chapter Topic: {project['topic']}
Discipline: {project['discipline']}
Audience: {project['audience']}
Target Word Count: {project['target_word_count']}
Academic Level: {project['academic_level']}

Available Reference Documents:
{doc_summary}

Custom Instructions: {custom_instructions or "Focus on clinical, pathological, and molecular dimensions."}

Return a valid JSON object with:
{{
  "proposed_title": "string",
  "sections": [
     {{
       "id": "sec_1",
       "title": "string",
       "level": 1,
       "target_word_count": 600,
       "learning_objectives": ["obj1", "obj2"],
       "order": 1
     }}
  ]
}}
"""
        raw_response = await LLMService.generate_text(prompt, system_instruction="Output only valid JSON.")

        # Parse JSON
        try:
            # clean possible markdown code blocks
            clean_json = raw_response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            outline_data = json.loads(clean_json.strip())
        except Exception as e:
            logger.warning("Failed to parse outline JSON: %s. Using default structure.", e)
            outline_data = json.loads(LLMService._synthesize_local("GENERATE_OUTLINE_JSON", None))

        # Save to DB
        conn = get_connection()
        cursor = conn.cursor()
        outline_id = f"outline_{project_id}"
        cursor.execute("""
        INSERT INTO chapter_outlines (id, project_id, title, sections_json, approved)
        VALUES (?, ?, ?, ?, 0)
        ON CONFLICT(project_id) DO UPDATE SET
            title = excluded.title,
            sections_json = excluded.sections_json,
            updated_at = CURRENT_TIMESTAMP
        """, (outline_id, project_id, outline_data.get("proposed_title", project["title"]), json.dumps(outline_data["sections"])))
        conn.commit()
        conn.close()

        return {
            "id": outline_id,
            "project_id": project_id,
            "title": outline_data.get("proposed_title", project["title"]),
            "sections": outline_data["sections"],
            "approved": False
        }

    @staticmethod
    def compute_coverage_matrix(project_id: str) -> Dict[str, Any]:
        """
        Stage B: Reference Mapping.
        Builds a source coverage matrix mapping each proposed section
        to all uploaded reference documents and calculates evidence strength.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT sections_json FROM chapter_outlines WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"project_id": project_id, "total_sources": 0, "sections": [], "overall_health": "needs_sources"}

        sections = json.loads(row["sections_json"])

        cursor.execute("SELECT id, title, authors, publication_year FROM documents WHERE project_id = ?", (project_id,))
        docs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        total_sources = len(docs)
        section_coverages = []

        for sec in sections:
            sec_title = sec["title"]
            # Query RAG for this section
            relevant_chunks = RAGEngine.retrieve_relevant_chunks(project_id, sec_title, top_k=8)

            # Aggregate which documents matched
            doc_matches: Dict[str, Dict[str, Any]] = {}
            for chunk in relevant_chunks:
                d_id = chunk["document_id"]
                if d_id not in doc_matches:
                    doc_matches[d_id] = {
                        "document_id": d_id,
                        "document_title": chunk["document_title"],
                        "authors": chunk["authors"],
                        "page_ranges": [chunk["page_number"]],
                        "relevance_score": chunk["score"]
                    }
                else:
                    if chunk["page_number"] not in doc_matches[d_id]["page_ranges"]:
                        doc_matches[d_id]["page_ranges"].append(chunk["page_number"])
                    doc_matches[d_id]["relevance_score"] += chunk["score"]

            matched_sources = list(doc_matches.values())
            coverage_pct = min(round((len(matched_sources) / max(total_sources, 1)) * 100, 1), 100.0)

            if len(matched_sources) >= 3:
                evidence_strength = "high"
            elif len(matched_sources) >= 1:
                evidence_strength = "moderate"
            else:
                evidence_strength = "low"

            section_coverages.append({
                "section_id": sec["id"],
                "section_title": sec_title,
                "sources_mapped": matched_sources,
                "evidence_strength": evidence_strength,
                "coverage_percentage": coverage_pct
            })

        overall_health = "excellent" if all(s["evidence_strength"] in ["high", "moderate"] for s in section_coverages) else "good"

        return {
            "project_id": project_id,
            "total_sources": total_sources,
            "sections": section_coverages,
            "overall_health": overall_health
        }

    @staticmethod
    def build_research_brief(project_id: str, section_id: str) -> Dict[str, Any]:
        """
        Stage D: Research Briefs.
        Gathers section objectives, key facts, cited source excerpts with page numbers.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT sections_json FROM chapter_outlines WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Outline not found")

        sections = json.loads(row["sections_json"])
        sec = next((s for s in sections if s["id"] == section_id), None)
        if not sec:
            conn.close()
            raise ValueError(f"Section {section_id} not found in outline")

        relevant_chunks = RAGEngine.retrieve_relevant_chunks(project_id, sec["title"], top_k=5)

        key_facts = []
        source_passages = []
        for c in relevant_chunks:
            source_passages.append({
                "document_id": c["document_id"],
                "document_title": c["document_title"],
                "authors": c["authors"],
                "page_number": c["page_number"],
                "heading": c.get("section_heading", ""),
                "excerpt": c["text"]
            })
            # Extract high-level sentence as key fact
            first_sentence = c["text"].split(". ")[0] + "."
            if first_sentence not in key_facts:
                key_facts.append(first_sentence)

        brief = {
            "id": f"brief_{project_id}_{section_id}",
            "project_id": project_id,
            "section_id": section_id,
            "objective": f"Synthesize academic knowledge on {sec['title']} grounded in primary reference texts.",
            "key_facts": key_facts[:4],
            "source_passages": source_passages,
            "conflicting_findings": [
                "Screening vs diagnostic criteria distinctions",
                "Liquid biopsy ctDNA sensitivity vs tissue biopsy requirements"
            ],
            "citations_needed": [c["document_title"] for c in relevant_chunks[:3]]
        }

        # Save brief
        cursor.execute("""
        INSERT INTO research_briefs (
            id, project_id, section_id, objective, key_facts_json,
            source_passages_json, conflicting_findings_json, citations_needed_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, section_id) DO UPDATE SET
            objective = excluded.objective,
            key_facts_json = excluded.key_facts_json,
            source_passages_json = excluded.source_passages_json
        """, (
            brief["id"], project_id, section_id, brief["objective"],
            json.dumps(brief["key_facts"]), json.dumps(brief["source_passages"]),
            json.dumps(brief["conflicting_findings"]), json.dumps(brief["citations_needed"])
        ))
        conn.commit()
        conn.close()

        return brief
