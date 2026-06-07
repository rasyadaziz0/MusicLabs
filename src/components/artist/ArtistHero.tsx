'use client';

import Image from 'next/image';
import { Play, MoreHorizontal, Share, Link2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ArtistHeroProps {
  name: string;
  heroImage: string | null;
  hasTracks: boolean;
  handlePlayAll: () => void;
}

export function ArtistHero({ name, heroImage, hasTracks, handlePlayAll }: ArtistHeroProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [moreMenuOpen]);

  return (
    <div className="relative h-[320px] md:h-[420px] overflow-hidden -mx-6 md:-mx-8 -mt-8">
      {/* Background image */}
      {heroImage ? (
        <Image
          src={heroImage}
          alt={name}
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2e] to-[#1C1C1E]" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Content over hero */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 pb-6 md:pb-8">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-4 md:gap-5">
            {/* Play button */}
            <button
              onClick={handlePlayAll}
              disabled={!hasTracks}
              className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-full bg-[#FA243C] flex items-center justify-center text-white hover:scale-105 hover:bg-[#ff3650] active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-[#FA243C]/30 flex-shrink-0"
            >
              <Play fill="currentColor" size={22} className="ml-0.5" />
            </button>

            {/* Artist name */}
            <h1 className="text-4xl sm:text-5xl md:text-[72px] lg:text-[84px] font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] leading-[0.95]">
              {name}
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0 mb-1" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
            >
              <MoreHorizontal size={18} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 flex flex-col backdrop-blur-xl">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Share size={15} /> Share Artist
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Link2 size={15} /> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
