import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Todo } from '../lib/types';
import { useState } from 'react';

interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onShowAll?: () => void;
}

export default function TodoSection({
  todos,
  onToggle,
  onAdd,
  onDelete,
  onShowAll,
}: Props) {
  const [input, setInput] = useState('');

  return (
    <section className="lg:col-span-1 bg-white rounded-2xl border border-blue-200/60 shadow-sm shadow-blue-100/40 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today`s Todos</h2>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="text-sm text-indigo-600 hover:underline"
          >
            Show previous todos
          </button>
        )}
      </div>
      {/* scrolling list */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <button onClick={() => onToggle(todo.id)}>
                {todo.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </button>
              <span
                className={`text-sm ${
                  todo.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-700'
                }`}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => onDelete(todo.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove todo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {/* sticky footer input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white sticky bottom-0">
        <div className="flex gap-2">
          <textarea
            id="new-routine"
            rows={2}
            placeholder="What do you need to do?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={() => {
              if (input.trim()) {
                onAdd(input.trim());
                setInput('');
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
