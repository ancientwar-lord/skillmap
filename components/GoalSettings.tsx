'use client';

import { useState, useEffect } from 'react';
import TodoOverlay from './TodoOverlay';
import {
  Check,
  Trash2,
  Plus,
  CalendarClock,
  AlertTriangle,
  Clock,
} from 'lucide-react';

function formatHumanDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear() % 100;
  return `${day} ${month} '${year.toString().padStart(2, '0')}`;
}

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};
const categories = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'LONGTERM',
  'PASSION',
  'BOREDOM',
  'RANDOM',
];
const categoryLabelMap: Record<string, string> = {
  DAILY: 'daily goals',
  WEEKLY: 'weekly goals',
  MONTHLY: 'monthly goals',
  LONGTERM: 'long‑term goals',
  PASSION: 'passion goals',
  BOREDOM: 'when bored',
  RANDOM: 'random targets',
};

interface ApiGoalItem {
  id?: string;
  text: string;
  startDate?: string;
  targetDate?: string;
  completed?: boolean;
  isRepetitive?: boolean;
  missedPeriods?: string[];
}

interface BacklogEntry {
  id?: string;
  text: string;
  startDate?: string;
  targetDate?: string;
  completed?: boolean;
  isRepetitive?: boolean;
  createdAt?: string;
  category: string;
  source: 'goal' | 'todo';
}

function GoalsOverview() {
  const [listing, setListing] = useState<Record<string, ApiGoalItem[]>>({});

  useEffect(() => {
    categories.forEach(async (cat) => {
      const res = await fetch(`/api/goals/${cat}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items.map((i: ApiGoalItem) => ({
          id: i.id,
          text: i.text,
          startDate: i.startDate,
          targetDate: i.targetDate,
          completed: !!i.completed,
          isRepetitive: !!i.isRepetitive,
          missedPeriods: i.missedPeriods ?? [],
        }));
        setListing((prev) => ({ ...prev, [cat]: items }));
      } else {
        setListing((prev) => ({ ...prev, [cat]: [] }));
      }
    });
  }, []);

  const markTodoComplete = async (id: string) => {
    const entry = backlog.find((e) => e.id === id);
    if (!entry) return;
    setBacklog((prev) => prev.filter((e) => e.id !== id));
    setCompletedTodos((prev) => [
      {
        id: entry.id!,
        text: entry.text,
        completed: true,
        createdAt: entry.createdAt ?? new Date().toISOString(),
      },
      ...prev,
    ]);
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
  };

  const deleteTodoFromBacklog = async (id: string) => {
    setBacklog((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  };

  const unmarkTodoComplete = async (id: string) => {
    const entry = completedTodos.find((t) => t.id === id);
    if (!entry) return;
    setCompletedTodos((prev) => prev.filter((t) => t.id !== id));
    setBacklog((prev) => [
      ...prev,
      {
        id: entry.id,
        text: entry.text,
        completed: false,
        createdAt: entry.createdAt,
        category: 'ROUTINE',
        source: 'todo' as const,
      },
    ]);
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false }),
    });
  };

  const markPeriodComplete = async (
    cat: string,
    goalId: string,
    periodKey: string
  ) => {
    setListing((prev) => {
      const arr = prev[cat] ?? [];
      return {
        ...prev,
        [cat]: arr.map((it) =>
          it.id !== goalId
            ? it
            : {
                ...it,
                missedPeriods: (it.missedPeriods ?? []).filter(
                  (p) => p !== periodKey
                ),
              }
        ),
      };
    });
    await fetch('/api/goals/toggle-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, isCompleted: true, periodKey }),
    });
  };

  const [backlog, setBacklog] = useState<BacklogEntry[]>([]);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const entries: BacklogEntry[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdueItem = (item: ApiGoalItem) => {
      if (!item.targetDate) return false;
      const target = new Date(item.targetDate);
      target.setHours(0, 0, 0, 0);
      return target < today;
    };

    categories.forEach((cat) => {
      const items = listing[cat] || [];
      items.forEach((it) => {
        if (!it.completed && isOverdueItem(it)) {
          entries.push({ ...it, category: cat, source: 'goal' });
        }
      });
    });

    fetch('/api/todos?all=true')
      .then((r) => r.json())
      .then((todos: Todo[]) => {
        const todoEntries: BacklogEntry[] = todos
          .filter((t) => !t.completed && new Date(t.createdAt) < today)
          .map((t) => ({
            id: t.id,
            text: t.text,
            completed: t.completed,
            createdAt: t.createdAt,
            category: 'ROUTINE',
            source: 'todo',
          }));
        setBacklog([...entries, ...todoEntries]);
        setCompletedTodos(todos.filter((t) => t.completed));
      });
  }, [listing]);

  const toggleItem = async (cat: string, idx: number) => {
    const arr = listing[cat] || [];
    const item = arr[idx];
    if (!item) return;
    const newCompleted = !item.completed;
    const next = arr.map((it, i) =>
      i === idx ? { ...it, completed: newCompleted } : it
    );
    setListing((prev) => ({ ...prev, [cat]: next }));

    if (item.isRepetitive && item.id) {
      await fetch('/api/goals/toggle-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: item.id, isCompleted: newCompleted }),
      });
    } else {
      await fetch(`/api/goals/${cat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next }),
      });
    }
  };

  const deleteItem = async (cat: string, idx: number) => {
    const arr = listing[cat] || [];
    const next = arr.filter((_, i) => i !== idx);
    setListing((prev) => ({ ...prev, [cat]: next }));
    await fetch(`/api/goals/${cat}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: next }),
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFutureItem = (item: ApiGoalItem) => {
    if (!item.startDate) return false;
    const start = new Date(item.startDate);
    start.setHours(0, 0, 0, 0);
    return start > today;
  };

  const renderItem = (cat: string, it: ApiGoalItem, idx: number) => (
    <div
      key={`${cat}-${idx}`}
      className="flex items-center justify-between py-1 group hover:bg-slate-50 rounded-lg px-2 transition"
    >
      <div className="flex items-center gap-2">
        <div
          onClick={() => toggleItem(cat, idx)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition shrink-0
            ${
              it.completed
                ? 'bg-green-500 border-green-500'
                : 'border-slate-300 hover:border-green-400'
            }`}
        >
          {it.completed && <Check size={14} className="text-white" />}
        </div>
        <span className={it.completed ? 'line-through text-slate-400' : ''}>
          {it.text}
        </span>
        {it.startDate && (
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
            {formatHumanDate(it.startDate)}
            <span className="text-[0.6rem] text-slate-400 uppercase">
              start
            </span>
          </span>
        )}
        {it.targetDate && (
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
            {formatHumanDate(it.targetDate)}
            <span className="text-[0.6rem] text-slate-400 uppercase">
              deadline
            </span>
          </span>
        )}
        {it.isRepetitive && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md border shadow-sm">
            repetitive
          </span>
        )}
      </div>
      <button
        onClick={() => deleteItem(cat, idx)}
        className="text-red-500 hover:text-red-700"
        aria-label="Delete item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const isOverdue = (item: ApiGoalItem) => {
    if (!item.targetDate) return false;
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  type Entry = { item: ApiGoalItem; origIdx: number };
  const currentByCategory: Record<string, Entry[]> = {};
  const futureByCategory: Record<string, Entry[]> = {};
  const completedByCategory: Record<string, Entry[]> = {};
  const backlogByCategory: Record<string, Entry[]> = {};

  categories.forEach((cat) => {
    const items = listing[cat] || [];
    currentByCategory[cat] = [];
    futureByCategory[cat] = [];
    completedByCategory[cat] = [];
    backlogByCategory[cat] = [];
    items.forEach((it, idx) => {
      const entry = { item: it, origIdx: idx };
      if (it.completed) {
        completedByCategory[cat].push(entry);
      } else if (isFutureItem(it)) {
        futureByCategory[cat].push(entry);
      } else if (isOverdue(it)) {
        backlogByCategory[cat].push(entry);
      } else {
        currentByCategory[cat].push(entry);
      }
    });
  });

  const hasCurrentItems = categories.some(
    (cat) => currentByCategory[cat].length > 0
  );
  const hasFutureItems = categories.some(
    (cat) => futureByCategory[cat].length > 0
  );
  const hasCompletedItems = categories.some(
    (cat) => completedByCategory[cat].length > 0
  );
  const hasBacklogItems = categories.some(
    (cat) => backlogByCategory[cat].length > 0
  );

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold uppercase mb-3 text-green-700 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Current Goals
        </h2>
        {!hasCurrentItems && (
          <p className="text-sm text-slate-400 italic">No current goals yet.</p>
        )}
        <div className="space-y-4">
          {categories.map((cat) => {
            const entries = currentByCategory[cat];
            if (entries.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                  {categoryLabelMap[cat] || cat.toLowerCase()}
                </h3>
                {entries.map(({ item, origIdx }) =>
                  renderItem(cat, item, origIdx)
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Future Goals Column */}
      <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold uppercase mb-3 text-indigo-700 flex items-center gap-2">
          <CalendarClock className="w-5 h-5" />
          Upcoming Goals
        </h2>
        {!hasFutureItems && (
          <p className="text-sm text-slate-400 italic">
            No future goals yet. Goals with a start date after today will appear
            here.
          </p>
        )}
        <div className="space-y-4">
          {categories.map((cat) => {
            const entries = futureByCategory[cat];
            if (entries.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                  {categoryLabelMap[cat] || cat.toLowerCase()}
                </h3>
                {entries.map(({ item, origIdx }) =>
                  renderItem(cat, item, origIdx)
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Goals */}
      <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold uppercase mb-3 text-emerald-600 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Completed
        </h2>
        {!hasCompletedItems && completedTodos.length === 0 && (
          <p className="text-sm text-slate-400 italic">
            No completed goals yet.
          </p>
        )}
        <div className="space-y-4">
          {categories.map((cat) => {
            const entries = completedByCategory[cat];
            if (entries.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                  {categoryLabelMap[cat] || cat.toLowerCase()}
                </h3>
                {entries.map(({ item, origIdx }) =>
                  renderItem(cat, item, origIdx)
                )}
              </div>
            );
          })}

          {/* Completed routine todos */}
          {completedTodos.length > 0 && (
            <div>
              <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                Routine todos
              </h3>
              {completedTodos.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1 group hover:bg-slate-50 rounded-lg px-2 transition"
                >
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => unmarkTodoComplete(t.id)}
                      className="w-5 h-5 rounded-full bg-green-500 border-green-500 border flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-200 hover:border-slate-300 transition"
                      title="Unmark as complete"
                    >
                      <Check size={12} className="text-white" />
                    </div>
                    <span className="line-through text-slate-400 text-sm">
                      {t.text}
                    </span>
                    <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
                      {formatHumanDate(t.createdAt)}
                      <span className="text-[0.6rem] text-slate-400 uppercase">
                        added
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      setCompletedTodos((prev) =>
                        prev.filter((x) => x.id !== t.id)
                      );
                      await fetch(`/api/todos/${t.id}`, { method: 'DELETE' });
                    }}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Delete todo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backlog - overdue incomplete tasks */}
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold uppercase mb-3 text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Backlog
        </h2>
        {!hasBacklogItems && (
          <p className="text-sm text-slate-400 italic">
            No overdue tasks. You&apos;re on track!
          </p>
        )}
        <div className="space-y-4">
          {categories.map((cat) => {
            const entries = backlogByCategory[cat];
            if (entries.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                  {categoryLabelMap[cat] || cat.toLowerCase()}
                </h3>
                {entries.map(({ item, origIdx }) => (
                  <div
                    key={`${cat}-${origIdx}`}
                    className="flex items-center justify-between py-1 group hover:bg-red-50 rounded-lg px-2 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        onClick={() => toggleItem(cat, origIdx)}
                        className="w-5 h-5 rounded-full border border-slate-300 hover:border-green-400 flex items-center justify-center cursor-pointer transition shrink-0"
                      />
                      <span>{item.text}</span>
                      {item.targetDate && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm flex flex-col items-center">
                          {formatHumanDate(item.targetDate)}
                          <span className="text-[0.6rem] text-red-400 uppercase">
                            overdue
                          </span>
                        </span>
                      )}
                      {item.isRepetitive && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md border shadow-sm">
                          repetitive
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteItem(cat, origIdx)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Missed periods for repetitive goals */}
          {categories.map((cat) => {
            const items = listing[cat] ?? [];
            const withMissed = items.filter(
              (it) => it.isRepetitive && (it.missedPeriods?.length ?? 0) > 0
            );
            if (withMissed.length === 0) return null;
            return (
              <div key={`missed-${cat}`}>
                <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                  {categoryLabelMap[cat] || cat.toLowerCase()} — missed periods
                </h3>
                {withMissed.map((it) =>
                  (it.missedPeriods ?? []).map((pk) => (
                    <div
                      key={`${it.id}-${pk}`}
                      className="flex items-center justify-between py-1 group hover:bg-red-50 rounded-lg px-2 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() =>
                            it.id && markPeriodComplete(cat, it.id, pk)
                          }
                          className="w-5 h-5 rounded-full border border-slate-300 hover:border-green-400 hover:bg-green-50 flex items-center justify-center cursor-pointer transition shrink-0"
                          title="Mark this period as complete"
                        >
                          <Check
                            size={11}
                            className="text-slate-300 group-hover:text-green-400"
                          />
                        </div>
                        <span className="text-sm text-slate-700 truncate">
                          {it.text}
                        </span>
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                          {pk}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}

          {backlog.filter((e) => e.source === 'todo').length > 0 && (
            <div>
              <h3 className="font-semibold capitalize text-sm text-slate-600 mb-1">
                Routine todos
              </h3>
              {backlog
                .filter((e) => e.source === 'todo')
                .map((e, idx) => (
                  <div
                    key={`todo-${idx}`}
                    className="flex items-center justify-between py-1 group hover:bg-red-50 rounded-lg px-2 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        onClick={() => e.id && markTodoComplete(e.id)}
                        className="w-5 h-5 rounded-full border border-slate-300 hover:border-green-400 hover:bg-green-50 flex items-center justify-center cursor-pointer transition shrink-0"
                        title="Mark as complete"
                      >
                        <Check
                          size={11}
                          className="text-slate-300 group-hover:text-green-400"
                        />
                      </div>
                      <span className="text-sm text-slate-700">{e.text}</span>
                      {e.createdAt && (
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
                          {formatHumanDate(e.createdAt)}
                          <span className="text-[0.6rem] text-slate-400 uppercase">
                            added
                          </span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => e.id && deleteTodoFromBacklog(e.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Delete todo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoalSettings() {
  const todayLabel = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const [dateTodos, setDateTodos] = useState<Record<string, Todo[]>>({});
  const [showTodoOverlay, setShowTodoOverlay] = useState(false);

  const categoryOptions = [
    { label: `Todos (${todayLabel})`, value: 'ROUTINE' },
    { label: 'Daily goals', value: 'DAILY' },
    { label: 'Weekly goals', value: 'WEEKLY' },
    { label: 'Monthly goals', value: 'MONTHLY' },
    { label: 'Long‑term goals', value: 'LONGTERM' },
    { label: 'Passion goals', value: 'PASSION' },
    { label: 'When bored', value: 'BOREDOM' },
    { label: 'Random targets', value: 'RANDOM' },
  ];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    'ROUTINE'
  );
  const [categoryItems, setCategoryItems] = useState<
    {
      id?: string;
      text: string;
      startDate?: string;
      targetDate?: string;
      completed?: boolean;
      isRepetitive?: boolean;
    }[]
  >([]);
  const handleAdd = async (text: string) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const todo: Todo = await res.json();

    setDateTodos((prev) => {
      const newMap = {
        ...prev,
        [todayLabel]: prev[todayLabel] ? [...prev[todayLabel], todo] : [todo],
      };
      return newMap;
    });
  };

  async function loadCategory(cat: string) {
    if (!cat) {
      setSelectedCategory(null);
      setCategoryItems([]);
      return;
    }
    setSelectedCategory(cat);
    if (cat === 'ROUTINE') {
      return;
    }
    const res = await fetch(`/api/goals/${cat}`);
    if (res.ok) {
      const data = await res.json();
      const items = data.items.map((i: ApiGoalItem) => ({
        id: i.id,
        text: i.text,
        startDate: i.startDate
          ? new Date(i.startDate).toISOString().slice(0, 10)
          : undefined,
        targetDate: i.targetDate
          ? new Date(i.targetDate).toISOString().slice(0, 10)
          : undefined,
        completed: !!i.completed,
        isRepetitive: !!i.isRepetitive,
      }));
      setCategoryItems(items);
    } else {
      setCategoryItems([]);
    }
  }

  useEffect(() => {
    fetch('/api/todos')
      .then((r) => r.json())
      .then((list: Todo[]) => {
        const today = new Date();
        const todayTodos = list.filter((t) => {
          const d = new Date(t.createdAt);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        });
        const grouped: Record<string, Todo[]> = {};
        if (todayTodos.length) {
          grouped[todayLabel] = todayTodos;
        }
        setDateTodos(grouped);
      });
  }, [todayLabel]);
  const headerControls = (
    <div className="flex items-center gap-2">
      <select
        value={selectedCategory || ''}
        onChange={(e) => loadCategory(e.target.value)}
        className="px-4 py-2 border rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
      >
        {categoryOptions.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
  const saveCategory = async (
    itemsToSave?: {
      text: string;
      targetDate?: string;
      startDate?: string;
      isRepetitive?: boolean;
      completed?: boolean;
    }[]
  ) => {
    if (!selectedCategory || selectedCategory === 'ROUTINE') return;
    const payload = itemsToSave ?? categoryItems;
    const showTarget = !['DAILY', 'BOREDOM', 'PASSION'].includes(
      selectedCategory!
    );

    const clean = payload.map((it) => {
      const { targetDate, startDate, isRepetitive, ...rest } =
        it as ApiGoalItem;
      const obj: Record<string, unknown> = { ...rest };
      if (startDate) obj.startDate = startDate;
      if (isRepetitive) obj.isRepetitive = isRepetitive;
      if (showTarget && targetDate) obj.targetDate = targetDate;
      return obj;
    });

    await fetch(`/api/goals/${selectedCategory}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: clean }),
    });
  };

  const updateTodoRemote = async (id: string, data: Partial<Todo>) => {
    setDateTodos((prev) => {
      const copy: Record<string, Todo[]> = {};
      Object.entries(prev).forEach(([k, arr]) => {
        copy[k] = arr.map((t) => (t.id === id ? { ...t, ...data } : t));
      });
      return copy;
    });

    if (selectedCategory === 'ROUTINE') {
    }

    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  const deleteTodoRemote = async (id: string) => {
    setDateTodos((prev) => {
      const copy: Record<string, Todo[]> = {};
      Object.entries(prev).forEach(([k, arr]) => {
        copy[k] = arr.filter((t) => t.id !== id);
      });
      return copy;
    });

    if (selectedCategory === 'ROUTINE') {
      loadCategory('ROUTINE');
    }

    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Goal Setter</h1>
      </div>

      <div className="mb-10">
        {selectedCategory === 'ROUTINE' ? (
          <ModernTodoCard
            title={`Today's Todos (${todayLabel})`}
            todos={dateTodos[todayLabel] || []}
            onAdd={handleAdd}
            onToggle={(id, completed) => updateTodoRemote(id, { completed })}
            onDelete={(id) => deleteTodoRemote(id)}
            headerRight={headerControls}
            onShowAll={() => setShowTodoOverlay(true)}
          />
        ) : (
          (() => {
            const showTarget = !['DAILY', 'BOREDOM', 'PASSION'].includes(
              selectedCategory || ''
            );
            const showStart =
              selectedCategory === 'DAILY' ||
              ['WEEKLY', 'MONTHLY', 'RANDOM'].includes(selectedCategory || '');

            return (
              <ModernCategoryCard
                title={
                  categoryOptions.find((c) => c.value === selectedCategory)
                    ?.label || ''
                }
                items={categoryItems}
                onAdd={(text, startDate, targetDate, isRepetitive) => {
                  const next = [
                    ...categoryItems,
                    {
                      text,
                      ...(startDate ? { startDate } : {}),
                      ...(targetDate ? { targetDate } : {}),
                      ...(isRepetitive ? { isRepetitive } : {}),
                      completed: false,
                    },
                  ];
                  setCategoryItems(next);
                  saveCategory(next);
                }}
                onToggle={(idx, completed) => {
                  const item = categoryItems[idx];
                  if (item.isRepetitive && item.id) {
                    const next = categoryItems.map((it, i) =>
                      i === idx ? { ...it, completed } : it
                    );
                    setCategoryItems(next);
                    fetch('/api/goals/toggle-log', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        goalId: item.id,
                        isCompleted: completed,
                      }),
                    });
                    return;
                  }
                  const next = categoryItems.map((it, i) =>
                    i === idx ? { ...it, completed } : it
                  );
                  setCategoryItems(next);
                  saveCategory(next);
                }}
                onDelete={(idx) => {
                  const next = categoryItems.filter((_, i) => i !== idx);
                  setCategoryItems(next);
                  saveCategory(next);
                }}
                headerRight={headerControls}
                showStartDate={showStart}
                showTargetDate={showTarget}
                showRepetitiveCheckbox={['DAILY', 'WEEKLY', 'MONTHLY'].includes(
                  selectedCategory || ''
                )}
              />
            );
          })()
        )}
      </div>
      <GoalsOverview />
      <TodoOverlay
        show={showTodoOverlay}
        onClose={() => setShowTodoOverlay(false)}
      />
    </div>
  );
}

function ModernTodoCard({
  title,
  todos,
  onToggle,
  onDelete,
  onAdd,
  headerRight,
  onShowAll,
}: {
  title: string;
  todos: Todo[];
  onToggle: (id: string, newCompletedState: boolean) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string) => Promise<void>;
  headerRight?: React.ReactNode;
  onShowAll?: () => void;
}) {
  const [input, setInput] = useState('');

  const addTodo = async () => {
    if (!input.trim()) return;
    await onAdd(input.trim());
    setInput('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="text-sm text-indigo-600 hover:underline"
          >
            Show previous todos
          </button>
        )}
        {headerRight}
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 group hover:bg-slate-100 transition"
          >
            <div
              onClick={() => onToggle(todo.id, !todo.completed)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition
                  ${
                    todo.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-300'
                  }`}
              >
                {todo.completed && <Check size={14} className="text-white" />}
              </div>
              <p
                className={`text-sm ${
                  todo.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-700'
                }`}
              >
                {todo.text}
              </p>
            </div>

            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTodo();
            }
          }}
          placeholder="What do you need to do?"
          className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={addTodo}
          disabled={!input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1 disabled:opacity-50 transition"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </div>
  );
}

function ModernCategoryCard({
  title,
  items,
  onAdd,
  onDelete,
  onToggle,
  headerRight,
  includeDate = true,
  showStartDate,
  showTargetDate,
  showRepetitiveCheckbox = false,
}: {
  title: string;
  items: {
    id?: string;
    text: string;
    startDate?: string;
    targetDate?: string;
    completed?: boolean;
    isRepetitive?: boolean;
  }[];
  onAdd: (
    text: string,
    startDate?: string,
    targetDate?: string,
    isRepetitive?: boolean
  ) => void;
  onDelete: (index: number) => void;
  onToggle?: (index: number, completed: boolean) => void;
  headerRight?: React.ReactNode;
  includeDate?: boolean;
  showStartDate?: boolean;
  showTargetDate?: boolean;
  showRepetitiveCheckbox?: boolean;
}) {
  const [input, setInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isRepetetive, setIsRepetetive] = useState(false);

  const displayStart =
    showStartDate !== undefined ? showStartDate : includeDate;
  const displayTarget =
    showTargetDate !== undefined ? showTargetDate : includeDate;
  const handelrepetetivecheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsRepetetive((prev) => !prev);
  };
  const getHint = (catTitle: string) => {
    const key = catTitle.toLowerCase();
    switch (key) {
      case 'daily goals':
        return 'Start your day by writing one achievable task in brackets – nothing added yet? (try jotting down a focused activity to build momentum)';
      case 'weekly goals':
        return 'Plan a goal for the week – (e.g. "prepare for interview") so you stay on track.';
      case 'monthly goals':
        return 'Add a monthly milestone to move your project or learning forward.';
      case 'long‑term goals':
        return 'Enter a big ambition here; thinking ahead keeps you motivated.';
      case 'passion goals':
        return 'What excites you? Add a passion project idea to stay creative.';
      case 'when bored':
        return 'Nothing added yet? Use downtime to add something that sparks focus and creativity to avoid bad habits.';
      case 'random targets':
        return 'Add a random task – something small or fun to break the routine.';
      default:
        return '';
    }
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    const startDateArg =
      displayStart && startDateInput ? startDateInput : undefined;
    const targetDateArg = displayTarget && targetDate ? targetDate : undefined;
    onAdd(input.trim(), startDateArg, targetDateArg, isRepetetive);
    setInput('');
    setStartDateInput('');
    setTargetDate('');
    setIsRepetetive(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {headerRight}
      </div>

      <div className="space-y-2 mb-4">
        {items.map((itm, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 group hover:bg-slate-100 transition"
          >
            <div
              onClick={() => onToggle?.(idx, !itm.completed)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition
                  ${
                    itm.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-300'
                  }`}
              >
                {itm.completed && <Check size={14} className="text-white" />}
              </div>
              <p
                className={`text-sm ${
                  itm.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-700'
                }`}
              >
                {itm.text}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(displayStart || displayTarget || itm.isRepetitive) && (
                <div className="flex items-center gap-1">
                  {displayStart && itm.startDate && (
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
                      {formatHumanDate(itm.startDate)}
                      <span className="text-[0.6rem] text-slate-400 ">
                        start
                      </span>
                    </span>
                  )}
                  {displayTarget && (
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
                      {itm.targetDate
                        ? formatHumanDate(itm.targetDate)
                        : 'no date selected yet'}
                      {itm.targetDate && (
                        <span className="text-[0.6rem] text-slate-400 ">
                          deadline
                        </span>
                      )}
                    </span>
                  )}
                  {itm.isRepetitive && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md border shadow-sm">
                      repetitive
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => onDelete(idx)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400 italic py-2">
            No items in this category yet.
            {title && (
              <span className="block mt-1 text-xs text-slate-500">
                {getHint(title)}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="What is your goal?"
          className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(displayTarget || displayStart) && (
          <div className="flex flex-col">
            {displayTarget && (
              <>
                <label htmlFor="deadline" className="">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  placeholder="Deadline"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-auto px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600"
                />
              </>
            )}
            {displayStart && (
              <>
                <label htmlFor="startDate" className="mt-2">
                  Start date
                </label>
                <input
                  id="startDate"
                  type="date"
                  placeholder="Start date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-auto px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600"
                />
              </>
            )}
          </div>
        )}
        {showRepetitiveCheckbox && (
          <label>
            <input
              type="checkbox"
              checked={isRepetetive}
              onChange={handelrepetetivecheck}
              className=""
            />
            repetetive goal
          </label>
        )}

        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1 disabled:opacity-50 transition"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </div>
  );
}
