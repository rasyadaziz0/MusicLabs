'use client';

import { useState, useMemo } from 'react';
import { Search as SearchIcon, Share, Link2, ChevronRight, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { getBestImageUrl, getArtistTopTracks } from '@/lib/api/musicApi';
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
  topResult?: { type: 'song'; data: Song } | { type: 'artist'; data: SearchArtistResult } | null;
}

function TopResultGridItem({ item, onPlay, onClick }: { item: any, onPlay: (song: Song) => void, onClick: (item: any) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { shufflePlay } = usePlayer();
  const isSong = item.type === 'song';
  const title = isSong ? item.data.name : item.data.title;
  const subtitle = isSong 
    ? [...(item.data.artists?.primary || []), ...(item.data.artists?.featured || [])].map((a: any) => a.name).join(', ')
    : item.data.description || 'Artist';
  const imageUrl = getBestImageUrl(item.data.image || []);
  
  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSong) {
      onPlay(item.data);
    } else {
      try {
        setIsLoading(true);
        const topTracks = await getArtistTopTracks(item.data.id);
        if (topTracks.length > 0) {
          shufflePlay(topTracks);
        } else {
          toast.error('No top tracks found for this artist');
        }
      } catch (err) {
        toast.error('Failed to load artist tracks');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative flex items-center gap-4 p-4 rounded-[14px] bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
    >
      <div className={`relative w-[76px] h-[76px] flex-shrink-0 bg-white/5 ${isSong ? 'rounded-lg' : 'rounded-full'} overflow-hidden shadow-sm`}>
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <SearchIcon size={24} className="text-white/20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isLoading ? (
             <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <button 
              onClick={handlePlay}
              className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center hover:scale-105 hover:bg-black/80 text-white transition-all"
            >
              <Play fill="currentColor" size={18} className="ml-1" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
        <h3 className="text-[15px] font-semibold text-white truncate w-full mb-0.5">{title}</h3>
        <p className="text-[13px] font-medium text-white/50 truncate w-full">
          {isSong ? 'Song' : 'Artist'} {subtitle ? `· ${subtitle}` : ''}
        </p>
      </div>
    </div>
  );
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
              <button 
                onClick={() => setIsExpandedTopResults(true)}
                className="flex items-center gap-1 text-2xl font-bold mb-4 text-white hover:text-white/80 transition-colors"
              >
                Artists
                <ChevronRight size={26} className="mt-0.5 text-white/50" />
              </button>
              <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {filteredArtists.map((artist: SearchArtistResult) => {
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

          {filteredSongs.length > 0 && (
            <div className="-mx-4 md:mx-0 mb-8">
              <h2 className="text-2xl font-bold mb-4 px-4 md:px-0">Songs</h2>
              <AppleMusicTrackList
                tracks={filteredSongs}
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
