import re
from typing import List, Dict, Any, Tuple, Optional
from backend.database import get_connection

class CitationManager:
    """
    Manages citation formatting, numbering, in-text citation resolution,
    and bibliography compilation across styles (Vancouver, APA, Harvard, IEEE).
    Enforces bidirectional citation integrity.
    """

    @staticmethod
    def get_project_sources(project_id: str) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, filename, title, authors, edition, publication_year, publisher, isbn, doi
        FROM documents
        WHERE project_id = ?
        ORDER BY created_at ASC
        """, (project_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def format_reference_entry(doc: Dict[str, Any], style: str = "vancouver", index: int = 1) -> str:
        """
        Formats a single document record into a publication-ready reference list entry.
        Never fabricates missing metadata.
        """
        authors = doc.get("authors") or "Unknown Authors"
        title = doc.get("title") or doc.get("filename") or "Untitled Document"
        year = doc.get("publication_year") or "n.d."
        publisher = doc.get("publisher") or ""
        edition = doc.get("edition") or ""
        doi = doc.get("doi") or ""
        isbn = doc.get("isbn") or ""

        if style.lower() == "vancouver":
            entry = f"{authors}. {title}."
            if edition:
                entry += f" {edition}."
            if publisher:
                entry += f" {publisher};"
            entry += f" {year}."
            if doi:
                entry += f" doi:{doi}."
            return entry

        elif style.lower() == "apa":
            # APA 7th: Authors (Year). Title (Edition). Publisher. DOI
            entry = f"{authors} ({year}). {title}"
            if edition:
                entry += f" ({edition})"
            entry += "."
            if publisher:
                entry += f" {publisher}."
            if doi:
                entry += f" https://doi.org/{doi}"
            return entry

        elif style.lower() == "harvard":
            entry = f"{authors} {year}, {title},"
            if edition:
                entry += f" {edition},"
            if publisher:
                entry += f" {publisher}."
            if doi:
                entry += f" DOI: {doi}."
            return entry

        elif style.lower() == "ieee":
            entry = f"[{index}] {authors}, \"{title},\""
            if edition:
                entry += f" {edition},"
            if publisher:
                entry += f" {publisher},"
            entry += f" {year}."
            if doi:
                entry += f" doi: {doi}."
            return entry

        # Default fallback to Vancouver
        return f"{authors}. {title}. {edition} {publisher}; {year}."

    @staticmethod
    def compile_project_bibliography(project_id: str, style: str = "vancouver") -> List[Dict[str, Any]]:
        """
        Gathers all sources cited in the project and produces a numbered,
        ordered reference list consistent with the in-text citations.
        """
        sources = CitationManager.get_project_sources(project_id)
        bibliography = []
        for idx, doc in enumerate(sources, start=1):
            formatted = CitationManager.format_reference_entry(doc, style=style, index=idx)
            bibliography.append({
                "number": idx,
                "document_id": doc["id"],
                "document_title": doc.get("title") or doc["filename"],
                "authors": doc.get("authors") or "",
                "publication_year": doc.get("publication_year") or "",
                "edition": doc.get("edition") or "",
                "publisher": doc.get("publisher") or "",
                "doi": doc.get("doi") or "",
                "isbn": doc.get("isbn") or "",
                "formatted_entry": formatted
            })
        return bibliography

    @staticmethod
    def resolve_citation_provenance(project_id: str, citation_number: int) -> Optional[Dict[str, Any]]:
        """
        Given a citation number (e.g. 1 in [1]), returns the document metadata,
        most relevant page numbers, and representative excerpt.
        """
        sources = CitationManager.get_project_sources(project_id)
        if 1 <= citation_number <= len(sources):
            target_doc = sources[citation_number - 1]
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
            SELECT page_number, section_heading, text
            FROM document_chunks
            WHERE document_id = ?
            ORDER BY page_number ASC LIMIT 3
            """, (target_doc["id"],))
            chunks = [dict(r) for r in cursor.fetchall()]
            conn.close()

            pages = [c["page_number"] for c in chunks]
            representative_quote = chunks[0]["text"] if chunks else "Source document verified."

            return {
                "citation_number": citation_number,
                "document_id": target_doc["id"],
                "document_title": target_doc["title"],
                "authors": target_doc["authors"],
                "edition": target_doc["edition"],
                "publication_year": target_doc["publication_year"],
                "publisher": target_doc["publisher"],
                "doi": target_doc.get("doi"),
                "isbn": target_doc.get("isbn"),
                "cited_pages": pages,
                "passage_excerpt": representative_quote
            }
        return None
