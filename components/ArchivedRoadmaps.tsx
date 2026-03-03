import { motion } from 'framer-motion';
import { Archive, Eye, ListTodo, CheckCircle2, Pin } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { RoadmapSummary } from '../lib/types';
import { formatDate, slugify } from '@/lib/utils';

interface Props {
  archivedRoadmaps: RoadmapSummary[];
  openRoadmap: (slug: string) => void;
  togglePin: (id: string) => void;
  setShowOverlay: (b: boolean) => void;
}

export default function ArchivedRoadmaps({
  archivedRoadmaps,
  openRoadmap,
  togglePin,
  setShowOverlay,
}: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-sky-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Archived Roadmaps
            </h2>
          </div>
          <button
            onClick={() => setShowOverlay(true)}
            className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Show All
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Browse and pin your roadmaps
        </p>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {archivedRoadmaps.map((roadmap) => (
          <motion.div
            key={roadmap.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/30 hover:shadow-sm transition-all cursor-pointer"
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
                title="Pin to targets"
              >
                <Pin className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar value={roadmap.progress} />
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {roadmap.progress}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ListTodo size={12} />
                  {roadmap.taskCount} tasks
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {roadmap.completedSubtasks}/{roadmap.subtaskCount}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {formatDate(roadmap.createdAt)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
