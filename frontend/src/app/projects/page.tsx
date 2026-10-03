'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  FilePlus2,
  Search,
  BookOpen,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateProject(id);
      loadProjects();
    } catch (err: any) {
      alert(`Could not duplicate project: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Could not delete project: ${err.message}`);
    }
  };

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.topic.toLowerCase().includes(search.toLowerCase()) ||
    p.discipline.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">Academic Chapter Projects</h1>
          <p className="text-xs text-slate-500 mt-1">Manage, duplicate, edit, or publish your book chapters</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>New Chapter Wizard</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-subtle max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, topic, or academic discipline..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
      </div>

      {/* Projects Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-xs text-slate-500">
          Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">No projects found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {proj.discipline}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Step {proj.current_step} / 5
                  </span>
                </div>

                <h3 className="font-serif font-bold text-slate-900 text-base line-clamp-2 leading-snug">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {proj.topic}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                    Target: {proj.target_word_count.toLocaleString()} words
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                    Style: {proj.citation_style.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                    {proj.document_count || 0} References
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(proj.id)}
                    title="Duplicate Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id, proj.title)}
                    title="Delete Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {proj.current_step >= 4 ? (
                    <Link
                      href={`/projects/${proj.id}/editor`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Editor</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/projects/new?step=${proj.current_step}&projectId=${proj.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <span>Resume</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
