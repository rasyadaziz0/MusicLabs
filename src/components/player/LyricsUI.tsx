'use client';

import { cn } from '@/lib/utils';
import { LrcLine } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
    <div className="flex h-full w-full px-8 py-8">
      <div className="ml-auto flex h-full w-full max-w-[980px] flex-col md:w-[58%]">
        {/* Track header — compact, Apple Music style */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl shadow-2xl shadow-black/50 flex-shrink-0">
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
                  <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/5" />
                );
              })()}
            </div>
            <div>
              <h2 className="mb-0.5 text-xl font-bold tracking-tight text-white/95">{currentTrack.name}</h2>
              <div className="text-sm text-white/40 flex items-center gap-1">
                {currentTrack.artists.primary.map((a, i) => (
                  <span key={a.id}>
                    <Link
                      href={`/artist/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline hover:text-white/60 transition-colors"
                    >
                      {a.name}
                    </Link>
                    {i < currentTrack.artists.primary.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics scroll area */}
        <div
          ref={scrollRef}
          className="mask-gradient scrollbar-hide flex-1 space-y-6 overflow-y-auto pr-2 md:pr-6"
        >
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-3/4 animate-pulse rounded-lg bg-white/5"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : lines.length > 0 ? (
            lines.map((line, index) => {
              const isActive = activeIndex === index;
              const distance = Math.abs(index - activeIndex);

              return (
                <motion.div
                  key={`${index}-${line.time}`}
                  initial={{ opacity: 0.15, y: 10 }}
                  animate={{
                    opacity: isActive ? 1 : Math.max(0.15, 0.35 - distance * 0.04),
                    scale: isActive ? 1 : 0.98,
                    y: 0,
                    filter: isActive ? 'blur(0px)' : `blur(${Math.min(2.5, 1 + distance * 0.3)}px)`,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className={cn(
                    'origin-left text-[28px] font-extrabold leading-[1.25] tracking-tight md:text-[36px]',
                    isSynced && !line.isPlaceholder ? 'cursor-pointer' : 'cursor-default',
                    isActive
                      ? 'text-white'
                      : 'text-white/30 hover:text-white/50',
                  )}
                  onClick={() => onLineClick(line.time, line.isPlaceholder)}
                >
                  {line.text}
                </motion.div>
              );
            })
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-medium text-white/30">
              Lirik tidak tersedia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
