'use client';

import Image from 'next/image';
import { Play, Search, AlertCircle, Music2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

interface ResultsBottomSheetProps {
  hasResults: boolean;
  state: 'idle' | 'recording' | 'processing' | 'results' | 'no-match' | 'error';
  mode: 'audd' | 'speech';
  matchedSong: Song | null;
  rawMatch: any;
  speechResults: Song[];
  errorMessage: string;
  speech: { transcript: string };
  resetState: () => void;
  handlePlay: (song: Song, onPlayStart: () => void) => void;
  handleSearchForSong: (name: string, artistName: string) => void;
  routerBack: () => void;
}

export function ResultsBottomSheet({
  hasResults,
  state,
  mode,
  matchedSong,
  rawMatch,
  speechResults,
  errorMessage,
  speech,
  resetState,
  handlePlay,
  handleSearchForSong,
  routerBack,
}: ResultsBottomSheetProps) {
  return (
    <>
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
                        onClick={() => handlePlay(matchedSong, routerBack)}
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
                  <p className="text-white/50 mb-6 text-sm">For &quot;{speech.transcript}&quot;</p>
                  
                  <div className="flex flex-col gap-1">
                    {speechResults.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlay(song, routerBack)}
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
                      Heard: &quot;{rawMatch.title}&quot;
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
  );
}
