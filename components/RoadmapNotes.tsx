'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Link2,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';

// ── Link extraction ──
interface ExtractedLink {
  url: string;
  description: string;
}

function extractLinks(text: string): ExtractedLink[] {
  if (!text) return [];

  const results: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  // Match (description: URL) format first
  const labeledRegex = /\(([^:)]+):\s*(https?:\/\/[^\s<>"{}|\\^`\])]+)\)/g;
  let match;
  while ((match = labeledRegex.exec(text)) !== null) {
    const description = match[1].trim();
    const url = match[2].replace(/\)+$/, '');
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      results.push({ url, description });
    }
  }

  // Match plain URLs not already captured
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const plainMatches = text.match(urlRegex);
  if (plainMatches) {
    for (const rawUrl of plainMatches) {
      const url = rawUrl.replace(/\)+$/, '');
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        try {
          const parsed = new URL(url);
          const host = parsed.hostname.replace('www.', '');
          const path = parsed.pathname.replace(/\/$/, '');
          const description =
            path && path !== '/'
              ? `${host}${path.length > 40 ? path.slice(0, 40) + '…' : path}`
              : host;
          results.push({ url, description });
        } catch {
          results.push({ url, description: url });
        }
      }
    }
  }

  return results;
}

// ── Debounce hook ──
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Quick links section ──
function QuickLinks({ links }: { links: ExtractedLink[] }) {
  if (!links.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Link2 className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          Quick Links
        </span>
      </div>
      <ul className="space-y-1.5">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 border border-indigo-100/60 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs text-slate-600 hover:text-indigo-700"
            >
              <span className=" truncate">{link.description}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity text-indigo-400" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Save status badge ──
type SaveStatus = 'idle' | 'edited' | 'saving' | 'saved' | 'error';

function StatusBadge({ status }: { status: SaveStatus }) {
  const config = {
    idle: { text: '', color: '', icon: null },
    edited: {
      text: 'Unsaved changes',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    saving: {
      text: 'Saving…',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    saved: {
      text: 'Saved',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      icon: <Check className="w-3 h-3" />,
    },
    error: {
      text: 'Save failed',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const c = config[status];
  if (!c.text) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.color}`}
    >
      {c.icon}
      {c.text}
    </span>
  );
}

// ── Main component ──
interface RoadmapNotesProps {
  roadmapId: string;
  initialNotes?: string | null;
}

export default function RoadmapNotes({
  roadmapId,
  initialNotes,
}: RoadmapNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [lastSaved, setLastSaved] = useState(initialNotes ?? '');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [showInfoTip, setShowInfoTip] = useState(false);
  const debouncedNotes = useDebounce(notes, 2000);
  const hasUserEdited = useRef(false);

  const links = useMemo(() => extractLinks(notes), [notes]);

  // Auto-save on debounced change
  const saveNotes = useCallback(
    async (text: string) => {
      if (text === lastSaved) {
        setStatus('saved');
        return;
      }
      setStatus('saving');
      try {
        const res = await fetch('/api/roadmaps/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadmapId, notes: text }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setLastSaved(text);
        setStatus('saved');
        hasUserEdited.current = false;
      } catch {
        setStatus('error');
      }
    },
    [roadmapId, lastSaved]
  );

  useEffect(() => {
    if (
      hasUserEdited.current &&
      debouncedNotes !== lastSaved &&
      status !== 'saving'
    ) {
      saveNotes(debouncedNotes);
    }
  }, [debouncedNotes, saveNotes, lastSaved, status]);

  // Warn on unsaved changes before unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (notes !== lastSaved) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [notes, lastSaved]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    hasUserEdited.current = true;
    setStatus(val === lastSaved ? 'saved' : 'edited');
  };

  return (
    <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800">Notes</h3>
          <div className="relative">
            <button
              onClick={() => setShowInfoTip((v) => !v)}
              className="p-1 rounded-full hover:bg-indigo-100 transition-colors"
              aria-label="How to use quick links"
            >
              <Info className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600 transition-colors" />
            </button>
            {showInfoTip && (
              <div className="absolute left-0 top-full mt-1 z-50 w-72 p-3 rounded-xl bg-white border border-indigo-200 shadow-lg text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-indigo-700 text-[11px] uppercase tracking-wide">
                    Quick Links Guide
                  </span>
                  <button
                    onClick={() => setShowInfoTip(false)}
                    className="p-0.5 rounded hover:bg-slate-100"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
                <ul className="space-y-1 list-disc list-inside text-[11px]">
                  <li>
                    Paste any URL (e.g.{' '}
                    <span className="text-indigo-600 font-mono">
                      https://...
                    </span>
                    ) in your notes
                  </li>
                  <li>
                    Use{' '}
                    <span className="text-indigo-600 font-mono">
                      (label: https://...)
                    </span>{' '}
                    to give a link a custom name
                  </li>
                  <li>
                    Links are <strong>auto-detected</strong> and shown as quick
                    links below
                  </li>
                  <li>Click a quick link to open it in a new tab</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={() => saveNotes(notes)}
            disabled={status === 'saving' || notes === lastSaved}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Add notes, links, ideas… Use (label: https://...) for named links."
          className="w-full h-40 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-y placeholder:text-slate-400 transition-all"
        />

        {/* Quick links preview */}
        <QuickLinks links={links} />
      </div>
    </div>
  );
}
