'use client';

import { usePlayer } from '@/context/PlayerContext';
import { ArtistStation } from '@/types/models/ArtistFollow';
import { EqualizerIcon } from '@/components/ui/EqualizerIcon';
import { motion } from 'framer-motion';
import { Play, Radio } from 'lucide-react';
import Image from 'next/image';

interface ArtistStationCardProps {
  station: ArtistStation;
}

export function ArtistStationCard({ station }: ArtistStationCardProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { artist, tracks } = station;

  const isCurrentStationPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  return (
    <div
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      aria-label={`Play ${artist.name}'s station`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlay(e as any);
        }
      }}
      className="group relative flex flex-col cursor-pointer select-none w-[150px] sm:w-[170px] md:w-[180px] flex-shrink-0"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-[14px] overflow-hidden bg-[#242426] shadow-md group-hover:shadow-2xl transition-all duration-300">
        {artist.image ? (
          <Image
            src={artist.image}
            alt={artist.name}
            fill
            sizes="(max-width: 768px) 150px, 180px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FA243C]/20 via-[#2A2A2E] to-[#1C1C1E] flex items-center justify-center">
            <Radio size={40} className="text-white/20" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Station Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/40 border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>STASIUN LIVE</span>
          </span>
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[2px]">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-[#FA243C] text-white flex items-center justify-center shadow-xl shadow-[#FA243C]/40"
          >
            <Play fill="currentColor" size={20} className="ml-0.5" />
          </motion.div>
        </div>

        {/* Live Audio Waves Indicator if current track belongs to this station */}
        {isCurrentStationPlaying && (
          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#FA243C]/40 text-white text-[10px] font-medium">
            <EqualizerIcon isPlaying={true} color="red" />
            <span className="text-white text-[10px] font-medium">Playing</span>
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="mt-2.5 space-y-0.5">
        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#FA243C] transition-colors" title={station.liveTitle || artist.name}>
          {station.liveTitle || `${artist.name} Station`}
        </h4>
        <p className="text-xs text-white/50 truncate flex items-center gap-1.5">
          <span className="text-[#FA243C] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FA243C] animate-pulse" />
            LIVE
          </span>
          <span>· {artist.name}</span>
        </p>
      </div>
    </div>
  );
}
