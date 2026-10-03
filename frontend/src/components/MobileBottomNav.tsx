'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Settings, BookOpen } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Synthesizer',
      href: '/',
      icon: Sparkles,
      active: pathname === '/'
    },
    {
      label: 'Settings & Keys',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings'
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl text-[11px] font-semibold transition-all ${
              item.active
                ? 'text-indigo-600 bg-indigo-50/80 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${item.active ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
