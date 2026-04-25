'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function LyricsView({ onClose }: { onClose?: () => void }) {
  const { currentTrack, currentTime, seek } = usePlayer();
  const { lines, activeIndex, isSynced, isLoading } = useLyrics(currentTrack?.id || null, currentTime);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeLine = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeLine) {
        activeLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeIndex]);

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img 
              src={currentTrack.image.find(i => i.quality === '500x500')?.url || currentTrack.image[0]?.url} 
              alt={currentTrack.name}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight">{currentTrack.name}</h2>
            <p className="text-lg text-muted">{currentTrack.artists.primary.map(a => a.name).join(', ')}</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-hide mask-gradient"
      >
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse w-full" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : lines.length > 0 ? (
          lines.map((line, index) => (
            <motion.div
              key={`${index}-${line.time}`}
              initial={{ opacity: 0.3, y: 10 }}
              animate={{ 
                opacity: activeIndex === index ? 1 : 0.4,
                scale: activeIndex === index ? 1.05 : 1,
                y: 0
              }}
              transition={{ duration: 0.4 }}
              className={cn(
                "text-3xl md:text-5xl font-bold cursor-pointer transition-all duration-300 origin-left leading-tight",
                activeIndex === index ? "text-white" : "text-white/40 hover:text-white/60"
              )}
              onClick={() => isSynced && seek(line.time)}
            >
              {line.text}
            </motion.div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-2xl text-muted font-medium">
            No lyrics available for this track
          </div>
        )}
      </div>
    </div>
  );
}
