'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, Check, Copy, RefreshCw,
  PlusCircle, Minimize2, Maximize2, ShieldAlert,
  FileText, Wand2, Scissors, Stethoscope, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  updatedChapter?: string | null;
  suggestedAction?: 'replace_chapter' | 'insert_section' | 'answer_only';
  actionLabel?: string | null;
  applied?: boolean;
}

interface ChapterCopilotProps {
  currentChapter: string;
  topic: string;
  writingStyle: string;
  onApplyChapter: (newMarkdown: string) => void;
  onAppendChapter: (additionalMarkdown: string) => void;
  connectedModelName?: string;
}

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const flushTable = (key: string) => {
    if (tableBuffer.length === 0) return null;
    const rows = tableBuffer.map(r =>
      r.split('|').map(c => c.trim()).filter((c, i, a) => (i > 0 && i < a.length - 1) || c)
    );
    tableBuffer = [];
    return (
      <div key={key} className="overflow-x-auto my-2">
        <table className="min-w-full text-xs border border-slate-700 rounded-lg">
          <tbody>
            {rows.map((row, rIdx) => {
              if (row.every(c => /^[-:| ]+$/.test(c))) return null;
              return (
                <tr key={rIdx} className={rIdx === 0 ? "bg-slate-800 font-bold text-indigo-300" : "border-t border-slate-800"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5 border-r border-slate-800 last:border-r-0">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code_${i}`} className="bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-emerald-400 my-2">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|')) {
      tableBuffer.push(line.trim());
      continue;
    } else if (tableBuffer.length > 0) {
      elements.push(flushTable(`table_${i}`));
    }

    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-white mt-2 mb-1">{formatInline(line.slice(2))}</h2>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-indigo-300 mt-2 mb-1">{formatInline(line.slice(3))}</h3>);
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-xs font-semibold text-slate-200 mt-1.5 mb-0.5">{formatInline(line.slice(4))}</h4>);
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-slate-300 my-0.5">
          {formatInline(line.trim().slice(2))}
        </li>
      );
    } else if (/^\d+\.\s+/.test(line.trim())) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-slate-300 my-0.5">
          {formatInline(line.trim().replace(/^\d+\.\s+/, ''))}
        </li>
      );
    } else if (line.trim()) {
      elements.push(<p key={i} className="my-1.5 leading-relaxed text-slate-300">{formatInline(line)}</p>);
    }
  }

  if (tableBuffer.length > 0) {
    elements.push(flushTable(`table_end`));
  }

  return <div className="space-y-1">{elements}</div>;
};

export const ChapterCopilot: React.FC<ChapterCopilotProps> = ({
  currentChapter,
  topic,
  writingStyle,
  onApplyChapter,
  onAppendChapter,
  connectedModelName = 'AI Copilot Engine'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **ScholarMind AI Copilot**. I can help you **expand the chapter text**, **make it concise**, **add nursing care plans (ADPIE)**, **regenerate fresh sections**, or answer any questions about your chapter.
      
Choose a quick action below or type your custom instruction!`,
      suggestedAction: 'answer_only'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const instruction = (textToSend || input).trim();
    if (!instruction || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: instruction
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.chatEditChapter({
        current_chapter: currentChapter,
        topic,
        user_instruction: instruction,
        conversation_history: history,
        writing_style: writingStyle
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: res.assistant_reply,
        updatedChapter: res.updated_chapter,
        suggestedAction: res.suggested_action,
        actionLabel: res.action_label || 'Apply to Chapter'
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Request failed**: ${err.message || 'Could not communicate with the AI Copilot. Please check your API key or connection.'}`,
        suggestedAction: 'answer_only'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (msgId: string, updatedChapter: string) => {
    onApplyChapter(updatedChapter);
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleAppend = (msgId: string, textToAppend: string) => {
    onAppendChapter(textToAppend);
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleCopy = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const quickPrompts = [
    {
      label: '📝 Expand Details (Text badhao)',
      icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
      prompt: 'Is chapter ko aur detail me expand kro, extra clinical pathways aur nursing points add kro.'
    },
    {
      label: '✂️ Make Concise (Text kam kro)',
      icon: <Scissors className="w-3.5 h-3.5 text-emerald-500" />,
      prompt: 'Is chapter ko concise, high-yield bullet format me summarize kro.'
    },
    {
      label: '🩺 Add Nursing Care Plan (ADPIE)',
      icon: <Stethoscope className="w-3.5 h-3.5 text-rose-500" />,
      prompt: 'Isme complete ADPIE Nursing Care Plan aur Nursing Interventions table add kro with rationales.'
    },
    {
      label: '🔄 Regenerate Fresh (Naya likho)',
      icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />,
      prompt: 'Is chapter ko ek fresh human-written academic tone me complete rewrite kro.'
    },
    {
      label: '📋 Add Patient Discharge Checklist',
      icon: <Wand2 className="w-3.5 h-3.5 text-amber-500" />,
      prompt: 'Isme patient & family discharge education aur emergency red-flag warning checklist add kro.'
    }
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-200">
      {/* Copilot Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                ScholarMind AI Copilot
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Editor
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Interactive Chapter Refinement, Expansion & Live Regenerator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/60">
            {connectedModelName}
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Copilot' : 'Collapse Copilot'}
          >
            {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Action Chips Bar */}
          <div className="px-3 sm:px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
              Quick Edits:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSendMessage(qp.prompt)}
                className="shrink-0 flex items-center gap-1.5 text-[11px] bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
              >
                {qp.icon}
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="p-3 sm:p-5 max-h-[420px] overflow-y-auto space-y-4 text-xs sm:text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/80'
                  }`}
                >
                  <div className="space-y-1">
                    <SimpleMarkdownRenderer content={m.content} />
                  </div>

                  {/* If assistant returned an updated or expandable chapter */}
                  {m.updatedChapter && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1">
                          <Wand2 className="w-3 h-3" />
                          Generated Revision Ready:
                        </span>
                        <span>~{m.updatedChapter.split(/\s+/).filter(Boolean).length} words</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApply(m.id, m.updatedChapter!)}
                          disabled={m.applied}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                            m.applied
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white active:scale-95'
                          }`}
                        >
                          {m.applied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Applied to Chapter!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>✨ {m.actionLabel || 'Apply to Chapter'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppend(m.id, m.updatedChapter!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Insert at End</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.updatedChapter!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-all"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Copilot is analyzing and refining the chapter text...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input Bar */}
          <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                rows={1}
                placeholder="Ask Copilot: 'Isme clinical nursing care pathways add kro' or 'Text ko thoda kam kro'..."
                className="flex-1 bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none max-h-24 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 sm:px-4 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>Press <b>Enter</b> to send, <b>Shift+Enter</b> for new line.</span>
              <span>1-Click <b>Apply to Chapter</b> updates the editor instantly.</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
