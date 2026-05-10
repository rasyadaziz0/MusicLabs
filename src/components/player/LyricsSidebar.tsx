'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useLyricsScroll } from '@/hooks/useLyricsScroll';
import { Music2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface LyricsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LyricsSidebar({ isOpen, onClose }: LyricsSidebarProps) {
  const { currentTrack, currentTime, seek } = usePlayer();
  const { lines, isSynced, isLoading } = useLyrics(currentTrack);
  const { activeIndex, scrollRef } = useLyricsScroll({ lines, isSynced, currentTime });
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const getLineStyle = (index: number): React.CSSProperties => {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    if (isActive) {
      return {
        fontSize: '22px',
        color: 'rgba(255,255,255,1)',
        fontWeight: 700,
      };
    }
    if (dist === 1) {
      return {
        fontSize: '16px',
        color: 'rgba(255,255,255,0.28)',
        fontWeight: 700,
      };
    }
    if (dist <= 3) {
      return {
        fontSize: '15px',
        color: 'rgba(255,255,255,0.15)',
        fontWeight: 700,
      };
    }
    return {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.07)',
      fontWeight: 700,
    };
  };

  const content = (
    <div
      ref={popupRef}
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
        animation: 'lyricsSlideIn 0.25s ease',
      }}
    >
      <style>{`
        @keyframes lyricsSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .lyrics-scroll::-webkit-scrollbar { display: none; }
        .lyric-btn {
          display: block;
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          padding: 0;
          margin-bottom: 22px;
          font-family: -apple-system, 'Helvetica Neue', sans-serif;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.3px;
          transition: color 0.35s ease, font-size 0.35s ease;
        }
        .lyric-btn:focus { outline: none; }
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
            {lines.map((line, index) => (
              <button
                key={`${line.time}-${index}`}
                className="lyric-btn"
                data-lyric-index={index}
                onClick={() => isSynced && !line.isPlaceholder && seek(line.time)}
                style={{
                  ...getLineStyle(index),
                  cursor: isSynced && !line.isPlaceholder ? 'pointer' : 'default',
                }}
              >
                {line.text}
              </button>
            ))}
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
    </div>
  );

  return createPortal(content, document.body);
}