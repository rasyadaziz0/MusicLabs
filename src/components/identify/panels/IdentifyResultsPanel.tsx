'use client';

import { motion } from 'framer-motion';
import type { IIdentifyResultsProps } from '../IdentifyLayoutInterface';
import { IdentifySongResultUI } from '../IdentifySongResultUI';
import { SingSayResultUI } from '../SingSayResultUI';

export function IdentifyResultsPanel({
  mode,
  state,
  matchedSong,
  speechResults,
  speech,
  handlePlay,
  handleSearchForSong,
  resetState,
}: IIdentifyResultsProps) {
  if (state !== 'results') return null;

  return (
    <motion.div
      key="results-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      className="w-full max-w-3xl flex flex-col items-center justify-center"
    >
      {mode === 'audd' && matchedSong && (
        <IdentifySongResultUI
          matchedSong={matchedSong}
          handlePlay={handlePlay}
          handleSearchForSong={handleSearchForSong}
          resetState={resetState}
        />
      )}

      {mode === 'speech' && speechResults.length > 0 && (
        <SingSayResultUI
          speechResults={speechResults}
          transcript={speech.transcript}
          handlePlay={handlePlay}
          resetState={resetState}
        />
      )}
    </motion.div>
  );
}
