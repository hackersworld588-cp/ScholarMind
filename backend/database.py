import sqlite3
import json
import logging
from typing import Any, Dict, List, Optional
from backend.config import DB_PATH

logger = logging.getLogger("scholarmind.database")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        discipline TEXT NOT NULL,
        audience TEXT NOT NULL,
        academic_level TEXT NOT NULL,
        language TEXT NOT NULL,
        target_word_count INTEGER NOT NULL,
        citation_style TEXT NOT NULL,
        formatting_guidelines TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        current_step INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Uploaded Documents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        page_count INTEGER NOT NULL DEFAULT 0,
        title TEXT,
        authors TEXT,
        edition TEXT,
        publication_year TEXT,
        publisher TEXT,
        isbn TEXT,
        doi TEXT,
        extraction_status TEXT NOT NULL DEFAULT 'pending',
        confidence REAL DEFAULT 1.0,
        ocr_used INTEGER DEFAULT 0,
        extracted_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # Document Chunks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        page_number INTEGER NOT NULL,
        section_heading TEXT,
        text TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        keywords_json TEXT,
        FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_project ON document_chunks(project_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);")

    # Chapter Outline
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chapter_outlines (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        sections_json TEXT NOT NULL,
        approved INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # Research Briefs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS research_briefs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        section_id TEXT NOT NULL,
        objective TEXT NOT NULL,
        key_facts_json TEXT NOT NULL,
        source_passages_json TEXT NOT NULL,
        conflicting_findings_json TEXT,
        citations_needed_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, section_id)
    );
    """)

    # Chapter Sections
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chapter_sections (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        section_id TEXT NOT NULL,
        title TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        section_order INTEGER NOT NULL,
        content_markdown TEXT NOT NULL DEFAULT '',
        word_count INTEGER NOT NULL DEFAULT 0,
        citations_json TEXT DEFAULT '[]',
        fact_check_status TEXT DEFAULT 'pending',
        review_warnings_json TEXT DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, section_id)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sections_project ON chapter_sections(project_id);")

    # Chapter Versions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chapter_versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        full_content_markdown TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        change_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # Citation Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citation_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        citation_number INTEGER NOT NULL,
        document_id TEXT NOT NULL,
        page_number INTEGER,
        passage_quote TEXT,
        citation_key TEXT,
        formatted_citation TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    """)

    # Export Jobs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS export_jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        export_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        validation_report_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # Settings Key-Value Store
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
    logger.info("ScholarMind database initialized at %s", DB_PATH)

if __name__ == "__main__":
    init_db()
