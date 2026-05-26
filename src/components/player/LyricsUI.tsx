'use client';

import { LrcLine, LrcWord } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

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

/* ── Karaoke word component: renders a single word with glow sweep ── */
function KaraokeWord({
  word,
  currentTime,
}: {
  word: LrcWord;
  currentTime: number;
}) {
  // Calculate fill progress: 0 = not started, 1 = fully spoken
  const progress = useMemo(() => {
    if (currentTime >= word.endTime) return 1;
    if (currentTime <= word.startTime) return 0;
    const duration = word.endTime - word.startTime;
    if (duration <= 0) return 1;
    return (currentTime - word.startTime) / duration;
  }, [currentTime, word.startTime, word.endTime]);

  const fillPercent = Math.round(progress * 100);

  // Active color (fully sung) vs inactive
  const activeColor = 'rgba(255,255,255,0.97)';
  const inactiveColor = 'rgba(255,255,255,0.35)';

  if (fillPercent <= 0) {
    // Not reached yet
    return (
      <span style={{ color: inactiveColor, transition: 'color 0.15s ease' }}>
        {word.text}
      </span>
    );
  }

  if (fillPercent >= 100) {
    // Fully sung
    return (
      <span
        style={{
          color: activeColor,
          textShadow: '0 0 20px rgba(255,255,255,0.15)',
          transition: 'color 0.1s ease',
        }}
      >
        {word.text}
      </span>
    );
  }

  // Partially sung — gradient clip sweep from left to right
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(90deg, ${activeColor} ${fillPercent}%, ${inactiveColor} ${fillPercent}%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none', // Can't have text-shadow with bg-clip
        transition: 'none', // Smooth handled by continuous updates
      }}
    >
      {word.text}
    </span>
  );
}

/* ── Karaoke line: renders all words with the sweep effect ── */
function KaraokeLine({
  line,
  currentTime,
}: {
  line: LrcLine;
  currentTime: number;
}) {
  if (!line.words || line.words.length === 0) {
    return <>{line.text}</>;
  }

  return (
    <>
      {line.words.map((word, i) => (
        <KaraokeWord key={i} word={word} currentTime={currentTime} />
      ))}
    </>
  );
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
  const hasRomanizations = romanizations && romanizations.size > 0;

  const imgUrl =
    currentTrack.image.find((i) => i.quality === '500x500')?.url ||
    currentTrack.image[0]?.url;

  const getLineStyle = (index: number) => {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    if (isActive) return {
      fontSize: 'clamp(28px, 3.4vw, 38px)',
      color: 'rgba(255,255,255,0.97)',
      filter: 'blur(0px)',
      scale: 1,
      opacity: 1,
      textShadow: '0 0 30px rgba(255,255,255,0.15)',
      y: 0,
    };
    if (dist === 1) return {
      fontSize: 'clamp(24px, 2.8vw, 32px)',
      color: 'rgba(255,255,255,0.35)',
      filter: 'blur(0.4px)',
      scale: 0.97,
      opacity: 0.55,
      textShadow: '0 0 0px transparent',
      y: 0,
    };
    if (dist === 2) return {
      fontSize: 'clamp(22px, 2.5vw, 30px)',
      color: 'rgba(255,255,255,0.2)',
      filter: 'blur(1.2px)',
      scale: 0.96,
      opacity: 0.35,
      textShadow: '0 0 0px transparent',
      y: 0,
    };
    if (dist === 3) return {
      fontSize: 'clamp(20px, 2.2vw, 28px)',
      color: 'rgba(255,255,255,0.12)',
      filter: 'blur(1.8px)',
      scale: 0.95,
      opacity: 0.22,
      textShadow: '0 0 0px transparent',
      y: 0,
    };
    return {
      fontSize: 'clamp(18px, 2vw, 26px)',
      color: 'rgba(255,255,255,0.06)',
      filter: 'blur(2.5px)',
      scale: 0.94,
      opacity: 0.12,
      textShadow: '0 0 0px transparent',
      y: 0,
    };
  };

  /* Spring config for that buttery Apple Music feel */
  const lineTransition = {
    type: 'spring' as const,
    stiffness: 120,
    damping: 20,
    mass: 0.8,
    /* filter & textShadow don't spring well — tween them */
    filter: { type: 'tween' as const, duration: 0.45, ease: [0.4, 0, 0.2, 1] },
    textShadow: { type: 'tween' as const, duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    color: { type: 'tween' as const, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  };

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
        {/* Romanization Toggle Button */}
        {hasRomanizations && (
          <div style={{ position: 'absolute', bottom: hideHeader ? 20 : 40, right: hideHeader ? 20 : 32, zIndex: 50 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowRomanization(!showRomanization); }}
              style={{
                background: showRomanization ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                color: showRomanization ? '#111' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: 12,
                padding: '6px 10px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                boxShadow: showRomanization ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              A/文
            </button>
          </div>
        )}

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
                const romanText = showRomanization ? romanizations?.get(index) : undefined;
                const lineStyle = getLineStyle(index);
                const dist = Math.abs(index - activeIndex);

                // Romanization font size: proportional to lyric line size
                const romanFontSize = isActive
                  ? 'clamp(14px, 1.6vw, 18px)'
                  : dist === 1
                  ? 'clamp(12px, 1.4vw, 16px)'
                  : 'clamp(11px, 1.2vw, 14px)';

                return (
                  <div key={`${index}-${line.time}`} className="lyric-line-wrapper">
                    <motion.button
                      data-lyric-index={index}
                      className={`lyric-line${isSynced && !line.isPlaceholder && !isActive ? ' lyric-line-hoverable' : ''}`}
                      animate={lineStyle}
                      transition={lineTransition}
                      onClick={() => onLineClick(line.time, line.isPlaceholder)}
                      style={{
                        cursor:
                          isSynced && !line.isPlaceholder ? 'pointer' : 'default',
                      }}
                    >
                      {/* Karaoke word glow for active line */}
                      {isActive && isSynced && line.words && line.words.length > 0 ? (
                        <KaraokeLine line={line} currentTime={currentTime} />
                      ) : (
                        line.text
                      )}
                    </motion.button>

                    {/* Romanization subtitle */}
                    {romanText && (
                      <motion.span
                        className="romanization-text"
                        animate={{
                          fontSize: romanFontSize,
                          color: isActive
                            ? 'rgba(255,255,255,0.55)'
                            : dist === 1
                            ? 'rgba(255,255,255,0.18)'
                            : 'rgba(255,255,255,0.08)',
                          opacity: lineStyle.opacity,
                          filter: lineStyle.filter,
                        }}
                        transition={{
                          type: 'tween' as const,
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        {romanText}
                      </motion.span>
                    )}
                  </div>
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