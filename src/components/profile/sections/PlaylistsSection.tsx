'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Music } from 'lucide-react';

interface PlaylistsSectionProps {
  playlists: any[];
}

export function PlaylistsSection({ playlists }: PlaylistsSectionProps) {
  return (
    <div data-animate className="px-5 md:px-8 mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-bold text-white tracking-tight">Your Playlists</h2>
        <Link
          href="/library/playlists"
          className="text-[13px] text-[#FA243C] font-medium hover:underline flex items-center gap-0.5"
        >
          See All
          <ChevronRight size={14} />
        </Link>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-7">
          {playlists.slice(0, 6).map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-white/5 shadow-md border border-white/5 transition-transform duration-300 group-hover:scale-[1.03]">
                {playlist.cover_url ? (
                  <Image
                    src={playlist.cover_url}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 flex items-center justify-center">
                    <Music size={32} className="text-[#FA243C]/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="px-0.5 mt-0.5">
                <p className="text-[14px] font-medium text-white/95 truncate leading-snug">
                  {playlist.name}
                </p>
                <p className="text-[12px] text-white/40 truncate mt-0.5">Playlist</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
          <p className="text-[15px] text-white/50 mb-5">No playlists yet.</p>
          <Link
            href="/playlist/create"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-white/20 transition-colors"
          >
            Create New Playlist
          </Link>
        </div>
      )}
    </div>
  );
}
