'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getAlbum } from '@/lib/api/musicApi';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Share } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';

export default function AlbumPage() {
  const { id } = useParams();
  const { playTrack, shufflePlay } = usePlayer();
  const albumId = Array.isArray(id) ? id[0] : id;
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
    alert('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

  const { data: album, isLoading: isAlbumLoading } = useQuery({
    queryKey: ['album', albumId],
    queryFn: async () => {
      return getAlbum(albumId!);
    },
    enabled: Boolean(albumId),
  });

  if (isAlbumLoading) return <><div>Loading...</div></>;

  const albumTracks = album?.tracks || [];
  const coverUrl = album?.cover_xl || album?.cover_big || album?.cover;
  
  // Format release date nicely if available
  const releaseYear = album?.release_date ? new Date(album.release_date).getFullYear() : '';

  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      {/* Hero Section */}
      <AppleMusicHeader
        title={album?.title || 'Unknown Album'}
        subtitle={album?.artist || 'Unknown Artist'}
        description={releaseYear ? `Released ${releaseYear} • ${albumTracks.length} Songs` : `${albumTracks.length} Songs`}
        cover={
          coverUrl ? (
            <Image src={coverUrl} alt={album?.title || 'Album cover'} fill sizes="300px" className="object-cover shadow-2xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
              <span className="text-white/20 text-4xl">💿</span>
            </div>
          )
        }
        onPlay={() => albumTracks.length > 0 && playTrack(albumTracks[0], albumTracks)}
        onShuffle={() => albumTracks.length > 0 && shufflePlay(albumTracks)}
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
      {isAlbumLoading ? (
        <div className="space-y-4 w-full">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : albumTracks.length > 0 ? (
        <AppleMusicTrackList
          tracks={albumTracks}
          onPlayTrack={playTrack}
          showStar={false}
          showAlbum={false} // don't show album name in an album page
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
