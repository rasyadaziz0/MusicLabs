'use client';

import { cn } from '@/lib/utils';
import { LrcLine } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';

interface LyricsUIProps {
  currentTrack: Song;
  lines: LrcLine[];
  activeIndex: number;
  isSynced: boolean;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
}

export default function LyricsUI({
  currentTrack,
  lines,
  activeIndex,
  isSynced,
  isLoading,
  scrollRef,
  onLineClick,
}: LyricsUIProps) {
  return (
    <div className="flex h-full w-full px-6 py-10">
      <div className="ml-auto flex h-full w-full max-w-[980px] flex-col md:w-[58%]">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {(() => {
                const imgUrl =
                  currentTrack.image.find((i) => i.quality === '500x500')?.url ||
                  currentTrack.image[0]?.url;
                return imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={currentTrack.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/40 to-void" />
                );
              })()}
            </div>
            <div>
              <h2 className="mb-1 text-3xl font-bold tracking-tight">{currentTrack.name}</h2>
              <p className="text-lg text-muted">
                {currentTrack.artists.primary.map((a) => a.name).join(', ')}
              </p>
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
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-lg bg-white/5"
                  style={{ opacity: 1 - i * 0.15 }}
                />
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
                  y: 0,
                }}
                transition={{ duration: 0.4 }}
                className={cn(
                  'origin-left text-2xl font-bold leading-tight transition-all duration-300 md:text-4xl',
                  isSynced && !line.isPlaceholder ? 'cursor-pointer' : 'cursor-default',
                  activeIndex === index ? 'text-white' : 'text-white/40 hover:text-white/60',
                )}
                onClick={() => onLineClick(line.time, line.isPlaceholder)}
              >
                {line.text}
              </motion.div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-medium text-muted">
              Lirik sedang di muat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
