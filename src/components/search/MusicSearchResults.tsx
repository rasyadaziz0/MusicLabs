'use client';

import { Search as SearchIcon, Share, Link2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { SearchArtistResult } from '@/hooks/useMusicSearch';
import { usePlayer } from '@/context/PlayerContext';

interface MusicSearchResultsProps {
  isLoading: boolean;
  rankedArtists: SearchArtistResult[];
  displayedSongs: Song[];
  query: string;
  isArtistSongsLoading: boolean;
  isArtistNameSongsLoading: boolean;
  selectedArtist: SearchArtistResult | null;
  rankedSongsLength: number;
}

export function MusicSearchResults({
  isLoading,
  rankedArtists,
  displayedSongs,
  query,
  isArtistSongsLoading,
  isArtistNameSongsLoading,
  selectedArtist,
  rankedSongsLength,
}: MusicSearchResultsProps) {
  const { playTrack } = usePlayer();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {rankedArtists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Artists</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {rankedArtists.map((artist: SearchArtistResult) => {
              const imageUrl = getBestImageUrl(artist.image || []);
              return (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="flex-shrink-0 w-32 md:w-40 flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform duration-500 bg-white/5 border border-white/5">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={artist.title}
                        fill
                        sizes="(max-width: 768px) 128px, 160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                        <SearchIcon size={32} className="text-white/20" />
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-center truncate w-full text-white/95">{artist.title}</p>
                  <p className="text-xs text-white/50 text-center truncate w-full mt-0.5">{artist.description || 'Artist'}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(isArtistSongsLoading || isArtistNameSongsLoading) && rankedSongsLength === 0 && (
        <div className="space-y-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {displayedSongs.length > 0 && (
        <div className="-mx-4 md:mx-0">
          <AppleMusicTrackList
            tracks={displayedSongs}
            onPlayTrack={playTrack}
            showStar={false}
            showAlbum={true}
            renderTrackOptions={(song, closeMenu) => (
              <>
                <AddToPlaylistButton track={song} asMenuItem />
                <div className="w-full">
                  <AddToQueueButton track={song} showText />
                </div>
                
                <div className="h-px bg-white/5 my-1 mx-3" />
                
                <TrackLikeButton track={song} asMenuItem />
                
                <div className="h-px bg-white/5 my-1 mx-3" />
                
                <button onClick={() => {
                  if (!song?.album?.id) return;
                  navigator.clipboard.writeText(`${window.location.origin}/album/${song.album.id}`);
                  alert('Album link copied to clipboard!');
                  closeMenu();
                }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group">
                  <span>Share</span>
                  <Share size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/search?q=${encodeURIComponent(song.name)}`);
                  alert('Song search link copied!');
                  closeMenu();
                }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group">
                  <span>Copy Link</span>
                  <Link2 size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
                </button>
              </>
            )}
          />
        </div>
      )}

      {displayedSongs.length === 0 && rankedArtists.length === 0 && !isArtistSongsLoading && !isArtistNameSongsLoading && (
        <div className="text-center py-20">
          <p className="text-xl text-white/50 font-medium">No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {selectedArtist && displayedSongs.length === 0 && !isArtistSongsLoading && !isArtistNameSongsLoading && (
        <div className="text-center py-10">
          <p className="text-base text-white/50">
            Belum ada lagu yang ketemu untuk artist &quot;{selectedArtist.title}&quot; dari source API ini.
          </p>
        </div>
      )}
    </>
  );
}
