'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useLyricsScroll } from '@/hooks/useLyricsScroll';
import { useRomanization } from '@/hooks/useRomanization';
import { Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LyricStyleManager } from './lyrics/LyricStyleManager';
import { KaraokeLine } from './lyrics/KaraokeLine';
import { GlassBar } from '@/components/ui/LiquidGlass';
import './lyrics/sidebar.css';

interface LyricsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LyricsSidebar({ isOpen, onClose }: LyricsSidebarProps) {
  const { currentTrack, currentTime, seek, duration } = usePlayer();
  const trackId = currentTrack?.id ?? null;
  const { lines, isSynced, isLoading } = useLyrics(currentTrack, duration);
  const { activeIndex, scrollRef } = useLyricsScroll({ lines, isSynced, currentTime, trackId });
  const romanizations = useRomanization(lines, trackId);
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
          <GlassBar
            className="absolute inset-0 w-full h-full border-none"
            style={{ backgroundColor: 'rgba(32, 32, 33, 0.5)', borderRadius: '0px', boxShadow: 'none' }}
          >
            <div className="flex flex-col h-full w-full relative">
            {/* Top fade */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(14,14,16,0.7) 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />

            {/* Bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, rgba(14,14,16,0.9) 0%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />

            {/* Scrollable lyrics */}
            <div
              ref={scrollRef}
              className="lyrics-scroll"
              style={{ position: 'relative', zIndex: 2, flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '60px 22px 80px' }}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '10px' }}>
                  <Music2 size={28} color="rgba(255,255,255,0.15)" />
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Play a song to see lyrics</p>
                </div>
              ) : lines.length > 0 ? (
                <div style={{ animation: 'lyricsFadeIn 0.5s ease-out' }}>
                  {lines.map((line, index) => {
                    const isActive = activeIndex === index;
                    const romanText = romanizations.get(index);
                    const lineStyle = LyricStyleManager.getSidebarLineStyle(index, activeIndex);
                    const romanStyle = LyricStyleManager.getSidebarRomanizationStyle(index, activeIndex, lineStyle.opacity);

                    return (
                      <div key={`${line.time}-${index}`} className="sidebar-lyric-wrapper">
                        <button
                          className="lyric-btn"
                          data-lyric-index={index}
                          onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
                          style={{ ...lineStyle, cursor: isSynced && !line.isPlaceholder ? 'pointer' : 'default' }}
                        >
                          {(isActive && line.words) ? (
                            <KaraokeLine line={line} currentTime={currentTime} isActive={isActive} />
                          ) : (
                            line.text
                          )}
                        </button>

                        {/* Romanization */}
                        {romanText && (
                          <span className="sidebar-roman" style={romanStyle}>
                            {romanText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>No lyrics available</p>
                </div>
              )}
              </div>
            </div>
          </GlassBar>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}