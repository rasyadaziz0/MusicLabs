'use client';

import { usePlayer } from '@/context/PlayerContext';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { ArtistStation } from '@/types/models/ArtistFollow';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Play, Radio } from 'lucide-react';
import { useState } from 'react';

interface StationBannerProps {
  artistId: string;
  artistName: string;
}

export function StationBanner({ artistId, artistName }: StationBannerProps) {
  const { playTrack } = usePlayer();
  const [isPlayingStation, setIsPlayingStation] = useState(false);

  const { data: station, isLoading } = useQuery<ArtistStation | null>({
    queryKey: ['artist-station', artistId],
    queryFn: async () => {
      try {
        const res = await MusicApiService.getArtistStation(artistId);
        if (res && res.hasStation && res.tracks && res.tracks.length > 0) {
          return res;
        }
        return null;
      } catch (err) {
        console.warn('Failed to load artist station banner:', err);
        return null;
      }
    },
    enabled: Boolean(artistId),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading || !station || station.tracks.length === 0) {
    return null;
  }

  const handlePlayStation = () => {
    if (!station || station.tracks.length === 0) return;
    setIsPlayingStation(true);
    playTrack(station.tracks[0], station.tracks, 0);
    setTimeout(() => setIsPlayingStation(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10 mb-6 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#FA243C]/20 via-[#1C1C1E]/80 to-transparent border border-[#FA243C]/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-[#FA243C]/5"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-xl bg-[#FA243C]/20 border border-[#FA243C]/40 flex items-center justify-center text-[#FA243C] flex-shrink-0">
          <Radio size={24} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FA243C]"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FA243C] text-white tracking-wide shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE DI YOUTUBE
            </span>
            <span className="text-xs text-white/50">Stasiun Artis</span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
            {station.liveTitle || `${artistName} Station`}
          </h3>
          <p className="text-xs md:text-sm text-white/60 mt-0.5">
            Siaran langsung resmi di YouTube — streaming audio langsung di aplikasi tanpa henti
          </p>
        </div>
      </div>

      <button
        onClick={handlePlayStation}
        disabled={isPlayingStation}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FA243C] hover:bg-[#ff3850] active:scale-95 text-white font-semibold text-sm transition-all shadow-lg shadow-[#FA243C]/30 flex-shrink-0"
      >
        {isPlayingStation ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
        <span>Dengarkan Live Stream</span>
      </button>
    </motion.div>
  );
}
