'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AudioLines, Mic, Play, Search, AlertCircle, Music, RefreshCw, Check } from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { IdentifySongResultUI } from './IdentifySongResultUI';
import { SingSayResultUI } from './SingSayResultUI';
import type {
  IIdentifyIdleProps,
  IIdentifyRecordingProps,
  IIdentifyProcessingProps,
  IIdentifyResultsProps,
  IIdentifyFeedbackProps,
} from './IdentifyLayoutInterface';

export function WaveformBar({ delay }: { delay: number }) {
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

export function IdentifyIdlePanel({ mode, handleAuddIdentify, handleSpeechStart }: IIdentifyIdleProps) {
  return (
    <motion.div
      key="idle-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center max-w-md w-full"
    >
      <div className="relative mb-6 group flex items-center justify-center">
        <button
          onClick={mode === 'audd' ? handleAuddIdentify : handleSpeechStart}
          className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shadow-inner hover:bg-white/[0.06] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#0088ff] via-[#a855f7] to-[#ff2d55] shadow-[0_0_50px_rgba(168,85,247,0.4)] flex items-center justify-center relative group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-14 h-14 text-white fill-current drop-shadow-md">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.93 14.33c-1.44.83-3.23.59-4.22-.58l-.06-.07c-.45-.55-.71-1.25-.71-1.98 0-.9.41-1.74 1.12-2.3l1.83-1.43c.5-.39.79-.98.79-1.62 0-.8-.48-1.52-1.22-1.81-.74-.29-1.58-.1-2.14.48L7.4 8.2c-.37.38-.97.4-1.37.04-.42-.38-.45-1.02-.07-1.44l1.9-2.07c1.37-1.41 3.51-1.8 5.27-1.03 1.76.78 2.87 2.53 2.87 4.45 0 1.48-.63 2.88-1.73 3.84l-1.83 1.43c-.5.39-.79.98-.79 1.62 0 .8.48 1.52 1.22 1.81.74.29 1.58.1 2.14-.48l1.91-2.07c.38-.42 1.02-.45 1.44-.07.42.38.45 1.02.07 1.44l-1.92 2.07c-.96.99-2.31 1.43-3.61 1.24z" />
            </svg>
          </div>
          <span className="text-white/55 font-bold text-[11px] mt-5 tracking-[0.2em] uppercase">
            {mode === 'audd' ? 'TAP TO SHAZAM' : 'TAP TO SPEAK'}
          </span>
        </button>
      </div>

      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-2">
        {mode === 'audd' ? 'Identify Song' : 'Sing or Say'}
      </h2>
      <p className="text-white/60 text-[13.5px] leading-relaxed mt-2.5 max-w-[280px] mx-auto font-normal">
        {mode === 'audd'
          ? 'Keep your device close to the audio source. We\'ll listen for 8 seconds and find your song.'
          : 'Speak or sing the lyrics/title, and we\'ll match it against the music library.'}
      </p>
    </motion.div>
  );
}

export function IdentifyRecordingPanel({
  mode,
  countdownPercent,
  recorder,
  speech,
  handleCancel,
}: IIdentifyRecordingProps) {
  return (
    <motion.div
      key="recording-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center max-w-md w-full"
    >
      <div className="relative mb-6 flex items-center justify-center">
        <svg className="absolute inset-0 w-64 h-64 md:w-72 md:h-72 -rotate-90 m-auto">
          <circle cx="50%" cy="50%" r="47%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="4" fill="transparent" />
          <motion.circle
            cx="50%"
            cy="50%"
            r="47%"
            stroke="#a855f7"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="380"
            initial={{ strokeDashoffset: 380 }}
            animate={{ strokeDashoffset: (countdownPercent / 100) * 380 }}
            transition={{ ease: 'linear' }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full bg-purple-500/20 blur-[2px]"
          />
        </div>

        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shadow-inner">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#0088ff] via-[#a855f7] to-[#ff2d55] shadow-[0_0_50px_rgba(168,85,247,0.6)] flex items-center justify-center animate-pulse">
            {mode === 'audd' ? (
              <AudioLines size={44} className="text-white animate-bounce" />
            ) : (
              <Mic size={44} className="text-white animate-bounce" />
            )}
          </div>
          <span className="text-white/70 font-bold text-[11px] mt-5 tracking-[0.2em] uppercase animate-pulse">
            {mode === 'audd' ? 'LISTENING...' : 'SPEAK NOW...'}
          </span>
        </div>
      </div>

      <div className="h-28 flex flex-col items-center justify-start">
        <h3 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          {mode === 'audd' ? 'Listening...' : 'Listening for Voice...'}
        </h3>

        {mode === 'audd' ? (
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">
            {recorder.secondsLeft > 0 ? `${recorder.secondsLeft} seconds left` : 'Analyzing...'}
          </p>
        ) : (
          <div className="w-full max-w-sm px-6">
            {speech.transcript ? (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[#fc3c44] font-medium text-lg italic truncate">
                &ldquo;{speech.transcript}&rdquo;
              </motion.p>
            ) : (
              <p className="text-white/40 text-sm animate-pulse">Speak clearly into your microphone</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center h-12 mb-8">
        <WaveformBar delay={0.0} />
        <WaveformBar delay={0.15} />
        <WaveformBar delay={0.3} />
        <WaveformBar delay={0.45} />
        <WaveformBar delay={0.1} />
        <WaveformBar delay={0.25} />
        <WaveformBar delay={0.4} />
      </div>

      <button
        onClick={handleCancel}
        className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm tracking-wide active:scale-95 transition-all shadow-md outline-none"
      >
        Cancel
      </button>
    </motion.div>
  );
}

export function IdentifyProcessingPanel({ mode }: IIdentifyProcessingProps) {
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
        {mode === 'audd' ? 'Matching waveform against database...' : `Searching matching songs for speech...`}
      </p>
    </motion.div>
  );
}

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

export function IdentifyFeedbackPanel({
  state,
  mode,
  speech,
  rawMatch,
  errorMessage,
  resetState,
  handleSearchForSong,
}: IIdentifyFeedbackProps) {
  return (
    <motion.div
      key="feedback-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      className="w-full max-w-3xl flex flex-col items-center justify-center"
    >
      {state === 'no-match' && (
        <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-3xl text-center shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Music size={36} className="text-white/30" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">No Match Found</h2>
          <p className="text-white/60 text-base mb-6 leading-relaxed">
            {mode === 'audd'
              ? 'We couldn\'t recognize the song playing nearby. Try holding your microphone closer to the speaker.'
              : `We couldn't find any songs matching "${speech.transcript}". Try speaking standard keywords.`}
          </p>

          {rawMatch?.title && (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left mb-8">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1">Raw Matches Heard</p>
              <p className="text-white font-bold text-base">{rawMatch.title}</p>
              {rawMatch.artist && <p className="text-white/50 text-sm mt-0.5">by {rawMatch.artist}</p>}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={resetState} className="py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20 outline-none">
              Try Again
            </button>
            {mode === 'audd' && rawMatch?.title && (
              <button onClick={() => handleSearchForSong(rawMatch.title, rawMatch.artist || '')} className="py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base active:scale-95 transition-all outline-none">
                Search Manual on AcadMusic
              </button>
            )}
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-3xl text-center shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Identification Failed</h2>
          <p className="text-red-300/80 text-sm bg-red-500/5 border border-red-500/10 p-4 rounded-2xl mb-6 leading-relaxed">
            {errorMessage || 'An unexpected error occurred during audio recording.'}
          </p>

          <button onClick={resetState} className="w-full py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20 outline-none">
            Try Again
          </button>
        </div>
      )}
    </motion.div>
  );
}
