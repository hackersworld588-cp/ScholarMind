export interface Project {
  id: string;
  title: string;
  topic: string;
  discipline: string;
  audience: string;
  academic_level: string;
  language: string;
  target_word_count: number;
  citation_style: string;
  formatting_guidelines?: string;
  status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  document_count?: number;
  section_count?: number;
  total_words?: number;
}

export interface ReferenceDocument {
  id: string;
  project_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  page_count: number;
  title?: string;
  authors?: string;
  edition?: string;
  publication_year?: string;
  publisher?: string;
  isbn?: string;
  doi?: string;
  extraction_status: string;
  confidence: number;
  ocr_used: boolean;
  created_at: string;
  chunk_count?: number;
}

export interface OutlineSection {
  id: string;
  title: string;
  level: number;
  target_word_count: number;
  learning_objectives?: string[];
  expected_sources?: string[];
  order: number;
}

export interface Outline {
  id: string;
  project_id: string;
  title: string;
  sections: OutlineSection[];
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceMapItem {
  document_id: string;
  document_title: string;
  authors: string;
  page_ranges: number[];
  relevance_score: number;
}

export interface SectionCoverage {
  section_id: string;
  section_title: string;
  sources_mapped: SourceMapItem[];
  evidence_strength: 'high' | 'moderate' | 'low' | 'none';
  coverage_percentage: number;
}

export interface CoverageMatrix {
  project_id: string;
  total_sources: number;
  sections: SectionCoverage[];
  overall_health: 'excellent' | 'good' | 'needs_sources';
}

export interface ResearchBrief {
  id: string;
  project_id: string;
  section_id: string;
  objective: string;
  key_facts: string[];
  source_passages: Array<{
    document_id: string;
    document_title: string;
    authors: string;
    page_number: number;
    heading: string;
    excerpt: string;
  }>;
  conflicting_findings?: string[];
  citations_needed?: string[];
}

export interface CitationProvenance {
  citation_number: number;
  document_id: string;
  document_title: string;
  authors: string;
  edition?: string;
  publication_year: string;
  publisher?: string;
  doi?: string;
  isbn?: string;
  cited_pages: number[];
  passage_excerpt: string;
}

export interface ChapterSection {
  id: string;
  project_id: string;
  section_id: string;
  title: string;
  level: number;
  section_order: number;
  content_markdown: string;
  word_count: number;
  citations: CitationProvenance[];
  fact_check_status: 'verified' | 'flagged' | 'pending';
  review_warnings: string[];
  updated_at: string;
}

export interface Chapter {
  project_id: string;
  title: string;
  total_words: number;
  sections: ChapterSection[];
  citations: CitationProvenance[];
  status: string;
}

export interface FactCheckIssue {
  section_id: string;
  section_title: string;
  claim_text: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  sources_cited: string[];
  suggested_revision?: string;
}

export interface FactCheckReport {
  project_id: string;
  total_claims_analyzed: number;
  verified_claims_count: number;
  warnings_count: number;
  issues: FactCheckIssue[];
  status?: string;
}

export interface Settings {
  llm_provider: string;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  default_model: string;
  default_citation_style: string;
  default_language: string;
  available_providers: string[];
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PdfValidation {
  passed: boolean;
  total_pages: number;
  word_count: number;
  checks: ValidationCheck[];
  summary: string;
}
