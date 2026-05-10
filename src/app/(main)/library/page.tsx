'use client';

import Link from 'next/link';
import { ChevronRight, Music, Mic, SquareStack, Library, Heart, PlusSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists } from '@/hooks/useMusicLibrary';
import Image from 'next/image';

const libraryMenu = [
  { label: 'Playlists', icon: Library, href: '/library/playlists' },
  { label: 'Favourite Songs', icon: Heart, href: '/library/liked' },
  { label: 'Artists', icon: Mic, href: '#' },
  { label: 'Albums', icon: SquareStack, href: '#' },
  { label: 'Songs', icon: Music, href: '#' },
];

export default function LibraryPage() {
  const { user, signInWithGoogle } = useAuth();
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();

  if (!user) {
    return (
      <div className="p-6 md:p-10 pt-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-[34px] font-bold tracking-tight text-white mb-4">Library</h1>
        <p className="text-[15px] text-white/60 mb-8 max-w-md">Sign in to access your saved music, playlists, and full library features.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-8 py-3 rounded-full bg-[#FA243C] text-white font-bold hover:bg-opacity-90 transition-all active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-2 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="px-5 md:px-8 pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[34px] font-bold text-white tracking-tight">Library</h1>
          <Link href="/playlist/create" className="text-[#FA243C] p-2 -mr-2 rounded-full hover:bg-white/5 transition-colors">
            <PlusSquare size={24} />
          </Link>
        </div>
        <div className="h-[1px] w-full bg-white/10" />
      </div>

      {/* List Menu */}
      <div className="px-5 md:px-8">
        <div className="flex flex-col">
          {libraryMenu.map((item) => {
            return (
              <Link key={item.label} href={item.href} className="group flex items-center justify-between py-3.5 border-b border-white/5 active:bg-white/5 transition-colors md:hover:bg-white/[0.02] md:-mx-4 md:px-4 md:rounded-lg md:border-b-0">
                <span className="text-[20px] text-white/90 font-normal tracking-tight">{item.label}</span>
                <ChevronRight size={20} className="text-white/20 group-active:text-white/50 group-hover:text-white/40" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recently Added */}
      <div className="px-5 md:px-8 mt-10">
        <h2 className="text-[22px] font-bold text-white mb-5 tracking-tight">Recently Added</h2>
        
        {isPlaylistsLoading ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="aspect-square bg-white/5 rounded-xl md:rounded-2xl animate-pulse" />
             ))}
           </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8">
            {/* Added Favourite Songs pseudo-playlist to recently added for filler if wanted, but using pure playlists for now */}
            {playlists.slice(0, 12).map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group flex flex-col gap-2">
                <div className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-white/5 shadow-md border border-white/5 transition-transform duration-300 group-hover:scale-[1.02]">
                   {playlist.cover_url ? (
                     <Image src={playlist.cover_url} alt={playlist.name} fill className="object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 flex items-center justify-center">
                       <Music size={36} className="text-[#FA243C]/50" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="px-0.5 mt-1">
                  <p className="text-[14px] md:text-[15px] font-medium text-white/95 truncate leading-snug">{playlist.name}</p>
                  <p className="text-[13px] text-white/50 truncate mt-0.5">Playlist</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
             <p className="text-[15px] text-white/50 mb-5">No recent activity.</p>
             <Link href="/playlist/create" className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-white/20 transition-colors">
               Create New Playlist
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
