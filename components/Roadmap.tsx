'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Watercomponent from './WaterProgress';
import AIResponseOverlay from './AIResponseOverlay';
import RoadmapNotes from '@/components/RoadmapNotes';

interface SubTask {
  $id: string;
  title: string;
  completed: boolean;
  ainotes?: string | null;
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
  ainotes?: string | null;
  resources?: TaskResources | null;
  subtasks: SubTask[];
}

interface RoadmapProps {
  title: string;
  description?: string;
  roadmapData: RoadmapTask[];
  roadmapId: string;
  initialNotes?: string | null;
  onToggleSubtask?: (subtaskId: string) => void;
  onAiNotesUpdate?: (
    type: 'task' | 'subtask',
    id: string,
    notes: string
  ) => void;
}

const Roadmap: React.FC<RoadmapProps> = ({
  title,
  description,
  roadmapData = [],
  roadmapId,
  initialNotes,
  onToggleSubtask,
  onAiNotesUpdate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiOverlay, setAiOverlay] = useState({
    isOpen: false,
    response: '',
    isLoading: false,
    title: '',
    chatKey: '',
    context: undefined as
      | { type: 'task' | 'subtask'; taskTitle: string; subtaskTitle?: string }
      | undefined,
  });

  const handleAiExplain = async (
    type: 'task' | 'subtask',
    id: string,
    taskTitle: string,
    subtaskTitle?: string,
    existingNotes?: string | null,
    subtaskTitles?: string[]
  ) => {
    const chatKey = `${type}-${id}`;
    const contextInfo = { type, taskTitle, subtaskTitle };

    // If AI notes already exist, show them immediately
    if (existingNotes) {
      setAiOverlay({
        isOpen: true,
        response: existingNotes,
        isLoading: false,
        title: subtaskTitle || taskTitle,
        chatKey,
        context: contextInfo,
      });
      return;
    }
    setAiOverlay({
      isOpen: true,
      response: '',
      isLoading: true,
      title: subtaskTitle || taskTitle,
      chatKey,
      context: contextInfo,
    });

    try {
      const res = await fetch('/api/roadmaps/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id,
          taskTitle,
          subtaskTitle,
          subtasks: subtaskTitles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.error || `Server error (${res.status})`;
        setAiOverlay((prev) => ({
          ...prev,
          isLoading: false,
          response: `⚠️ **Failed to generate explanation**\n\n${errorDetail}\n\nPlease try again later.`,
        }));
        return;
      }

      // Show response instantly
      setAiOverlay((prev) => ({
        ...prev,
        isLoading: false,
        response: data.ainotes,
      }));

      // Update parent state (DB save already happened in the API route)
      onAiNotesUpdate?.(type, id, data.ainotes);
    } catch (err) {
      const errorDetail =
        err instanceof Error && err.message === 'Failed to fetch'
          ? 'Network error — check your internet connection and try again.'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred.';
      setAiOverlay((prev) => ({
        ...prev,
        isLoading: false,
        response: `⚠️ **Something went wrong**\n\n${errorDetail}`,
      }));
    }
  };

  const router = useRouter();

  const navigateToTest = (
    topic: string,
    scope: 'subtask' | 'task' | 'roadmap',
    context?: string
  ) => {
    const slug = encodeURIComponent(topic.replace(/\s+/g, '-').toLowerCase());
    const params = new URLSearchParams({ scope });
    if (context) params.set('context', encodeURIComponent(context));
    router.push(`/practice/${slug}?${params.toString()}`);
  };

  const allSubtasks = roadmapData.flatMap((t) => t.subtasks || []);
  const totalSub = allSubtasks.length;
  const completeSub = allSubtasks.filter((s) => s.completed).length;
  const overallProgress =
    totalSub === 0 ? 0 : Math.round((completeSub / totalSub) * 100);

  return (
    <div className="min-h-screen  py-12 px-4 overflow-hidden font-sans ">
      <AIResponseOverlay
        isOpen={aiOverlay.isOpen}
        onClose={() => setAiOverlay((prev) => ({ ...prev, isOpen: false }))}
        response={aiOverlay.response}
        isLoading={aiOverlay.isLoading}
        title={aiOverlay.title}
        chatKey={aiOverlay.chatKey}
        context={aiOverlay.context}
      />
      <div className="max-w-4xl mx-auto bg-sky-50 p-4 rounded-4xl">
        <header className="sticky top-4 z-40 mb-1">
          <div className="relative w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 ">
                <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-blue-800 to-gray-900 px-20">
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
          {/* Test Skills button for the whole roadmap */}
          <div className="flex justify-center mt-3">
            <button
              onClick={() => navigateToTest(title, 'roadmap', title)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
            >
              <GraduationCap size={18} />
              Test All Skills
            </button>
          </div>
        </header>
        <div className="relative pt-10 pb-30">
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
              onAiExplain={handleAiExplain}
              onTestSkill={navigateToTest}
            />
          ))}
        </div>
        <div className="max-w-4xl mx-auto">
          {' '}
          <RoadmapNotes roadmapId={roadmapId} initialNotes={initialNotes} />
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

const SubtaskList = ({
  task,
  onToggleSubtask,
  onAiExplain,
  onTestSkill,
}: {
  task: RoadmapTask;
  onToggleSubtask?: (subtaskId: string) => void;
  onAiExplain?: (
    type: 'task' | 'subtask',
    id: string,
    taskTitle: string,
    subtaskTitle?: string,
    existingNotes?: string | null,
    subtaskTitles?: string[]
  ) => void;
  onTestSkill?: (
    topic: string,
    scope: 'subtask' | 'task' | 'roadmap',
    context?: string
  ) => void;
}) => {
  return (
    <div className="mt-6 w-full max-w-md mx-auto bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      {/* Task-level buttons: AI tag + Test Skills */}
      <div className="flex items-center gap-1">
        {task.tag && (
          <button
            className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 transition-colors duration-200 cursor-pointer rounded-br-lg px-2.5 py-1"
            onClick={(e) => {
              e.stopPropagation();
              onAiExplain?.(
                'task',
                task.taskId,
                task.title,
                undefined,
                task.ainotes,
                task.subtasks.map((s) => s.title)
              );
            }}
            aria-label={`Get AI explanation for ${task.tag}`}
          >
            <span className="text-[10px] font-semibold text-purple-800 uppercase">
              {task.tag}
            </span>
            <span className="text-[10px] text-purple-500 font-medium">AI</span>
            <Sparkles className="w-3 h-3 text-purple-500" />
          </button>
        )}
        {/* Test Skills for the whole task */}
        <button
          className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 transition-colors duration-200 cursor-pointer rounded-br-lg px-2.5 py-1"
          onClick={(e) => {
            e.stopPropagation();
            onTestSkill?.(task.title, 'task', task.title);
          }}
          aria-label={`Test skills for ${task.title}`}
          title="Test your skills on this task"
        >
          <GraduationCap className="w-3 h-3 text-blue-600" />
          <span className="text-[10px] font-semibold text-blue-700">Test</span>
        </button>
      </div>

      <div className="p-4 space-y-2">
        {task.subtasks.map((sub) => (
          <div
            key={sub.$id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200 hover:shadow-sm
              ${
                sub.completed
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-white border-gray-100'
              }`}
          >
            {/* Checkbox area */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubtask?.(sub.$id);
              }}
              className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
            >
              {sub.completed ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-700 shrink-0" />
              )}
              <span
                className={`text-sm font-medium truncate ${
                  sub.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                }`}
              >
                {sub.title}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* YouTube search */}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  sub.title + ' ' + task.title
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                aria-label="Search on YouTube"
                title="Search on YouTube"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.196-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </a>

              {/* AI explain */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAiExplain?.(
                    'subtask',
                    sub.$id,
                    task.title,
                    sub.title,
                    sub.ainotes
                  );
                }}
                className="flex items-center gap-0.5 p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200 cursor-pointer"
                aria-label={`Get AI explanation for ${sub.title}`}
                title="AI Explanation"
              >
                <span className="text-[10px] font-medium opacity-70">AI</span>
                <Sparkles className="h-3.5 w-3.5" />
              </button>

              {/* Test Skills for subtask */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTestSkill?.(sub.title, 'subtask', task.title);
                }}
                className="flex items-center gap-0.5 p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                aria-label={`Test skills for ${sub.title}`}
                title="Test your skills"
              >
                <GraduationCap className="h-3.5 w-3.5" />
              </button>
            </div>
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
  onAiExplain,
  onTestSkill,
}: {
  task: RoadmapTask;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onAiExplain?: (
    type: 'task' | 'subtask',
    id: string,
    taskTitle: string,
    subtaskTitle?: string,
    existingNotes?: string | null,
    subtaskTitles?: string[]
  ) => void;
  onTestSkill?: (
    topic: string,
    scope: 'subtask' | 'task' | 'roadmap',
    context?: string
  ) => void;
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
        <SubtaskList
          task={task}
          onToggleSubtask={onToggleSubtask}
          onAiExplain={onAiExplain}
          onTestSkill={onTestSkill}
        />
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
