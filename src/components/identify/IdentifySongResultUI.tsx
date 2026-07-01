'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Search, Music, Check } from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import type { IIdentifySongResultsProps } from './IdentifyLayoutInterface';

export function IdentifySongResultUI({
  matchedSong,
  handlePlay,
  handleSearchForSong,
  resetState,
}: IIdentifySongResultsProps) {
  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-10 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none filter blur-[60px] scale-125 z-0">
        {getBestImageUrl(matchedSong.image) ? (
          <Image src={getBestImageUrl(matchedSong.image)!} alt="reflection" fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-[#fc3c44]" />
        )}
      </div>

      <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0 z-10 group border border-white/10">
        {getBestImageUrl(matchedSong.image) ? (
          <Image
            src={getBestImageUrl(matchedSong.image)!}
            alt={matchedSong.name}
            fill
            sizes="(max-width: 768px) 224px, 256px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#fc3c44]/40 to-black flex items-center justify-center">
            <Music size={64} className="text-white/20" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10 w-full min-w-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Check size={12} strokeWidth={3} /> Match Identified
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight break-words max-w-full">
          {matchedSong.name}
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-[#fc3c44] mb-3 truncate max-w-full">
          {matchedSong.artists.primary.map((a) => a.name).join(', ')}
        </p>

        <div className="flex flex-col gap-1 text-sm text-white/40 font-medium mb-8">
          {matchedSong.album?.name && <span className="truncate">Album: {matchedSong.album.name}</span>}
          {matchedSong.releaseDate && <span>Released: {matchedSong.releaseDate}</span>}
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3">
          {!matchedSong.id.startsWith('audd-') ? (
            <button
              onClick={() => handlePlay(matchedSong)}
              className="flex-1 py-4 px-6 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-white/5 outline-none"
            >
              <Play size={18} className="fill-black" /> Listen on AcadMusic
            </button>
          ) : (
            <button
              onClick={() => handleSearchForSong(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
              className="flex-1 py-4 px-6 rounded-full bg-[#fc3c44] hover:bg-[#fc3c44]/90 text-white font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20 outline-none"
            >
              <Search size={18} strokeWidth={2.5} /> Search on AcadMusic
            </button>
          )}

          <button
            onClick={resetState}
            className="py-4 px-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base active:scale-95 transition-all outline-none"
          >
            Identify Another
          </button>
        </div>
      </div>
    </div>
  );
}
