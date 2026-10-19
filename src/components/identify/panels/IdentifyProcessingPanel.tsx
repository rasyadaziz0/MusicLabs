'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { IdentifyPanelPresenter } from '@/lib/identify/IdentifyPanelPresenter';
import type { IIdentifyProcessingProps } from '../IdentifyLayoutInterface';

export function IdentifyProcessingPanel({ mode }: IIdentifyProcessingProps) {
  const processingText = IdentifyPanelPresenter.getProcessingDescription(mode);

  return (
    <motion.div
      key="processing-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center max-w-md"
    >
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-10">
        <div className="absolute inset-0 rounded-full border border-white/5" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute w-40 h-40 rounded-full border-t-2 border-r-2 border-b-2 border-transparent border-[#fc3c44] shadow-[0_0_20px_rgba(252,60,68,0.3)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute w-44 h-44 rounded-full border-t-2 border-l-2 border-transparent border-[#0088ff] shadow-[0_0_20px_rgba(0,136,255,0.2)]"
        />
        <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
          <RefreshCw size={36} className="text-white animate-spin" />
        </div>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Analyzing Audio</h2>
      <p className="text-white/50 text-sm animate-pulse">
        {processingText}
      </p>
    </motion.div>
  );
}
