'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MoreHorizontal, Play, Shuffle, Share } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongs } from '@/hooks/useMusicLibrary';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';

import { useState, useRef, useEffect } from 'react';
import { gooeyToast as toast } from 'goey-toast';

export default function LikedSongsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { playTrack, shufflePlay } = usePlayer();
  const { data: likedSongs = [], isLoading } = useLikedSongs();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="space-y-8">
        <AppleMusicHeader
          title={<div className="flex items-center gap-2">Favourite Songs <Heart className="text-red-500" fill="currentColor" size={24} /></div>}
          description="Updated Today"
          cover={
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
              <div className="w-48 h-48 md:w-56 md:h-56 bg-[#f5f5f7] rounded-xl flex items-center justify-center shadow-inner relative z-10">
                <Heart size={80} className="text-red-500 drop-shadow-md" fill="currentColor" strokeWidth={1.5} />
              </div>
            </>
          }
          onPlay={() => likedSongs.length > 0 && playTrack(likedSongs[0], likedSongs)}
          onShuffle={() => likedSongs.length > 0 && shufflePlay(likedSongs)}
          isSaved={true}
          backHref="/library"
          topRightActions={
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 flex flex-col overflow-hidden">
                  <button 
                    onClick={() => {
                      if (likedSongs.length > 0) playTrack(likedSongs[0], likedSongs);
                      setIsMenuOpen(false);
                    }} 
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Play size={16} fill="currentColor" /> Play All
                  </button>
                  <button 
                    onClick={() => {
                      if (likedSongs.length > 0) shufflePlay(likedSongs);
                      setIsMenuOpen(false);
                    }} 
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Shuffle size={16} /> Shuffle Play
                  </button>
                  <div className="h-px bg-white/10 my-1 mx-2" />
                  <button 
                    onClick={handleShare} 
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Share size={16} /> Share Link
                  </button>
                </div>
              )}
            </div>
          }
        />

        {!user ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Heart size={28} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Login dulu untuk buka liked songs</h2>
            <p className="text-muted">Setelah login, lagu yang kamu like bakal otomatis muncul di sini.</p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Login with Google
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : likedSongs.length > 0 ? (
          <AppleMusicTrackList
            tracks={likedSongs}
            onPlayTrack={playTrack}
            showHeart={true}
            showAlbum={true}
            renderTrackOptions={(song, closeMenu) => (
              <>
                <TrackLikeButton track={song} asMenuItem />
                <div className="w-full">
                  <AddToQueueButton track={song} showText />
                </div>
                <div className="w-full">
                  <AddToPlaylistButton track={song} asMenuItem />
                </div>
              </>
            )}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Heart size={28} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">No liked songs yet</h2>
            <p className="text-muted">
              Tap ikon hati dari player atau hasil pencarian buat nyimpen lagu ke sini.
            </p>
            <Link href="/search" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Cari Lagu
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
