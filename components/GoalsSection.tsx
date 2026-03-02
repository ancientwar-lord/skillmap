import { Pin, PinOff, ClipboardList, Eye } from 'lucide-react';
import { GoalItem } from '../lib/types';
import { formatDate } from '../lib/utils';

interface Props {
  goals: GoalItem[];
  visibleGoals: GoalItem[];
  toggleGoalPin: (id: string) => void;
  onShowAll?: () => void;
}

export default function GoalsSection({
  goals,
  visibleGoals,
  toggleGoalPin,
  onShowAll,
}: Props) {
  return (
    <section className="bg-white rounded-2xl border border-blue-200/60 shadow-sm shadow-blue-100/40 overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-blue-900">Your Goals</h2>
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
      </div>
      <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
        {visibleGoals.length === 0 ? (
          <p className="text-sm text-slate-400">
            {goals.length === 0
              ? 'No goals added yet.'
              : 'All goals are pinned (locked targets)'}
          </p>
        ) : (
          visibleGoals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between">
              <span
                className={`text-sm truncate ${
                  goal.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-700'
                }`}
              >
                {goal.text}
                {goal.category && (
                  <span className="text-xs text-slate-400 ml-2">
                    {goal.category.toLowerCase()}
                  </span>
                )}
                {goal.targetDate && (
                  <span className="text-xs text-slate-400 ml-2">
                    due {formatDate(goal.targetDate)}
                  </span>
                )}
              </span>
              <button
                onClick={() => toggleGoalPin(goal.id)}
                className="p-1 text-blue-500 hover:text-blue-700"
                title={goal.isPinned ? 'Unpin target' : 'Pin target'}
              >
                {goal.isPinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
