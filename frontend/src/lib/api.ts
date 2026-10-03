import {
  Project, ReferenceDocument, Outline, CoverageMatrix,
  ResearchBrief, ChapterSection, Chapter, CitationProvenance,
  FactCheckReport, Settings, PdfValidation
} from './types';

export type { Settings };

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin
    : 'http://127.0.0.1:8000');

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8000/api');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      detail = parsed.detail || errorText;
    } catch {}
    throw new Error(detail || `HTTP Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    return handleResponse<Project[]>(res);
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    return handleResponse<Project>(res);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async duplicateProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}/duplicate`, { method: 'POST' });
    return handleResponse<Project>(res);
  },

  // Documents
  async getDocuments(projectId: string): Promise<ReferenceDocument[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/documents`);
    return handleResponse<ReferenceDocument[]>(res);
  },

  async getDocumentDetails(docId: string): Promise<ReferenceDocument & { chunks: any[] }> {
    const res = await fetch(`${API_BASE}/documents/${docId}`);
    return handleResponse<ReferenceDocument & { chunks: any[] }>(res);
  },

  async uploadDocuments(projectId: string, files: File[]): Promise<ReferenceDocument[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_BASE}/projects/${projectId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ReferenceDocument[]>(res);
  },

  async loadSampleCorpus(projectId: string): Promise<ReferenceDocument[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/documents/load-sample-corpus`, {
      method: 'POST',
    });
    return handleResponse<ReferenceDocument[]>(res);
  },

  async updateDocumentMetadata(docId: string, meta: Partial<ReferenceDocument>): Promise<ReferenceDocument> {
    const res = await fetch(`${API_BASE}/documents/${docId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    return handleResponse<ReferenceDocument>(res);
  },

  async deleteDocument(docId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async searchDocuments(projectId: string, query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/documents/search?q=${encodeURIComponent(query)}`);
    return handleResponse<any>(res);
  },

  // Outline
  async generateOutline(projectId: string, customInstructions?: string): Promise<Outline> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/outline/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, custom_instructions: customInstructions }),
    });
    return handleResponse<Outline>(res);
  },

  async getOutline(projectId: string): Promise<Outline> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/outline`);
    return handleResponse<Outline>(res);
  },

  async updateOutline(projectId: string, data: { title: string; sections: any[]; approved: boolean }): Promise<Outline> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/outline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Outline>(res);
  },

  async getCoverageMatrix(projectId: string): Promise<CoverageMatrix> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/coverage-matrix`);
    return handleResponse<CoverageMatrix>(res);
  },

  async getSectionBrief(projectId: string, sectionId: string): Promise<ResearchBrief> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/briefs/${sectionId}`);
    return handleResponse<ResearchBrief>(res);
  },

  // Chapter & Writing
  async draftSection(projectId: string, sectionId: string, customGuidance?: string): Promise<ChapterSection> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sections/${sectionId}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_guidance: customGuidance }),
    });
    return handleResponse<ChapterSection>(res);
  },

  async reviseSection(
    projectId: string,
    sectionId: string,
    action: string,
    instructions?: string,
    selectedText?: string
  ): Promise<ChapterSection> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sections/${sectionId}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, instructions, selected_text: selectedText }),
    });
    return handleResponse<ChapterSection>(res);
  },

  async updateSectionContent(projectId: string, sectionId: string, contentMarkdown: string): Promise<ChapterSection> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_markdown: contentMarkdown }),
    });
    return handleResponse<ChapterSection>(res);
  },

  async generateAllSections(projectId: string): Promise<{ success: boolean; drafted_count: number }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/generate-all`, { method: 'POST' });
    return handleResponse<{ success: boolean; drafted_count: number }>(res);
  },

  async getFullChapter(projectId: string): Promise<Chapter> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chapter`);
    return handleResponse<Chapter>(res);
  },

  async getMedicalValidation(projectId: string): Promise<FactCheckReport> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/medical-validation`);
    return handleResponse<FactCheckReport>(res);
  },

  async getCitations(projectId: string): Promise<{ project_id: string; style: string; references: any[] }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/citations`);
    return handleResponse<{ project_id: string; style: string; references: any[] }>(res);
  },

  async getCitationProvenance(projectId: string, citationNumber: number): Promise<CitationProvenance> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/citations/${citationNumber}/provenance`);
    return handleResponse<CitationProvenance>(res);
  },

  // Export
  async exportPdf(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/pdf`, { method: 'POST' });
    return handleResponse<any>(res);
  },

  async exportDocx(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/docx`, { method: 'POST' });
    return handleResponse<any>(res);
  },

  getPdfDownloadUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/export/pdf`;
  },

  getDocxDownloadUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/export/docx`;
  },

  async getPdfValidation(projectId: string): Promise<PdfValidation> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/validation`);
    return handleResponse<PdfValidation>(res);
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<Settings>(res);
  },

  async updateSettings(settings: Partial<Settings & { gemini_api_key?: string; openai_api_key?: string; anthropic_api_key?: string }>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse<Settings>(res);
  },

  async testConnection(provider: string, apiKey?: string, model?: string): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    const res = await fetch(`${API_BASE}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey, model }),
    });
    return handleResponse<{ success: boolean; message: string; latency_ms?: number }>(res);
  },

  // Image-to-Chapter Synthesizer
  async getSampleBookImages(): Promise<{ samples: any[] }> {
    const res = await fetch(`${API_BASE}/sample-book-images`);
    return handleResponse<{ samples: any[] }>(res);
  },

  async synthesizeFromImages(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/synthesize-from-images`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<any>(res);
  },

  async downloadChapterPdf(title: string, topic: string, chapterMarkdown: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/download-chapter-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, topic, chapter_markdown: chapterMarkdown }),
    });
    if (!res.ok) throw new Error(`PDF generation failed: ${res.statusText}`);
    return res.blob();
  },

  async downloadChapterDocx(title: string, topic: string, chapterMarkdown: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/download-chapter-docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, topic, chapter_markdown: chapterMarkdown }),
    });
    if (!res.ok) throw new Error(`DOCX generation failed: ${res.statusText}`);
    return res.blob();
  },

  async getNetworkInfo(): Promise<{ local_ip: string; mobile_url: string; api_url: string }> {
    if (typeof window !== 'undefined' && window.location.origin) {
      const origin = window.location.origin;
      if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('10.') && !origin.includes('192.168.')) {
        return {
          local_ip: window.location.hostname,
          mobile_url: origin,
          api_url: `${origin}/api`,
        };
      }
    }
    try {
      const res = await fetch(`${API_BASE}/network-info`);
      if (res.ok) return await res.json();
    } catch {}
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
    return {
      local_ip: host,
      mobile_url: `http://${host}:3000`,
      api_url: `http://${host}:8000`,
    };
  },

  async chatEditChapter(data: {
    current_chapter: string;
    topic: string;
    user_instruction: string;
    conversation_history?: Array<{ role: string; content: string }>;
    writing_style?: string;
  }): Promise<{
    assistant_reply: string;
    updated_chapter?: string | null;
    suggested_action: 'replace_chapter' | 'insert_section' | 'answer_only';
    action_label?: string | null;
  }> {
    const res = await fetch(`${API_BASE}/chat-edit-chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }
};
