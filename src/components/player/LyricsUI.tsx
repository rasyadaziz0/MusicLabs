'use client';

import { LrcLine } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LyricsUIProps {
  currentTrack: Song;
  lines: LrcLine[];
  activeIndex: number;
  isSynced: boolean;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
  hideHeader?: boolean;
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
}: LyricsUIProps) {
  const imgUrl =
    currentTrack.image.find((i) => i.quality === '500x500')?.url ||
    currentTrack.image[0]?.url;

  const getLineStyle = (index: number) => {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    if (isActive) return {
      fontSize: 'clamp(28px, 3.4vw, 38px)',
      color: 'rgba(255,255,255,0.95)',
      filter: 'blur(0px)',
      transform: 'scale(1)',
      opacity: 1,
    };
    if (dist === 1) return {
      fontSize: 'clamp(24px, 2.8vw, 32px)',
      color: 'rgba(255,255,255,0.35)',
      filter: 'blur(0.5px)',
      transform: 'scale(0.97)',
      opacity: 0.55,
    };
    if (dist === 2) return {
      fontSize: 'clamp(22px, 2.5vw, 30px)',
      color: 'rgba(255,255,255,0.2)',
      filter: 'blur(1.5px)',
      transform: 'scale(0.96)',
      opacity: 0.35,
    };
    if (dist === 3) return {
      fontSize: 'clamp(20px, 2.2vw, 28px)',
      color: 'rgba(255,255,255,0.12)',
      filter: 'blur(2.2px)',
      transform: 'scale(0.95)',
      opacity: 0.22,
    };
    return {
      fontSize: 'clamp(18px, 2vw, 26px)',
      color: 'rgba(255,255,255,0.06)',
      filter: 'blur(3px)',
      transform: 'scale(0.94)',
      opacity: 0.12,
    };
  };

  return (
    <>
      <style>{`
        .lyrics-scroll-area::-webkit-scrollbar { display: none; }
        .lyric-line {
          display: block;
          background: none;
          border: none;
          text-align: left;
          width: 100%;
          padding: 0;
          margin-bottom: 20px;
          font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.4px;
          transform-origin: left center;
          will-change: transform, filter, opacity;
        }
        .lyric-line:focus { outline: none; }
        .lyric-line-hoverable { cursor: pointer; }
        .lyric-line-hoverable:hover { opacity: 0.6 !important; }
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
        }}
      >
        {/* Header */}
        {!hideHeader && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 28,
              flexShrink: 0,
            }}
          >
            {/* Mini album art */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              }}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={currentTrack.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%' }} />
              )}
            </div>

            {/* Track name + artist */}
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.95)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {currentTrack.name}
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {currentTrack.artists.primary.map((a, i) => (
                  <span key={a.id}>
                    <Link
                      href={`/artist/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {a.name}
                    </Link>
                    {i < currentTrack.artists.primary.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: '10vh' }}>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="lyric-skeleton"
                  style={{
                    height: i === 0 ? 36 : i <= 2 ? 30 : 26,
                    width: `${[80, 65, 72, 55, 68, 48, 60][i]}%`,
                    opacity: i <= 1 ? 0.7 : i <= 3 ? 0.4 : 0.2,
                  }}
                />
              ))}
            </div>
          ) : lines.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {lines.map((line, index) => {
                const isActive = activeIndex === index;

                return (
                  <motion.button
                    key={`${index}-${line.time}`}
                    data-lyric-index={index}
                    className={`lyric-line${isSynced && !line.isPlaceholder && !isActive ? ' lyric-line-hoverable' : ''}`}
                    animate={getLineStyle(index)}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    onClick={() => onLineClick(line.time, line.isPlaceholder)}
                    style={{
                      cursor:
                        isSynced && !line.isPlaceholder ? 'pointer' : 'default',
                    }}
                  >
                    {line.text}
                  </motion.button>
                );
              })}
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