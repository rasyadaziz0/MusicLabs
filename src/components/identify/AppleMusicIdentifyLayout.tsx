'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { IdentifyHeaderUI } from './IdentifyHeaderUI';
import {
  IdentifyIdlePanel,
  IdentifyRecordingPanel,
  IdentifyProcessingPanel,
  IdentifyResultsPanel,
  IdentifyFeedbackPanel,
} from './IdentifyPanelsUI';
import type { IIdentifyLayoutProps } from './IdentifyLayoutInterface';

export function AppleMusicIdentifyLayout({
  mode,
  setMode,
  state,
  matchedSong,
  rawMatch,
  speechResults,
  errorMessage,
  recorder,
  speech,
  quota,
  handleAuddIdentify,
  handleSpeechStart,
  handlePlay,
  handleSearchForSong,
  handleCancel,
  resetState,
}: IIdentifyLayoutProps) {
  const router = useRouter();
  const [countdownPercent, setCountdownPercent] = useState(100);

  // Animate countdown ring for Audd mode (8s total)
  useEffect(() => {
    if (state === 'recording' && mode === 'audd' && recorder.secondsLeft > 0) {
      const percentage = (recorder.secondsLeft / 8) * 100;
      setCountdownPercent(percentage);
    } else if (state !== 'recording') {
      setCountdownPercent(100);
    }
  }, [state, mode, recorder.secondsLeft]);

  const showResults = state === 'results';
  const showFeedback = state === 'no-match' || state === 'error';

  return (
    <div className="relative w-full max-w-5xl mx-auto min-h-[85vh] flex flex-col justify-between py-6 px-4 md:px-8 z-10 select-none">
      
      {/* ── 1. OOP HEADER NAVIGATION ── */}
      <IdentifyHeaderUI
        mode={mode}
        setMode={setMode}
        state={state}
        speech={speech}
        quota={quota}
        onBack={() => router.back()}
      />

      {/* ── 2. OOP MAIN CONTENT PANELS ── */}
      <main className="flex-1 flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <IdentifyIdlePanel
              mode={mode}
              handleAuddIdentify={handleAuddIdentify}
              handleSpeechStart={handleSpeechStart}
            />
          )}

          {state === 'recording' && (
            <IdentifyRecordingPanel
              mode={mode}
              countdownPercent={countdownPercent}
              recorder={recorder}
              speech={speech}
              handleCancel={handleCancel}
            />
          )}

          {state === 'processing' && <IdentifyProcessingPanel mode={mode} />}

          {showResults && (
            <IdentifyResultsPanel
              mode={mode}
              state={state}
              matchedSong={matchedSong}
              speechResults={speechResults}
              speech={speech}
              handlePlay={handlePlay}
              handleSearchForSong={handleSearchForSong}
              resetState={resetState}
            />
          )}

          {showFeedback && (
            <IdentifyFeedbackPanel
              state={state}
              mode={mode}
              speech={speech}
              rawMatch={rawMatch}
              errorMessage={errorMessage}
              resetState={resetState}
              handleSearchForSong={handleSearchForSong}
            />
          )}
        </AnimatePresence>
      </main>

      {/* ── 3. FOOTER ── */}
      <footer className="w-full text-center py-4 text-xs text-white/30 font-medium">
        Powered by Shazam &amp; Google Speech API • AcadMusic Services
      </footer>
    </div>
  );
}
