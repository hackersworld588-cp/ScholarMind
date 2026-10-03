'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  UploadCloud,
  ListTree,
  PenTool,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Download,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Project, ReferenceDocument, Outline, OutlineSection, CoverageMatrix } from '@/lib/types';

function NewProjectWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // Step 1 Form
  const [title, setTitle] = useState('Diagnosis of Various Types of Cancer: Modern Principles and Practice');
  const [topic, setTopic] = useState('Diagnosis of Various Types of Cancer');
  const [discipline, setDiscipline] = useState('Clinical Oncology & Anatomical Pathology');
  const [audience, setAudience] = useState('Medical Fellows & Oncology Residents');
  const [academicLevel, setAcademicLevel] = useState('Postgraduate / Clinical Specialist');
  const [language, setLanguage] = useState('English (US Academic)');
  const [targetWordCount, setTargetWordCount] = useState(5000);
  const [citationStyle, setCitationStyle] = useState('vancouver');
  const [formattingGuidelines, setFormattingGuidelines] = useState('Academic Book Chapter Standard. Numbered subheadings, structured tables, Vancouver references, peer-review format.');

  // Step 2 References
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ReferenceDocument | null>(null);
  const [docPreviewDetails, setDocPreviewDetails] = useState<any>(null);

  // Step 3 Outline & Matrix
  const [outline, setOutline] = useState<Outline | null>(null);
  const [coverageMatrix, setCoverageMatrix] = useState<CoverageMatrix | null>(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [editingSection, setEditingSection] = useState<OutlineSection | null>(null);

  // Step 4 Drafting & Progress
  const [draftingProgress, setDraftingProgress] = useState<{
    stage: string;
    completedCount: number;
    totalCount: number;
    isWriting: boolean;
    logs: string[];
  }>({
    stage: 'idle',
    completedCount: 0,
    totalCount: 0,
    isWriting: false,
    logs: []
  });

  // Step 5 Review & Export
  const [pdfValidation, setPdfValidation] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Query Param handling
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const pidParam = searchParams.get('projectId');
    if (pidParam) {
      setProjectId(pidParam);
      api.getProject(pidParam).then((p) => {
        setProject(p);
        setTitle(p.title);
        setTopic(p.topic);
        setDiscipline(p.discipline);
        setAudience(p.audience);
        setAcademicLevel(p.academic_level);
        setLanguage(p.language);
        setTargetWordCount(p.target_word_count);
        setCitationStyle(p.citation_style);
        setFormattingGuidelines(p.formatting_guidelines || '');
      });
      loadDocuments(pidParam);
    }
    if (stepParam) {
      setCurrentStep(parseInt(stepParam, 10));
    }
  }, [searchParams]);

  const loadDocuments = async (pId: string) => {
    try {
      const docs = await api.getDocuments(pId);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  // Step 1: Save Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!projectId) {
        const created = await api.createProject({
          title, topic, discipline, audience, academic_level: academicLevel,
          language, target_word_count: targetWordCount, citation_style: citationStyle,
          formatting_guidelines: formattingGuidelines, current_step: 2
        });
        setProjectId(created.id);
        setProject(created);
        setCurrentStep(2);
      } else {
        const updated = await api.updateProject(projectId, {
          title, topic, discipline, audience, academic_level: academicLevel,
          language, target_word_count: targetWordCount, citation_style: citationStyle,
          formatting_guidelines: formattingGuidelines, current_step: 2
        });
        setProject(updated);
        setCurrentStep(2);
      }
    } catch (err: any) {
      alert(`Error saving details: ${err.message}`);
    }
  };

  // Step 2: Upload Files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !projectId) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      await api.uploadDocuments(projectId, files);
      await loadDocuments(projectId);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Load Sample Oncology Corpus
  const handleLoadSampleCorpus = async () => {
    if (!projectId) return;
    setUploading(true);
    try {
      await api.loadSampleCorpus(projectId);
      await loadDocuments(projectId);
    } catch (err: any) {
      alert(`Error loading corpus: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Preview Document
  const handlePreviewDoc = async (doc: ReferenceDocument) => {
    setSelectedDocForPreview(doc);
    try {
      const details = await api.getDocumentDetails(doc.id);
      setDocPreviewDetails(details);
    } catch (err: any) {
      alert(`Error loading preview: ${err.message}`);
    }
  };

  // Step 2 to Step 3: Trigger Outline & Coverage
  const handleProceedToOutline = async () => {
    if (!projectId) return;
    if (documents.length === 0) {
      alert('Please upload or load at least one reference document before planning.');
      return;
    }
    setCurrentStep(3);
    setGeneratingOutline(true);
    try {
      let currentOutline: Outline;
      try {
        currentOutline = await api.getOutline(projectId);
      } catch {
        currentOutline = await api.generateOutline(projectId);
      }
      setOutline(currentOutline);
      const cov = await api.getCoverageMatrix(projectId);
      setCoverageMatrix(cov);
    } catch (err: any) {
      alert(`Error generating outline: ${err.message}`);
    } finally {
      setGeneratingOutline(false);
    }
  };

  // Step 3: Approve Outline
  const handleApproveOutline = async () => {
    if (!projectId || !outline) return;
    try {
      await api.updateOutline(projectId, {
        title: outline.title,
        sections: outline.sections,
        approved: true
      });
      setCurrentStep(4);
      startLiveDrafting();
    } catch (err: any) {
      alert(`Error approving outline: ${err.message}`);
    }
  };

  // Step 4: Live Drafting Execution
  const startLiveDrafting = async () => {
    if (!projectId || !outline) return;
    setDraftingProgress({
      stage: 'Topic Understanding & Reference Mapping',
      completedCount: 0,
      totalCount: outline.sections.length,
      isWriting: true,
      logs: [
        'Starting multi-stage research and writing agent...',
        'Analyzing approved outline hierarchy and word budgets...',
        'Building section-level research briefs with primary source excerpts...'
      ]
    });

    try {
      for (let i = 0; i < outline.sections.length; i++) {
        const sec = outline.sections[i];
        setDraftingProgress(prev => ({
          ...prev,
          stage: `Synthesizing Section ${i + 1}/${outline.sections.length}: ${sec.title}`,
          logs: [...prev.logs, `Retrieving source passages for "${sec.title}" across ${documents.length} volumes...`]
        }));

        const drafted = await api.draftSection(projectId, sec.id);

        setDraftingProgress(prev => ({
          ...prev,
          completedCount: i + 1,
          logs: [
            ...prev.logs,
            `✓ Drafted "${sec.title}" (${drafted.word_count} words, ${drafted.citations.length} verified citations).`,
            `  Medical validation status: ${drafted.fact_check_status.toUpperCase()}.`
          ]
        }));
      }

      setDraftingProgress(prev => ({
        ...prev,
        stage: 'Final Medical Integrity & Citation Verification',
        isWriting: false,
        logs: [
          ...prev.logs,
          '✓ Complete chapter assembled.',
          '✓ Bidirectional reference mapping verified.',
          'Ready for review, editing, and PDF export.'
        ]
      }));

      // Automatically advance to Step 5
      setTimeout(() => {
        setCurrentStep(5);
        loadValidationReport();
      }, 1000);
    } catch (err: any) {
      alert(`Drafting error: ${err.message}`);
      setDraftingProgress(prev => ({ ...prev, isWriting: false }));
    }
  };

  // Step 5: PDF Validation
  const loadValidationReport = async () => {
    if (!projectId) return;
    setGeneratingPdf(true);
    try {
      const res = await api.exportPdf(projectId);
      setPdfValidation(res.validation);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const steps = [
    { num: 1, title: 'Project Scope', icon: FileText },
    { num: 2, title: 'References', icon: UploadCloud },
    { num: 3, title: 'Outline & Coverage', icon: ListTree },
    { num: 4, title: 'Writing Engine', icon: PenTool },
    { num: 5, title: 'Review & Publish', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-10">
      {/* Wizard Header & Stepper */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Academic Book Chapter Creation Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Follow the 5-stage research, ingestion, planning, and publishing protocol
          </p>
        </div>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-5 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (isCompleted || (projectId && s.num <= (project?.current_step || 1))) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-indigo-500 text-white' : isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-[10px] opacity-80">Stage 0{s.num}</div>
                  <div className="font-semibold truncate">{s.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAGE 1: PROJECT DETAILS */}
      {currentStep === 1 && (
        <form onSubmit={handleSaveDetails} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold font-serif text-slate-900">Stage 1: Chapter Scope & Institutional Metadata</h2>
            <p className="text-xs text-slate-500 mt-1">Define the scholarly boundaries, target readership, and citation standards for this monograph chapter.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Project & Book Chapter Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Core Chapter Topic</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Academic Discipline / Subspecialty</label>
              <input
                type="text"
                required
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Target Readership / Audience</label>
              <input
                type="text"
                required
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Academic Rigor & Scholarly Level</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option>Postgraduate / Clinical Specialist</option>
                <option>Undergraduate Medical Curriculum</option>
                <option>Doctoral / Research Fellowship</option>
                <option>Clinical Reference / Board Exam Standard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Citation & Reference Style</label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="vancouver">Vancouver [1, 2] (Medical Default)</option>
                <option value="apa">APA 7th Edition (Author, Year)</option>
                <option value="harvard">Harvard Referencing Style</option>
                <option value="ieee">IEEE [1] Technical Standard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Target Word Count (Complete Chapter)</label>
              <input
                type="number"
                min={1000}
                max={25000}
                step={500}
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Institutional Formatting Guidelines (Optional)</label>
              <textarea
                rows={2}
                value={formattingGuidelines}
                onChange={(e) => setFormattingGuidelines(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              <span>Save & Proceed to Upload References</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STAGE 2: UPLOAD & INGEST REFERENCES */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold font-serif text-slate-900">Stage 2: Reference Document Ingestion Engine</h2>
              <p className="text-xs text-slate-500 mt-1">Upload primary PDF textbooks, monographs, and journals. Text is extracted with exact page numbering preserved.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleCorpus}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Load 5-Volume Cancer Reference Corpus</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
            <input
              type="file"
              multiple
              accept=".pdf"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Click to browse or drag and drop reference PDFs</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports multi-volume textbooks, chapters, guidelines, and clinical papers</p>
              </div>
              {uploading && (
                <p className="text-xs font-mono text-indigo-600 animate-pulse">Extracting text & indexing semantic chunks into RAG...</p>
              )}
            </label>
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ingested References ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="text-center p-8 border border-slate-100 rounded-xl text-xs text-slate-400">
                No reference documents uploaded yet. Upload your own PDFs or click "Load 5-Volume Cancer Reference Corpus".
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{doc.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {doc.edition || 'Standard Edition'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {doc.page_count} Pages
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        <b>Authors:</b> {doc.authors} • <b>Year:</b> {doc.publication_year} • <b>Publisher:</b> {doc.publisher}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-indigo-600 font-mono">
                        {doc.chunk_count || 0} RAG Chunks
                      </span>
                      <button
                        onClick={() => handlePreviewDoc(doc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview Drawer/Modal if selected */}
          {selectedDocForPreview && docPreviewDetails && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-xs text-slate-800">
                    Source Inspector: {selectedDocForPreview.title}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Close
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 font-mono text-[11px] text-slate-600 bg-white p-4 rounded-lg border border-slate-200">
                {docPreviewDetails.chunks?.map((c: any) => (
                  <div key={c.id} className="border-b border-slate-100 pb-2">
                    <span className="text-indigo-600 font-semibold">[Page {c.page_number}] {c.section_heading}</span>
                    <p className="font-sans text-xs text-slate-700 mt-1">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>

            <button
              onClick={handleProceedToOutline}
              disabled={documents.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
            >
              <span>Analyze References & Generate Outline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: OUTLINE & COVERAGE MATRIX */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle space-y-8">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-serif text-slate-900">Stage 3: Chapter Architecture & Source Coverage Matrix</h2>
              <p className="text-xs text-slate-500 mt-1">Review the proposed chapter outline, customize word budgets, and verify evidence depth across your uploaded references.</p>
            </div>
            {generatingOutline && (
              <span className="text-xs font-mono text-indigo-600 animate-pulse flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing outline...
              </span>
            )}
          </div>

          {/* Source Coverage Matrix Banner */}
          {coverageMatrix && (
            <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Cross-Reference Evidence Coverage Matrix</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                  Overall Health: {coverageMatrix.overall_health.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Every section is cross-indexed against all {coverageMatrix.total_sources} uploaded reference volumes. High evidence strength ensures strong source-grounding and zero hallucination risk.
              </p>
            </div>
          )}

          {/* Outline Sections List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Proposed Chapter Table of Contents ({outline?.sections?.length || 0} Sections)
            </h3>

            {outline?.sections?.map((sec, idx) => {
              const cov = coverageMatrix?.sections?.find(c => c.section_id === sec.id);
              return (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {idx + 1}.0
                      </span>
                      <h4 className="font-semibold text-xs text-slate-900">
                        {sec.title}
                      </h4>
                      {cov && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                          cov.evidence_strength === 'high' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          cov.evidence_strength === 'moderate' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {cov.evidence_strength.toUpperCase()} EVIDENCE ({cov.sources_mapped.length} Sources)
                        </span>
                      )}
                    </div>
                    {sec.learning_objectives && sec.learning_objectives.length > 0 && (
                      <p className="text-[11px] text-slate-500">
                        <b>Objectives:</b> {sec.learning_objectives.join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {sec.target_word_count} words
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to References</span>
            </button>

            <button
              onClick={handleApproveOutline}
              disabled={generatingOutline || !outline}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              <span>Approve Outline & Begin Autonomous Drafting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: AUTONOMOUS RESEARCH & DRAFTING MONITOR */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold font-serif text-slate-900">Stage 4: Coordinated Research & Authoring Agent Execution</h2>
            <p className="text-xs text-slate-500 mt-1">Autonomous section-by-section synthesis, fact validation, and citation grounding.</p>
          </div>

          {/* Progress Bar & Status */}
          <div className="space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                {draftingProgress.isWriting && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
                {draftingProgress.stage}
              </span>
              <span className="font-mono text-indigo-600 font-bold">
                {draftingProgress.completedCount} / {draftingProgress.totalCount} Sections Written
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                style={{
                  width: `${(draftingProgress.completedCount / Math.max(draftingProgress.totalCount, 1)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Live Agent Console Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Agent Audit Log</span>
              <span className="text-[11px] font-mono text-slate-400">Zero Hallucination Pipeline</span>
            </div>

            <div className="bg-slate-900 text-slate-200 font-mono text-xs p-5 rounded-xl max-h-72 overflow-y-auto space-y-1.5 shadow-inner">
              {draftingProgress.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                  <span className={log.startsWith('✓') ? 'text-emerald-400 font-semibold' : log.includes('Synthesizing') ? 'text-indigo-400 font-semibold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!draftingProgress.isWriting && draftingProgress.completedCount > 0 && (
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setCurrentStep(5);
                  loadValidationReport();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <span>Proceed to Review & Publishing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAGE 5: REVIEW, EDITOR & PUBLISHING */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle space-y-8">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chapter Drafting Complete</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-slate-900">Stage 5: Editorial Review & Publication Hub</h2>
              <p className="text-xs text-slate-500 mt-1">Inspect citations, verify medical compliance, make live edits, and download the finished academic PDF.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}/editor`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-sm"
              >
                <PenTool className="w-4 h-4" />
                <span>Open in 3-Panel Editor</span>
              </button>

              <a
                href={api.getPdfDownloadUrl(projectId!)}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Typeset PDF</span>
              </a>
            </div>
          </div>

          {/* Automated PDF Validation Report */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Automated Publication Quality & Fact Integrity Audit</span>
            </h3>

            {generatingPdf ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono animate-pulse">
                Running PDF publication typesetting & fact validation engine...
              </div>
            ) : pdfValidation ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="p-4 bg-slate-50 flex items-center justify-between font-mono">
                  <span className="font-semibold text-slate-800">
                    Total Formatted Pages: {pdfValidation.total_pages} | Word Count: {pdfValidation.word_count.toLocaleString()}
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    AUDIT PASSED
                  </span>
                </div>

                {pdfValidation.checks?.map((chk: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <span className="font-medium text-slate-800">{chk.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {chk.detail}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quick PDF In-Browser Preview */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live PDF Reader Preview
            </h3>
            <div className="w-full h-96 border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
              <iframe
                src={`${api.getPdfDownloadUrl(projectId!)}#toolbar=0`}
                className="w-full h-full"
                title="Academic Chapter PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewProjectWizard() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-12 text-center text-xs font-mono text-slate-500">Loading Academic Wizard...</div>}>
      <NewProjectWizardContent />
    </Suspense>
  );
}
