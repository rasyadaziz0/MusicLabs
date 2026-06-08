'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBackgroundProps {
  isRecordingOrProcessing: boolean;
}

export function AnimatedBackground({ isRecordingOrProcessing }: AnimatedBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isRecordingOrProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-[-20%] w-[80vw] h-[80vw] rounded-full bg-[#ff2a5f]/40 blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-[-20%] w-[90vw] h-[90vw] rounded-full bg-[#3b82f6]/40 blur-[120px]"
            />
            <motion.div
              animate={{
                y: [0, -50, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/4 w-[60vw] h-[60vw] rounded-full bg-[#8b5cf6]/30 blur-[90px]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
