'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  Sparkles,
  Download,
  Copy,
  Check,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Key,
  Cpu,
  GraduationCap,
  Stethoscope,
  BookText,
  Zap,
  HelpCircle,
  ChevronRight,
  Camera,
  Smartphone
} from 'lucide-react';
import { api, BACKEND_URL } from '@/lib/api';
import { Settings } from '@/lib/types';
import ApiKeyModal from '@/components/ApiKeyModal';
import { ChapterCopilot } from '@/components/ChapterCopilot';

interface UploadedImageItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  previewUrl: string;
  bookLabel: string;
}

export default function SynthesizerPage() {
  const [topic, setTopic] = useState('Diagnosis of Various Types of Cancer');
  const [writingStyle, setWritingStyle] = useState('Natural Academic / Clinical Specialist');
  const [customInstructions, setCustomInstructions] = useState('');
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [useSampleCorpus, setUseSampleCorpus] = useState(false);

  // Settings & API Key modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeSettings, setActiveSettings] = useState<Settings | null>(null);

  // File & Camera input refs for mobile and desktop
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthesizing status
  const [generating, setGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [generatedChapter, setGeneratedChapter] = useState<any>(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');

  // UI helpers
  const [copied, setCopied] = useState(false);
  const [showRawExtracts, setShowRawExtracts] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string>('http://10.184.122.158:3000');

  // Load existing settings and network info on mount
  useEffect(() => {
    api.getSettings()
      .then((s) => setActiveSettings(s))
      .catch((err) => console.warn('Could not fetch settings:', err));

    api.getNetworkInfo()
      .then((info) => {
        if (info?.mobile_url) setMobileUrl(info.mobile_url);
      })
      .catch(() => {
        if (typeof window !== 'undefined' && window.location.hostname) {
          setMobileUrl(`http://${window.location.hostname}:3000`);
        }
      });
  }, []);

  // Load sample book images for 1-click test
  const handleLoadSampleImages = () => {
    setUseSampleCorpus(true);
    setImages([
      {
        id: 'sample_1',
        name: 'book1_devita_cancer_principles.png',
        size: 142000,
        previewUrl: `${BACKEND_URL}/static/samples/book1_devita_cancer_principles.png`,
        bookLabel: 'Reference Book 1: DeVita Oncology (11th Ed.)'
      },
      {
        id: 'sample_2',
        name: 'book2_robbins_pathology.png',
        size: 156000,
        previewUrl: `${BACKEND_URL}/static/samples/book2_robbins_pathology.png`,
        bookLabel: 'Reference Book 2: Robbins Pathology (10th Ed.)'
      },
      {
        id: 'sample_3',
        name: 'book3_nccn_guidelines.png',
        size: 138000,
        previewUrl: `${BACKEND_URL}/static/samples/book3_nccn_guidelines.png`,
        bookLabel: 'Reference Book 3: NCCN Clinical Guidelines (2024)'
      }
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUseSampleCorpus(false);

    const newItems: UploadedImageItem[] = files.map((f, idx) => {
      const bookNum = images.length + idx + 1;
      return {
        id: `img_${Date.now()}_${idx}`,
        file: f,
        name: f.name,
        size: f.size,
        previewUrl: URL.createObjectURL(f),
        bookLabel: `Reference Book ${bookNum}: ${f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`
      };
    });

    setImages(prev => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSynthesize = async () => {
    if (images.length === 0 && !useSampleCorpus) {
      alert('Please upload 2-3 book page images or click "Load 3 Reference Book Images".');
      return;
    }

    setGenerating(true);
    setProgressStage('Extracting text from book page images via Vision/OCR...');

    try {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('writing_style', writingStyle);
      if (customInstructions) {
        formData.append('custom_instructions', customInstructions);
      }

      if (activeSettings?.llm_provider) {
        formData.append('provider', activeSettings.llm_provider);
      }

      if (useSampleCorpus) {
        formData.append('use_sample_corpus', 'true');
      } else {
        images.forEach(img => {
          if (img.file) {
            formData.append('files', img.file);
          }
        });
      }

      setTimeout(() => {
        setProgressStage('Cross-referencing evidence and tailoring to selected writing style...');
      }, 700);

      setTimeout(() => {
        setProgressStage('Authoring fresh, original human-written chapter...');
      }, 1400);

      const result = await api.synthesizeFromImages(formData);
      setGeneratedChapter(result);
      setEditableMarkdown(result.chapter_markdown);
    } catch (err: any) {
      alert(`Synthesis failed: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgressStage('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!generatedChapter) return;
    setDownloadingPdf(true);
    try {
      const blob = await api.downloadChapterPdf(
        generatedChapter.title,
        topic,
        editableMarkdown
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ScholarMind_${topic.replace(/\s+/g, '_')}_Chapter.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!generatedChapter) return;
    setDownloadingDocx(true);
    try {
      const blob = await api.downloadChapterDocx(
        generatedChapter.title,
        topic,
        editableMarkdown
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ScholarMind_${topic.replace(/\s+/g, '_')}_Chapter.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`DOCX download failed: ${err.message}`);
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Helper for style description card
  const getStyleDetails = (style: string) => {
    if (style.includes('Student')) {
      return {
        icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
        badge: 'Student & Resident Mode',
        color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
        description: 'Didactic & clear: includes the 3 cardinal rules, a step-by-step clinical case vignette, high-yield memory aids/mnemonics (e.g. CK7/CK20 hooks), and the Top 5 Board Exam Traps.'
      };
    } else if (style.includes('Concise') || style.includes('High-Yield')) {
      return {
        icon: <Zap className="w-4 h-4 text-amber-600" />,
        badge: 'High-Yield Clinical Summary Mode',
        color: 'border-amber-200 bg-amber-50/60 text-amber-900',
        description: 'Rapid on-call triage: 0 fluff, numbered diagnostic action checklist, critical numerical cut-offs card (HER2 ≥2.0, BI-RADS 4/5), lineage cheat sheet, and 🚨 red flag warnings.'
      };
    } else if (style.includes('Nursing') || style.includes('Comprehensive') || style.includes('Textbook')) {
      return {
        icon: <BookText className="w-4 h-4 text-blue-600" />,
        badge: 'Comprehensive Nursing Textbook Mode (ADPIE & Care Pathways)',
        color: 'border-blue-200 bg-blue-50/60 text-blue-900',
        description: 'Brunner & Suddarth benchmark: Clinical nursing pathophysiology, ADPIE Nursing Process, NANDA-I priority diagnoses, evidence-based nursing interventions with clinical rationales (NIC), and patient discharge care continuum.'
      };
    } else {
      return {
        icon: <Stethoscope className="w-4 h-4 text-indigo-600" />,
        badge: 'Clinical Specialist Practice Mode',
        color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
        description: 'Advanced bedside practice: clinical dilemmas (CNB vs FNA tradeoffs), discordant imaging resolution, algorithmic IHC for unknown primary, and multidisciplinary tumor board (MDT) protocols.'
      };
    }
  };

  const styleInfo = getStyleDetails(writingStyle);

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Mobile Wi-Fi Access Banner */}
      <div className="p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
          <span><b>Use on Phone:</b> Connect phone to the same Wi-Fi and open:</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-white/90 px-2 py-0.5 rounded border border-indigo-200 font-mono font-bold text-indigo-700 text-[11px] select-all">
            {mobileUrl}
          </code>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(mobileUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Top Bar: Title & Connected API Key Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/80">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>ScholarMind AI — Multi-Book Image Synthesizer</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-slate-900 tracking-tight leading-snug">
            Turn 2–3 Book Page Photos into a Fresh Human Chapter
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Upload page photos from 2–3 reference books. AI reads the pages, cross-references evidence, and writes a completely fresh, original chapter.
          </p>
        </div>

        {/* API Key Connection Pill */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all text-xs font-semibold text-slate-700 hover:border-indigo-300"
          >
            {activeSettings?.has_gemini_key ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-800">Gemini Connected</span>
                <span className="text-[10px] text-slate-400 font-mono">({activeSettings.default_model})</span>
              </>
            ) : activeSettings?.has_openai_key ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-800">OpenAI Connected</span>
                <span className="text-[10px] text-slate-400 font-mono">({activeSettings.default_model})</span>
              </>
            ) : activeSettings?.has_anthropic_key ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-800">Claude Connected</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-amber-700 font-semibold">Connect API Key</span>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
                  Gemini / OpenAI
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Input Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-subtle space-y-5 sm:space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chapter Topic / Subject
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
              <span>Quick:</span>
              <button
                type="button"
                onClick={() => setTopic('Diagnosis of Various Types of Cancer')}
                className="hover:text-indigo-600 underline"
              >
                Cancer Diagnosis
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTopic('Cardiovascular Diagnostic Pathways')}
                className="hover:text-indigo-600 underline"
              >
                Cardiology
              </button>
            </div>
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Diagnosis of Various Types of Cancer"
            className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Options Row: Writing Style & Custom Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Writing Style & Persona</span>
              <span className="text-[11px] text-indigo-600 font-normal">Outputs vary distinctly!</span>
            </label>
            <select
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
            >
              <option>Natural Academic / Clinical Specialist</option>
              <option>Comprehensive Nursing Textbook Style</option>
              <option>Clear & Engaging Student Reference</option>
              <option>Concise High-Yield Clinical Summary</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Author Notes (Optional)</label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Highlight CNB vs FNA tradeoffs and IHC algorithms"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Dynamic Style Persona Explanation Card */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${styleInfo.color}`}>
          <div className="shrink-0 mt-0.5">{styleInfo.icon}</div>
          <div className="space-y-0.5">
            <div className="font-bold text-[11px] uppercase tracking-wider">{styleInfo.badge}</div>
            <p className="leading-relaxed opacity-95">{styleInfo.description}</p>
          </div>
        </div>

        {/* Image Upload Action Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Reference Book Page Images ({images.length} Selected)
            </label>
            <button
              type="button"
              onClick={handleLoadSampleImages}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>⚡ Load 3 Reference Book Images (Demo)</span>
            </button>
          </div>

          {/* Mobile Fast Action Buttons: Camera & File Upload */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">Take Photo (Camera)</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">Upload Images</span>
            </button>
          </div>

          {/* Hidden Inputs for Camera and File Browsing */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Desktop Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:block border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center bg-slate-50/50 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-1">
              <UploadCloud className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Or drag & drop page scans from Book 1, Book 2, and Book 3 here
            </p>
            <p className="text-[10px] text-slate-400">
              Supports JPG, PNG, WEBP photos of book pages or PDF scans
            </p>
          </div>

          {/* Image Thumbnails List */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm flex items-center justify-between gap-3 relative group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-11 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-xs text-slate-800 truncate">{img.bookLabel}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(img.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleSynthesize}
            disabled={generating}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{progressStage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize & Write Fresh Human Chapter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULT SECTION: Synthesized Academic Chapter */}
      {generatedChapter && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden space-y-6 animate-in fade-in duration-300">
          {/* Header Action Bar */}
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                  ✓ Fresh Human Chapter Written
                </span>
                {generatedChapter.engine_info && (
                  <span className="text-[10px] sm:text-[11px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800 px-2 py-0.5 rounded">
                    ⚡ {generatedChapter.engine_info}
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                  {generatedChapter.writing_style}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-white">
                {generatedChapter.title}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 font-mono flex-wrap">
                <span>{generatedChapter.word_count.toLocaleString()} Words</span>
                <span>•</span>
                <span>~{generatedChapter.reading_time_minutes} min read</span>
                <span>•</span>
                <span>{generatedChapter.source_books_count} Reference Books</span>
              </div>
            </div>

            {/* Mobile-Optimized Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Publication'}</span>
              </button>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleDownloadDocx}
                  disabled={downloadingDocx}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{downloadingDocx ? 'Generating...' : 'Word DOCX'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Raw Book Extracts */}
          <div className="px-4 sm:px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
              Complete Academic Chapter
            </span>
            <button
              onClick={() => setShowRawExtracts(!showRawExtracts)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showRawExtracts ? 'Hide' : 'Inspect'} Notes Extracted from Book Images</span>
            </button>
          </div>

          {/* Raw Extracts Inspector Drawer */}
          {showRawExtracts && generatedChapter.raw_extracts && (
            <div className="mx-3.5 sm:mx-8 p-3.5 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold font-serif text-slate-900">
                Evidence Extracted from Uploaded Book Scans:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {generatedChapter.raw_extracts.map((ext: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-mono font-bold text-indigo-600 block text-[11px]">
                      {ext.book_label}
                    </span>
                    <p className="text-[11px] text-slate-600 font-mono line-clamp-6 leading-relaxed">
                      {ext.extracted_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Content Canvas */}
          <div className="px-3.5 sm:px-8 pb-4 sm:pb-6">
            <div className="academic-paper rounded-xl sm:rounded-2xl p-3.5 sm:p-8 md:p-10 border border-slate-100">
              <textarea
                value={editableMarkdown}
                onChange={(e) => setEditableMarkdown(e.target.value)}
                rows={22}
                className="w-full font-serif text-xs sm:text-[15px] leading-relaxed text-slate-800 bg-transparent resize-y focus:outline-none placeholder-slate-300"
              />
            </div>
          </div>

          {/* AI Chapter Copilot & Refinement Chatbot */}
          <div className="px-3.5 sm:px-8 pb-6 sm:pb-10">
            <ChapterCopilot
              currentChapter={editableMarkdown}
              topic={topic}
              writingStyle={writingStyle}
              onApplyChapter={(newMarkdown) => {
                setEditableMarkdown(newMarkdown);
                setGeneratedChapter((prev: any) => ({
                  ...prev,
                  chapter_markdown: newMarkdown,
                  word_count: newMarkdown.split(/\s+/).filter(Boolean).length
                }));
              }}
              onAppendChapter={(additionalMarkdown) => {
                const combined = `${editableMarkdown}\n\n${additionalMarkdown}`;
                setEditableMarkdown(combined);
                setGeneratedChapter((prev: any) => ({
                  ...prev,
                  chapter_markdown: combined,
                  word_count: combined.split(/\s+/).filter(Boolean).length
                }));
              }}
              connectedModelName={
                activeSettings?.has_gemini_key
                  ? `Gemini (${activeSettings.default_model})`
                  : activeSettings?.has_openai_key
                  ? `OpenAI (${activeSettings.default_model})`
                  : activeSettings?.has_anthropic_key
                  ? 'Claude Sonnet'
                  : 'ScholarMind Local Engine'
              }
            />
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSettingsSaved={(newSettings) => setActiveSettings(newSettings)}
      />
    </div>
  );
}
