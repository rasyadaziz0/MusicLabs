'use client';

import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useLibraryPlaylists } from '@/hooks/library/useLibraryPlaylists';
import { ChevronLeft, Heart, ListMusic, PlusSquare } from 'lucide-react';
import Link from 'next/link';

const gradients = [
  'from-[#87B4E5] to-[#121921]', // Blue
  'from-[#DFD9D3] to-[#242220]', // Gray
  'from-[#E2D2C6] to-[#25201C]', // Tan
  'from-[#E7B5C7] to-[#2A181D]', // Pink
  'from-[#D68494] to-[#281518]', // Reddish
  'from-[#B5D6D4] to-[#182322]', // Teal
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function AllPlaylistsPage() {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-32">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <div className="flex items-center gap-1">
          <Link href="/library" className="p-2 -ml-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </Link>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Playlists</h1>
        </div>
        <div className="flex items-center gap-2">
          {flags.feature_import_playlist && (
            <Link
              href="/import/playlist"
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <ListMusic size={14} className="text-[#FA243C]" />
              <span>Import</span>
            </Link>
          )}
          <Link href="/playlist/create" className="text-[#FA243C] p-2 rounded-full hover:bg-white/5 transition-colors">
            <PlusSquare size={24} />
          </Link>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Playlists</h1>
        <div className="flex items-center gap-3">
          {flags.feature_import_playlist && (
            <Link
              href="/import/playlist"
              className="text-xs font-semibold px-4 py-2 rounded-full bg-white/10 text-white/90 border border-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <ListMusic size={16} className="text-[#FA243C]" />
              <span>Import Playlist</span>
            </Link>
          )}
          <Link
            href="/playlist/create"
            className="text-xs font-semibold px-4 py-2 rounded-full bg-[#FA243C] text-white hover:bg-[#ff3b53] transition-colors flex items-center gap-1.5"
          >
            <PlusSquare size={16} />
            <span>Create Playlist</span>
          </Link>
        </div>
      </div>
      
      {isPlaylistsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
          {/* Import Playlist Action Card */}
          {flags.feature_import_playlist && (
            <Link href="/import/playlist" className="group flex flex-col gap-2">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1c1c1e] border border-white/5 flex flex-col items-center justify-center p-4 text-center transition-transform duration-300 group-hover:scale-[1.02] shadow-md group-hover:border-white/20">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 text-[#FA243C]">
                  <ListMusic size={24} />
                </div>
                <p className="text-[13px] font-semibold text-white/90">Import Playlist</p>
                <p className="text-[11px] text-white/40 mt-0.5">Spotify • Apple Music</p>
              </div>
              <div className="mt-1 px-0.5">
                <p className="text-[13px] font-medium text-white/90 truncate">Import Playlist</p>
                <p className="text-[12px] text-white/50 truncate">Transfer to Library</p>
              </div>
            </Link>
          )}
          
          {/* Favourite Songs Card */}
          <Link href="/library/liked" className="group flex flex-col gap-2">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FA243C] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] shadow-md">
              <div className="absolute top-0 left-0 w-full h-full bg-black/0 transition-colors group-hover:bg-black/5 z-10" />
              {/* Large Red Heart */}
              <div className="text-white">
                <Heart size={64} fill="currentColor" strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-1 px-0.5">
              <p className="text-[13px] font-medium text-white/90 truncate flex items-center gap-1">
                Favourite Songs <span className="text-[#FA243C] text-[10px]">★</span>
              </p>
              <p className="text-[12px] text-white/50 truncate">AcadMusic</p>
            </div>
          </Link>

          {/* User Playlists */}
          {playlists.map((playlist) => {
            const gradient = getGradient(playlist.id);
            return (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group flex flex-col gap-2">
                <div className={`relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-[1.02] shadow-md`}>
                  {playlist.cover_url && (
                    <img src={playlist.cover_url} alt={playlist.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute top-0 left-0 w-full h-full bg-black/0 transition-colors group-hover:bg-black/10 z-10" />
                  {!playlist.cover_url && (
                    <div className="absolute top-4 left-4 right-4 z-20">
                      <h3 className="text-xl font-bold text-black/90 leading-tight drop-shadow-sm line-clamp-3">{playlist.name}</h3>
                    </div>
                  )}
                  {playlist.is_liked && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1 text-[10px] text-[#FA243C] font-semibold border border-white/10 z-30">
                      <Heart size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="mt-1 px-0.5">
                  <p className="text-[13px] font-medium text-white/90 truncate">{playlist.name}</p>
                  <p className="text-[12px] text-white/50 truncate">
                    {playlist.is_liked ? 'Liked Playlist' : (user?.user_metadata?.name || 'AcadMusic')}
                  </p>
                </div>
              </Link>
            );
          })}
          
        </div>
      )}
    </div>
  );
}
