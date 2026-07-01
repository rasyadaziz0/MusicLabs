'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export default function TapToStartOverlay() {
  const { autoplayBlocked, dismissAutoplayBlock } = (usePlayer() as any);

  if (!autoplayBlocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-[80px] md:bottom-[76px] left-1/2 -translate-x-1/2 z-[100]"
      >
        <button
          onClick={dismissAutoplayBlock}
          className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#1db954] text-black font-bold shadow-[0_8px_32px_rgba(29,185,84,0.5)] border border-white/20 hover:scale-105 active:scale-95 transition-all group animate-bounce"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-[#1db954] group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold tracking-tight">Ketuk untuk mulai memutar</span>
            <span className="text-[10px] font-semibold opacity-80">Kebijakan autoplay browser memblokir audio</span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
