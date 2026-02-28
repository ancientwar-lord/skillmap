'use client';

import { useState, useEffect } from 'react';
import TodoOverlay from './TodoOverlay';
import { Check, Trash2, Plus } from 'lucide-react';

function formatHumanDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear() % 100;
  return `${day} ${month} '${year.toString().padStart(2, '0')}`;
}

function getHint(key: string) {
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
  targetDate?: string;
  completed?: boolean;
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
          targetDate: i.targetDate,
        }));
        setListing((prev) => ({ ...prev, [cat]: items }));
      } else {
        setListing((prev) => ({ ...prev, [cat]: [] }));
      }
    });
  }, []);

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

  return (
    <div className="mb-6 space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="font-semibold capitalize">{cat.toLowerCase()}</h3>
          {(listing[cat] || []).length === 0 && (
            <p className="text-xs text-slate-400 italic">
              {getHint(categoryLabelMap[cat] || cat.toLowerCase())}
            </p>
          )}
          {(listing[cat] || []).map((it, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span>{it.text}</span>
                {it.targetDate && (
                  <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border shadow-sm flex flex-col items-center">
                    {formatHumanDate(it.targetDate)}
                    <span className="text-[0.6rem] text-slate-400 uppercase">
                      deadline
                    </span>
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
          ))}
        </div>
      ))}
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
    { id?: string; text: string; targetDate?: string; completed?: boolean }[]
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
        targetDate: i.targetDate
          ? new Date(i.targetDate).toISOString().slice(0, 10)
          : undefined,
        completed: !!i.completed,
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
    itemsToSave?: { text: string; targetDate?: string; completed?: boolean }[]
  ) => {
    if (!selectedCategory || selectedCategory === 'ROUTINE') return;
    const payload = itemsToSave ?? categoryItems;
    const clean = payload.map((it) => {
      if (['DAILY', 'BOREDOM', 'PASSION'].includes(selectedCategory!)) {
        const { text } = it as { text: string; targetDate?: string };
        return { text };
      }
      return it;
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
          <ModernCategoryCard
            title={
              categoryOptions.find((c) => c.value === selectedCategory)
                ?.label || ''
            }
            items={categoryItems}
            onAdd={(text, targetDate) => {
              const next = [
                ...categoryItems,
                {
                  text,
                  ...(targetDate ? { targetDate } : {}),
                  completed: false,
                },
              ];
              setCategoryItems(next);
              saveCategory(next);
            }}
            onToggle={(idx, completed) => {
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
            includeDate={
              !['DAILY', 'BOREDOM', 'PASSION'].includes(selectedCategory || '')
            }
          />
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
}: {
  title: string;
  items: {
    id?: string;
    text: string;
    targetDate?: string;
    completed?: boolean;
  }[];
  onAdd: (text: string, date?: string) => void;
  onDelete: (index: number) => void;
  onToggle?: (index: number, completed: boolean) => void;
  headerRight?: React.ReactNode;
  includeDate?: boolean;
}) {
  const [input, setInput] = useState('');
  const [dateInput, setDateInput] = useState('');

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
    const dateArg = includeDate && dateInput ? dateInput : undefined;
    onAdd(input.trim(), dateArg);
    setInput('');
    setDateInput('');
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
              {includeDate && (
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
        {includeDate && (
          <div className="flex flex-col">
            <label htmlFor="deadline" className="sr-only">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              aria-label="Deadline"
              placeholder="Deadline"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-auto px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600"
            />
          </div>
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
