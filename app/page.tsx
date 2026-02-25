'use client';

import { motion } from 'framer-motion';
import InteractiveSkillMap from '@/components/InteractiveSkillMap';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center max-w-3xl mt-12 mb-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500 mb-6"
        >
          Skillmap
        </motion.h1>

        <p className="text-slate-400 text-lg">
          Learn, practice, and apply skills with{' '}
          <span className="text-blue-400 font-semibold">Agentic AI</span>
        </p>
      </div>

      {/* Interactive Map */}
      <InteractiveSkillMap />
    </div>
  );
}