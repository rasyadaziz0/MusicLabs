'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useLyricsScroll } from '@/hooks/useLyricsScroll';
import { useRomanization } from '@/hooks/useRomanization';
import { LrcWord } from '@/lib/utils/lrcParser';
import { Music2 } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { KaraokeWordAnimator } from './lyrics/KaraokeWordAnimator';
import { LyricStyleManager } from './lyrics/LyricStyleManager';

interface LyricsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Karaoke word (sidebar version — smaller) ── */
function SidebarKaraokeWord({
  word,
}: {
  word: LrcWord;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);

  const activeColor = 'rgba(255,255,255,1)';
  const inactiveColor = 'rgba(255,255,255,0.35)';

  const animator = useMemo(() => {
    return new KaraokeWordAnimator(word, {
      activeColor,
      inactiveColor,
    });
  }, [word, activeColor, inactiveColor]);

  useEffect(() => {
    if (spanRef.current) {
      animator.attach(spanRef.current);
    }
    return () => animator.detach();
  }, [animator]);

  return (
    <span ref={spanRef} style={{ color: inactiveColor, transition: 'none' }}>
      {word.text}
    </span>
  );
}

export default function LyricsSidebar({ isOpen, onClose }: LyricsSidebarProps) {
  const { currentTrack, currentTime, seek } = usePlayer();
  const { lines, isSynced, isLoading } = useLyrics(currentTrack);
  const { activeIndex, scrollRef } = useLyricsScroll({ lines, isSynced, currentTime });
  const romanizations = useRomanization(lines, currentTrack?.id ?? null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // The user explicitly requested to remove click-outside-to-close for the lyrics sidebar
  // so it behaves like Apple Music (only closes when clicking the lyrics button).

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '340px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
            overflow: 'hidden',
          }}
        >
          <style>{`
            .lyrics-scroll::-webkit-scrollbar { display: none; }
        .lyric-btn {
          display: block;
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          padding: 0;
          margin-bottom: 6px;
          font-family: -apple-system, 'Helvetica Neue', sans-serif;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.3px;
          transform-origin: left center;
          transition: color 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                      font-size 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, color, opacity, filter;
          -webkit-font-smoothing: antialiased;
        }
        .lyric-btn:focus { outline: none; }
        .sidebar-lyric-wrapper {
          margin-bottom: 16px;
        }
        .sidebar-roman {
          display: block;
          font-weight: 400;
          font-style: italic;
          line-height: 1.3;
          letter-spacing: 0.1px;
          margin-top: 3px;
          padding-left: 1px;
          transition: color 0.4s ease, opacity 0.4s ease, font-size 0.4s ease;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .sidebar-lyric-skeleton {
          border-radius: 8px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @keyframes lyricsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Blurred album art background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(18,18,20,0.82)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        zIndex: 0,
      }} />

      {/* Colored glow from album art — tint based on currentTrack */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 40% 50%, rgba(180,40,20,0.35) 0%, transparent 65%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Top fade */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '80px',
        background: 'linear-gradient(to bottom, rgba(14,14,16,0.7) 0%, transparent 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '100px',
        background: 'linear-gradient(to top, rgba(14,14,16,0.9) 0%, transparent 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Scrollable lyrics */}
      <div
        ref={scrollRef}
        className="lyrics-scroll"
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: '60px 22px 80px',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '8px' }}>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="sidebar-lyric-skeleton"
                style={{
                  height: i === 0 ? '26px' : i <= 2 ? '20px' : '16px',
                  width: `${[75, 60, 68, 50, 65, 45, 58, 52][i]}%`,
                  opacity: i <= 1 ? 0.7 : i <= 3 ? 0.4 : 0.2,
                }}
              />
            ))}
          </div>
        ) : !currentTrack ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            gap: '10px',
          }}>
            <Music2 size={28} color="rgba(255,255,255,0.15)" />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Play a song to see lyrics
            </p>
          </div>
        ) : lines.length > 0 ? (
          <div style={{ animation: 'lyricsFadeIn 0.5s ease-out' }}>
            {lines.map((line, index) => {
              const isActive = activeIndex === index;
              const dist = Math.abs(index - activeIndex);
              const romanText = romanizations.get(index);
              const lineStyle = LyricStyleManager.getSidebarLineStyle(index, activeIndex);
              const romanStyle = LyricStyleManager.getSidebarRomanizationStyle(
                index,
                activeIndex,
                lineStyle.opacity
              );

              return (
                <div key={`${line.time}-${index}`} className="sidebar-lyric-wrapper">
                  <button
                    className="lyric-btn"
                    data-lyric-index={index}
                    onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
                    style={{
                      ...lineStyle,
                      cursor: isSynced && !line.isPlaceholder ? 'pointer' : 'default',
                    }}
                  >
                    {/* Karaoke word glow for active line */}
                    {isActive && isSynced && line.words && line.words.length > 0 ? (
                      line.words.map((word, wi) => (
                        <SidebarKaraokeWord key={wi} word={word} />
                      ))
                    ) : (
                      line.text
                    )}
                  </button>

                  {/* Romanization */}
                  {romanText && (
                    <span
                      className="sidebar-roman"
                      style={romanStyle}
                    >
                      {romanText}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
          }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              No lyrics available
            </p>
          </div>
        )}
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}