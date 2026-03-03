import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Search, X, Pin, PinOff } from 'lucide-react';
import { GoalItem } from '../lib/types';

interface Props {
  show: boolean;
  onClose: () => void;
  goals: GoalItem[];
  toggleGoalPin: (id: string) => void;
}

export default function GoalsOverlay({
  show,
  onClose,
  goals,
  toggleGoalPin,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = goals.filter((g) =>
    g.text.toLowerCase().includes(query.toLowerCase())
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
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-sky-50/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">All Goals</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by text..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No goals found</p>
                </div>
              ) : (
                filtered.map((goal) => (
                  <motion.div
                    key={goal.id}
                    layout
                    className="group flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-gradient-to-r hover:from-white hover:to-purple-50/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          goal.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {goal.text}
                      </p>
                      {goal.category && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {goal.category.toLowerCase()}
                        </p>
                      )}
                      {goal.targetDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          due {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleGoalPin(goal.id)}
                      className="group shrink-0 p-2 rounded-lg transition-all hover:bg-purple-50"
                      title={goal.isPinned ? 'Unpin' : 'Pin'}
                    >
                      {goal.isPinned ? (
                        <PinOff className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Pin className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80">
              <p className="text-xs text-slate-400 text-center">
                {filtered.length} goal{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
