'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  PinOff,
  Search,
  X,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronRight,
  Target,
  Archive,
  ClipboardList,
  MapPin,
  Eye,
  Loader2,
  ListTodo,
} from 'lucide-react';

interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  taskCount: number;
  subtaskCount: number;
  completedSubtasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  roadmapSlug?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function isTodayDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function buildTodosFromRoadmaps(roadmaps: RoadmapSummary[]): TodoItem[] {
  return roadmaps.map((r) => {
    const remaining = r.subtaskCount - r.completedSubtasks;
    const completed = r.progress === 100;
    const d = new Date(r.updatedAt || r.createdAt);
    return {
      id: `todo-${r.id}`,
      title: completed
        ? `✅ Completed "${r.title}"`
        : `Continue "${r.title}" — ${remaining} subtask${remaining !== 1 ? 's' : ''} left`,
      date: d.toISOString().split('T')[0],
      completed,
      roadmapSlug: slugify(r.title),
    };
  });
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function DashboardContent({
  userName,
}: {
  userName?: string | null;
}) {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showOverlay, setShowOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    async function fetchRoadmaps() {
      try {
        const res = await fetch('/api/roadmaps', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setRoadmaps(data.roadmaps);
        setTodos(buildTodosFromRoadmaps(data.roadmaps));
        // Initialize pinned state from DB
        const dbPinned = new Set<string>();
        data.roadmaps.forEach((r: RoadmapSummary) => {
          if (r.isPinned) dbPinned.add(r.id);
        });
        setPinnedIds(dbPinned);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmaps();
  }, []);

  const pinnedRoadmaps = roadmaps.filter((r) => pinnedIds.has(r.id));
  const archivedRoadmaps = roadmaps
    .filter((r) => !pinnedIds.has(r.id))
    .slice(0, 4);

  const togglePin = async (id: string) => {
    // Optimistic update
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const res = await fetch('/api/roadmaps/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId: id }),
      });
      if (!res.ok) {
        // Revert on failure
        setPinnedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      } else {
        const data = await res.json();
        // Sync roadmaps state with confirmed DB value
        setRoadmaps((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isPinned: data.isPinned } : r))
        );
      }
    } catch {
      // Revert on error
      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const openRoadmap = (slug: string) => {
    router.push(`/dashboard/roadmap/${slug}`);
  };

  const filteredRoadmaps = roadmaps.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back{userName ? `, ${userName}` : ''}!
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s your learning overview &middot; {roadmaps.length} roadmap
          {roadmaps.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-2xl border border-purple-200/60 shadow-sm shadow-purple-100/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50/60">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-700" />
              <h2 className="text-lg font-semibold text-purple-900">
                Your Locked Targets
              </h2>
            </div>
            <p className="text-xs text-purple-500 mt-1">
              Pinned roadmaps you&apos;re focused on
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {pinnedRoadmaps.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pinned roadmaps yet</p>
                <p className="text-xs mt-1">
                  Pin roadmaps from Archived section
                </p>
              </div>
            ) : (
              pinnedRoadmaps.map((roadmap) => (
                <motion.div
                  key={roadmap.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group relative p-4 rounded-xl border border-purple-100 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/40 hover:shadow-md hover:shadow-purple-100/50 transition-all cursor-pointer"
                  onClick={() => openRoadmap(slugify(roadmap.title))}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-slate-800 truncate text-sm">
                        {roadmap.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {roadmap.description || 'No description'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(roadmap.id);
                      }}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                      title="Unpin"
                    >
                      <PinOff className="w-4 h-4 text-purple-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={roadmap.progress} />
                    <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
                      {roadmap.progress}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ListTodo size={12} />
                      {roadmap.taskCount} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      {roadmap.completedSubtasks}/{roadmap.subtaskCount}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-blue-200/60 shadow-sm shadow-blue-100/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50/60">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-semibold text-blue-900">
                Previous Action Plans
              </h2>
            </div>
            <p className="text-xs text-blue-500 mt-1">
              Your learning tasks timeline
            </p>
          </div>
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {todos.map((todo) => {
              const todayFlag = isTodayDate(todo.date);
              return (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    todayFlag
                      ? 'border-blue-300 bg-blue-50/60'
                      : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-blue-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        todo.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span
                        className={`text-xs ${
                          todayFlag
                            ? 'text-blue-600 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {todayFlag ? 'Today' : formatDate(todo.date)}
                      </span>
                    </div>
                  </div>
                  {todo.roadmapSlug && (
                    <button
                      onClick={() => openRoadmap(todo.roadmapSlug!)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Open roadmap"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Archived Roadmaps
                </h2>
              </div>
              <button
                onClick={() => setShowOverlay(true)}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Show All
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Browse and pin your roadmaps
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {archivedRoadmaps.map((roadmap) => (
              <motion.div
                key={roadmap.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/30 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => openRoadmap(slugify(roadmap.title))}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-slate-800 truncate text-sm">
                      {roadmap.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {roadmap.description || 'No description'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(roadmap.id);
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    title="Pin to targets"
                  >
                    <Pin className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={roadmap.progress} />
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    {roadmap.progress}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ListTodo size={12} />
                      {roadmap.taskCount} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      {roadmap.completedSubtasks}/{roadmap.subtaskCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(roadmap.createdAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowOverlay(false);
                setSearchQuery('');
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-purple-200/60 overflow-hidden max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50/60">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-purple-900">
                    All Roadmaps
                  </h2>
                  <button
                    onClick={() => {
                      setShowOverlay(false);
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search roadmaps by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredRoadmaps.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No roadmaps found</p>
                  </div>
                ) : (
                  filteredRoadmaps.map((roadmap) => {
                    const isPinned = pinnedIds.has(roadmap.id);
                    return (
                      <motion.div
                        key={roadmap.id}
                        layout
                        className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-gradient-to-r hover:from-white hover:to-purple-50/40 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => {
                          setShowOverlay(false);
                          setSearchQuery('');
                          openRoadmap(slugify(roadmap.title));
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800 text-sm truncate">
                              {roadmap.title}
                            </h3>
                            {isPinned && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {roadmap.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 max-w-[200px]">
                              <ProgressBar value={roadmap.progress} />
                            </div>
                            <span className="text-xs text-slate-500">
                              {roadmap.progress}%
                            </span>
                            <div className="flex items-center gap-2 ml-auto text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <ListTodo size={11} />
                                {roadmap.taskCount}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2
                                  size={11}
                                  className="text-green-500"
                                />
                                {roadmap.completedSubtasks}/
                                {roadmap.subtaskCount}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(roadmap.id);
                          }}
                          className={`shrink-0 p-2 rounded-lg transition-all ${
                            isPinned
                              ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              : 'text-slate-400 hover:bg-purple-50 hover:text-purple-500'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin to targets'}
                        >
                          {isPinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80">
                <p className="text-xs text-slate-400 text-center">
                  {filteredRoadmaps.length} roadmap
                  {filteredRoadmaps.length !== 1 ? 's' : ''} found
                  {' · '}
                  {pinnedIds.size} pinned
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
