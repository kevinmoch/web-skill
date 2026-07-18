import { motion } from 'motion/react';
import { BrainCircuit, Code2, LayoutTemplate, Wrench } from 'lucide-react';

export const TrinityDiagram = ({ t, className = '' }: { t: (key: string) => any, className?: string }) => (
  <div className={`relative w-full max-w-3xl mx-auto aspect-[16/11] flex items-center justify-center ${className}`}>
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute z-20 flex flex-col items-center justify-center w-32 h-32 rounded-full bg-surface border border-border-color shadow-[0_0_40px_rgba(0,240,255,0.2)]"
    >
      <BrainCircuit className="w-10 h-10 text-accent mb-2" />
      <span className="font-mono font-bold text-sm">LLM</span>
    </motion.div>

    <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.3))' }}>
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5 }} d="M 50 50 L 20 20" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.7 }} d="M 50 50 L 80 20" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.9 }} d="M 50 50 L 50 85" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
    </svg>

    <motion.div
      initial={{ opacity: 0, x: -20, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="absolute top-[10%] left-[10%] flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <Code2 className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">WebSkill</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
      className="absolute top-[10%] right-[10%] flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <LayoutTemplate className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">Generative UI</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className="absolute bottom-[0%] left-1/2 -translate-x-1/2 flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <Wrench className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">WebMCP</span>
    </motion.div>
  </div>
);
