import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Pin, PinOff, ListTodo, CheckCircle2 } from 'lucide-react';
import { RoadmapSummary } from '../lib/types';
import { slugify } from '@/lib/utils';
import ProgressBar from './ProgressBar';

interface Props {
  show: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roadmaps: RoadmapSummary[];
  pinnedIds: Set<string>;
  togglePin: (id: string) => void;
  openRoadmap: (slug: string) => void;
}

export default function RoadmapOverlay({
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  roadmaps,
  pinnedIds,
  togglePin,
  openRoadmap,
}: Props) {
  const filteredRoadmaps = roadmaps.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-purple-200/60 overflow-hidden max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-violet-50/60">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-900">
                  All Roadmaps
                </h2>
                <button
                  onClick={() => {
                    onClose();
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roadmaps by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredRoadmaps.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No roadmaps found</p>
                </div>
              ) : (
                filteredRoadmaps.map((roadmap) => {
                  const isPinned = pinnedIds.has(roadmap.id);
                  return (
                    <motion.div
                      key={roadmap.id}
                      layout
                      className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-gradient-to-r hover:from-white hover:to-purple-50/40 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        onClose();
                        setSearchQuery('');
                        openRoadmap(slugify(roadmap.title));
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">
                            {roadmap.title}
                          </h3>
                          {isPinned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {roadmap.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 max-w-[200px]">
                            <ProgressBar value={roadmap.progress} />
                          </div>
                          <span className="text-xs text-slate-500">
                            {roadmap.progress}%
                          </span>
                          <div className="flex items-center gap-2 ml-auto text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <ListTodo size={11} />
                              {roadmap.taskCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2
                                size={11}
                                className="text-green-500"
                              />
                              {roadmap.completedSubtasks}/{roadmap.subtaskCount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(roadmap.id);
                        }}
                        className={`shrink-0 p-2 rounded-lg transition-all ${
                          isPinned
                            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            : 'text-slate-400 hover:bg-purple-50 hover:text-purple-500'
                        }`}
                        title={isPinned ? 'Unpin' : 'Pin to targets'}
                      >
                        {isPinned ? (
                          <PinOff className="w-4 h-4" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80">
              <p className="text-xs text-slate-400 text-center">
                {filteredRoadmaps.length} roadmap
                {filteredRoadmaps.length !== 1 ? 's' : ''} found
                {' · '}
                {pinnedIds.size} pinned
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
