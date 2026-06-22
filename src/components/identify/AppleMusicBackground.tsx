'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AppleMusicBackgroundProps {
  isRecordingOrProcessing: boolean;
}

export function AppleMusicBackground({ isRecordingOrProcessing }: AppleMusicBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating Animated Blobs */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen filter blur-[100px] md:blur-[150px]">
        {/* Blob 1: Magenta/Red */}
        <motion.div
          animate={{
            x: isRecordingOrProcessing ? ['-10%', '20%', '-10%'] : ['0%', '10%', '0%'],
            y: isRecordingOrProcessing ? ['-20%', '10%', '-20%'] : ['0%', '-10%', '0%'],
            scale: isRecordingOrProcessing ? [1, 1.3, 1] : [1, 1.1, 1],
          }}
          transition={{
            duration: isRecordingOrProcessing ? 8 : 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-tr from-[#ff2d55] to-[#fc3c44] opacity-70"
        />

        {/* Blob 2: Deep Purple/Violet */}
        <motion.div
          animate={{
            x: isRecordingOrProcessing ? ['20%', '-10%', '20%'] : ['0%', '-5%', '0%'],
            y: isRecordingOrProcessing ? ['20%', '-20%', '20%'] : ['0%', '10%', '0%'],
            scale: isRecordingOrProcessing ? [1.1, 0.8, 1.1] : [1, 0.9, 1],
          }}
          transition={{
            duration: isRecordingOrProcessing ? 10 : 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-1/4 -right-1/4 w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] rounded-full bg-gradient-to-br from-[#5856d6] to-[#8b5cf6] opacity-60"
        />

        {/* Blob 3: Shazam Blue/Cyan */}
        <motion.div
          animate={{
            x: isRecordingOrProcessing ? ['-30%', '10%', '-30%'] : ['0%', '5%', '0%'],
            y: isRecordingOrProcessing ? ['10%', '40%', '10%'] : ['0%', '-5%', '0%'],
            scale: isRecordingOrProcessing ? [0.8, 1.2, 0.8] : [1, 1.05, 1],
          }}
          transition={{
            duration: isRecordingOrProcessing ? 7 : 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 left-[-10%] w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full bg-gradient-to-tr from-[#0088ff] to-[#00c6ff] opacity-50"
        />

        {/* Blob 4: Bright Pink - Active during recording */}
        <AnimatePresence>
          {isRecordingOrProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 1.5 }}
              className="absolute top-1/4 right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#ff2a5f] filter blur-[120px]"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
