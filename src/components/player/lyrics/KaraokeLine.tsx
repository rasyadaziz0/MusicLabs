import { useEffect, useRef } from 'react';
import { LrcLine } from '@/lib/utils/lrcParser';
import { KaraokeWordAnimator } from './KaraokeWordAnimator';

interface KaraokeLineProps {
  line: LrcLine;
  currentTime: number;
  isActive: boolean;
}

export function KaraokeLine({ line, currentTime, isActive }: KaraokeLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animatorRef = useRef<KaraokeWordAnimator | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animatorRef.current = new KaraokeWordAnimator(containerRef.current);
    }
    return () => {
      animatorRef.current?.stop();
    };
  }, [line]); // re-init if line changes

  useEffect(() => {
    if (isActive) {
      animatorRef.current?.updateTime(currentTime);
    }
  }, [currentTime, isActive]);

  if (!line.words || line.words.length === 0) {
    return <span>{line.text}</span>;
  }

  return (
    <div ref={containerRef} className="karaoke-line-container" style={{ display: 'inline' }}>
      {line.words.map((word, i) => (
        <span
          key={i}
          className="karaoke-word"
          data-start={word.startTime}
          data-end={word.endTime}
          style={{
            position: 'relative',
            display: 'inline-block',
            color: 'inherit',
            whiteSpace: 'pre-wrap', // Preserve spaces
            transformOrigin: 'center bottom',
            marginRight: line.isPlaceholder ? '8px' : '0',
            transform: 'scale(calc(1 + var(--glow, 0) * 0.015))',
            willChange: 'transform, opacity',
          }}
        >
          {line.isPlaceholder ? (
            /* Render a CSS circle that uses var(--progress-raw) for sequential scaling */
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#fff',
                opacity: 'calc(0.5 + var(--progress-raw, 0) * 0.5)',
                transform: 'scale(calc(0.6 + var(--progress-raw, 0) * 0.55))',
                transition: 'opacity 0.1s linear, transform 0.1s linear',
              }}
            />
          ) : (
            <>
              {/* Base text (dimmed) */}
              <span style={{ opacity: isActive ? 0.3 : 1, transition: 'opacity 0.3s ease', position: 'relative', zIndex: 1 }}>
                {word.text}
              </span>

              {/* Active text overlay */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    paddingTop: '0.4em',
                    paddingBottom: '0.4em',
                    marginTop: '-0.4em',
                    marginBottom: '-0.4em',
                    opacity: 1,
                    color: 'var(--lyric-active-color, #fff)',
                    whiteSpace: 'pre-wrap',
                    textShadow: '0 0 calc(10px * var(--glow, 0)) rgba(255, 255, 255, calc(0.4 * var(--glow, 0)))',
                    WebkitMaskImage: 'linear-gradient(90deg, #000 calc(var(--progress-raw, 0) * 120% - 20%), transparent calc(var(--progress-raw, 0) * 120% + 0%))',
                    maskImage: 'linear-gradient(90deg, #000 calc(var(--progress-raw, 0) * 120% - 20%), transparent calc(var(--progress-raw, 0) * 120% + 0%))',
                    willChange: 'mask-image',
                    zIndex: 2,
                  }}
                >
                  {word.text}
                </span>
              )}
            </>
          )}
        </span>
      ))}
    </div>
  );
}
