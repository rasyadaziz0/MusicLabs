'use client';

import { PlaylistSearchResult } from '@/types/models/PlaylistLike';
import { Heart, Music } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PlaylistSearchCardProps {
  playlist: PlaylistSearchResult;
}

export function PlaylistSearchCard({ playlist }: PlaylistSearchCardProps) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group flex flex-col gap-2 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 shadow-md">
        {playlist.cover_url ? (
          <Image
            src={playlist.cover_url}
            alt={playlist.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 via-[#2F2FE4]/10 to-transparent flex items-center justify-center">
            <Music size={36} className="text-white/30 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Like Badge Overlay */}
        {playlist.like_count > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-semibold text-white/90 shadow-lg">
            <Heart size={11} className="text-[#FA243C] fill-[#FA243C]" />
            <span>{playlist.like_count}</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-1 mt-1 flex flex-col min-w-0">
        <p className="text-[14px] md:text-[15px] font-semibold text-white/90 group-hover:text-white truncate transition-colors">
          {playlist.name}
        </p>
        <p className="text-[12px] text-white/50 truncate mt-0.5">
          by <span className="text-white/70">{playlist.owner_name || 'Community'}</span>
        </p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
          <span>{playlist.track_count} {playlist.track_count === 1 ? 'song' : 'songs'}</span>
          <span>•</span>
          <span className="text-[#22C55E]/80">Public</span>
        </div>
      </div>
    </Link>
  );
}
