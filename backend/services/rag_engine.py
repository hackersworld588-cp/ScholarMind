import re
import math
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from backend.database import get_connection

logger = logging.getLogger("scholarmind.rag_engine")

class RAGEngine:
    """
    Source-aware Knowledge Base & Hybrid RAG Engine.
    Chunks documents semantically by heading, subsection, and paragraph with context overlap.
    Supports hybrid retrieval (BM25 keyword search + semantic term frequency scoring)
    while rigorously maintaining page-level source provenance.
    """

    @staticmethod
    def chunk_document(document_id: str, project_id: str, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes extracted page data and produces semantically meaningful chunks.
        Saves chunks into the database and returns them.
        """
        conn = get_connection()
        cursor = conn.cursor()

        # Delete any existing chunks for this document
        cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (document_id,))

        chunks: List[Dict[str, Any]] = []
        chunk_idx = 0

        for page in pages_data:
            page_num = page["page_number"]
            page_text = page["text"].strip()
            headings = page.get("headings", [])
            primary_heading = headings[0] if headings else f"Page {page_num}"

            if not page_text:
                continue

            # Split by double newline into logical paragraphs
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]

            if not paragraphs:
                paragraphs = [page_text]

            current_chunk_text = ""
            for p in paragraphs:
                # If adding paragraph exceeds ~900 chars, flush chunk
                if len(current_chunk_text) + len(p) > 950 and current_chunk_text:
                    chunk_id = f"chunk_{document_id}_{chunk_idx}"
                    token_approx = len(current_chunk_text.split())
                    keywords = RAGEngine._extract_keywords(current_chunk_text)

                    cursor.execute("""
                    INSERT INTO document_chunks (
                        id, document_id, project_id, chunk_index, page_number,
                        section_heading, text, token_count, keywords_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        chunk_id, document_id, project_id, chunk_idx, page_num,
                        primary_heading, current_chunk_text, token_approx, json.dumps(keywords)
                    ))

                    chunks.append({
                        "id": chunk_id,
                        "document_id": document_id,
                        "page_number": page_num,
                        "section_heading": primary_heading,
                        "text": current_chunk_text,
                        "token_count": token_approx,
                        "keywords": keywords
                    })
                    chunk_idx += 1
                    # Small overlap: carry over last 150 chars if helpful
                    overlap = current_chunk_text[-120:] if len(current_chunk_text) > 200 else ""
                    current_chunk_text = (overlap + " " + p).strip()
                else:
                    if current_chunk_text:
                        current_chunk_text += "\n\n" + p
                    else:
                        current_chunk_text = p

            if current_chunk_text:
                chunk_id = f"chunk_{document_id}_{chunk_idx}"
                token_approx = len(current_chunk_text.split())
                keywords = RAGEngine._extract_keywords(current_chunk_text)

                cursor.execute("""
                INSERT INTO document_chunks (
                    id, document_id, project_id, chunk_index, page_number,
                    section_heading, text, token_count, keywords_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    chunk_id, document_id, project_id, chunk_idx, page_num,
                    primary_heading, current_chunk_text, token_approx, json.dumps(keywords)
                ))

                chunks.append({
                    "id": chunk_id,
                    "document_id": document_id,
                    "page_number": page_num,
                    "section_heading": primary_heading,
                    "text": current_chunk_text,
                    "token_count": token_approx,
                    "keywords": keywords
                })
                chunk_idx += 1

        conn.commit()
        conn.close()
        logger.info("Created %d chunks for document %s", len(chunks), document_id)
        return chunks

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        words = re.findall(r"\b[A-Za-z0-9_-]{3,20}\b", text.lower())
        stopwords = {
            "the", "and", "for", "with", "that", "this", "from", "are", "was",
            "were", "which", "such", "can", "has", "have", "been", "also", "into",
            "than", "more", "most", "about", "other", "some", "only", "well"
        }
        filtered = [w for w in words if w not in stopwords and not w.isdigit()]
        freq = {}
        for w in filtered:
            freq[w] = freq.get(w, 0) + 1
        sorted_kw = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [k for k, _ in sorted_kw[:12]]

    @staticmethod
    def retrieve_relevant_chunks(
        project_id: str,
        query: str,
        top_k: int = 6,
        doc_id_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval: combines keyword BM25-style scoring and semantic query terms
        across all uploaded documents in the project.
        Returns sorted chunks with source metadata and provenance.
        """
        conn = get_connection()
        cursor = conn.cursor()

        query_sql = """
        SELECT c.id, c.document_id, c.page_number, c.section_heading, c.text, c.token_count,
               c.keywords_json, d.title as doc_title, d.authors as doc_authors,
               d.publication_year, d.publisher, d.edition
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.project_id = ?
        """
        params = [project_id]
        if doc_id_filter:
            query_sql += " AND c.document_id = ?"
            params.append(doc_id_filter)

        cursor.execute(query_sql, params)
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        # Tokenize query
        q_tokens = [w.lower() for w in re.findall(r"\b[A-Za-z0-9_-]{3,20}\b", query) if len(w) > 2]
        scored_chunks: List[Tuple[float, Dict[str, Any]]] = []

        total_chunks = len(rows)
        # Calculate term document frequency
        df: Dict[str, int] = {}
        for row in rows:
            chunk_text_lower = row["text"].lower()
            for token in set(q_tokens):
                if token in chunk_text_lower:
                    df[token] = df.get(token, 0) + 1

        for row in rows:
            chunk_text = row["text"]
            chunk_lower = chunk_text.lower()
            heading_lower = (row["section_heading"] or "").lower()

            # BM25-like scoring
            score = 0.0
            for token in q_tokens:
                tf = chunk_lower.count(token)
                heading_bonus = 2.5 if token in heading_lower else 0.0
                token_df = df.get(token, 1)
                idf = math.log((total_chunks - token_df + 0.5) / (token_df + 0.5) + 1.0)
                if tf > 0 or heading_bonus > 0:
                    score += ((tf * 2.2) / (tf + 1.2)) * idf + heading_bonus

            # Bonus for exact multi-word phrase matching
            if len(query.strip()) > 5 and query.lower() in chunk_lower:
                score += 5.0

            if score > 0.1:
                chunk_item = {
                    "id": row["id"],
                    "document_id": row["document_id"],
                    "document_title": row["doc_title"],
                    "authors": row["doc_authors"],
                    "publication_year": row["publication_year"],
                    "edition": row["edition"],
                    "publisher": row["publisher"],
                    "page_number": row["page_number"],
                    "section_heading": row["section_heading"],
                    "text": chunk_text,
                    "score": round(score, 3)
                }
                scored_chunks.append((score, chunk_item))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = [item for _, item in scored_chunks[:top_k]]

        # Fallback if no specific matches found: return diverse chunks from the books
        if not results and rows:
            for r in rows[:top_k]:
                results.append({
                    "id": r["id"],
                    "document_id": r["document_id"],
                    "document_title": r["doc_title"],
                    "authors": r["doc_authors"],
                    "publication_year": r["publication_year"],
                    "edition": r["edition"],
                    "publisher": r["publisher"],
                    "page_number": r["page_number"],
                    "section_heading": r["section_heading"],
                    "text": r["text"],
                    "score": 0.5
                })

        return results
