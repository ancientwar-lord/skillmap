import { motion } from 'framer-motion';
import { PinOff, MapPin, ListTodo, CheckCircle2, Target } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { RoadmapSummary, GoalItem } from '../lib/types';
import { formatDate, slugify } from '@/lib/utils';

interface Props {
  roadmaps: RoadmapSummary[];
  goals: GoalItem[];
  togglePin: (id: string) => void;
  toggleGoalPin: (id: string) => void;
  openRoadmap: (slug: string) => void;
}

export default function PinnedTargets({
  roadmaps,
  goals,
  togglePin,
  toggleGoalPin,
  openRoadmap,
}: Props) {
  return (
    <section className="lg:col-span-2 bg-white rounded-2xl border border-purple-200/60 shadow-sm shadow-purple-100/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50/60">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-700" />
          <h2 className="text-lg font-semibold text-purple-900">
            Your Locked Targets
          </h2>
        </div>
        <p className="text-xs text-purple-500 mt-1">
          Pinned roadmaps & goals you`re focused on
        </p>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {roadmaps.length === 0 && goals.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No pinned targets yet</p>
            <p className="text-xs mt-1">
              Pin roadmaps from Archived section or goals below
            </p>
          </div>
        ) : (
          <>
            {roadmaps.map((roadmap) => (
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
            ))}

            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group relative p-3 rounded-xl border border-purple-100 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/40 hover:shadow-md hover:shadow-purple-100/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate text-sm">
                      {goal.text}
                    </h3>
                    {goal.category && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {goal.category.toLowerCase()} goal
                      </p>
                    )}
                    {goal.targetDate && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        due {formatDate(goal.targetDate)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleGoalPin(goal.id)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    title="Unpin goal"
                  >
                    <PinOff className="w-4 h-4 text-purple-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
