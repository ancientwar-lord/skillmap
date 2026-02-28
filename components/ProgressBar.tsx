import { motion } from 'framer-motion';

export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
