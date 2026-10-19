'use client';

import { motion } from 'framer-motion';

export interface WaveformBarProps {
  delay: number;
}

export function WaveformBar({ delay }: WaveformBarProps) {
  return (
    <motion.div
      animate={{
        height: ['15%', '85%', '30%', '95%', '15%'],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="w-1.5 bg-gradient-to-t from-[#0088ff] via-[#fc3c44] to-[#ff2d55] rounded-full mx-0.5 shadow-[0_0_8px_rgba(252,60,68,0.2)]"
      style={{ height: '20%' }}
    />
  );
}
