'use client';

import { usePlayer } from '@/context/PlayerContext';
import { gooeyToast as toast } from 'goey-toast';
import { MoreHorizontal, Share } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/music';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';

interface AlbumPageClientProps {
  albumTitle: string;
  albumArtist: string;
  albumArtistId: string | null;
  coverUrl: string;
  releaseYear: string;
  trackCount: number;
  tracks: Song[];
}

export default function AlbumPageClient({
  albumTitle,
  albumArtist,
  albumArtistId,
  coverUrl,
  releaseYear,
  trackCount,
  tracks,
}: AlbumPageClientProps) {
  const { playTrack, shufflePlay } = usePlayer();
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
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      {/* Hero Section */}
      <AppleMusicHeader
        title={albumTitle}
        subtitle={
          albumArtistId ? (
            <Link href={`/artist/${albumArtistId}`} className="hover:underline hover:text-white transition-colors">
              {albumArtist}
            </Link>
          ) : (
            albumArtist
          )
        }
        description={releaseYear ? `Released ${releaseYear} • ${trackCount} Songs` : `${trackCount} Songs`}
        cover={
          coverUrl ? (
            <Image src={coverUrl} alt={albumTitle} fill sizes="300px" className="object-cover shadow-2xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
              <span className="text-white/20 text-4xl">💿</span>
            </div>
          )
        }
        onPlay={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
        onShuffle={() => tracks.length > 0 && shufflePlay(tracks)}
        backHref="/search"
        topRightActions={
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 flex flex-col overflow-hidden">
                <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3">
                  <Share size={16} /> Share Album
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Tracklist */}
      {tracks.length > 0 ? (
        <AppleMusicTrackList
          tracks={tracks}
          onPlayTrack={playTrack}
          showHeart={false}
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
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center mt-8">
          <h2 className="text-xl font-bold mb-2">Album is empty</h2>
          <p className="text-sm text-white/50">
            No tracks found for this album.
          </p>
        </div>
      )}
    </div>
  );
}
