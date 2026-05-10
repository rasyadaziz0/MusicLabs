import { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Star, MoreHorizontal } from 'lucide-react';

export interface AppleMusicTrackListProps {
  tracks: Song[];
  onPlayTrack: (track: Song, allTracks: Song[]) => void;
  showStar?: boolean;
  showAlbum?: boolean;
  renderTrackOptions?: (track: Song, closeMenu: () => void) => ReactNode;
}

export function AppleMusicTrackList({
  tracks,
  onPlayTrack,
  showStar = false,
  showAlbum = true,
  renderTrackOptions
}: AppleMusicTrackListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  if (tracks.length === 0) return null;

  const totalDuration = tracks.reduce((acc, song) => acc + song.duration, 0);

  return (
    <section className="space-y-1 mt-12 w-full">
      {/* Table Header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-[13px] font-semibold text-white/50 uppercase tracking-wider mb-2">
        {showStar && <div className="w-6 flex-shrink-0"></div>}
        <div className="flex-1 min-w-0">Song</div>
        <div className="hidden md:block w-1/4 min-w-0">Artist</div>
        {showAlbum && <div className="hidden md:block w-1/4 min-w-0">Album</div>}
        <div className="w-12 md:w-16 flex-shrink-0 text-right">Time</div>
        {renderTrackOptions && <div className="w-8 flex-shrink-0"></div>}
      </div>

      {/* Tracks */}
      <div className="space-y-1">
        {tracks.map((song) => (
          <div
            key={song.id}
            onClick={() => onPlayTrack(song, tracks)}
            className="group flex items-center gap-4 rounded-xl px-4 py-2.5 hover:bg-white/10 cursor-pointer transition-colors"
          >
            {showStar && (
              <div className="w-6 flex-shrink-0 flex justify-center text-[#FF2D55]">
                <Star size={12} fill="currentColor" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0 rounded bg-white/10 overflow-hidden shadow-sm">
                {getBestImageUrl(song.image) ? (
                  <Image
                    src={getBestImageUrl(song.image)!}
                    alt={song.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                )}
              </div>
              <span className="truncate text-sm font-medium text-white">{song.name}</span>
            </div>
            
            <div className="hidden md:block w-1/4 min-w-0 truncate text-sm text-white/70 group-hover:text-white transition-colors">
              {song.artists.primary.map(a => a.name).join(', ')}
            </div>

            {showAlbum && (
              <div className="hidden md:block w-1/4 min-w-0 truncate text-sm text-white/70 group-hover:text-white transition-colors">
                {song.album.name}
              </div>
            )}
            
            <div className="w-12 md:w-16 flex-shrink-0 text-right text-xs text-white/50 group-hover:text-white/70">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </div>

            {renderTrackOptions && (
              <div className="w-8 flex-shrink-0 relative flex items-center justify-center">
                <button 
                  className={`transition-all hover:text-white md:opacity-0 md:group-hover:opacity-100 ${activeMenuId === song.id ? '!opacity-100 text-white' : 'opacity-100 text-white/50'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === song.id ? null : song.id);
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>

                {activeMenuId === song.id && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 py-1 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderTrackOptions(song, () => setActiveMenuId(null))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 text-sm text-white/50 px-4 pb-12">
        {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}, {Math.floor(totalDuration / 60)} minutes
      </div>
    </section>
  );
}
