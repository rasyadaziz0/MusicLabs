'use client';

import Link from 'next/link';
import { Song } from '@/types/music';

interface LyricsHeaderProps {
  currentTrack: Song;
  hasRomanizations: boolean;
  showRomanization: boolean;
  onToggleRomanization: () => void;
  hideHeader?: boolean;
}

export function LyricsHeader({
  currentTrack,
  hasRomanizations,
  showRomanization,
  onToggleRomanization,
  hideHeader,
}: LyricsHeaderProps) {
  const imgUrl =
    currentTrack.image.find((i) => i.quality === '500x500')?.url ||
    currentTrack.image[0]?.url;

  return (
    <>
      {/* Romanization Toggle Button */}
      {hasRomanizations && (
        <div style={{ position: 'absolute', bottom: hideHeader ? 20 : 40, right: hideHeader ? 20 : 32, zIndex: 50 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleRomanization(); }}
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

      {/* Header Info */}
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
    </>
  );
}
