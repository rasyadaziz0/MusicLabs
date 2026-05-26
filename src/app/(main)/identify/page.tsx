'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, AudioLines, Mic, LogIn, Music2, Play, Search, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useIdentifyController } from '@/hooks/useIdentifyController';
import { getBestImageUrl } from '@/lib/api/musicApi';

export default function IdentifyPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const {
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
  } = useIdentifyController();

  // Redirect to modal on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsDesktop(true);
      router.replace('/?modal=identify');
    } else {
      setIsDesktop(false);
    }
  }, [router]);

  if (isDesktop === null || isDesktop === true) {
    return null;
  }

  const isRecordingOrProcessing = state === 'recording' || state === 'processing';
  const hasResults = state === 'results' || state === 'no-match' || state === 'error';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#000000] relative overflow-hidden text-white font-sans selection:bg-white/30">
      
      {/* ── Dynamic Apple Music Style Animated Background ── */}
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
        
        {/* Idle calm background */}
        <motion.div
          animate={{ opacity: isRecordingOrProcessing ? 0 : 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full bg-gradient-to-b from-[#1c1c1e] to-transparent blur-[80px]" />
        </motion.div>
      </div>

      {/* ── Top Navigation ── */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        
        {/* Apple style segmented control */}
        <div className="flex bg-[#1c1c1e]/80 backdrop-blur-xl rounded-full p-1 border border-white/5 shadow-lg">
          <button
            onClick={() => setMode('audd')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'audd'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60'
            }`}
          >
            Identify
          </button>
          <button
            onClick={() => setMode('speech')}
            disabled={!speech.isSupported}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'speech'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60'
            } ${!speech.isSupported ? 'opacity-30' : ''}`}
          >
            Sing/Say
          </button>
        </div>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        
        {!authLoading && !isAuthenticated ? (
          /* Auth Gate */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10">
              <LogIn size={40} className="text-white/80" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Login Required</h2>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              Sign in to identify songs and sync them to your library.
            </p>
            <button
              onClick={() => signInWithGoogle('/identify')}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-full bg-white text-black font-semibold text-lg active:scale-95 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        ) : (
          <>
            {/* Center massive button */}
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

            {/* ── Apple Music Style Results Bottom Sheet ── */}
            <AnimatePresence>
              {hasResults && (
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute inset-x-0 bottom-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-3xl rounded-t-[36px] pt-3 pb-8 px-5 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
                >
                  {/* Drag Handle (Visual only) */}
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                  
                  {/* Close button */}
                  <button 
                    onClick={resetState}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
                  >
                    <X size={18} />
                  </button>

                  <div className="overflow-y-auto scrollbar-hide pb-safe">
                    
                    {/* AudD Match */}
                    {state === 'results' && mode === 'audd' && matchedSong && (
                      <div className="flex flex-col items-center text-center">
                        <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl mb-6">
                          {getBestImageUrl(matchedSong.image) ? (
                            <Image
                              src={getBestImageUrl(matchedSong.image)!}
                              alt={matchedSong.name}
                              fill
                              sizes="192px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#1a1a1e]" />
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1 px-4">{matchedSong.name}</h2>
                        <p className="text-xl text-white/60 mb-8">{matchedSong.artists.primary.map(a => a.name).join(', ')}</p>

                        <div className="w-full flex flex-col gap-3">
                          {/* Main Action */}
                          {(!matchedSong.id.startsWith('audd-')) ? (
                            <button
                              onClick={() => handlePlay(matchedSong, () => router.back())}
                              className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                              <Play size={20} className="fill-black" />
                              Play Full Song
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
                              className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                              <Search size={20} strokeWidth={2.5} />
                              Search on AcadMusic
                            </button>
                          )}
                          
                          <button
                            onClick={resetState}
                            className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-lg active:scale-95 transition-transform"
                          >
                            Identify Another
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Speech Results */}
                    {state === 'results' && mode === 'speech' && speechResults.length > 0 && (
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-white mb-1">Results</h2>
                        <p className="text-white/50 mb-6 text-sm">For "{speech.transcript}"</p>
                        
                        <div className="flex flex-col gap-1">
                          {speechResults.map((song) => (
                            <div
                              key={song.id}
                              onClick={() => handlePlay(song, () => router.back())}
                              className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                            >
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                {getBestImageUrl(song.image) ? (
                                  <Image src={getBestImageUrl(song.image)!} alt={song.name} fill sizes="56px" className="object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#1a1a1e]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 border-b border-white/5 pb-4 pt-1">
                                <p className="font-semibold text-base text-white truncate">{song.name}</p>
                                <p className="text-sm text-white/50 truncate">{song.artists.primary.map((a) => a.name).join(', ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Match / Error */}
                    {(state === 'no-match' || state === 'error') && (
                      <div className="flex flex-col items-center text-center pt-8 pb-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                          {state === 'error' ? <AlertCircle size={32} className="text-red-400" /> : <Music2 size={32} className="text-white/40" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                          {state === 'error' ? 'An Error Occurred' : 'No Result'}
                        </h2>
                        <p className="text-white/60 mb-2 px-4">
                          {state === 'error' ? errorMessage : "We couldn't quite catch that."}
                        </p>
                        {state === 'no-match' && rawMatch?.title && (
                          <p className="text-white/40 text-sm mb-6 bg-white/5 p-3 rounded-lg w-full">
                            Heard: "{rawMatch.title}"
                          </p>
                        )}
                        
                        <div className="w-full mt-6">
                          <button
                            onClick={resetState}
                            className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg active:scale-95 transition-transform"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Backdrop for bottom sheet */}
            <AnimatePresence>
              {hasResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 z-40"
                  onClick={resetState}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
