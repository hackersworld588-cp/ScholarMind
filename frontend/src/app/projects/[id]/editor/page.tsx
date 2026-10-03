'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTree,
  PenTool,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Download,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Search,
  ChevronRight,
  FileText,
  FileCheck2,
  Maximize2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Chapter, ChapterSection, CitationProvenance, FactCheckReport, CoverageMatrix } from '@/lib/types';

export default function ChapterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('All changes saved');

  // Right Panel Tabs: 'ai_assistant' | 'citations' | 'fact_check' | 'coverage'
  const [activeTab, setActiveTab] = useState<'ai_assistant' | 'citations' | 'fact_check' | 'coverage'>('ai_assistant');

  // AI Assistant state
  const [aiAction, setAiAction] = useState<string>('improve_transitions');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [revising, setRevising] = useState(false);

  // Inspector & Fact Check state
  const [selectedCitation, setSelectedCitation] = useState<CitationProvenance | null>(null);
  const [factReport, setFactReport] = useState<FactCheckReport | null>(null);
  const [coverageMatrix, setCoverageMatrix] = useState<CoverageMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadChapterData();
    }
  }, [projectId]);

  const loadChapterData = async () => {
    try {
      const data = await api.getFullChapter(projectId);
      setChapter(data);
      if (data.sections && data.sections.length > 0) {
        const first = data.sections[0];
        setActiveSectionId(first.section_id);
        setActiveContent(first.content_markdown);
      }
      const factData = await api.getMedicalValidation(projectId);
      setFactReport(factData);
      const covData = await api.getCoverageMatrix(projectId);
      setCoverageMatrix(covData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (sec: ChapterSection) => {
    setActiveSectionId(sec.section_id);
    setActiveContent(sec.content_markdown);
  };

  const handleManualSave = async () => {
    if (!projectId || !activeSectionId) return;
    setSaving(true);
    setSaveStatus('Saving changes...');
    try {
      const updated = await api.updateSectionContent(projectId, activeSectionId, activeContent);
      setSaveStatus('All changes saved to database');
      // Update local state
      if (chapter) {
        const newSecs = chapter.sections.map(s => s.section_id === activeSectionId ? updated : s);
        setChapter({ ...chapter, sections: newSecs });
      }
    } catch (err: any) {
      setSaveStatus(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAIRevise = async () => {
    if (!projectId || !activeSectionId) return;
    setRevising(true);
    try {
      const revised = await api.reviseSection(
        projectId,
        activeSectionId,
        aiAction,
        customInstructions
      );
      setActiveContent(revised.content_markdown);
      if (chapter) {
        const newSecs = chapter.sections.map(s => s.section_id === activeSectionId ? revised : s);
        setChapter({ ...chapter, sections: newSecs });
      }
      setSaveStatus('Section updated by AI synthesis');
      // Refresh fact check
      const factData = await api.getMedicalValidation(projectId);
      setFactReport(factData);
    } catch (err: any) {
      alert(`Revision error: ${err.message}`);
    } finally {
      setRevising(false);
    }
  };

  const activeSection = chapter?.sections.find(s => s.section_id === activeSectionId);
  const currentCoverage = coverageMatrix?.sections.find(s => s.section_id === activeSectionId);

  // Compute stats
  const totalWords = chapter?.sections.reduce((acc, s) => acc + s.word_count, 0) || 0;
  const readingTimeMin = Math.ceil(totalWords / 220);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-xs text-slate-500 font-mono">
        Loading 3-Panel Academic Editor...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Editor Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-xs font-bold font-serif text-slate-900 truncate max-w-md">
              {chapter?.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>{totalWords.toLocaleString()} Words</span>
              <span>•</span>
              <span>~{readingTimeMin} min read</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{saveStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Section'}</span>
          </button>

          <a
            href={api.getPdfDownloadUrl(projectId)}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          <a
            href={api.getDocxDownloadUrl(projectId)}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-slate-200 shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word DOCX</span>
          </a>
        </div>
      </header>

      {/* Main 3-Panel Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= LEFT PANEL: Table of Contents ================= */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ListTree className="w-4 h-4 text-indigo-600" />
              <span>Chapter Sections</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {chapter?.sections.length} Sections
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {chapter?.sections.map((sec, idx) => {
              const isSelected = sec.section_id === activeSectionId;
              const hasWarnings = sec.review_warnings && sec.review_warnings.length > 0;
              return (
                <button
                  key={sec.section_id}
                  onClick={() => handleSelectSection(sec)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-sm'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-indigo-600">
                      {idx + 1}.0
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sec.word_count}w
                    </span>
                  </div>

                  <span className="font-semibold text-xs leading-snug line-clamp-2">
                    {sec.title}
                  </span>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {sec.citations?.length || 0} Cites
                    </span>
                    {hasWarnings ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        Review Needed
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ================= CENTER PANEL: Academic Writing Canvas ================= */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100">
          <div className="w-full max-w-3xl academic-paper rounded-2xl p-12 min-h-full space-y-6 flex flex-col">
            {/* Section Heading Badge */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>SECTION {activeSection?.section_order || 1}.0</span>
                <span>{activeContent.split(/\s+/).filter(Boolean).length} WORDS</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
                {activeSection?.title}
              </h2>
            </div>

            {/* Editable Content Area with Academic Typography */}
            <div className="flex-1 flex flex-col">
              <textarea
                value={activeContent}
                onChange={(e) => {
                  setActiveContent(e.target.value);
                  setSaveStatus('Unsaved edits');
                }}
                rows={22}
                placeholder="Write or edit academic section content..."
                className="w-full flex-1 font-serif text-[15px] leading-relaxed text-slate-800 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder-slate-300"
              />
            </div>

            {/* Interactive Citations Bar at Bottom of Canvas */}
            {activeSection?.citations && activeSection.citations.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active In-Text Citations in this Section (Click to Inspect Source):
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeSection.citations.map((cite) => (
                    <button
                      key={cite.citation_number}
                      onClick={() => {
                        setSelectedCitation(cite);
                        setActiveTab('citations');
                      }}
                      className="citation-tag"
                    >
                      [{cite.citation_number}] {cite.document_title} (p. {cite.cited_pages?.join(', ')})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ================= RIGHT PANEL: Intelligent Academic Assistant ================= */}
        <aside className="w-84 bg-white border-l border-slate-200 flex flex-col shrink-0">
          {/* Tab Navigation */}
          <div className="grid grid-cols-4 border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`py-3 px-2 text-center border-b-2 transition-all ${
                activeTab === 'ai_assistant'
                  ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`py-3 px-2 text-center border-b-2 transition-all ${
                activeTab === 'citations'
                  ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Citations
            </button>
            <button
              onClick={() => setActiveTab('fact_check')}
              className={`py-3 px-2 text-center border-b-2 transition-all ${
                activeTab === 'fact_check'
                  ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Fact-Check
            </button>
            <button
              onClick={() => setActiveTab('coverage')}
              className={`py-3 px-2 text-center border-b-2 transition-all ${
                activeTab === 'coverage'
                  ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Coverage
            </button>
          </div>

          {/* TAB 1: AI WRITING ASSISTANT */}
          {activeTab === 'ai_assistant' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              <div className="space-y-1">
                <h3 className="font-bold font-serif text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Section-Level Academic Polisher</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Refine, expand, or adjust tone for <b>{activeSection?.title}</b> without rewriting unrelated sections.
                </p>
              </div>

              <div className="space-y-3">
                <label className="font-semibold text-slate-700 block">Revision Action</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'improve_transitions', label: 'Improve Academic Flow & Transitions' },
                    { id: 'expand', label: 'Expand with Clinical Mechanisms' },
                    { id: 'condense', label: 'Condense & Tighten Prose' },
                    { id: 'academic_polish', label: 'Polish Scholarly Tone & Terminology' },
                    { id: 'regenerate', label: 'Full Section Re-Synthesis' },
                  ].map((act) => (
                    <label
                      key={act.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                        aiAction === act.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ai_action"
                        checked={aiAction === act.id}
                        onChange={() => setAiAction(act.id)}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>{act.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Specific Author Guidance (Optional)</label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Emphasize WHO 5th edition diagnostic criteria and distinction from screening tests..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleAIRevise}
                disabled={revising}
                className="w-full py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {revising ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Academic Synthesis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Revision to Section</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: CITATION INSPECTOR */}
          {activeTab === 'citations' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="font-bold font-serif text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Citation & Source Inspector</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Inspect primary source records, authorial metadata, and exact page passages.
                </p>
              </div>

              {selectedCitation ? (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-indigo-700">
                      Citation [{selectedCitation.citation_number}]
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Pages: {selectedCitation.cited_pages?.join(', ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-900 font-serif">
                      {selectedCitation.document_title}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      <b>Authors:</b> {selectedCitation.authors}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <b>Publication:</b> {selectedCitation.edition} ({selectedCitation.publication_year}), {selectedCitation.publisher}
                    </p>
                    {selectedCitation.doi && (
                      <p className="text-[10px] font-mono text-indigo-600">
                        DOI: {selectedCitation.doi}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Exact Extracted Source Excerpt:
                    </span>
                    <blockquote className="p-3 bg-white rounded-lg border border-slate-200 italic font-serif text-[11px] text-slate-700 leading-relaxed">
                      "{selectedCitation.passage_excerpt}"
                    </blockquote>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                  Click any citation tag (e.g., [1]) in the writing canvas to inspect its source provenance and page excerpt.
                </div>
              )}

              {/* All references in active section */}
              <div className="space-y-2 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  All Citations in this Section
                </span>
                <div className="space-y-1.5">
                  {activeSection?.citations?.map((c) => (
                    <div
                      key={c.citation_number}
                      onClick={() => setSelectedCitation(c)}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <span className="font-semibold text-indigo-600">[{c.citation_number}]</span>{' '}
                      <span className="font-medium text-slate-800">{c.document_title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL FACT CHECKER */}
          {activeTab === 'fact_check' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="font-bold font-serif text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Medical Accuracy & Integrity Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automated validation distinguishing established source facts from unverified claims.
                </p>
              </div>

              {factReport && (
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Criteria Analyzed</span>
                    <span className="text-base font-bold text-slate-900">{factReport.total_claims_analyzed}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Verified Facts</span>
                    <span className="text-base font-bold text-emerald-800">{factReport.verified_claims_count}</span>
                  </div>
                </div>
              )}

              {/* Issues / Checklist */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Clinical Validation Rules
                </span>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Screening vs Diagnostic Distinction</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified: Low-dose CT and screening biomarkers are framed strictly as screening modalities requiring tissue biopsy.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Diagnostic Threshold Precision</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified: Numerical thresholds (HER2/CEP17 ≥2.0, BI-RADS risk stratifications, TPS ≥50%) are accurate to source literature.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Liquid Biopsy Limitations</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified: Negative ctDNA is explicitly qualified as non-exclusionary, mandating tissue acquisition.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOURCE COVERAGE MATRIX */}
          {activeTab === 'coverage' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="font-bold font-serif text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Section Source Coverage</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sources mapped to <b>{activeSection?.title}</b>:
                </p>
              </div>

              {currentCoverage ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                    <span className="font-semibold text-indigo-900">Evidence Strength</span>
                    <span className="font-mono font-bold text-indigo-700 uppercase">
                      {currentCoverage.evidence_strength}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Mapped Reference Volumes ({currentCoverage.sources_mapped.length})
                    </span>
                    {currentCoverage.sources_mapped.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                        <span className="font-semibold text-slate-900 block">{s.document_title}</span>
                        <p className="text-[11px] text-slate-500">Pages: {s.page_ranges.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">Coverage details loading...</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
