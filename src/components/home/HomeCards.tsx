'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Play, MoreHorizontal } from 'lucide-react';
import { TrackContextMenu } from '../ui/TrackContextMenu';

// ── Top Picks Card ──────────────────────────────────────────
export function TopPicksCard({
  song,
  index,
  gradient,
  onPlay,
}: {
  song: Song;
  index: number;
  gradient: string;
  onPlay: () => void;
}) {
  return (
    <div
      className="group relative flex-shrink-0 w-[260px] md:w-[310px] aspect-[4/5] rounded-[16px] overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
      onClick={onPlay}
      style={{ background: gradient }}
    >
      {/* Subtle AcadMusic Logo in top right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80">
        <span className="text-[12px] font-bold text-white tracking-tight">AcadMusic</span>
      </div>

      {/* Optional centered image collage effect for variety */}
      {index % 2 === 1 && getBestImageUrl(song.image) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-black/10">
          <Image
            src={getBestImageUrl(song.image)!}
            alt={song.name}
            fill
            sizes="160px"
            className="object-cover"
            priority={index < 4}
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 p-5 w-full bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white/90 text-[11px] font-semibold mb-1 uppercase tracking-widest">
          {index % 2 === 0 ? 'Trending' : 'Top Hit'}
        </p>
        <h3 className="text-2xl md:text-[28px] font-bold text-white mb-1 line-clamp-2 leading-tight">
          {song.name}
        </h3>
        <p className="text-[14px] text-white/80 line-clamp-2 leading-snug pointer-events-auto">
          {song.artists.primary.map((a: any, i: number) => (
            <React.Fragment key={a.id}>
              <Link
                href={`/artist/${a.id}`}
                className="hover:underline hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {a.name}
              </Link>
              {i < song.artists.primary.length - 1 && ', '}
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

// ── Standard Track Card ─────────────────────────────────────
export function TrackCard({
  song,
  onPlay,
  priority = false,
}: {
  song: Song;
  onPlay: () => void;
  priority?: boolean;
}) {
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  return (
    <>
    <div
      className="group flex-shrink-0 w-[160px] md:w-[180px] text-left cursor-pointer"
      onClick={onPlay}
      onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e); }}
    >
      <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
        {getBestImageUrl(song.image) && (
          <Image
            src={getBestImageUrl(song.image)!}
            alt={song.name}
            fill
            sizes="180px"
            className="object-cover"
            priority={priority}
          />
        )}
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
        
        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            aria-label="Play"
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-md"
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
          >
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          </button>
          <button 
            aria-label="More options"
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-md"
            onClick={handleContextMenu}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">{song.name}</p>
      <p className="text-muted text-[13px] line-clamp-1 mt-0.5 pointer-events-auto">
        {song.artists.primary.map((a: any, i: number) => (
          <React.Fragment key={a.id}>
            <Link
              href={`/artist/${a.id}`}
              className="hover:underline hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {a.name}
            </Link>
            {i < song.artists.primary.length - 1 && ', '}
          </React.Fragment>
        ))}
      </p>
    </div>
    <TrackContextMenu
      track={song}
      isOpen={contextMenu.isOpen}
      position={{ x: contextMenu.x, y: contextMenu.y }}
      onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}

// ── Social Activity Card ────────────────────────────────────
export function SocialActivityCard({
  item,
  onPlay,
}: {
  item: any;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      className="group flex-shrink-0 w-[240px] md:w-[280px] flex items-center gap-3 p-3 rounded-[12px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left"
      onClick={onPlay}
    >
      <div className="relative w-12 h-12 rounded-[8px] overflow-hidden flex-shrink-0">
        {getBestImageUrl(item.track.image) && (
          <Image
            src={getBestImageUrl(item.track.image)!}
            alt={item.track.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-white/60 mb-0.5 truncate">
          <span className="font-semibold text-white/90">{item.user?.display_name || item.user?.username || 'User'}</span> baru dengerin
        </p>
        <p className="text-[14px] font-medium text-white truncate">{item.track.name}</p>
        <p className="text-[12px] text-white/50 truncate pointer-events-auto">
          {item.track.artists?.primary?.map((a: any, i: number) => (
            <React.Fragment key={a.id}>
              <Link
                href={`/artist/${a.id}`}
                className="hover:underline hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {a.name}
              </Link>
              {i < item.track.artists.primary.length - 1 && ', '}
            </React.Fragment>
          ))}
        </p>
      </div>
    </button>
  );
}

// ── Guest Banner ────────────────────────────────────────────
export function GuestBanner() {
  return (
    <section className="px-2">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FA243C]/20 via-[#FA243C]/10 to-transparent border border-[#FA243C]/20 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-white mb-1">Get the full experience</h3>
          <p className="text-[13px] text-white/50">Sign in to save songs, create playlists, and listen to full tracks.</p>
        </div>
        <Link
          href="/login"
          className="flex-shrink-0 ml-4 px-5 py-2 rounded-full bg-[#FA243C] text-white text-[13px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </section>
  );
}
