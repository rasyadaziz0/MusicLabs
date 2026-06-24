'use client';

import { useState, useMemo } from 'react';
import { Search as SearchIcon, Share, Link2, ChevronRight, Play, MoreHorizontal } from 'lucide-react';
import { gooeyToast as toast } from 'goey-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { getBestImageUrl, getArtistTopTracks } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { SearchArtistResult } from '@/hooks/useMusicSearch';
import { usePlayer } from '@/context/PlayerContext';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';
import { TopResultGridItem } from '@/components/search/TopResultGridItem';

interface MusicSearchResultsProps {
  isLoading: boolean;
  rankedArtists: SearchArtistResult[];
  rankedAlbums: any[];
  displayedSongs: Song[];
  query: string;
  isArtistSongsLoading: boolean;
  isArtistNameSongsLoading: boolean;
  selectedArtist: SearchArtistResult | null;
  rankedSongsLength: number;
  topResult?: { type: 'song'; data: Song } | { type: 'artist'; data: SearchArtistResult } | null;
}

export function MusicSearchResults({
  isLoading,
  rankedArtists,
  rankedAlbums,
  displayedSongs,
  query,
  isArtistSongsLoading,
  isArtistNameSongsLoading,
  selectedArtist,
  rankedSongsLength,
  topResult,
}: MusicSearchResultsProps) {
  const { playTrack } = usePlayer();
  const router = useRouter();
  const [isExpandedTopResults, setIsExpandedTopResults] = useState(false);

  const filteredArtists = topResult?.type === 'artist'
    ? rankedArtists.filter(a => a.id !== topResult.data.id)
    : rankedArtists;

  const filteredSongs = topResult?.type === 'song'
    ? displayedSongs.filter(s => s.id !== topResult.data.id)
    : displayedSongs;

  const combinedResults = useMemo(() => {
    const results: Array<{ type: 'song' | 'artist'; data: any; id: string }> = [];

    if (topResult) {
      results.push({
        type: topResult.type,
        data: topResult.data,
        id: topResult.type === 'song' ? topResult.data.id : topResult.data.id
      });
    }

    // Add remaining songs
    for (const song of displayedSongs) {
      if (song.id !== topResult?.data?.id && !results.find(r => r.id === song.id)) {
        results.push({ type: 'song', data: song, id: song.id });
      }
    }

    // Add remaining artists
    for (const artist of rankedArtists) {
      if (artist.id !== topResult?.data?.id && !results.find(r => r.id === artist.id)) {
        results.push({ type: 'artist', data: artist, id: artist.id });
      }
    }

    return results;
  }, [topResult, displayedSongs, rankedArtists]);

  const gridItemsToDisplay = isExpandedTopResults ? combinedResults : combinedResults.slice(0, 6);

  const handleGridItemClick = (item: any) => {
    if (item.type === 'artist') {
      router.push(`/artist/${item.data.id}`);
    } else if (item.data.album?.id) {
      router.push(`/album/${item.data.album.id}`);
    }
  };

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
      {combinedResults.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => !isExpandedTopResults && setIsExpandedTopResults(true)}
            className={`flex items-center gap-1 text-2xl font-bold mb-4 text-white hover:text-white/80 transition-colors ${isExpandedTopResults ? 'cursor-default pointer-events-none hover:text-white' : ''}`}
          >
            Top Results
            {!isExpandedTopResults && combinedResults.length > 6 && (
              <ChevronRight size={26} className="mt-0.5 text-white/50" />
            )}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridItemsToDisplay.map((item) => (
              <TopResultGridItem
                key={`${item.type}-${item.id}`}
                item={item}
                onPlay={playTrack}
                onClick={handleGridItemClick}
              />
            ))}
          </div>
        </div>
      )}

      {!isExpandedTopResults && (
        <>
          {filteredArtists.length > 0 && (
            <div className="mb-8">
              <HorizontalScrollSection title="Artists" onSeeAll={() => setIsExpandedTopResults(true)}>
                {filteredArtists.map((artist: SearchArtistResult) => {
                  const imageUrl = getBestImageUrl(artist.image || []);
                  return (
                    <Link
                      key={artist.id}
                      href={`/artist/${artist.id}`}
                      className="flex-shrink-0 w-[120px] md:w-[140px] flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform duration-500 bg-white/5 border border-white/5">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={artist.title}
                            fill
                            sizes="(max-width: 768px) 120px, 140px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                            <SearchIcon size={32} className="text-white/20" />
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-[14px] text-center truncate w-full text-white/95">{artist.title}</p>
                      <p className="text-[12px] text-white/50 text-center truncate w-full mt-0.5">{artist.description || 'Artist'}</p>
                    </Link>
                  );
                })}
              </HorizontalScrollSection>
            </div>
          )}

          {rankedAlbums && rankedAlbums.length > 0 && (
            <div className="mb-8">
              <HorizontalScrollSection title="Albums">
                {rankedAlbums.map((album: any) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="flex-shrink-0 w-[140px] md:w-[160px] flex flex-col group cursor-pointer"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 shadow-lg group-hover:scale-105 transition-transform duration-500 bg-white/5 border border-white/5">
                      {album.cover_medium || album.cover ? (
                        <Image
                          src={album.cover_medium || album.cover}
                          alt={album.title}
                          fill
                          sizes="(max-width: 768px) 140px, 160px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                          <SearchIcon size={32} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-[14px] truncate w-full text-white/95 leading-tight mb-0.5">{album.title}</p>
                    <p className="text-[12px] text-white/50 truncate w-full">{album.artist || 'Unknown Artist'}</p>
                  </Link>
                ))}
              </HorizontalScrollSection>
            </div>
          )}

          {(isArtistSongsLoading || isArtistNameSongsLoading) && rankedSongsLength === 0 && (
            <div className="space-y-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {filteredSongs.length > 0 && (
            <div className="-mx-4 md:mx-0 mb-8">
              <h2 className="text-2xl font-bold mb-4 px-4 md:px-0">Songs</h2>
              <AppleMusicTrackList
                tracks={filteredSongs}
                onPlayTrack={playTrack}
                showHeart={false}
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
                      toast.success('Album link copied to clipboard!');
                      closeMenu();
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group">
                      <span>Share</span>
                      <Share size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
                    </button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/search?q=${encodeURIComponent(song.name)}`);
                      toast.success('Song search link copied!');
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
        </>
      )}

      {filteredSongs.length === 0 && filteredArtists.length === 0 && !topResult && !isArtistSongsLoading && !isArtistNameSongsLoading && (
        <div className="text-center py-20">
          <p className="text-xl text-white/50 font-medium">No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {selectedArtist && filteredSongs.length === 0 && !isArtistSongsLoading && !isArtistNameSongsLoading && (
        <div className="text-center py-10">
          <p className="text-base text-white/50">
            Belum ada lagu yang ketemu untuk artist &quot;{selectedArtist.title}&quot; dari source API ini.
          </p>
        </div>
      )}
    </>
  );
}
