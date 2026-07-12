'use client';

import { LrcLine } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import { motion, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { LyricsHeader } from './lyrics/LyricsHeader';
import { LyricLine } from './lyrics/LyricLine';
import { LyricsSkeleton } from './lyrics/LyricsSkeleton';
import { LyricStyleManager } from './lyrics/LyricStyleManager';
import { useSettings } from '@/context/SettingsContext';
import './LyricsUI.css';

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
  trackId: string | null;
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
  trackId,
}: LyricsUIProps) {
  const { settings } = useSettings();
  const [showRomanization, setShowRomanization] = useState(settings.romanizationEnabled);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const hasRomanizations = romanizations && romanizations.size > 0;

  // Sync font size setting to LyricStyleManager
  LyricStyleManager.setFontSize(settings.lyricsFontSize);

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

  const scrollAnimRef = useRef<any>(null);

  // Auto-scroll logic (moved from useNowPlaying to respect isUserScrolling)
  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current || isUserScrolling) return;
    const el = scrollRef.current.querySelector(
      `[data-lyric-index="${activeIndex}"]`
    ) as HTMLElement | null;
    if (el && scrollRef.current) {
      const container = scrollRef.current;

      // On mobile, position active lyric slightly higher (at 20%). On desktop, we also move it higher (at 25% instead of 50%).
      const isMobile = window.innerWidth < 768;
      const offsetRatio = isMobile ? 0.20 : 0.20;

      const offset = el.offsetTop - (container.clientHeight * offsetRatio) + (el.clientHeight / 2);
      
      // Stop previous animation if any
      if (scrollAnimRef.current) scrollAnimRef.current.stop();
      
      // Custom "santai" spring animation instead of native smooth scroll
      scrollAnimRef.current = animate(container.scrollTop, offset, {
        type: 'spring',
        stiffness: 70, // Semakin kecil, semakin santai
        damping: 20,   // Mengurangi mantul-mantul
        mass: 1.5,
        onUpdate: (latest) => {
          container.scrollTop = latest;
        }
      });
    }
  }, [activeIndex, lines, scrollRef, isUserScrolling]);

  return (
    <>
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
            position: 'relative',
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingRight: 8,
            paddingTop: '20vh',
            paddingBottom: '60vh',
            fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif',
            maskImage:
              'linear-gradient(180deg,transparent 0,#000 18%,#000 72%,transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg,transparent 0,#000 18%,#000 72%,transparent 100%)',
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
                  trackId={trackId}
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