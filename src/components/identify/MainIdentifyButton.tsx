'use client';

import { AudioLines, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MainIdentifyButtonProps {
  mode: 'audd' | 'speech';
  state: 'idle' | 'recording' | 'processing' | 'results' | 'no-match' | 'error';
  quota: { isExhausted: boolean; remaining: number };
  recorder: { secondsLeft: number };
  speech: { transcript: string };
  handleAuddIdentify: () => void;
  handleSpeechStart: () => void;
  handleCancel: () => void;
}

export function MainIdentifyButton({
  mode,
  state,
  quota,
  recorder,
  speech,
  handleAuddIdentify,
  handleSpeechStart,
  handleCancel,
}: MainIdentifyButtonProps) {
  const hasResults = state === 'results' || state === 'no-match' || state === 'error';

  return (
    <div className="relative w-full flex flex-col items-center justify-center flex-1">
      <AnimatePresence>
        {!hasResults && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center"
          >
            {/* The Button */}
            <div className="relative mb-12 flex justify-center items-center">
              
              {/* Ripple Effects when recording */}
              {state === 'recording' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-40 h-40 rounded-full bg-white/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                    className="absolute w-40 h-40 rounded-full bg-white/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                    className="absolute w-40 h-40 rounded-full bg-white/20"
                  />
                </>
              )}

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (state === 'idle') {
                    mode === 'audd' ? handleAuddIdentify() : handleSpeechStart();
                  } else if (state === 'recording') {
                    handleCancel();
                  }
                }}
                disabled={state === 'processing' || (mode === 'audd' && quota.isExhausted)}
                className={`relative z-10 w-44 h-44 rounded-full flex items-center justify-center backdrop-blur-2xl transition-colors duration-500 shadow-2xl ${
                  state === 'recording' 
                    ? 'bg-white/20 border border-white/30' 
                    : state === 'processing'
                      ? 'bg-white/10 border border-white/10'
                      : quota.isExhausted && mode === 'audd'
                        ? 'bg-white/5 border border-white/5 opacity-50'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: state === 'recording' ? [1, 1.1, 1] : 1 
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {mode === 'audd' ? (
                    <AudioLines size={64} strokeWidth={1.5} className={state === 'recording' ? 'text-white' : 'text-white/80'} />
                  ) : (
                    <Mic size={64} strokeWidth={1.5} className={state === 'recording' ? 'text-white' : 'text-white/80'} />
                  )}
                </motion.div>
              </motion.button>
            </div>

            {/* Status Text */}
            <div className="h-20 flex flex-col items-center justify-start text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  {state === 'idle' && (
                    <>
                      <h3 className="text-3xl font-bold tracking-tight mb-2">
                        {mode === 'audd' ? 'Tap to Identify' : 'Tap to Speak'}
                      </h3>
                      {mode === 'audd' && (
                        <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                          {quota.remaining} Left This Month
                        </p>
                      )}
                    </>
                  )}

                  {state === 'recording' && (
                    <>
                      <h3 className="text-2xl font-semibold tracking-tight mb-2">
                        {mode === 'audd' ? 'Listening...' : 'Speak now...'}
                      </h3>
                      {mode === 'audd' && recorder.secondsLeft > 0 && (
                        <p className="text-white/80 font-mono text-xl">
                          {recorder.secondsLeft}s
                        </p>
                      )}
                      {mode === 'speech' && speech.transcript && (
                        <p className="text-white/60 text-sm italic max-w-[280px]">
                          &ldquo;{speech.transcript}&rdquo;
                        </p>
                      )}
                    </>
                  )}

                  {state === 'processing' && (
                    <>
                      <h3 className="text-2xl font-semibold tracking-tight mb-2">Finding Match...</h3>
                      <p className="text-white/40 text-sm animate-pulse">This might take a moment</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
