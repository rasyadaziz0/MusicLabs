'use client';

import React from 'react';
import Image from 'next/image';
import { AppleMusicThemeGenerator } from '@/lib/color';

export interface AppleMusicPlaylistCoverProps {
  name: string;
  coverUrl?: string | null;
  className?: string;
  priority?: boolean;
}

export function AppleMusicPlaylistCover({
  name,
  coverUrl,
  className = '',
  priority = false,
}: AppleMusicPlaylistCoverProps) {
  // If a custom image exists, display it
  if (coverUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl shadow-2xl bg-white/5 ${className}`}>
        <Image
          src={coverUrl}
          alt={name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover"
        />
      </div>
    );
  }

  const palette = AppleMusicThemeGenerator.getDeterministicPalette(name || 'Playlist');

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl shadow-2xl flex flex-col justify-between p-5 md:p-6 select-none group ${className}`}
      style={{
        background: `radial-gradient(circle at 15% 15%, ${palette.tertiary} 0%, ${palette.primary} 45%, ${palette.secondary} 100%)`,
      }}
    >
      <div className="relative z-10 max-w-[85%]">
        <h2 className="text-white font-bold text-2xl md:text-3xl tracking-tight leading-tight drop-shadow-md break-words line-clamp-3">
          {name || 'My Playlist'}
        </h2>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
        style={{
          background: 'radial-gradient(circle at 85% 85%, rgba(255,255,255,0.7) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}
