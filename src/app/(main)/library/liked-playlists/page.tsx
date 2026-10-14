'use client';

import { useLikedPlaylists } from '@/hooks/playlist/useLikedPlaylists';
import { ChevronLeft, Heart, Library, Music } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LikedPlaylistsPage() {
  const { playlists, isLoading, isEmpty } = useLikedPlaylists();

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-32">
      {/* Mobile Header */}
      <div className="flex items-center gap-1 mb-4 md:hidden">
        <Link href="/library" className="p-2 -ml-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <div className="flex items-center gap-2">
          <Heart size={22} className="text-[#FA243C] fill-[#FA243C]" />
          <h1 className="text-[26px] font-bold text-white tracking-tight">Liked Playlists</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center">
            <Heart size={22} className="text-[#FA243C] fill-[#FA243C]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Liked Playlists</h1>
            <p className="text-xs text-white/50 mt-0.5">Public playlists you have saved to your library</p>
          </div>
        </div>

        <span className="text-xs text-white/40">{playlists.length} playlists</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/40">
            <Library size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No liked playlists yet</h2>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            When you like a public playlist from search or another user, it will be saved here in your library.
          </p>
          <Link
            href="/search"
            className="px-6 py-2.5 rounded-full bg-[#FA243C] text-white text-sm font-semibold hover:bg-opacity-90 transition-all active:scale-95"
          >
            Find Playlists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 shadow-md border border-white/5 transition-transform duration-300 group-hover:scale-[1.02]">
                {playlist.cover_url ? (
                  <Image
                    src={playlist.cover_url}
                    alt={playlist.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 flex items-center justify-center">
                    <Music size={36} className="text-[#FA243C]/50" />
                  </div>
                )}

                {/* Liked badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1 text-[10px] text-[#FA243C] font-semibold border border-white/10">
                  <Heart size={10} fill="currentColor" />
                </div>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              <div className="px-0.5 mt-1">
                <p className="text-[14px] md:text-[15px] font-medium text-white/95 truncate leading-snug group-hover:text-white">
                  {playlist.name}
                </p>
                <p className="text-[12px] text-white/50 truncate mt-0.5">
                  Liked Playlist
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
