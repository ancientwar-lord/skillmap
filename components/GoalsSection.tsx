'use client';

import { useState, useEffect } from 'react';
import {
  Pin,
  PinOff,
  ClipboardList,
  Eye,
  Check,
  AlertTriangle,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import { formatDate } from '../lib/utils';

const CATEGORIES = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'LONGTERM',
  'PASSION',
  'BOREDOM',
  'RANDOM',
] as const;
type Category = (typeof CATEGORIES)[number];

interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
  startDate?: string | null;
  targetDate?: string | null;
  isPinned?: boolean;
  isRepetitive?: boolean;
  category?: string | null;
  missedPeriods?: string[];
}

interface Props {
  onShowAll?: () => void;
}

function GoalRow({
  item,
  onToggleComplete,
  onTogglePin,
}: {
  item: GoalItem;
  onToggleComplete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          onClick={onToggleComplete}
          className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition shrink-0
            ${
              item.completed
                ? 'bg-green-500 border-green-500'
                : 'border-slate-300 hover:border-green-400'
            }`}
        >
          {item.completed && <Check size={12} className="text-white" />}
        </div>
        <span
          className={`text-sm truncate ${
            item.completed ? 'line-through text-slate-400' : 'text-slate-700'
          }`}
        >
          {item.text}
          {item.category && (
            <span className="text-xs text-slate-400 ml-2">
              {item.category.toLowerCase()}
            </span>
          )}
          {item.targetDate && (
            <span className="text-xs text-slate-400 ml-2">
              due {formatDate(item.targetDate)}
            </span>
          )}
          {item.startDate && !item.targetDate && (
            <span className="text-xs text-slate-400 ml-2">
              from {formatDate(item.startDate)}
            </span>
          )}
          {item.isRepetitive && (
            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-2">
              repetitive
            </span>
          )}
        </span>
      </div>
      <button
        onClick={onTogglePin}
        className="group shrink-0 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
        title={item.isPinned ? 'Unpin' : 'Pin'}
      >
        {item.isPinned ? (
          <PinOff className="w-4 h-4 text-purple-500" />
        ) : (
          <Pin className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
        )}
      </button>
    </div>
  );
}

export default function GoalsSection({ onShowAll }: Props) {
  const [listing, setListing] = useState<Record<string, GoalItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch each category in parallel (same as GoalSettings)
  useEffect(() => {
    let mounted = true;
    let completed = 0;

    CATEGORIES.forEach(async (cat) => {
      const res = await fetch(`/api/goals/${cat}`);
      if (!mounted) return;
      if (res.ok) {
        const data = await res.json();
        const items: GoalItem[] = data.items.map((i: GoalItem) => ({
          id: i.id,
          text: i.text,
          completed: !!i.completed,
          startDate: i.startDate ?? null,
          targetDate: i.targetDate ?? null,
          isPinned: !!i.isPinned,
          isRepetitive: !!i.isRepetitive,
          category: cat,
          missedPeriods: i.missedPeriods ?? [],
        }));
        setListing((prev) => ({ ...prev, [cat]: items }));
      } else {
        setListing((prev) => ({ ...prev, [cat]: [] }));
      }
      completed++;
      if (completed === CATEGORIES.length && mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // ── Classification ──────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Flatten all non-pinned, non-completed items first
  const allItems: (GoalItem & { cat: Category })[] = CATEGORIES.flatMap((cat) =>
    (listing[cat] ?? []).map((it) => ({ ...it, cat }))
  );

  const backlogItems = allItems.filter((it) => {
    if (it.completed || it.isPinned) return false;
    // Non-repetitive: overdue by targetDate
    if (it.targetDate) {
      const t = new Date(it.targetDate);
      t.setHours(0, 0, 0, 0);
      if (t < today) return true;
    }
    return false;
  });

  // Repetitive goals with missed periods (for backlog display)
  const missedPeriodEntries: {
    item: GoalItem & { cat: Category };
    periodKey: string;
  }[] = [];
  for (const it of allItems) {
    if (it.isRepetitive && it.missedPeriods && it.missedPeriods.length > 0) {
      for (const pk of it.missedPeriods) {
        missedPeriodEntries.push({ item: it, periodKey: pk });
      }
    }
  }

  const upcomingItems = allItems.filter((it) => {
    if (it.completed || it.isPinned) return false;
    if (!it.startDate) return false;
    const s = new Date(it.startDate);
    s.setHours(0, 0, 0, 0);
    return s > today;
  });

  const backlogIds = new Set(backlogItems.map((it) => it.id));
  const upcomingIds = new Set(upcomingItems.map((it) => it.id));

  const currentItems = allItems.filter(
    (it) =>
      !it.completed &&
      !it.isPinned &&
      !backlogIds.has(it.id) &&
      !upcomingIds.has(it.id)
  );

  const totalNonPinned = allItems.filter((it) => !it.isPinned).length;

  // ── Toggles ─────────────────────────────────────────────────────────
  const toggleComplete = async (cat: Category, id: string) => {
    const item = (listing[cat] ?? []).find((it) => it.id === id);
    if (!item) return;
    const newCompleted = !item.completed;

    setListing((prev) => ({
      ...prev,
      [cat]: (prev[cat] ?? []).map((it) =>
        it.id === id ? { ...it, completed: newCompleted } : it
      ),
    }));

    if (item.isRepetitive) {
      await fetch('/api/goals/toggle-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, isCompleted: newCompleted }),
      });
    } else {
      const updated = (listing[cat] ?? []).map((it) =>
        it.id === id ? { ...it, completed: newCompleted } : it
      );
      await fetch(`/api/goals/${cat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated }),
      });
    }
  };

  const togglePin = async (cat: Category, id: string) => {
    setListing((prev) => ({
      ...prev,
      [cat]: (prev[cat] ?? []).map((it) =>
        it.id === id ? { ...it, isPinned: !it.isPinned } : it
      ),
    }));
    await fetch('/api/goals/toggle-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId: id }),
    });
  };

  const markPeriodComplete = async (
    cat: Category,
    goalId: string,
    periodKey: string
  ) => {
    // Optimistically remove the missed period from listing
    setListing((prev) => ({
      ...prev,
      [cat]: (prev[cat] ?? []).map((it) =>
        it.id === goalId
          ? {
              ...it,
              missedPeriods: (it.missedPeriods ?? []).filter(
                (p) => p !== periodKey
              ),
            }
          : it
      ),
    }));
    await fetch('/api/goals/toggle-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, isCompleted: true, periodKey }),
    });
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-sky-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Your Goals</h2>
        </div>
        {typeof onShowAll === 'function' && (
          <button
            onClick={onShowAll}
            className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Show All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : totalNonPinned === 0 ? (
        <p className="text-sm text-slate-400 p-5">No goals added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* ── Left: Current ── */}
          <div className="p-4 space-y-2 max-h-[460px] overflow-y-auto">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
              Current
            </p>
            {currentItems.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No active goals.</p>
            ) : (
              currentItems.map((it) => (
                <GoalRow
                  key={it.id}
                  item={it}
                  onToggleComplete={() => toggleComplete(it.cat, it.id)}
                  onTogglePin={() => togglePin(it.cat, it.id)}
                />
              ))
            )}
          </div>

          {/* ── Right: Backlog + Upcoming ── */}
          <div className="flex flex-col divide-y divide-slate-100">
            {/* Backlog */}
            {(backlogItems.length > 0 || missedPeriodEntries.length > 0) && (
              <div className="p-4 space-y-2 max-h-[230px] overflow-y-auto">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Backlog
                </p>
                {backlogItems.map((it) => (
                  <GoalRow
                    key={it.id}
                    item={it}
                    onToggleComplete={() => toggleComplete(it.cat, it.id)}
                    onTogglePin={() => togglePin(it.cat, it.id)}
                  />
                ))}
                {missedPeriodEntries.map(({ item, periodKey }) => (
                  <div
                    key={`${item.id}-${periodKey}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-red-100 hover:bg-red-50 transition"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div
                        onClick={() =>
                          markPeriodComplete(item.cat, item.id, periodKey)
                        }
                        className="w-5 h-5 rounded-full border border-slate-300 hover:border-green-400 hover:bg-green-50 flex items-center justify-center cursor-pointer transition shrink-0"
                        title="Mark this period as complete"
                      >
                        <Check
                          size={11}
                          className="text-slate-300 hover:text-green-400"
                        />
                      </div>
                      <span className="text-sm text-slate-700 truncate">
                        {item.text}
                        <span className="text-xs text-slate-400 ml-2">
                          {item.cat.toLowerCase()}
                        </span>
                      </span>
                      <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                        {periodKey}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 space-y-2 max-h-[230px] overflow-y-auto">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                Upcoming
              </p>
              {upcomingItems.length === 0 ? (
                <p className="text-sm text-slate-400 italic">
                  No upcoming goals.
                </p>
              ) : (
                upcomingItems.map((it) => (
                  <GoalRow
                    key={it.id}
                    item={it}
                    onToggleComplete={() => toggleComplete(it.cat, it.id)}
                    onTogglePin={() => togglePin(it.cat, it.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
