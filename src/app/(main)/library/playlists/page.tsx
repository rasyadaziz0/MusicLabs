'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists } from '@/hooks/useMusicLibrary';
import { Star, ChevronLeft } from 'lucide-react';

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
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();

  return (
    <div className="p-4 md:p-8 pt-2 md:pt-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-32">
      {/* Mobile Header */}
      <div className="flex items-center gap-1 mb-4 md:hidden">
        <Link href="/library" className="p-2 -ml-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold text-white tracking-tight">Playlists</h1>
      </div>

      {/* Desktop Header */}
      <h1 className="text-3xl font-bold text-white mb-6 hidden md:block">Playlists</h1>
      
      {isPlaylistsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
          
          {/* Favourite Songs Card */}
          <Link href="/library/liked" className="group flex flex-col gap-2">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F5F7] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] shadow-md">
              <div className="absolute top-0 left-0 w-full h-full bg-black/0 transition-colors group-hover:bg-black/5 z-10" />
              {/* Large Red Star - manually drawn or lucide scaled */}
              <div className="relative w-[45%] h-[45%]">
                <svg viewBox="0 0 24 24" className="w-full h-full text-[#FA243C]" fill="currentColor" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="mt-1 px-0.5">
              <p className="text-[13px] font-medium text-white/90 truncate flex items-center gap-1">
                Favourite Songs <span className="text-[#FA243C] text-[10px]">★</span>
              </p>
              <p className="text-[12px] text-white/50 truncate">MusicLabs</p>
            </div>
          </Link>

          {/* User Playlists */}
          {playlists.map((playlist) => {
            const gradient = getGradient(playlist.id);
            return (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group flex flex-col gap-2">
                <div className={`relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-[1.02] shadow-md`}>
                  <div className="absolute top-0 left-0 w-full h-full bg-black/0 transition-colors group-hover:bg-black/10 z-10" />
                  <div className="absolute top-4 left-4 right-4 z-20">
                    <h3 className="text-xl font-bold text-black/90 leading-tight drop-shadow-sm line-clamp-3">{playlist.name}</h3>
                  </div>
                </div>
                <div className="mt-1 px-0.5">
                  <p className="text-[13px] font-medium text-white/90 truncate">{playlist.name}</p>
                  <p className="text-[12px] text-white/50 truncate">{user?.user_metadata?.name || 'MusicLabs'}</p>
                </div>
              </Link>
            );
          })}
          
        </div>
      )}
    </div>
  );
}
