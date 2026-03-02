'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Briefcase,
  BrainCircuit,
  Hexagon,
  MapPinned,
  BellIcon,
  Crosshair,
} from 'lucide-react';

const RADIUS = 120;

const STEPS = [
  {
    id: 'learn',
    label: 'Learn',
    icon: Book,
    contentIcon: MapPinned,
    subtitle: 'Mark the progress',
    description: 'Learn from curated roadmaps',
    position: { x: -RADIUS * 1.5, y: -RADIUS * 0.8 },
    accent: '#c084fc',
    bg: 'bg-neutral-950/90',
    border: 'border-purple-400/30',
    iconBg: 'bg-purple-400/20',
    iconText: 'text-purple-300',
    labelText: 'text-purple-300',
    muted: 'text-zinc-400',
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: BrainCircuit,
    contentIcon: Crosshair,
    subtitle: 'Practise your skills',
    description: 'Practise with Agentic AI-Avatars',
    position: { x: RADIUS * 1.8, y: 0 },
    accent: '#C36F3C',
    bg: 'bg-[#0F1412]/90',
    border: 'border-[#C36F3C]/30',
    iconBg: 'bg-[#C36F3C]/20',
    iconText: 'text-[#C36F3C]',
    labelText: 'text-[#C36F3C]',
    muted: 'text-[#8B8F8C]',
  },
  {
    id: 'apply',
    label: 'Apply',
    icon: Briefcase,
    contentIcon: BellIcon,
    subtitle: 'Apply in real world',
    description: 'Get personalized opportunity recommendations',
    position: { x: -RADIUS * 1.5, y: RADIUS * 1.2 },
    accent: '#B7C29C',
    bg: 'bg-[#11130F]/90',
    border: 'border-[#B7C29C]/30',
    iconBg: 'bg-[#B7C29C]/20',
    iconText: 'text-[#B7C29C]',
    labelText: 'text-[#B7C29C]',
    muted: 'text-[#8A8F7E]',
  },
] as const;

export default function InteractiveSkillMap() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const activeColor = STEPS[activeStep].accent;
  const cx = 300;
  const cy = 250;

  return (
    <div className="relative w-full max-w-150 h-125 flex items-center justify-center">
      {/* Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${activeColor}1a, transparent 65%)`,
        }}
      />

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const tx = cx + step.position.x;
          const ty = cy + step.position.y;
          const controlX = (cx + tx) / 2 + (ty - cy) * 0.2;
          const controlY = (cy + ty) / 2 - (tx - cx) * 0.2;
          const path = `M ${cx} ${cy} Q ${controlX} ${controlY} ${tx} ${ty}`;

          return (
            <g key={step.id}>
              <path d={path} stroke="#1e293b" strokeWidth="2" fill="none" />
              {isActive && (
                <motion.path
                  d={path}
                  stroke={step.accent}
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Central Hub */}
      <motion.div
        animate={{
          borderColor: activeColor,
          boxShadow: `0 0 55px -12px ${activeColor}66`,
        }}
        className="relative z-10 w-24 h-24 bg-slate-900 border-2 rounded-3xl flex items-center justify-center"
      >
        <Hexagon size={48} color={activeColor} />
      </motion.div>

      {/* Orbiting Nodes */}
      {STEPS.map((step, index) => {
        const isActive = index === activeStep;
        const ContentIcon = step.contentIcon;

        return (
          <div
            key={step.id}
            className="absolute flex flex-col items-center"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${step.position.x}px), calc(-50% + ${step.position.y}px))`,
            }}
          >
            {/* Tooltip card */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-6"
                >
                  <div
                    className={`flex items-center gap-3 ${step.bg} border ${step.border} p-3 rounded-xl shadow-xl backdrop-blur-md min-w-55`}
                  >
                    <div
                      className={`${step.iconBg} p-2 rounded-lg ${step.iconText}`}
                    >
                      <ContentIcon size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-medium ${step.muted}`}>
                        {step.subtitle}
                      </span>
                      <span className={`text-sm font-bold ${step.labelText}`}>
                        {step.description}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Node circle */}
            <motion.div
              animate={{
                scale: isActive ? 1.25 : 1,
                borderColor: isActive ? step.accent : '#334155',
                boxShadow: isActive ? `0 0 25px ${step.accent}55` : 'none',
              }}
              className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-slate-950"
            >
              <step.icon size={24} color={isActive ? step.accent : '#475569'} />
            </motion.div>

            <span className="mt-3 text-[10px] tracking-widest text-slate-400">
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
