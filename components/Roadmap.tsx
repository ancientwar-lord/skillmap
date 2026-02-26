'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Rocket,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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

interface RoadmapTask {
  taskId: string;
  title: string;
  tag?: string;
  subtasks: SubTask[];
}

interface RoadmapProps {
  title: string;
  description?: string;
  roadmapData: RoadmapTask[];
}

const Roadmap: React.FC<RoadmapProps> = ({
  title,
  description,
  roadmapData = [],
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

const SubtaskList = ({ task }: { task: RoadmapTask }) => {
  return (
    <div className="mt-6 w-full max-w-md mx-auto bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="p-4 space-y-2">
        {task.subtasks.map((sub) => (
          <div
            key={sub.$id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200 
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
}: {
  task: RoadmapTask;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const [offset, setOffset] = useState(0);

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

      {isExpanded && <SubtaskList task={task} />}
    </div>
  );
};
