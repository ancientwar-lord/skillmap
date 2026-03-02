'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { RoadmapSummary, Todo, GoalItem } from '../lib/types';
import { isTodayDate } from '../lib/utils';

import PinnedTargets from './PinnedTargets';
import TodoSection from './TodoSection';
import TodoOverlay from './TodoOverlay';
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
  const [showTodoOverlay, setShowTodoOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [routineTodos, setRoutineTodos] = useState<Todo[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);

  useEffect(() => {
    async function fetchRoadmaps() {
      try {
        const res = await fetch('/api/roadmaps', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        setRoadmaps(data.roadmaps);
        fetch('/api/todos')
          .then((r) => r.json())
          .then((list: Todo[]) => {
            const todayList = list.filter((t) => isTodayDate(t.createdAt));
            setRoutineTodos(todayList);
          });
        fetch('/api/goals/items')
          .then((r) => r.json())
          .then((data) => setGoals(data.items || []));
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
  const visibleGoals = goals.filter((g) => !g.isPinned);
  const archivedRoadmaps = roadmaps
    .filter((r) => !pinnedIds.has(r.id))
    .slice(0, 4);

  const togglePin = async (id: string) => {
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
        setPinnedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      } else {
        const data = await res.json();
        setRoadmaps((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isPinned: data.isPinned } : r))
        );
      }
    } catch {
      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const toggleGoalPin = async (id: string) => {
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
      const data = await res.json();
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isPinned: data.isPinned } : g))
      );
    } catch {
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
    setRoutineTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    } catch {}
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

  const openTodoOverlay = () => {
    setShowTodoOverlay(true);
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
          onShowAll={openTodoOverlay}
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

      <TodoOverlay
        show={showTodoOverlay}
        onClose={() => setShowTodoOverlay(false)}
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
