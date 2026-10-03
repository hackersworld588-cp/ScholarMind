# ScholarMind AI — Intelligent Book Chapter Research & Authoring Agent

**ScholarMind AI** is an academic research and book authoring platform designed for medical researchers, clinical oncologists, academic editors, and scholars. It enables users to ingest multiple authoritative reference textbooks and papers, perform source-aware RAG retrieval, generate evidence coverage matrices, plan non-repetitive chapter outlines, author original synthesized academic chapters with verified in-text citations and medical fact validation, and export publication-grade typeset PDFs and Word DOCX documents.

---

## Key Capabilities

1. **Multi-Volume Reference Ingestion Engine**:
   - Ingests multiple PDF textbooks and monographs simultaneously.
   - Extracts page-by-page text while strictly preserving exact page numbers, chapter headings, and paragraph boundaries.
   - Automatically parses bibliographic metadata (Title, Authors, Edition, Publication Year, Publisher, ISBN, DOI) without fabricating missing records.
   - Detects low-confidence or scanned pages.
   - Provides side-by-side text preview and full-text search across all uploaded reference volumes.

2. **Source-Aware Knowledge Base & RAG**:
   - Chunks reference texts semantically by heading and paragraph with contextual overlap.
   - Employs hybrid retrieval (BM25 keyword matching + semantic scoring) across all uploaded books.
   - Deduplicates repeated findings across books while preserving distinct diagnostic perspectives.
   - Maintains an immutable audit trail linking every factual statement to its exact source volume and page range.

3. **Coordinated Multi-Stage Research & Planning Agent**:
   - **Stage A (Topic Understanding)**: Determines clinical scope, diagnostic modalities, target audience prerequisites, and terminology boundaries.
   - **Stage B (Reference Mapping)**: Builds an interactive Source Coverage Matrix showing section-to-source mapping and evidence health.
   - **Stage C (Outline Generation & Approval)**: Creates tailored, non-repetitive chapter outlines with customizable word counts per section; users can approve or edit prior to drafting.
   - **Stage D (Section Research Briefs)**: Compiles structured briefs containing key facts, source passages, required citations, and cross-section continuity links.
   - **Stage E (Academic Drafting)**: Synthesizes sections independently with original sentence construction and zero filler.

4. **Medical Accuracy, Fact-Checking & Citation Engine**:
   - **Fact Validation Layer**: Differentiates confirmed source facts from edition-specific guidelines (e.g. AJCC 8th vs 7th) and flags unverified clinical claims.
   - **Diagnostic vs Screening Safeguards**: Ensures screening examinations (low-dose CT, FIT) are framed as preliminary tests requiring tissue biopsy confirmation.
   - **Threshold Precision**: Validates clinical percentages and ratios (e.g., HER2/CEP17 ≥2.0, TPS ≥50%, BI-RADS 4 risk 2% to 95%).
   - **Citation Management**: Full support for Vancouver (`[1]`, `[1,2]`), APA 7th, Harvard, and IEEE styles with dynamic renumbering.
   - **Interactive Citation Inspector**: Clicking any citation opens the exact source book, author, title, publication year, page number, and original quotation.

5. **Full-Screen 3-Panel Chapter Editor**:
   - **Left Panel**: Chapter Table of Contents, live section word counts, coverage health indicators, citation count badges.
   - **Center Panel**: Academic canvas with heading hierarchy, formatted academic tables with captions and citations, interactive citation tags, live word count, and autosave.
   - **Right Panel**:
     - *AI Writing Assistant*: Fine-grained section revisions (Regenerate, Expand clinical mechanisms, Condense prose, Polish scholarly flow, Tone adjustment).
     - *Citation Inspector*: Full source provenance and excerpt viewer.
     - *Medical Fact Checker*: Live validation checklist and claim verification.
     - *Coverage Matrix*: Section-by-section breakdown of source utilization.

6. **Publication-Grade PDF & DOCX Publishing Engine**:
   - ReportLab Typesetting: Front cover, title block, metadata block, executive abstract, styled Table of Contents, numbered section headings (1.0, 2.0), academic comparison tables with repeating headers, callout boxes for clinical takeaways, in-text citation links, complete formatted Bibliography, and mandatory Medical & Educational Academic Disclaimer.
   - Running headers with chapter title and running footers with "Page X of Y".
   - Automated PDF Validator: Programmatically verifies PDF stream integrity, validates total page count (≥5 pages), checks that all outline sections are rendered, and verifies citation-to-reference parity.
   - Microsoft Word DOCX export option.

---

## Pre-Loaded Clinical Reference Corpus

ScholarMind AI includes a curated 5-volume clinical reference corpus on **"Diagnosis of Various Types of Cancer"** for instant evaluation:
1. *DeVita, Hellman, and Rosenberg's Cancer: Principles & Practice of Oncology (11th Edition)*
2. *Robbins & Cotran Pathologic Basis of Disease (10th Edition)*
3. *AJCC Cancer Staging Manual (8th Edition)*
4. *WHO Classification of Tumours: Thoracic and Digestive System Tumours (5th Edition)*
5. *NCCN Clinical Practice Guidelines in Oncology: Early Detection & Diagnostic Workup (2024)*

Users can load this reference corpus with 1 click in the New Chapter Wizard or upload their own PDFs.

---

## Architecture & Directory Layout

```
scholarmind-ai/
├── backend/
│   ├── main.py                     # FastAPI entrypoint, middleware, routers
│   ├── config.py                   # App configuration and storage paths
│   ├── database.py                 # SQLite database with WAL mode
│   ├── models/
│   │   ├── schemas.py              # Pydantic request/response schemas
│   ├── services/
│   │   ├── pdf_extractor.py        # PDF text and metadata extraction with page tracking
│   │   ├── rag_engine.py           # Semantic chunker, BM25, and hybrid retrieval
│   │   ├── llm_service.py          # Gemini/OpenAI/Anthropic adapters + local academic engine
│   │   ├── research_agent.py       # Outline generation, coverage matrix, research briefs
│   │   ├── academic_writer.py      # Section drafting and fine-grained revision
│   │   ├── medical_validator.py    # Fact checking, criteria verification, conflict detection
│   │   ├── citation_manager.py     # Vancouver, APA, Harvard formatting and citation numbering
│   │   ├── pdf_publisher.py        # Publication-grade ReportLab PDF generation & validator
│   │   ├── docx_publisher.py       # Microsoft Word .docx exporter
│   │   └── sample_corpus.py        # Preloaded reference books on Cancer Diagnosis
│   ├── routers/
│   │   ├── projects.py             # Project CRUD and status endpoints
│   │   ├── documents.py            # Upload, metadata correction, extracted text preview
│   │   ├── outline.py              # Outline generation, editing, coverage matrix
│   │   ├── chapter.py              # Section drafting, revision, editing, fact checks
│   │   ├── export.py               # PDF/DOCX generation, download, validation
│   │   └── settings.py             # API keys, provider selection, connection tests
│   └── tests/
│       ├── test_backend.py         # End-to-end pipeline and PDF validation tests
│       └── test_api_endpoints.py   # FastAPI HTTP endpoint tests
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout with academic styling
│   │   │   ├── page.tsx            # Dashboard overview & stats
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx        # Projects list & management
│   │   │   │   ├── new/page.tsx    # 5-Step Project & Ingestion Wizard
│   │   │   │   └── [id]/
│   │   │   │       └── editor/page.tsx # 3-Panel Academic Chapter Editor
│   │   │   ├── references/page.tsx # Global Reference Library
│   │   │   └── settings/page.tsx   # LLM Provider & System Settings
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   └── lib/
│   │       ├── api.ts              # Typed API client for FastAPI backend
│   │       └── types.ts            # Shared TypeScript interfaces
├── storage/
│   ├── uploads/                    # Ingested PDF documents
│   ├── exports/                    # Generated PDF and DOCX publications
│   └── scholarmind.db              # Persistent SQLite database
└── .env.example
```

---

## Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node v24.19.0)
- Python 3.9+

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r <(cat << 'EOF'
fastapi
uvicorn
pydantic
reportlab
pypdf
python-docx
python-multipart
aiofiles
httpx
pytest
EOF
)

# Start backend server on port 8000
PYTHONPATH=. venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## Running the Automated Test Suite

```bash
cd scholarmind-ai
PYTHONPATH=. backend/venv/bin/pytest backend/tests -v
```

All 5 test suites run in ~2.5s and verify:
- PDF text & metadata extraction with page tracking
- RAG chunking and hybrid query retrieval
- Multi-volume cancer reference corpus ingestion
- Outline generation and Coverage Matrix computation
- Section drafting with citation numbers
- Medical fact validation and claim checks
- Citation provenance resolution
- Complete ReportLab PDF generation and automated validation (5+ pages, table, cover, references, disclaimer)
- DOCX export
- FastAPI REST API endpoints
