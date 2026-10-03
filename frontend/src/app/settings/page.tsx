'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Lock,
  Smartphone
} from 'lucide-react';
import { api } from '@/lib/api';
import { Settings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState<string>('gemini');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<string>('gemini-1.5-flash');
  const [defaultCitation, setDefaultCitation] = useState<string>('vancouver');
  const [defaultLanguage, setDefaultLanguage] = useState<string>('English (US Academic)');

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [mobileUrl, setMobileUrl] = useState<string>('http://10.184.122.158:3000');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
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

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setProvider(data.llm_provider);
      setDefaultModel(data.default_model);
      setDefaultCitation(data.default_citation_style);
      setDefaultLanguage(data.default_language);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      let keyToTest = '';
      if (provider === 'gemini') keyToTest = geminiKey;
      else if (provider === 'openai') keyToTest = openaiKey;
      else if (provider === 'anthropic') keyToTest = anthropicKey;

      const res = await api.testConnection(provider, keyToTest, defaultModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateSettings({
        llm_provider: provider,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
        default_model: defaultModel,
        default_citation_style: defaultCitation,
        default_language: defaultLanguage,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">System Settings & AI Providers</h1>
        <p className="text-xs text-slate-500 mt-1">Configure LLM adapters, API keys, citation defaults, and privacy preferences.</p>
      </div>

      {/* Mobile Wi-Fi Access Card */}
      <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 rounded-2xl p-4 sm:p-5 border border-indigo-100 space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Mobile Phone Access on Local Wi-Fi</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-600">
          Use ScholarMind AI directly on your phone camera & browser on the same Wi-Fi network:
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          <code className="bg-white px-3 py-1 rounded-xl border border-indigo-200 font-mono font-bold text-indigo-700 text-xs select-all">
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-0.5 rounded-lg bg-indigo-100/70"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5 sm:space-y-6">
        {/* Provider Selection Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-subtle space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold font-serif text-slate-900">Configurable LLM Provider</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 1.5 Flash / 2.0', hasKey: settings?.has_gemini_key },
              { id: 'openai', name: 'OpenAI', desc: 'GPT-4o / GPT-4o-mini', hasKey: settings?.has_openai_key },
              { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5 Sonnet', hasKey: settings?.has_anthropic_key },
              { id: 'local_deterministic', name: 'Local Engine', desc: 'Academic Deterministic', hasKey: true },
            ].map((p) => (
              <label
                key={p.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  provider === p.id
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={(e) => setProvider(e.target.value)}
                    className="text-indigo-600 focus:ring-0"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">{p.desc}</span>
                  <span className={`text-[10px] font-mono mt-1 inline-block px-1.5 py-0.2 rounded ${
                    p.hasKey ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.hasKey ? 'Key Configured' : 'No Key'}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* API Key Inputs */}
          {provider === 'gemini' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                {settings?.has_gemini_key && (
                  <span className="text-[10px] text-emerald-600 font-mono">Existing key stored on server</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settings?.has_gemini_key ? '••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {provider === 'openai' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>OpenAI API Key</span>
                {settings?.has_openai_key && (
                  <span className="text-[10px] text-emerald-600 font-mono">Existing key stored on server</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settings?.has_openai_key ? '••••••••••••••••••••••••••••••••' : 'sk-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {provider === 'anthropic' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Anthropic API Key</span>
                {settings?.has_anthropic_key && (
                  <span className="text-[10px] text-emerald-600 font-mono">Existing key stored on server</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settings?.has_anthropic_key ? '••••••••••••••••••••••••••••••••' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Test Connection Button */}
          <div className="pt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>Test Connection</span>
            </button>

            {testResult && (
              <span className={`text-xs font-medium flex items-center gap-1.5 ${
                testResult.success ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message} {testResult.latency_ms ? `(${testResult.latency_ms} ms)` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Academic Defaults Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold font-serif text-slate-900">Academic & Citation Defaults</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Citation Format</label>
              <select
                value={defaultCitation}
                onChange={(e) => setDefaultCitation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="vancouver">Vancouver [1] (Medical Default)</option>
                <option value="apa">APA 7th Edition</option>
                <option value="harvard">Harvard Referencing Style</option>
                <option value="ieee">IEEE Technical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Academic Language</label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
              >
                <option>English (US Academic)</option>
                <option>English (UK Academic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Data Retention Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold font-serif text-slate-900">Security, Privacy & Medical Compliance</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All uploaded reference books and generated publications remain strictly confidential in private local storage.
            Text extracted from reference documents is treated as untrusted data to protect against prompt injection.
            The system applies a mandatory medical disclaimer to all exported PDF publications stating that generated
            content is for educational, academic, and instructional use.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all text-xs disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
