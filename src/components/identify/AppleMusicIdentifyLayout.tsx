'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, AudioLines, Mic, Play, Search, AlertCircle, Music, RefreshCw, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { IdentifyMode, IdentifyState } from '@/hooks/useIdentifyController';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';
import { useRouter } from 'next/navigation';

interface AppleMusicIdentifyLayoutProps {
  mode: IdentifyMode;
  setMode: (mode: IdentifyMode) => void;
  state: IdentifyState;
  matchedSong: Song | null;
  rawMatch: { title: string; artist: string; album?: string } | null;
  speechResults: Song[];
  errorMessage: string;
  recorder: ReturnType<typeof useAudioRecorder>;
  speech: ReturnType<typeof useSpeechRecognition>;
  quota: ReturnType<typeof useIdentifyQuota>;
  handleAuddIdentify: () => void;
  handleSpeechStart: () => void;
  handlePlay: (song: Song, onAfterPlay?: () => void) => void;
  handleSearchForSong: (title: string, artist: string, onAfterSearch?: () => void) => void;
  handleCancel: () => void;
  resetState: () => void;
}

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
}: AppleMusicIdentifyLayoutProps) {
  const router = useRouter();
  const [countdownPercent, setCountdownPercent] = useState(100);

  // Animate the countdown timer ring for Audd mode (8 seconds total)
  useEffect(() => {
    if (state === 'recording' && mode === 'audd' && recorder.secondsLeft > 0) {
      const percentage = (recorder.secondsLeft / 8) * 100;
      setCountdownPercent(percentage);
    } else if (state !== 'recording') {
      setCountdownPercent(100);
    }
  }, [state, mode, recorder.secondsLeft]);

  const isRecordingOrProcessing = state === 'recording' || state === 'processing';
  const showResults = state === 'results' || state === 'no-match' || state === 'error';

  return (
    <div className="relative w-full max-w-5xl mx-auto min-h-[85vh] flex flex-col justify-between py-6 px-4 md:px-8 z-10 select-none">
      
      {/* ── HEADER NAVIGATION ── */}
      <header className="flex items-center justify-between w-full pb-4 border-b border-white/5 backdrop-blur-sm z-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-semibold hidden sm:inline">Back</span>
        </button>

        {/* Pill-shaped Segmented Tab Selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setMode('audd')}
            disabled={isRecordingOrProcessing}
            className={`px-6 py-2 rounded-full text-sm font-bold tracking-tight transition-all active:scale-95 duration-300 ${
              mode === 'audd'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40'
            }`}
          >
            Identify Song
          </button>
          <button
            onClick={() => setMode('speech')}
            disabled={!speech.isSupported || isRecordingOrProcessing}
            className={`px-6 py-2 rounded-full text-sm font-bold tracking-tight transition-all active:scale-95 duration-300 ${
              mode === 'speech'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40'
            } ${!speech.isSupported ? 'opacity-30' : ''}`}
            title={!speech.isSupported ? 'Speech recognition not supported in this browser' : ''}
          >
            Sing / Say
          </button>
        </div>

        {/* Quota display / mode badge */}
        <div className="text-right">
          {mode === 'audd' ? (
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-mono text-white/60">
              <span className="text-white font-bold">{quota.remaining}</span> / 300 left
            </div>
          ) : (
            <div className="bg-[#fc3c44]/10 border border-[#fc3c44]/20 rounded-full px-4 py-1.5 text-xs font-semibold text-[#fc3c44] tracking-wider uppercase">
              Unlimited
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT PANEL ── */}
      <main className="flex-1 flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: IDLE */}
          {state === 'idle' && (
            <motion.div
              key="idle-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center max-w-md"
            >
              {/* Giant pulsing action button */}
              <div className="relative mb-10 group">
                {/* Glow ring */}
                <div className="absolute inset-[-15px] rounded-full bg-gradient-to-tr from-[#0088ff] via-[#fc3c44] to-[#ff2d55] opacity-25 blur-xl group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />
                
                <button
                  onClick={mode === 'audd' ? handleAuddIdentify : handleSpeechStart}
                  className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-white/15 to-white/5 border border-white/20 flex flex-col items-center justify-center backdrop-blur-3xl hover:border-white/40 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
                >
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-[#0088ff] to-[#fc3c44] flex items-center justify-center shadow-2xl relative">
                    {/* Shazam Logo stylized SVG */}
                    <svg viewBox="0 0 24 24" className="w-16 h-16 text-white fill-current drop-shadow-lg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.93 14.33c-1.44.83-3.23.59-4.22-.58l-.06-.07c-.45-.55-.71-1.25-.71-1.98 0-.9.41-1.74 1.12-2.3l1.83-1.43c.5-.39.79-.98.79-1.62 0-.8-.48-1.52-1.22-1.81-.74-.29-1.58-.1-2.14.48L7.4 8.2c-.37.38-.97.4-1.37.04-.42-.38-.45-1.02-.07-1.44l1.9-2.07c1.37-1.41 3.51-1.8 5.27-1.03 1.76.78 2.87 2.53 2.87 4.45 0 1.48-.63 2.88-1.73 3.84l-1.83 1.43c-.5.39-.79.98-.79 1.62 0 .8.48 1.52 1.22 1.81.74.29 1.58.1 2.14-.48l1.91-2.07c.38-.42 1.02-.45 1.44-.07.42.38.45 1.02.07 1.44l-1.92 2.07c-.96.99-2.31 1.43-3.61 1.24z" />
                    </svg>
                  </div>
                  <span className="text-white/60 font-semibold text-xs mt-4 tracking-widest uppercase">
                    {mode === 'audd' ? 'TAP TO SHAZAM' : 'TAP TO SPEAK'}
                  </span>
                </button>
              </div>

              <h2 className="text-4xl font-extrabold tracking-tight text-white mb-3">
                {mode === 'audd' ? 'Identify Song' : 'Sing or Say'}
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-6 px-4">
                {mode === 'audd' 
                  ? 'Keep your device close to the audio source. We\'ll listen for 8 seconds and find your song.' 
                  : 'Speak or sing the lyrics/title, and we\'ll match it against the music library.'}
              </p>
            </motion.div>
          )}

          {/* STATE 2: RECORDING */}
          {state === 'recording' && (
            <motion.div
              key="recording-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center max-w-md w-full"
            >
              {/* Pulsing button with circular countdown progress bar */}
              <div className="relative mb-12">
                
                {/* SVG Countdown Ring */}
                <svg className="absolute inset-0 w-52 h-52 md:w-60 md:h-60 -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="47%"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="47%"
                    stroke="#fc3c44"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray="295"
                    initial={{ strokeDashoffset: 295 }}
                    animate={{ strokeDashoffset: (countdownPercent / 100) * 295 }}
                    transition={{ ease: 'linear' }}
                  />
                </svg>

                {/* Pulsing concentric rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute w-44 h-44 rounded-full bg-[#fc3c44]/20 blur-[2px]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.67 }}
                    className="absolute w-44 h-44 rounded-full bg-[#0088ff]/15 blur-[2px]"
                  />
                </div>

                <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-full flex flex-col items-center justify-center">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-[#0088ff] to-[#fc3c44] flex items-center justify-center shadow-2xl animate-pulse">
                    {mode === 'audd' ? (
                      <AudioLines size={48} className="text-white animate-pulse" />
                    ) : (
                      <Mic size={48} className="text-white animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Headline & Dynamic Info */}
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
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[#fc3c44] font-medium text-lg italic truncate"
                      >
                        &ldquo;{speech.transcript}&rdquo;
                      </motion.p>
                    ) : (
                      <p className="text-white/40 text-sm animate-pulse">Speak clearly into your microphone</p>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Equalizer Waveform Indicator */}
              <div className="flex items-center justify-center h-12 mb-8">
                <WaveformBar delay={0.0} />
                <WaveformBar delay={0.15} />
                <WaveformBar delay={0.3} />
                <WaveformBar delay={0.1} />
                <WaveformBar delay={0.45} />
                <WaveformBar delay={0.25} />
                <WaveformBar delay={0.35} />
                <WaveformBar delay={0.05} />
                <WaveformBar delay={0.2} />
              </div>

              <button
                onClick={handleCancel}
                className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm tracking-wide active:scale-95 transition-all shadow-md"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* STATE 3: PROCESSING */}
          {state === 'processing' && (
            <motion.div
              key="processing-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center max-w-md"
            >
              {/* Spinning/morphing glowing circle */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-10">
                <div className="absolute inset-0 rounded-full border border-white/5" />
                
                {/* Rotating neon gradients */}
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
          )}

          {/* STATE 4: RESULTS / ERROR / NO-MATCH */}
          {showResults && (
            <motion.div
              key="results-panel"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full max-w-3xl flex flex-col items-center justify-center"
            >
              
              {/* ── SUB-STATE: SUCCESS MATCH ── */}
              {state === 'results' && mode === 'audd' && matchedSong && (
                <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-10 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  
                  {/* Saturated Dynamic Background Reflection based on Artwork */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none filter blur-[60px] scale-125 z-0">
                    {getBestImageUrl(matchedSong.image) ? (
                      <Image
                        src={getBestImageUrl(matchedSong.image)!}
                        alt="reflection"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#fc3c44]" />
                    )}
                  </div>

                  {/* Album Cover Art */}
                  <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0 z-10 group border border-white/10">
                    {getBestImageUrl(matchedSong.image) ? (
                      <Image
                        src={getBestImageUrl(matchedSong.image)!}
                        alt={matchedSong.name}
                        fill
                        sizes="(max-width: 768px) 224px, 256px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#fc3c44]/40 to-black flex items-center justify-center">
                        <Music size={64} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                      <Check size={12} strokeWidth={3} /> Match Identified
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                      {matchedSong.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-semibold text-[#fc3c44] mb-3">
                      {matchedSong.artists.primary.map((a) => a.name).join(', ')}
                    </p>
                    
                    <div className="flex flex-col gap-1 text-sm text-white/40 font-medium mb-8">
                      {matchedSong.album?.name && (
                        <span>Album: {matchedSong.album.name}</span>
                      )}
                      {matchedSong.releaseDate && (
                        <span>Released: {matchedSong.releaseDate}</span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                      {!matchedSong.id.startsWith('audd-') ? (
                        <button
                          onClick={() => handlePlay(matchedSong)}
                          className="flex-1 py-4 px-6 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                          <Play size={18} className="fill-black" />
                          Listen on AcadMusic
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
                          className="flex-1 py-4 px-6 rounded-full bg-[#fc3c44] hover:bg-[#fc3c44]/90 text-white font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20"
                        >
                          <Search size={18} strokeWidth={2.5} />
                          Search on AcadMusic
                        </button>
                      )}

                      <button
                        onClick={resetState}
                        className="py-4 px-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base active:scale-95 transition-all"
                      >
                        Identify Another
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUB-STATE: SPEECH MATCH LIST ── */}
              {state === 'results' && mode === 'speech' && speechResults.length > 0 && (
                <div className="w-full flex flex-col bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-white mb-1">Search Matches</h2>
                      <p className="text-white/40 text-sm">Matches found for &ldquo;{speech.transcript}&rdquo;</p>
                    </div>
                    
                    <button
                      onClick={resetState}
                      className="mt-3 sm:mt-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80 transition-all self-start"
                    >
                      <RefreshCw size={14} /> Try Again
                    </button>
                  </div>

                  {/* Matches List Grid */}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {speechResults.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlay(song)}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/15 cursor-pointer transition-all group relative overflow-hidden"
                      >
                        {/* Artwork */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                          {getBestImageUrl(song.image) ? (
                            <Image
                              src={getBestImageUrl(song.image)!}
                              alt={song.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#fc3c44]/30 flex items-center justify-center">
                              <Music size={20} className="text-white/40" />
                            </div>
                          )}
                        </div>

                        {/* Title and artist */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-base truncate group-hover:text-[#fc3c44] transition-colors">{song.name}</p>
                          <p className="text-white/50 text-sm truncate mt-0.5">
                            {song.artists.primary.map((a) => a.name).join(', ')}
                          </p>
                        </div>

                        {/* Hover trigger element */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#fc3c44] flex items-center justify-center transition-all">
                          <Play size={16} className="text-white fill-white group-hover:scale-105 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SUB-STATE: NO MATCH MATCH ── */}
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
                      {rawMatch.artist && (
                        <p className="text-white/50 text-sm mt-0.5">by {rawMatch.artist}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={resetState}
                      className="py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20"
                    >
                      Try Again
                    </button>
                    {mode === 'audd' && rawMatch?.title && (
                      <button
                        onClick={() => handleSearchForSong(rawMatch.title, rawMatch.artist || '')}
                        className="py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base active:scale-95 transition-all"
                      >
                        Search Manual on AcadMusic
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── SUB-STATE: ERROR MATCH ── */}
              {state === 'error' && (
                <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-3xl text-center shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={36} className="text-red-400" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-2">Identification Failed</h2>
                  <p className="text-red-300/80 text-sm bg-red-500/5 border border-red-500/10 p-4 rounded-2xl mb-6 leading-relaxed">
                    {errorMessage || 'An unexpected error occurred during audio recording.'}
                  </p>

                  <button
                    onClick={resetState}
                    className="w-full py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-4 text-xs text-white/30 font-medium">
        Powered by Shazam &amp; Google Speech API • AcadMusic Services
      </footer>
    </div>
  );
}

// Sub-component for individual dynamic vertical audio bars
function WaveformBar({ delay }: { delay: number }) {
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
