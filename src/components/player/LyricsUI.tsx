'use client';

import { LrcLine } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LyricsHeader } from './lyrics/LyricsHeader';
import { LyricLine } from './lyrics/LyricLine';
import { LyricsSkeleton } from './lyrics/LyricsSkeleton';

interface LyricsUIProps {
  currentTrack: Song;
  lines: LrcLine[];
  activeIndex: number;
  isSynced: boolean;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
  hideHeader?: boolean;
  currentTime?: number;
  romanizations?: Map<number, string>;
}

export default function LyricsUI({
  currentTrack,
  lines,
  activeIndex,
  isSynced,
  isLoading,
  scrollRef,
  onLineClick,
  hideHeader,
  currentTime = 0,
  romanizations,
}: LyricsUIProps) {
  const [showRomanization, setShowRomanization] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const hasRomanizations = romanizations && romanizations.size > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000);
    };

    el.addEventListener('wheel', handleScroll, { passive: true });
    el.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleScroll);
      el.removeEventListener('touchmove', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollRef]);

  // Auto-scroll logic (moved from useNowPlaying to respect isUserScrolling)
  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current || isUserScrolling) return;
    if (lines[activeIndex]?.isPlaceholder) return;
    const el = scrollRef.current.querySelector(
      `[data-lyric-index="${activeIndex}"]`
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeIndex, lines, scrollRef, isUserScrolling]);

  return (
    <>
      <style>{`
        .lyrics-scroll-area::-webkit-scrollbar { display: none; }
        .lyrics-scroll-area {
          scroll-behavior: auto;        /* we control scroll ourselves */
        }
        .lyric-line {
          display: block;
          background: none;
          border: none;
          text-align: left;
          width: 100%;
          padding: 0;
          margin-bottom: 6px;
          font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.4px;
          transform-origin: left center;
          will-change: transform, filter, opacity, color;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-margin-top: 22vh;
        }
        .lyric-line-wrapper {
          margin-bottom: 20px;
        }
        .lyric-line:focus { outline: none; }
        .lyric-line-hoverable { cursor: pointer; }
        .lyric-line-hoverable:hover { opacity: 0.6 !important; }
        .romanization-text {
          display: block;
          font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          font-weight: 500;
          font-style: italic;
          line-height: 1.3;
          letter-spacing: 0.2px;
          margin-top: 4px;
          padding-left: 1px;
          -webkit-font-smoothing: antialiased;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .lyric-skeleton {
          border-radius: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.8s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          padding: hideHeader ? '0' : '28px 32px',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <LyricsHeader
          currentTrack={currentTrack}
          hasRomanizations={hasRomanizations || false}
          showRomanization={showRomanization}
          onToggleRomanization={() => setShowRomanization(!showRomanization)}
          hideHeader={hideHeader}
        />

        {/* Lyrics scroll */}
        <div
          ref={scrollRef}
          className="lyrics-scroll-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingRight: 8,
            paddingTop: '30vh',
            paddingBottom: '30vh',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 12%, black 80%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 12%, black 80%, transparent 100%)',
          }}
        >
          {isLoading ? (
            <LyricsSkeleton />
          ) : lines.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {lines.map((line, index) => (
                <LyricLine
                  key={`${index}-${line.time}`}
                  line={line}
                  index={index}
                  activeIndex={activeIndex}
                  isSynced={isSynced}
                  currentTime={currentTime}
                  isUserScrolling={isUserScrolling}
                  romanText={showRomanization ? romanizations?.get(index) : undefined}
                  onLineClick={onLineClick}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Lirik tidak tersedia.
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}