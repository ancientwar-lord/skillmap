'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Rocket,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Book,
  X,
  Youtube,
  FileText,
  BookOpen,
  ExternalLink,
  Dumbbell,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Watercomponent from './WaterProgress';

interface SubTask {
  $id: string;
  title: string;
  completed: boolean;
}

interface TaskResources {
  youtubeLinks?: string[];
  articles?: string[];
  selfstudyReferences?: string[];
  practiceLinks?: string[];
}

interface RoadmapTask {
  taskId: string;
  title: string;
  tag?: string;
  resources?: TaskResources | null;
  subtasks: SubTask[];
}

interface RoadmapProps {
  title: string;
  description?: string;
  roadmapData: RoadmapTask[];
  onToggleSubtask?: (subtaskId: string) => void;
}

const Roadmap: React.FC<RoadmapProps> = ({
  title,
  description,
  roadmapData = [],
  onToggleSubtask,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allSubtasks = roadmapData.flatMap((t) => t.subtasks || []);
  const totalSub = allSubtasks.length;
  const completeSub = allSubtasks.filter((s) => s.completed).length;
  const overallProgress =
    totalSub === 0 ? 0 : Math.round((completeSub / totalSub) * 100);

  return (
    <div className="min-h-screen  py-12 px-4 overflow-hidden font-sans ">
      <div className="max-w-4xl mx-auto bg-sky-50 p-4 rounded-4xl">
        <header className="sticky top-4 z-40 mb-1">
          <div className="relative w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-blue-800 to-gray-900">
                  {title}
                </span>
              </h1>
              {description && (
                <p className="mt-2 text-gray-600">{description}</p>
              )}
            </div>
            <div className="flex justify-between items-end px-1">
              <span className="pl-14 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Completed: {completeSub} / {totalSub}
              </span>
              <span className="pr-14 text-xs font-bold text-red-900 uppercase tracking-widest">
                {overallProgress}% Done
              </span>
            </div>
            <Watercomponent progressMeter={overallProgress} />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold text-black/20 uppercase tracking-[0.2em]">
              {overallProgress === 100 ? 'Congratulations!' : `Keep Going!`}
            </span>
          </div>
        </header>
        <div className="relative pt-10 pb-32">
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
            <div className="w-px h-full border-l-2 border-dashed border-indigo-800" />
          </div>
          {roadmapData.map((task, index) => (
            <RoadmapNode
              key={task.taskId}
              index={index}
              task={task}
              isExpanded={expandedId === task.taskId}
              onToggle={() =>
                setExpandedId(expandedId === task.taskId ? null : task.taskId)
              }
              onToggleSubtask={onToggleSubtask}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

const SubtaskList = ({
  task,
  onToggleSubtask,
}: {
  task: RoadmapTask;
  onToggleSubtask?: (subtaskId: string) => void;
}) => {
  return (
    <div className="mt-6 w-full max-w-md mx-auto bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="p-4 space-y-2">
        {task.subtasks.map((sub) => (
          <div
            key={sub.$id}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSubtask?.(sub.$id);
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200 cursor-pointer hover:shadow-sm
              ${
                sub.completed
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-white border-gray-100'
              }`}
          >
            {sub.completed ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <Circle size={18} className="text-gray-700 shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                sub.completed ? 'text-gray-500 line-through' : 'text-gray-700'
              }`}
            >
              {sub.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RoadmapNode = ({
  task,
  index,
  isExpanded,
  onToggle,
  onToggleSubtask,
}: {
  task: RoadmapTask;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
}) => {
  const [offset, setOffset] = useState(0);
  const [showResources, setShowResources] = useState(false);

  const total = task.subtasks.length;
  const completed = task.subtasks.filter((s) => s.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isCompleted = percentage === 100;

  const Icon = isCompleted ? Trophy : Rocket;

  useEffect(() => {
    const calculatePosition = () => {
      const cycleIndex = index % 6;
      let indentationMultiplier = 0;

      if (cycleIndex === 1 || cycleIndex === 2) indentationMultiplier = -1;
      else if (cycleIndex === 4 || cycleIndex === 5) indentationMultiplier = 1;

      const isMobile = window.innerWidth < 768;
      const baseUnit = isMobile ? window.innerWidth / 5 : 80;

      setOffset(indentationMultiplier * baseUnit);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [index]);

  const isTextOnRight = offset <= 0;

  return (
    <div className="relative flex flex-col items-center mb-8 z-10">
      {index !== 0 && (
        <div className="absolute -top-12 h-12 w-0.5 bg-gray-200 -z-10" />
      )}

      <div
        className="relative group cursor-pointer transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={onToggle}
      >
        <div
          className={`absolute top-5 w-60 flex flex-col justify-center
            ${isTextOnRight ? 'left-24 text-left' : 'right-24 text-right'}
            transition-all duration-300
          `}
        >
          <div
            className={`
             bg-white border px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all
             ${
               isExpanded
                 ? 'border-indigo-500 ring-4 ring-indigo-50'
                 : 'border-gray-200'
             }
          `}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (task.resources) setShowResources(true);
              }}
              className={`absolute right-1 top-1 p-0.5 rounded transition-colors ${
                task.resources
                  ? 'hover:bg-indigo-100 cursor-pointer'
                  : 'opacity-30 cursor-default'
              }`}
              title={
                task.resources ? 'View resources' : 'No resources available'
              }
            >
              <Book className="w-4 h-4 text-indigo-800" />
            </button>
            <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">
              {task.title}
            </h3>
            {task.tag && (
              <span className="text-[10px] uppercase font-bold text-red-900 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2">
                {task.tag}
              </span>
            )}
          </div>
        </div>

        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-lg shadow-gray-200/50 z-20 hover:scale-105 transition-transform duration-300">
          <CircularProgressbarWithChildren
            value={percentage}
            strokeWidth={6}
            styles={buildStyles({
              pathColor: isCompleted
                ? '#10b981'
                : percentage > 0
                  ? '#6366f1'
                  : '#a5b4fc',
              trailColor: '#e8ecf4',
              strokeLinecap: 'round',
              pathTransitionDuration: 0.8,
            })}
          >
            <div
              className={`
              w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center 
              border-2 
              ${
                isCompleted
                  ? isExpanded
                    ? 'bg-emerald-200 border-gray-100'
                    : 'bg-emerald-200/30 border-emerald-100'
                  : isExpanded
                    ? 'bg-indigo-400 border-indigo-400'
                    : 'bg-white border-gray-100'
              }
              transition-all duration-300
            `}
            >
              <Icon
                className={`w-7 h-7 md:w-9 md:h-9 transition-colors ${
                  isCompleted
                    ? 'text-emerald-600 drop-shadow-md'
                    : isExpanded
                      ? 'text-white'
                      : 'text-indigo-600'
                }`}
              />
            </div>
          </CircularProgressbarWithChildren>

          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-300">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <SubtaskList task={task} onToggleSubtask={onToggleSubtask} />
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showResources && task.resources && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowResources(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.div
                  className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-indigo-200/60 overflow-hidden max-h-[70vh] flex flex-col"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="w-5 h-5 text-indigo-700" />
                        <h3 className="font-semibold text-indigo-900 text-sm">
                          Resources
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowResources(false)}
                        className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                    <p className="text-xs text-indigo-500 mt-1 truncate">
                      {task.title}
                    </p>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <ResourceSection
                      icon={<Youtube className="w-4 h-4 text-red-500" />}
                      title="YouTube"
                      links={task.resources.youtubeLinks}
                    />
                    <ResourceSection
                      icon={<FileText className="w-4 h-4 text-blue-500" />}
                      title="Articles"
                      links={task.resources.articles}
                    />
                    <ResourceSection
                      icon={<BookOpen className="w-4 h-4 text-emerald-600" />}
                      title="Self-Study References"
                      links={task.resources.selfstudyReferences}
                    />
                    <ResourceSection
                      icon={<Dumbbell className="w-4 h-4 text-purple-500" />}
                      title="Practice"
                      links={task.resources.practiceLinks}
                    />

                    {!task.resources.youtubeLinks?.length &&
                      !task.resources.articles?.length &&
                      !task.resources.selfstudyReferences?.length &&
                      !task.resources.practiceLinks?.length && (
                        <p className="text-center text-sm text-slate-400 py-6">
                          No resources available for this task.
                        </p>
                      )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

const ResourceSection = ({
  icon,
  title,
  links,
}: {
  icon: React.ReactNode;
  title: string;
  links?: string[];
}) => {
  if (!links || links.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div className="space-y-1.5">
        {links.map((link, i) => (
          <a
            key={i}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all text-xs text-slate-600 hover:text-indigo-700 group"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex-1 truncate">{link}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
};
