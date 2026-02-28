import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Circle, CheckCircle2 } from 'lucide-react';
import { Todo } from '../lib/types';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function TodoOverlay({ show, onClose }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!show) return;
    fetch('/api/todos?all=true')
      .then((r) => r.json())
      .then((list: Todo[]) => setTodos(list))
      .catch(() => setTodos([]));
  }, [show]);

  const toggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed: !todos.find((t) => t.id === id)?.completed,
      }),
    }).catch(() => {});
  };

  const grouped: Record<string, Todo[]> = {};
  todos.forEach((t) => {
    const d = new Date(t.createdAt);
    const key = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    (grouped[key] ||= []).push(t);
  });

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).valueOf() - new Date(a).valueOf()
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Previous Todos</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sortedDates.length === 0 ? (
                <p className="text-center text-slate-400 py-12">
                  No todos found.
                </p>
              ) : (
                sortedDates.map((date) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                      {date}
                    </h3>
                    <div className="space-y-2">
                      {grouped[date].map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-xl"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggle(t.id)}
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                            <span
                              className={`text-sm ${
                                t.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-700'
                              }`}
                            >
                              {t.text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80">
              <p className="text-xs text-slate-400 text-center">
                {todos.length} todo{todos.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
