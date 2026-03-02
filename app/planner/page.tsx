'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { slugify } from '@/lib/utils';
import {
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  Map,
  Send,
  Trash2,
} from 'lucide-react';

interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  taskCount: number;
  subtaskCount: number;
  completedSubtasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}


export default function PlannerPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch existing roadmaps on mount
  useEffect(() => {
    async function fetchRoadmaps() {
      try {
        const res = await fetch('/api/roadmaps');
        const data = await res.json();
        if (res.ok) setRoadmaps(data.roadmaps);
      } catch {
        // silently fail — list is secondary
      } finally {
        setLoadingList(false);
      }
    }
    fetchRoadmaps();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      setError('Please enter at least 3 characters.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap');

      // Refetch roadmaps list to include the new one
      const listRes = await fetch('/api/roadmaps');
      const listData = await listRes.json();
      if (listRes.ok) setRoadmaps(listData.roadmaps);

      setPrompt('');

      // Navigate to the new roadmap
      if (data.roadmap?.title) {
        router.push(`/dashboard/roadmap/${slugify(data.roadmap.title)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200/50">
            <Sparkles className="w-6 h-6 text-purple-700" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-950 via-violet-900 to-purple-800 bg-clip-text text-transparent">
            Planner
          </h1>
        </div>
        <p className="text-slate-500 ml-14">
          Describe what you want to learn and AI will create a structured
          roadmap for you.
        </p>
      </motion.div>

      {/* ── Create Roadmap Form ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-200/50 shadow-sm shadow-purple-100/30 p-6 mb-10"
      >
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !generating) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="e.g. I want to learn React.js from scratch, including hooks, state management, and building a full project..."
            rows={4}
            disabled={generating}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:bg-white transition-all resize-none disabled:opacity-50"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {prompt.length > 0 && `${prompt.trim().length} characters`}
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating || prompt.trim().length < 3}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium shadow-md shadow-purple-200/40 hover:shadow-purple-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generating animation */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-2 border-purple-200 animate-[spin_3s_linear_infinite]" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-purple-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    AI is crafting your roadmap...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This may take 15-30 seconds
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Your Roadmaps ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Map className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            Your Roadmaps
          </h2>
          {!loadingList && (
            <span className="text-xs text-slate-400 ml-1">
              ({roadmaps.length})
            </span>
          )}
        </div>

        {/* Loading */}
        {loadingList && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="text-purple-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loadingList && roadmaps.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No roadmaps yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Generate your first roadmap above to get started
            </p>
          </div>
        )}

        {/* Roadmap List */}
        {!loadingList && roadmaps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() =>
                  router.push(`/dashboard/roadmap/${slugify(roadmap.title)}`)
                }
                className="group relative bg-white rounded-2xl border border-purple-200/30 shadow-sm hover:shadow-lg hover:shadow-purple-200/20 hover:border-purple-300/50 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Delete button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (deletingId === roadmap.id) return;
                    if (!confirm('Delete this roadmap? This cannot be undone.'))
                      return;
                    setDeletingId(roadmap.id);
                    try {
                      const res = await fetch(
                        `/api/roadmaps/${slugify(roadmap.title)}`,
                        { method: 'DELETE' }
                      );
                      if (res.ok) {
                        setRoadmaps((prev) =>
                          prev.filter((r) => r.id !== roadmap.id)
                        );
                      }
                    } catch {
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 border border-slate-200   bg-red-50 hover:border-red-300 text-red-600  transition-all cursor-pointer"
                  title="Delete roadmap"
                >
                  {deletingId === roadmap.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 group-hover:text-purple-800 transition-colors line-clamp-2 leading-snug text-sm">
                      {roadmap.title}
                    </h3>
                  </div>

                  {roadmap.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {roadmap.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      {roadmap.completedSubtasks}/{roadmap.subtaskCount}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={11} />
                      {(() => {
                        const d = new Date(roadmap.createdAt);
                        const day = d.getDate();
                        const mon = d.toLocaleString('en-US', {
                          month: 'short',
                        });
                        const yr = String(d.getFullYear()).slice(-2);
                        return `${day}${mon} '${yr}`;
                      })()}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        roadmap.progress === 100
                          ? 'text-green-600'
                          : roadmap.progress > 0
                            ? 'text-purple-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {roadmap.progress}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
