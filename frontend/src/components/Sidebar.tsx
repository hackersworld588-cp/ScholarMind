'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Settings,
  BookOpen,
  ShieldCheck,
  FileText
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Chapter Synthesizer', href: '/', icon: Sparkles },
  { label: 'Settings & API Keys', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              ScholarMind
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-sans font-medium border border-indigo-500/30">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Image-to-Chapter</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Workflow
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Human Writing Guarantee Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Human-Style Synthesis</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Synthesizes 2–3 reference book page images into an original, human-written complete chapter without verbatim copying.
          </p>
        </div>
      </div>
    </aside>
  );
}
