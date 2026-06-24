import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, MoreHorizontal, Share } from 'lucide-react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { EqualizerIcon } from '@/components/ui/EqualizerIcon';

export function TopSongRow({
  song,
  index,
  onPlay,
  isCurrentlyPlaying,
}: {
  song: Song;
  index: number;
  onPlay: () => void;
  isCurrentlyPlaying: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const artwork = getBestImageUrl(song.image);
  const albumInfo = song.album?.name || '';
  const songType = song.type === 'song' ? 'Single' : song.type || '';
  const year = song.year || (song.releaseDate ? new Date(song.releaseDate).getFullYear().toString() : '');
  const subtitle = [albumInfo, songType, year].filter(Boolean).join(' · ');

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-all duration-200 relative"
      onClick={onPlay}
    >
      {/* Index / Play icon */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        <span className="text-[13px] font-medium text-white/40 group-hover:hidden tabular-nums">
          {index}
        </span>
        <Play
          size={13}
          fill="currentColor"
          className="text-white hidden group-hover:block"
        />
      </div>

      {/* Artwork */}
      <div className="relative w-11 h-11 flex-shrink-0 rounded-[6px] overflow-hidden bg-white/5 shadow-sm">
        {artwork ? (
          <Image src={artwork} alt={song.name} fill sizes="44px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-void" />
        )}
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <EqualizerIcon isPlaying={true} color="red" />
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium truncate leading-tight ${isCurrentlyPlaying ? 'text-[#FA243C]' : 'text-white'}`}>
          {song.name}
        </p>
        <p className="text-[12px] text-white/40 truncate mt-0.5 leading-tight">{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0" ref={menuRef}>
        <button
          className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <TrackContextMenu
            track={song}
            isOpen={menuOpen}
            position={menuRef.current ? { 
              x: menuRef.current.getBoundingClientRect().right - 224, 
              y: menuRef.current.getBoundingClientRect().bottom 
            } : null}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
