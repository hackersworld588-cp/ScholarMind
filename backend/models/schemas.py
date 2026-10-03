from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str = Field(..., json_schema_extra={"example": "Diagnosis of Various Types of Cancer: Modern Principles and Practice"})
    topic: str = Field(..., json_schema_extra={"example": "Diagnosis of Various Types of Cancer"})
    discipline: str = Field(default="Clinical Oncology & Pathology")
    audience: str = Field(default="Medical Students & Oncology Fellows")
    academic_level: str = Field(default="Postgraduate / Clinical Specialist")
    language: str = Field(default="English (US Academic)")
    target_word_count: int = Field(default=5000)
    citation_style: str = Field(default="vancouver")
    formatting_guidelines: Optional[str] = Field(default=None)

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    discipline: Optional[str] = None
    audience: Optional[str] = None
    academic_level: Optional[str] = None
    language: Optional[str] = None
    target_word_count: Optional[int] = None
    citation_style: Optional[str] = None
    formatting_guidelines: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[int] = None

class ProjectResponse(BaseModel):
    id: str
    title: str
    topic: str
    discipline: str
    audience: str
    academic_level: str
    language: str
    target_word_count: int
    citation_style: str
    formatting_guidelines: Optional[str] = None
    status: str
    current_step: int
    created_at: str
    updated_at: str
    document_count: Optional[int] = 0
    section_count: Optional[int] = 0
    total_words: Optional[int] = 0

# --- Document Schemas ---
class DocumentMetadataUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    edition: Optional[str] = None
    publication_year: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    doi: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    original_name: str
    file_size: int
    page_count: int
    title: Optional[str] = None
    authors: Optional[str] = None
    edition: Optional[str] = None
    publication_year: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    doi: Optional[str] = None
    extraction_status: str
    confidence: float
    ocr_used: bool
    created_at: str
    chunk_count: Optional[int] = 0

class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    page_number: int
    section_heading: Optional[str] = None
    text: str
    token_count: int

# --- Outline Schemas ---
class OutlineSectionItem(BaseModel):
    id: str
    title: str
    level: int = 1  # 1 for H1, 2 for H2, 3 for H3
    target_word_count: int = 500
    learning_objectives: Optional[List[str]] = []
    expected_sources: Optional[List[str]] = []
    order: int = 0

class OutlineGenerateRequest(BaseModel):
    project_id: str
    custom_instructions: Optional[str] = None

class OutlineUpdateRequest(BaseModel):
    title: str
    sections: List[OutlineSectionItem]
    approved: bool = False

class OutlineResponse(BaseModel):
    id: str
    project_id: str
    title: str
    sections: List[OutlineSectionItem]
    approved: bool
    created_at: str
    updated_at: str

# --- Coverage Matrix ---
class SectionCoverageItem(BaseModel):
    section_id: str
    section_title: str
    sources_mapped: List[Dict[str, Any]]  # doc_id, doc_title, relevance_score, page_ranges
    evidence_strength: str  # "high", "moderate", "low", "none"
    coverage_percentage: float

class CoverageMatrixResponse(BaseModel):
    project_id: str
    total_sources: int
    sections: List[SectionCoverageItem]
    overall_health: str  # "excellent", "good", "needs_sources"

# --- Research Brief Schemas ---
class ResearchBriefResponse(BaseModel):
    id: str
    project_id: str
    section_id: str
    objective: str
    key_facts: List[str]
    source_passages: List[Dict[str, Any]]
    conflicting_findings: Optional[List[str]] = []
    citations_needed: Optional[List[str]] = []

# --- Section & Writing Schemas ---
class SectionDraftRequest(BaseModel):
    custom_guidance: Optional[str] = None
    tone: Optional[str] = "Academic / Clinical"

class SectionReviseRequest(BaseModel):
    action: str  # "regenerate", "expand", "condense", "improve_transitions", "academic_polish", "tone_shift", "add_sources"
    instructions: Optional[str] = None
    selected_text: Optional[str] = None

class SectionResponse(BaseModel):
    id: str
    project_id: str
    section_id: str
    title: str
    level: int
    section_order: int
    content_markdown: str
    word_count: int
    citations: List[Dict[str, Any]]
    fact_check_status: str
    review_warnings: List[str]
    updated_at: str

class ChapterFullResponse(BaseModel):
    project_id: str
    title: str
    total_words: int
    sections: List[SectionResponse]
    citations: List[Dict[str, Any]]
    status: str

# --- Citation Schemas ---
class CitationItem(BaseModel):
    citation_number: int
    document_id: str
    document_title: str
    authors: str
    publication_year: str
    publisher: Optional[str] = None
    edition: Optional[str] = None
    doi: Optional[str] = None
    page_number: Optional[int] = None
    passage_quote: Optional[str] = None
    formatted_citation: str

# --- Fact Checking Schemas ---
class FactCheckItem(BaseModel):
    section_id: str
    section_title: str
    claim_text: str
    category: str  # "verified_source", "edition_specific", "source_conflict", "unverified_claim", "screening_vs_diagnostic"
    severity: str  # "info", "warning", "critical"
    message: str
    sources_cited: List[str]
    suggested_revision: Optional[str] = None

class FactCheckReport(BaseModel):
    project_id: str
    total_claims_analyzed: int
    verified_claims_count: int
    warnings_count: int
    issues: List[FactCheckItem]

# --- Settings & Provider Schemas ---
class SettingsRequest(BaseModel):
    llm_provider: str
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    default_model: Optional[str] = None
    default_citation_style: Optional[str] = None
    default_language: Optional[str] = None

class SettingsResponse(BaseModel):
    llm_provider: str
    has_gemini_key: bool
    has_openai_key: bool
    has_anthropic_key: bool
    default_model: str
    default_citation_style: str
    default_language: str
    available_providers: List[str]

class TestConnectionRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None

class TestConnectionResponse(BaseModel):
    success: bool
    provider: str
    model: str
    message: str
    latency_ms: Optional[float] = None
