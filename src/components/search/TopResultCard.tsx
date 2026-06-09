'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { getBestImageUrl, getArtistTopTracks } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { SearchArtistResult } from '@/hooks/useMusicSearch';
import { usePlayer } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface TopResultCardProps {
  topResult: { type: 'song'; data: Song } | { type: 'artist'; data: SearchArtistResult };
}

export function TopResultCard({ topResult }: TopResultCardProps) {
  const { playTrack, shufflePlay } = usePlayer();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (topResult.type === 'song') {
      playTrack(topResult.data);
    } else {
      try {
        setIsLoading(true);
        const topTracks = await getArtistTopTracks(topResult.data.id);
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

  const handleClick = () => {
    if (topResult.type === 'artist') {
      router.push(`/artist/${topResult.data.id}`);
    } else if (topResult.data.album?.id) {
      router.push(`/album/${topResult.data.album.id}`);
    }
  };

  const isSong = topResult.type === 'song';
  
  const title = topResult.type === 'song' ? topResult.data.name : topResult.data.title;
  const subtitle = topResult.type === 'song' 
    ? [...topResult.data.artists.primary, ...topResult.data.artists.featured].map(a => a.name).join(', ')
    : topResult.data.description || 'Artist';
  
  const imageUrl = getBestImageUrl(topResult.data.image || []);

  const imageClass = isSong ? 'rounded-xl' : 'rounded-full';

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-white">Top Result</h2>
      <div 
        onClick={handleClick}
        className="group relative flex flex-row items-center gap-5 p-5 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.02] transition-colors cursor-pointer w-full md:w-[420px] overflow-hidden"
      >
        <div className={`relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 bg-white/5 shadow-xl ${imageClass} overflow-hidden`}>
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={title} 
              fill 
              sizes="112px" 
              className="object-cover"
            />
          )}
        </div>
        
        <div className="flex flex-col justify-center flex-1 min-w-0 pr-12">
          <h3 className="text-2xl font-bold text-white truncate w-full leading-tight">{title}</h3>
          <div className="flex flex-col items-start gap-1.5 mt-2 opacity-70">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-[4px] text-white">
              {isSong ? 'Song' : 'Artist'}
            </span>
            <span className="text-[15px] truncate max-w-full text-white/90">
              {subtitle}
            </span>
          </div>
        </div>

        <button 
          onClick={handlePlay}
          disabled={isLoading}
          className="absolute right-5 bottom-5 w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center lg:opacity-0 translate-y-2 lg:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <Play fill="currentColor" size={22} className="ml-1" />
          )}
        </button>
      </div>
    </div>
  );
}
