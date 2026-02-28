'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { RoadmapSummary, Todo, GoalItem } from '../lib/types';

import PinnedTargets from './PinnedTargets';
import TodoSection from './TodoSection';
import GoalsSection from './GoalsSection';
import ArchivedRoadmaps from './ArchivedRoadmaps';
import RoadmapOverlay from './RoadmapOverlay';
import GoalsOverlay from './GoalsOverlay';

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
  const [showGoalsOverlay, setShowGoalsOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // routine todos fetched from /api/todos
  const [routineTodos, setRoutineTodos] = useState<Todo[]>([]);

  // goal items fetched from database
  const [goals, setGoals] = useState<GoalItem[]>([]);

  useEffect(() => {
    async function fetchRoadmaps() {
      try {
        const res = await fetch('/api/roadmaps', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setRoadmaps(data.roadmaps);
        // load routine todos as well
        fetch('/api/todos')
          .then((r) => r.json())
          .then((list: Todo[]) => setRoutineTodos(list));
        // load all goal items
        fetch('/api/goals/items')
          .then((r) => r.json())
          .then((data) => setGoals(data.items || []));
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
  const pinnedGoals = goals.filter((g) => g.isPinned);
  // only show unpinned goals in the "Your Goals" list
  const visibleGoals = goals.filter((g) => !g.isPinned);
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

  const toggleGoalPin = async (id: string) => {
    // optimistic
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isPinned: !g.isPinned } : g))
    );
    try {
      const res = await fetch('/api/goals/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id }),
      });
      if (!res.ok) throw new Error('toggle failed');
      // optionally refresh goals list to pick up any other changes
      const data = await res.json();
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isPinned: data.isPinned } : g))
      );
    } catch {
      // revert
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isPinned: !g.isPinned } : g))
      );
    }
  };

  const toggleRoutine = (id: string) => {
    setRoutineTodos((prev) => {
      return prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, completed: !t.completed };
          fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: updated.completed }),
          }).catch(() => {});
          return updated;
        }
        return t;
      });
    });
  };

  const deleteRoutine = async (id: string) => {
    // optimistic removal
    setRoutineTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    } catch {
      // if failure we could reload but ignore for now
    }
  };

  const addRoutine = async (text: string) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const todo: Todo = await res.json();
      setRoutineTodos((prev) => [todo, ...prev]);
    }
  };

  const openRoadmap = (slug: string) => {
    router.push(`/dashboard/roadmap/${slug}`);
  };

  const openGoalsOverlay = () => {
    setShowGoalsOverlay(true);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PinnedTargets
          roadmaps={pinnedRoadmaps}
          goals={pinnedGoals}
          togglePin={togglePin}
          toggleGoalPin={toggleGoalPin}
          openRoadmap={openRoadmap}
        />
        <TodoSection
          todos={routineTodos}
          onToggle={toggleRoutine}
          onAdd={addRoutine}
          onDelete={deleteRoutine}
        />
      </div>

      <GoalsSection
        goals={goals}
        visibleGoals={visibleGoals}
        toggleGoalPin={toggleGoalPin}
        onShowAll={openGoalsOverlay}
      />

      <ArchivedRoadmaps
        archivedRoadmaps={archivedRoadmaps}
        openRoadmap={openRoadmap}
        togglePin={togglePin}
        setShowOverlay={setShowOverlay}
      />

      <GoalsOverlay
        show={showGoalsOverlay}
        onClose={() => setShowGoalsOverlay(false)}
        goals={goals}
        toggleGoalPin={toggleGoalPin}
      />

      <RoadmapOverlay
        show={showOverlay}
        onClose={() => {
          setShowOverlay(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roadmaps={roadmaps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        openRoadmap={openRoadmap}
      />
    </div>
  );
}
