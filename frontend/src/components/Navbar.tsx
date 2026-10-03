'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Settings } from '@/lib/types';

export default function Navbar() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => null);
  }, []);

  const hasLiveKey = settings?.has_gemini_key || settings?.has_openai_key || settings?.has_anthropic_key;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-sm text-slate-900">ScholarMind</span>
        </Link>
        <div className="hidden md:flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight font-serif">
            ScholarMind AI — Multi-Book Chapter Synthesizer
          </h2>
          <span className="text-xs text-slate-400 font-sans hidden lg:inline">• Academic Image-to-Chapter Studio</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Engine Status Badge */}
        <Link
          href="/settings"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-colors bg-slate-50 border-slate-200 hover:bg-slate-100"
          title="Click to configure AI providers and credentials in Settings"
        >
          {hasLiveKey ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-slate-700 capitalize font-mono text-[11px] sm:text-xs">{settings?.llm_provider}</span>
              <span className="text-[9px] sm:text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Connected
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <span className="text-slate-700 font-mono text-[11px] sm:text-xs hidden xs:inline">Academic AI</span>
              <span className="text-[9px] sm:text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                Active
              </span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}
