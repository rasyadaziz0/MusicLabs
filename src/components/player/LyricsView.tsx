'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

const LYRICS_SYNC_DELAY_SEC = 0.35;

export default function LyricsView({ onClose }: { onClose?: () => void }) {
  const { currentTrack, currentTime, seek } = usePlayer();
  const { lines, isSynced, isLoading } = useLyrics(currentTrack);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    const lyricTime = Math.max(0, currentTime - LYRICS_SYNC_DELAY_SEC);
    if (lyricTime < lines[0].time) return -1;

    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= lyricTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }, [currentTime, lines, isSynced]);

  useEffect(() => {
    if (activeIndex < 0) return;
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
    <div className="flex h-full w-full px-6 py-10">
      <div className="ml-auto flex h-full w-full max-w-[980px] flex-col md:w-[58%]">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src={currentTrack.image.find(i => i.quality === '500x500')?.url || currentTrack.image[0]?.url}
                alt={currentTrack.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="mb-1 text-3xl font-bold tracking-tight">{currentTrack.name}</h2>
              <p className="text-lg text-muted">{currentTrack.artists.primary.map(a => a.name).join(', ')}</p>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mask-gradient scrollbar-hide flex-1 space-y-8 overflow-y-auto pr-2 md:pr-4"
        >
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-white/5" style={{ opacity: 1 - i * 0.15 }} />
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
                  "origin-left text-2xl font-bold leading-tight transition-all duration-300 md:text-4xl",
                  isSynced && !line.isPlaceholder ? 'cursor-pointer' : 'cursor-default',
                  activeIndex === index ? "text-white" : "text-white/40 hover:text-white/60"
                )}
                onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
              >
                {line.text}
              </motion.div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-medium text-muted">
              No lyrics available for this track
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
