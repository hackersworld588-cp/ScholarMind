'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Edit2, Trash2, ExternalLink, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { ReferenceDocument, Project } from '@/lib/types';

export default function ReferencesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ReferenceDocument | null>(null);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editAuthors, setEditAuthors] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editEdition, setEditEdition] = useState('');

  useEffect(() => {
    api.getProjects().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
        loadDocs(projs[0].id);
      }
    });
  }, []);

  const loadDocs = async (pId: string) => {
    try {
      const docs = await api.getDocuments(pId);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectChange = (pId: string) => {
    setSelectedProjectId(pId);
    loadDocs(pId);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedProjectId) return;
    setSearching(true);
    try {
      const res = await api.searchDocuments(selectedProjectId, searchQuery);
      setSearchResults(res.results || []);
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const startEdit = (doc: ReferenceDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || '');
    setEditAuthors(doc.authors || '');
    setEditYear(doc.publication_year || '');
    setEditPublisher(doc.publisher || '');
    setEditEdition(doc.edition || '');
  };

  const handleSaveMetadata = async () => {
    if (!editingDoc) return;
    try {
      const updated = await api.updateDocumentMetadata(editingDoc.id, {
        title: editTitle,
        authors: editAuthors,
        publication_year: editYear,
        publisher: editPublisher,
        edition: editEdition,
      });
      setDocuments(documents.map(d => d.id === editingDoc.id ? updated : d));
      setEditingDoc(null);
    } catch (err: any) {
      alert(`Failed to save metadata: ${err.message}`);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Remove "${title}" from reference library?`)) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">Reference Library & Source Metadata</h1>
        <p className="text-xs text-slate-500 mt-1">Manage bibliographic metadata and perform hybrid full-text search across all ingested volumes.</p>
      </div>

      {/* Project Selector & Search Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Filter by Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms, biomarkers, genes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Search Results if any */}
      {searchResults.length > 0 && (
        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-serif text-indigo-900">
              Search Results for "{searchQuery}" ({searchResults.length} Passages Found)
            </h3>
            <button
              onClick={() => setSearchResults([])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {searchResults.map((r, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-indigo-700 font-semibold">
                  <span>{r.document_title}</span>
                  <span>Page {r.page_number}</span>
                </div>
                <p className="text-slate-700 font-sans">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Indexed Volumes ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No reference documents loaded for this project.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-xs">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 font-serif">{doc.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {doc.edition || 'Standard Edition'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.page_count} Pages
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <b>Authors:</b> {doc.authors} • <b>Year:</b> {doc.publication_year} • <b>Publisher:</b> {doc.publisher}
                  </p>
                  {doc.doi && (
                    <p className="text-[10px] font-mono text-indigo-600">
                      DOI: {doc.doi}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title || doc.filename)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-elevation max-w-lg w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold font-serif text-slate-900 text-sm">Edit Bibliographic Metadata</h4>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Document / Book Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Authors / Editors</label>
                <input
                  type="text"
                  value={editAuthors}
                  onChange={(e) => setEditAuthors(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Publication Year</label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Edition</label>
                  <input
                    type="text"
                    value={editEdition}
                    onChange={(e) => setEditEdition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Publisher</label>
                <input
                  type="text"
                  value={editPublisher}
                  onChange={(e) => setEditPublisher(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetadata}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
