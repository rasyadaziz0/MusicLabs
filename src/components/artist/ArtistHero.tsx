'use client';
import { FollowButton } from '@/components/artist/FollowButton';
import { FollowerCount } from '@/components/artist/FollowerCount';
import { Link2, MoreHorizontal, Play, Share } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export interface ArtistHeroProps {
  name: string;
  artistId?: string;
  heroImage: string | null;
  hasTracks: boolean;
  handlePlayAll: () => void;
}

export function ArtistHero({ name, artistId, heroImage, hasTracks, handlePlayAll }: ArtistHeroProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!moreMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [moreMenuOpen]);

  return (
    <div ref={heroRef} className="relative h-[320px] md:h-[420px] -mx-6 md:-mx-8 -mt-8 z-20">
      {/* Background image & gradient overlays (scoped overflow-hidden) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={name}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2e] to-[#1C1C1E]" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Content over hero */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 pb-6 md:pb-8 z-30">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4 md:gap-5 min-w-0">
            {/* Play button */}
            <button
              onClick={handlePlayAll}
              disabled={!hasTracks}
              className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-full bg-[#FA243C] flex items-center justify-center text-white hover:scale-105 hover:bg-[#ff3650] active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-[#FA243C]/30 flex-shrink-0 mb-1"
            >
              <Play fill="currentColor" size={22} className="ml-0.5" />
            </button>

            {/* Artist name & Follower count */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-4xl sm:text-5xl md:text-[64px] lg:text-[76px] font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] leading-[0.95] truncate">
                {name}
              </h1>
              {artistId && (
                <div className="mt-2">
                  <FollowerCount artistId={artistId} artistName={name} />
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-auto mb-1">
            {artistId && (
              <FollowButton
                artistId={artistId}
                artistName={name}
                artistImage={heroImage}
              />
            )}

            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#252525]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 py-1.5 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Share size={15} className="text-white/70" /> Share Artist
                  </button>
                  <div className="h-[1px] bg-white/10 mx-3 my-0.5" />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Link2 size={15} className="text-white/70" /> Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

