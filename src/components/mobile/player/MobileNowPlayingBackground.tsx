'use client';

import Image from 'next/image';

interface MobileNowPlayingBackgroundProps {
  coverUrl: string | null;
}

export function MobileNowPlayingBackground({ coverUrl }: MobileNowPlayingBackgroundProps) {
  return (
    <div style={{ position: 'absolute', inset: '-20px', zIndex: 0 }}>
      {coverUrl && (
        <Image
          src={coverUrl}
          alt="bg"
          fill
          style={{ objectFit: 'cover', transform: 'scale(1.15)' }}
          priority
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        backdropFilter: 'blur(80px) saturate(180%)',
        WebkitBackdropFilter: 'blur(80px) saturate(180%)',
        background: 'rgba(0,0,0,0.35)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
      }} />
    </div>
  );
}
