'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search as SearchIcon, Play, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { getBestImageUrl, getArtistTopTracks } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';

export function TopResultGridItem({ item, onPlay, onClick }: { item: any, onPlay: (song: Song) => void, onClick: (item: any) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div
      onClick={() => onClick(item)}
      onContextMenu={isSong ? handleContextMenu : undefined}
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

      {isSong && (
        <button
          onClick={handleContextMenu}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <MoreHorizontal size={18} />
        </button>
      )}

      {isSong && contextMenu.isOpen && (
        <TrackContextMenu
          track={item.data}
          isOpen={contextMenu.isOpen}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
