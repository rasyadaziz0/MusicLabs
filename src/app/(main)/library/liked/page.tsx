'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MoreHorizontal } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongs } from '@/hooks/useMusicLibrary';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';

export default function LikedSongsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { playTrack, shufflePlay } = usePlayer();
  const { data: likedSongs = [], isLoading } = useLikedSongs();

  return (
    <>
      <div className="space-y-8">
        <AppleMusicHeader
          title={<>Favourite Songs <span className="text-[#FF2D55] text-xl ml-1">★</span></>}
          description="Updated Today"
          cover={
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
              <div className="w-48 h-48 md:w-56 md:h-56 bg-[#f5f5f7] rounded-xl flex items-center justify-center shadow-inner relative z-10">
                <svg viewBox="0 0 24 24" fill="#FF2D55" className="w-32 h-32 drop-shadow-md">
                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </>
          }
          onPlay={() => likedSongs.length > 0 && playTrack(likedSongs[0], likedSongs)}
          onShuffle={() => likedSongs.length > 0 && shufflePlay(likedSongs)}
          isSaved={true}
          backHref="/library"
          topRightActions={
            <button className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white">
              <MoreHorizontal size={18} />
            </button>
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
            showStar={true}
            showAlbum={false}
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
