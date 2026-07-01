'use client';

import React from 'react';
import Image from 'next/image';
import { Play, RefreshCw, Music } from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import type { ISingSayResultsProps } from './IdentifyLayoutInterface';

export function SingSayResultUI({
  speechResults,
  transcript,
  handlePlay,
  resetState,
}: ISingSayResultsProps) {
  return (
    <div className="w-full flex flex-col bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold text-white mb-1">Search Matches</h2>
          <p className="text-white/40 text-sm truncate">Matches found for &ldquo;{transcript}&rdquo;</p>
        </div>

        <button
          onClick={resetState}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white/80 transition-all self-start sm:self-center outline-none flex-shrink-0"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {speechResults.map((song) => (
          <div
            key={song.id}
            onClick={() => handlePlay(song)}
            className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/15 cursor-pointer transition-all group relative overflow-hidden select-none"
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
              {getBestImageUrl(song.image) ? (
                <Image src={getBestImageUrl(song.image)!} alt={song.name} fill sizes="56px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#fc3c44]/30 flex items-center justify-center">
                  <Music size={20} className="text-white/40" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base truncate group-hover:text-[#fc3c44] transition-colors">
                {song.name}
              </p>
              <p className="text-white/50 text-sm truncate mt-0.5">
                {song.artists.primary.map((a) => a.name).join(', ')}
              </p>
            </div>

            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#fc3c44] flex items-center justify-center transition-all">
              <Play size={16} className="text-white fill-white group-hover:scale-105 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
