'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Share2, MoreHorizontal, ListMusic, Mic2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import Image from 'next/image';
import { useState } from 'react';
import LyricsView from './LyricsView';
import { cn } from '@/lib/utils';

export default function NowPlaying({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentTrack } = usePlayer();
  const [view, setView] = useState<'cover' | 'lyrics'>('cover');

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-void flex flex-col"
        >
          {/* Background Blur */}
          <div className="absolute inset-0 z-0 opacity-30 blur-[100px] pointer-events-none">
            <Image 
              src={getBestImageUrl(currentTrack.image)} 
              alt="bg" 
              fill 
              className="object-cover"
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronDown size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">Playing from album</span>
              <span className="text-sm font-bold truncate max-w-[200px]">{currentTrack.album.name}</span>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <MoreHorizontal size={24} />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Cover Art View */}
              <div className={cn(
                "flex flex-col items-center lg:items-start transition-all duration-500",
                view === 'lyrics' ? "hidden lg:flex opacity-50 scale-90" : "flex"
              )}>
                <div className="relative aspect-square w-full max-w-[400px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-8">
                  <Image 
                    src={getBestImageUrl(currentTrack.image)} 
                    alt={currentTrack.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full text-center lg:text-left">
                  <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">{currentTrack.name}</h1>
                  <p className="text-xl text-muted">{currentTrack.artists.primary.map(a => a.name).join(', ')}</p>
                </div>
              </div>

              {/* Lyrics View */}
              <div className={cn(
                "h-[60vh] transition-all duration-500",
                view === 'lyrics' ? "flex flex-col" : "hidden lg:flex opacity-50 grayscale pointer-events-none"
              )}>
                <LyricsView />
              </div>
            </div>
          </div>

          {/* Bottom Tabs */}
          <div className="relative z-10 p-8 flex items-center justify-center gap-4">
             <button 
              onClick={() => setView('cover')}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                view === 'cover' ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white"
              )}
            >
              Cover
            </button>
            <button 
              onClick={() => setView('lyrics')}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                view === 'lyrics' ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white"
              )}
            >
              <Mic2 size={16} />
              Lyrics
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
