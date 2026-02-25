"use client";
import {
  Book,
  BrainCircuit,
  Briefcase,
  MapPinned,
  Crosshair,
  BellIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Learn with Roadmaps',
    description: 'Follow curated paths that make skill-building clear, structured, and measurable.',
    icon: Book,
  },
  {
    title: 'Track Progress',
    description: 'Mark milestones and visualize growth so you always know what comes next.',
    icon: MapPinned,
  },
  {
    title: 'Practice with AI',
    description: 'Use Agentic AI to rehearse skills in guided, feedback-rich scenarios.',
    icon: BrainCircuit,
  },
  {
    title: 'Skill Drills',
    description: 'Target weak spots with focused practice that builds real confidence.',
    icon: Crosshair,
  },
  {
    title: 'Apply in the Real World',
    description: 'Translate skills into action with opportunities matched to your growth.',
    icon: Briefcase,
  },
  {
    title: 'Personalized Signals',
    description: 'Get alerts and recommendations that keep your momentum moving forward.',
    icon: BellIcon,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto my-10">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500 mb-4"
          >
            About Skillmap
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Skillmap helps you learn, practice, and apply skills with Agentic AI and
            curated roadmaps that turn progress into real outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ title, description, icon: Icon }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="group relative bg-slate-900/90 p-6 rounded-xl shadow-2xl shadow-zinc-500/30 border border-slate-800 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-500/30"
            >
              <div className="w-12 h-12 bg-purple-950/30 rounded-lg flex items-center justify-center text-purple-300 mb-4 border border-purple-900/70">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
