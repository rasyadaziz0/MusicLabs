'use client';

import Link from 'next/link';
import { Check, ListPlus, Loader2, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAddTrackToPlaylist, useLibraryPlaylists } from '@/hooks/useMusicLibrary';

interface AddToPlaylistButtonProps {
  track: Song;
  className?: string;
  asMenuItem?: boolean;
}

export default function AddToPlaylistButton({ track, className, asMenuItem = false }: AddToPlaylistButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const { data: playlists = [], isLoading } = useLibraryPlaylists();
  const addMutation = useAddTrackToPlaylist();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 260;

    setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
  }, [isOpen]);

  const handleButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    setIsOpen((open) => !open);
  };

  const handleAdd = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    addMutation.mutate(
      { playlistId, trackId: track.id },
      {
        onSuccess: () => {
          setIsOpen(false);
          setTimeout(() => setSelectedPlaylistId(null), 1200);
        },
      }
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", asMenuItem && "w-full")}>
      <button
        type="button"
        onClick={handleButtonClick}
        className={cn(
          asMenuItem ? 'w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group' : 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:text-white',
          className
        )}
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        {asMenuItem ? (
          <>
            <span>Add to Playlist</span>
            <ListPlus size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
          </>
        ) : (
          <ListPlus size={16} />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-56 rounded-xl border border-white/15 bg-[#1c1c1e]/90 p-1.5 shadow-2xl backdrop-blur-xl',
            asMenuItem ? (openUpward ? 'bottom-full left-0 mb-1' : 'top-full left-0 mt-1') : (openUpward ? 'bottom-11 right-0' : 'top-11 right-0')
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-1 border-b border-white/5 px-2 py-1.5 flex items-center">
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider ml-1">Add to Playlist</p>
          </div>

          <Link href="/playlist/create" className="group mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-white transition-colors hover:bg-white/10">
            <Plus size={16} className="text-[#FA243C]" />
            <span>New Playlist</span>
          </Link>

          <div className="my-1 mx-2 h-px bg-white/5" />

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-white/50">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : playlists.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
              {playlists.map((playlist) => {
                const isSelected = selectedPlaylistId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleAdd(playlist.id)}
                    disabled={addMutation.isPending}
                    className="group flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-white/10 disabled:opacity-60"
                  >
                    <span className="truncate font-medium text-white/90 group-hover:text-white">
                      {playlist.name}
                    </span>
                    {isSelected && <Check size={14} className="text-[#FA243C] flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-[12px] text-white/50 mb-2">Belum ada playlist.</p>
              <Link href="/playlist/create" className="inline-block text-[12px] font-medium text-[#FA243C] hover:text-[#FA243C]/80 transition-colors">
                Buat sekarang
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
