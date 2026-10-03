'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  X, 
  RefreshCw, 
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { api } from '@/lib/api';
import { Settings } from '@/lib/types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: Settings) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSettingsSaved }: ApiKeyModalProps) {
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'local_deterministic'>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  // Load existing settings when modal opens
  useEffect(() => {
    if (isOpen) {
      api.getSettings()
        .then((s) => {
          if (s.llm_provider) {
            setProvider(s.llm_provider as any);
          }
          if (s.default_model) {
            setSelectedModel(s.default_model);
          }
        })
        .catch((err) => console.error('Failed to load settings:', err));
      setTestResult(null);
    }
  }, [isOpen]);

  // Sync default model when provider changes
  const handleProviderChange = (newProvider: 'gemini' | 'openai' | 'anthropic' | 'local_deterministic') => {
    setProvider(newProvider);
    setTestResult(null);
    if (newProvider === 'gemini') {
      setSelectedModel('gemini-1.5-flash');
    } else if (newProvider === 'openai') {
      setSelectedModel('gpt-4o');
    } else if (newProvider === 'anthropic') {
      setSelectedModel('claude-3-5-sonnet-20241022');
    } else {
      setSelectedModel('built-in');
    }
  };

  const getActiveKey = () => {
    if (provider === 'gemini') return geminiKey;
    if (provider === 'openai') return openaiKey;
    if (provider === 'anthropic') return anthropicKey;
    return '';
  };

  const setActiveKey = (val: string) => {
    if (provider === 'gemini') setGeminiKey(val);
    else if (provider === 'openai') setOpenaiKey(val);
    else if (provider === 'anthropic') setAnthropicKey(val);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const activeKey = getActiveKey();
      const res = await api.testConnection(provider, activeKey, selectedModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        llm_provider: provider,
        default_model: selectedModel,
      };
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
      if (anthropicKey.trim()) payload.anthropic_api_key = anthropicKey.trim();

      const updated = await api.updateSettings(payload);
      if (onSettingsSaved) {
        onSettingsSaved(updated);
      }
      onClose();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Connect AI Models & API Keys</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Enable live Vision OCR & chapter synthesis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Provider Selection Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Select AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>Google Gemini</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Recommended</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal">Free tier available</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'openai'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div>
                  <span>OpenAI</span>
                  <p className="text-[10px] text-slate-500 font-normal">GPT-4o / GPT-4o-mini</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'anthropic'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div>
                  <span>Anthropic</span>
                  <p className="text-[10px] text-slate-500 font-normal">Claude 3.5 Sonnet</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('local_deterministic')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  provider === 'local_deterministic'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <div>
                  <span>Local Academic Engine</span>
                  <p className="text-[10px] text-slate-500 font-normal">Offline / Zero Key</p>
                </div>
              </button>
            </div>
          </div>

          {/* Key Input Section */}
          {provider !== 'local_deterministic' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    {provider === 'gemini' ? 'Gemini API Key' : provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
                  </label>
                  {provider === 'gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {provider === 'openai' && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      Get OpenAI Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={getActiveKey()}
                    onChange={(e) => setActiveKey(e.target.value)}
                    placeholder={
                      provider === 'gemini' 
                        ? 'AIzaSy...' 
                        : provider === 'openai' 
                        ? 'sk-...' 
                        : 'sk-ant-...'
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Your key is saved locally in your private database and never shared.
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Model Selection</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {provider === 'gemini' && (
                    <>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Recommended: Free tier, ultra-fast & high-yield)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Next-gen fast multimodal vision)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Deep clinical reasoning)</option>
                    </>
                  )}
                  {provider === 'openai' && (
                    <>
                      <option value="gpt-4o">gpt-4o (Multimodal Vision & Comprehensive Synthesis)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient)</option>
                    </>
                  )}
                  {provider === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (High-precision medical reasoning)</option>
                      <option value="claude-3-haiku-20240307">claude-3-haiku (Fast review)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>ScholarMind Built-In Deterministic Academic Engine</span>
              </div>
              <p className="text-purple-700 leading-relaxed">
                No external API key or internet access required. The built-in academic synthesizer produces 4 distinct styles with structured tables, citations [1], [2], [3], and medical accuracy safeguards automatically.
              </p>
            </div>
          )}

          {/* Test Status Badge */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{testResult.message}</div>
                {testResult.latency_ms && (
                  <div className="text-[11px] opacity-80 mt-0.5">Latency: {testResult.latency_ms} ms</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          {provider !== 'local_deterministic' ? (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !getActiveKey().trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Test Connection
                </>
              )}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
